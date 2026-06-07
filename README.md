# JobPulse

Privacy-first desktop job application tracker. Connects to your email, detects job application updates, and builds a local dashboard of your job search. Your data stays on your device. AI is optional, and you choose the provider.

## MVP 4 — Local Rule-Based Classifier

This milestone adds:

- `AIProvider` interface and `LocalRulesProvider`
- Keyword-based classification for interview, assessment, offer, rejection, and more
- Company, role, and deadline extraction from subject/snippet text
- Local email processing pipeline with deduplication via `processed_messages`
- Emails page demo: classify sample emails without Gmail or cloud AI

## MVP 3 — CSV Export

- Export `applications.csv`, `emails.csv`, and `alerts.csv`

## MVP 2 — SQLite + Manual Tracker

- SQLite schema, manual application CRUD, dashboard from saved data

## MVP 1 — Project Skeleton

- Tauri + React + TypeScript desktop app shell

## Stack

- Frontend: React + TypeScript + Vite
- Desktop: Tauri 2
- Storage: SQLite via `@tauri-apps/plugin-sql`
- Classification: Local keyword rules (`LocalRulesProvider`)

## Development

```powershell
Set-Location D:\Github
npm install
npm run dev
```

Open http://localhost:1420/

## Testing MVP 4

1. Open **Emails**.
2. Click **Classify Sample Emails**.
3. Review categories, summaries, suggested status, and local-rules tags.
4. Click again to confirm already-processed messages are skipped.
5. Open **Settings → Classification** to confirm local rules are active.
6. Export classified emails from **Settings → Export**.

## Project Structure

```text
src/
  lib/classifier/  # LocalRulesProvider and classification types
  lib/             # Database helpers, CSV export, email processing
  routes/          # Page components
  components/      # Reusable UI
  context/         # Application state
src-tauri/         # Tauri Rust backend and migrations
docs/              # Product specification
```

See [docs/product-spec.md](docs/product-spec.md) for the full product specification.

## Next Steps

- MVP 5: Gmail OAuth and import
- MVP 6: Optional cloud AI integrations
- MVP 7: Privacy controls and polish
