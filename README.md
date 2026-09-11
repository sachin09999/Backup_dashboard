# MongoDB Backup Center

> **Factory Database Backup Management System**
> Production-grade web dashboard for automating, monitoring, inspecting, downloading, and scheduling MongoDB exports from Docker container `ast-mongodb`.

---

## Features

- 🟢 **Live MongoDB & Docker Health Monitoring**: Real-time server connection checks for `ast-mongodb` and `factory` database.
- 📁 **Automated Mongoexport Engine**: Exports `plants.json` and `cameras.json` using MongoDB 4.0.3 Extended JSON format.
- ⏱️ **Timestamped Backup Directory Structure**: Every backup creates a unique folder `D-MMM-YYYY_HH-MM-SS` (e.g. `7-Sep-2026_14-30-25`) without overwriting previous backups.
- ⚡ **Live SSE Backup Execution**: Real-time Server-Sent Events (SSE) stream step-by-step progress and terminal logs to the UI.
- 🔍 **JSON Code Inspector**: Built-in code viewer with syntax highlighting, line numbers, search, expand/collapse, copy, and server-side pagination (50 items/page).
- 📦 **Download Packages**: Instant `.zip` archive downloads or individual collection JSON exports.
- 🗓️ **Autonomous Scheduler**: Built-in background cron service (Hourly, Daily, Weekly) that runs without needing open browser tabs.
- 🧹 **Retention Policy Cleaner**: Configurable auto-cleanup (7, 14, 30, 60, 90 days, or Forever).
- 🛡️ **Zero Credential Exposure & Path Security**: Server-side path traversal protection and credential masking in logs.

---



---

## Quick Start (Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

```bash
npm run build
npm run start
```

---

## Docker Deployment

To deploy via Docker Compose alongside `ast-mongodb`:

```bash
docker-compose up -d --build
```

Access the dashboard at `http://<server-ip>:3005`.

---

## Troubleshooting & Permissions

- **Backup Directory Access**: If `/home/rmg/mongodb-backups` is not writable by the process user, the system automatically falls back to `./backups` or logs permission warnings. Ensure proper permissions with:
  ```bash
  sudo mkdir -p /home/rmg/mongodb-backups
  sudo chown -R $USER:$USER /home/rmg/mongodb-backups
  ```
- **Docker Socket**: Ensure the user running Next.js has access to `docker` commands (`usermod -aG docker $USER`).
