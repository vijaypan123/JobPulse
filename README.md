# JobPulse

Privacy-first desktop job application tracker. Connects to your email, detects job application updates, and builds a local dashboard of your job search. Your data stays on your device. AI is optional, and you choose the provider.

## MVP 2 — SQLite + Manual Tracker

This milestone includes:

- SQLite schema for applications, emails, alerts, processed messages, settings, and AI providers
- Database helper functions and startup initialization
- Manual application CRUD on the Applications page
- Search, status filter, and sort by last update or deadline
- Dashboard and Deadlines powered by stored application data
- Browser preview fallback using localStorage when not running in Tauri

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

Build the desktop app:

```powershell
npm run tauri build
```

## Testing MVP 2

1. Open the **Applications** page.
2. Click **Add Application** and save a new record.
3. Use **Edit** and **Delete** on existing rows.
4. Try search, status filter, and sorting.
5. Refresh the page and confirm your changes persist.
6. Check the **Dashboard** stat cards and **Deadlines** page update from your saved data.

In browser preview, data is stored in `localStorage`. In the desktop app, data is stored in `jobpulse.db`.

## Project Structure

```text
src/
  routes/          # Page components
  components/      # Reusable UI
  context/         # Application state
  lib/             # Database helpers and types
  styles/          # Global styles
src-tauri/         # Tauri Rust backend and migrations
docs/              # Product specification
```

See [docs/product-spec.md](docs/product-spec.md) for the full product specification.

## Next Steps

- MVP 3: CSV export
- MVP 4: Local rule-based classifier
- MVP 5: Gmail OAuth and import
