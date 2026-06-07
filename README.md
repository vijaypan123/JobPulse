# JobPulse

Privacy-first desktop job application tracker. Connects to your email, detects job application updates, and builds a local dashboard of your job search. Your data stays on your device. AI is optional, and you choose the provider.

## MVP 5 — Gmail OAuth and Import

This milestone adds:

- Google OAuth PKCE connection flow for Gmail read-only access
- Gmail search import for likely job-related emails from the last 14 days
- Metadata-only fetch: sender, subject, snippet, message ID, received date
- Deduplication via `processed_messages`
- Local rule-based classification on imported emails
- Automatic application create/update and important alert creation
- Background sync every 20 minutes while connected

## MVP 4 — Local Rule-Based Classifier

- `LocalRulesProvider` with keyword matching and local extraction helpers

## MVP 3 — CSV Export

- Export applications, emails, and alerts as CSV

## MVP 2 — SQLite + Manual Tracker

- SQLite storage and manual application CRUD

## MVP 1 — Project Skeleton

- Tauri + React + TypeScript app shell

## Stack

- Frontend: React + TypeScript + Vite
- Desktop: Tauri 2
- Storage: SQLite via `@tauri-apps/plugin-sql`
- Email: Gmail API + local OAuth token storage

## Development

```powershell
Set-Location D:\Github
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:1420/

## Gmail setup

1. Create a Google OAuth web client
2. Add redirect URI: `http://localhost:1420/oauth/google/callback`
3. Put the client ID in `.env` as `VITE_GOOGLE_CLIENT_ID`
4. See [docs/gmail-setup.md](docs/gmail-setup.md) for full instructions

## Testing MVP 5

1. Configure `.env` with your Google OAuth client ID
2. Go to **Settings → Manage Gmail Connection**
3. Click **Connect Gmail** and approve access
4. Wait for the initial sync summary
5. Check **Emails**, **Applications**, **Alerts**, and **Dashboard**
6. Click **Sync Now** to import new messages manually

## Project Structure

```text
src/
  lib/gmail/       # OAuth, Gmail API, import pipeline
  lib/classifier/  # LocalRulesProvider
  lib/             # Database helpers, CSV export, email processing
  routes/          # Page components
  context/         # Application and Gmail state
src-tauri/         # Tauri Rust backend and migrations
docs/              # Product spec and Gmail setup guide
```

See [docs/product-spec.md](docs/product-spec.md) for the full product specification.

## Next Steps

- MVP 6: Optional cloud AI integrations
- MVP 7: Privacy controls, notifications, and polish
