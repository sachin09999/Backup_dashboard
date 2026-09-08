import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds} sec`;
}

export function generateTimestampFolderName(date: Date = new Date()): string {
  // Format: D-MMM-YYYY_HH-MM-SS
  // e.g. 7-Sep-2026_14-30-25
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}

export function parseTimestampFolderName(folderName: string): { date: Date | null; formattedDate: string; formattedTime: string } {
  // Pattern: D-MMM-YYYY_HH-MM-SS e.g. 7-Sep-2026_14-30-25
  try {
    const match = folderName.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})_(\d{2})-(\d{2})-(\d{2})(?:_\d+)?$/);
    if (!match) {
      return { date: null, formattedDate: folderName, formattedTime: '' };
    }

    const [, dayStr, monthStr, yearStr, hourStr, minStr, secStr] = match;
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const monthIndex = months[monthStr];
    if (monthIndex === undefined) {
      return { date: null, formattedDate: folderName, formattedTime: '' };
    }

    const date = new Date(
      parseInt(yearStr, 10),
      monthIndex,
      parseInt(dayStr, 10),
      parseInt(hourStr, 10),
      parseInt(minStr, 10),
      parseInt(secStr, 10)
    );

    const formattedDate = `${dayStr}-${monthStr}-${yearStr}`;
    const formattedTime = `${hourStr}:${minStr}:${secStr}`;

    return { date, formattedDate, formattedTime };
  } catch {
    return { date: null, formattedDate: folderName, formattedTime: '' };
  }
}
