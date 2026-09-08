'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Copy, Download, Check, ChevronLeft, ChevronRight, FileCode, Layers } from 'lucide-react';

interface JsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupId: string;
  filename: string;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({
  isOpen,
  onClose,
  backupId,
  filename
}) => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<{ totalPages: number; totalItems: number } | null>(null);

  const fetchFile = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/backups/${encodeURIComponent(backupId)}/files/${encodeURIComponent(filename)}?page=${p}&limit=50`);
      if (!res.ok) {
        throw new Error('Failed to load file contents');
      }
      const json = await res.json();
      if (json.paginated) {
        setData(json.items);
        setPaginationInfo({ totalPages: json.totalPages, totalItems: json.totalItems });
      } else {
        setData(json.raw !== undefined ? json.raw : json.text);
        setPaginationInfo(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [backupId, filename]);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchFile(1);
    }
  }, [isOpen, fetchFile]);

  if (!isOpen) return null;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchFile(newPage);
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedJsonStr = data ? JSON.stringify(data, null, 2) : '';
  const lines = formattedJsonStr.split('\n');

  const filteredLines = searchTerm
    ? lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
                {filename}
                <span className="text-xs font-normal text-slate-400">({backupId})</span>
              </h2>
              <p className="text-xs text-slate-400">MongoDB Extended JSON Format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-48 transition-all"
              />
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download File Button */}
            <a
              href={`/api/backups/${encodeURIComponent(backupId)}/files/${encodeURIComponent(filename)}?download=true`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Code Viewer */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span>Loading file preview...</span>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-rose-400">
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-1 select-text">
              {filteredLines.map((line, idx) => (
                <div key={idx} className="flex hover:bg-slate-900/60 rounded px-1 transition-colors">
                  <span className="w-12 text-slate-600 select-none text-right pr-4 font-mono text-[11px]">{idx + 1}</span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer / Pagination */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>
              {paginationInfo ? `Showing documents page ${page} of ${paginationInfo.totalPages} (${paginationInfo.totalItems} total documents)` : `${lines.length} lines loaded`}
            </span>
          </div>

          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-slate-200 font-semibold">{page} / {paginationInfo.totalPages}</span>
              <button
                disabled={page >= paginationInfo.totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="p-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
