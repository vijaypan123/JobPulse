# JobPulse

Privacy-first desktop job application tracker. Connects to your email, detects job application updates, and builds a local dashboard of your job search. Your data stays on your device. AI is optional, and you choose the provider.

## MVP 3 — CSV Export

This milestone adds:

- Export `applications.csv`, `emails.csv`, and `alerts.csv`
- Export buttons on the Settings and Applications pages
- Correct CSV escaping for commas, quotes, and newlines
- Exports read from local storage (SQLite in desktop, localStorage in browser preview)

## MVP 2 — SQLite + Manual Tracker

- SQLite schema for all core tables
- Manual application CRUD with search, filter, and sort
- Dashboard and Deadlines powered by stored application data

## MVP 1 — Project Skeleton

- Tauri + React + TypeScript desktop app shell
- Sidebar navigation and mock-driven pages

## Stack

- Frontend: React + TypeScript + Vite
- Desktop: Tauri 2
- Storage: SQLite via `@tauri-apps/plugin-sql`

## Development

Install dependencies:

```powershell
Set-Location D:\Github
npm install
```

Run the web UI preview:

```powershell
npm run dev
```

Open http://localhost:1420/

Run the desktop app:

```powershell
npm run tauri dev
```

## Testing MVP 3

1. Open **Settings** or **Applications**.
2. Click an export button.
3. Confirm a CSV file downloads with headers and your saved data.
4. Open the file in Excel or a text editor to verify formatting.

## Project Structure

```text
src/
  routes/          # Page components
  components/      # Reusable UI
  context/         # Application state
  lib/             # Database helpers, CSV export, types
  styles/          # Global styles
src-tauri/         # Tauri Rust backend and migrations
docs/              # Product specification
```

See [docs/product-spec.md](docs/product-spec.md) for the full product specification.

## Next Steps

- MVP 4: Local rule-based classifier
- MVP 5: Gmail OAuth and import
- MVP 6: Optional AI integrations
