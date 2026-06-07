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
4. Create an OAuth **Web application** client
5. Add this redirect URI:

```text
http://localhost:1420/oauth/google/callback
```

6. Copy `.env.example` to `.env`
7. Set your personal client ID:

```text
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

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
