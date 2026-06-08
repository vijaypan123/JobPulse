# Gmail Setup for JobPulse

JobPulse supports **two ways** to connect Gmail. Pick the one that fits how you want to run the app.

## Option A — Sign in with Google (quickest)

Best for users who just want to click **Sign in with Google** without touching `.env`.

### For app maintainers / distributors

1. Create a Google Cloud OAuth **Web application** client
2. Enable the **Gmail API**
3. Add this redirect URI:

```text
http://localhost:1420/oauth/google/callback
```

4. Set the built-in client ID in `.env` before building JobPulse:

```text
VITE_BUILTIN_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

5. Rebuild or restart the dev server

Users can then open **Settings → Manage Gmail Connection** and click **Sign in with Google**.

---

## Option B — Your own Google OAuth app (advanced)

Best for developers who want **full control** of their own Google Cloud project and credentials.

### Steps

1. Create a Google Cloud project
2. Enable the **Gmail API**
3. Configure the OAuth consent screen and add yourself as a test user
4. Create an OAuth client — use **Desktop app** (recommended) or **Web application**
5. Add this redirect URI:

```text
http://localhost:1420/oauth/google/callback
```

6. Copy `.env.example` to `.env`
7. Set your personal client ID:

```text
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

If you chose **Web application**, also copy the client secret into `.env` (never commit this file):

```text
GOOGLE_CLIENT_SECRET=your-client-secret
```

JobPulse adds the secret only on the local Vite dev server during token exchange — it is not bundled into the browser app.

8. Restart the dev server
9. In JobPulse, go to **Settings → Manage Gmail Connection**
10. Click **Connect with your OAuth app**

---

## Using both options

You can enable **both** in the same build:

```text
VITE_GOOGLE_CLIENT_ID=your-personal-client.apps.googleusercontent.com
VITE_BUILTIN_GOOGLE_CLIENT_ID=shared-jobpulse-client.apps.googleusercontent.com
```

JobPulse will show:

- **Sign in with Google** → uses the built-in client ID (popup flow)
- **Connect with your OAuth app** → uses your `.env` client ID (redirect flow)

---

## What JobPulse reads

- Gmail search results from the last 14 days using job-related subject filters
- Message metadata only: sender, subject, snippet, received date, message ID
- No full email bodies stored by default

## Privacy notes

- OAuth tokens are stored locally in SQLite or browser localStorage during preview mode
- Email content is classified with local keyword rules only
- No JobPulse cloud backend receives your inbox data

## Troubleshooting

### client_secret is missing

You created a **Web application** OAuth client. Google requires the client secret when exchanging the auth code.

Fix one of these:

1. **Easiest:** create a new OAuth client with type **Desktop app**, use its Client ID in `.env`, and add the same redirect URI
2. **Keep Web client:** open your OAuth client in Google Cloud → copy the **Client secret** → add to `.env`:

```text
GOOGLE_CLIENT_SECRET=your-client-secret
```

Restart `npm run dev` and connect again.

### Redirect URI mismatch

Make sure Google Cloud uses exactly:

```text
http://localhost:1420/oauth/google/callback
```

### Built-in Sign in with Google is disabled

The app build does not include `VITE_BUILTIN_GOOGLE_CLIENT_ID`. Use Option B or ask the maintainer to configure Option A.

### Popup blocked

Allow popups for `localhost:1420` when using **Sign in with Google**.

### Session expired

Disconnect and reconnect Gmail from **Settings → Email**.

### Wrong Google account / primary account auto-selected

JobPulse asks Google to show the **account picker** on connect. If you still land on the wrong inbox:

1. **Disconnect** Gmail in JobPulse, then connect again and choose the other account on the picker
2. Open an **Incognito/Private** window, sign in only with the job-search Gmail, then connect
3. Or sign out of Google in your browser (`https://accounts.google.com/`), then reconnect

If your OAuth app is still in **Testing** mode in Google Cloud, add **every Gmail address** you want to use under **APIs & Services → OAuth consent screen → Test users**. Accounts not on that list cannot authorize the app.
