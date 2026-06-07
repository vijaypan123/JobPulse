# Gmail Setup for JobPulse

JobPulse connects to Gmail using Google OAuth with PKCE. All email processing happens locally on your device.

## 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the **Gmail API** for that project

## 2. Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** for personal testing or **Internal** for workspace use
3. Add your email as a test user while the app is in testing mode
4. Add the scope:
   - `https://www.googleapis.com/auth/gmail.readonly`

## 3. Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Create credentials → **OAuth client ID**
3. Application type: **Web application**
4. Add this authorized redirect URI:

```text
http://localhost:1420/oauth/google/callback
```

5. Copy the client ID

## 4. Configure JobPulse locally

1. Copy `.env.example` to `.env`
2. Set your client ID:

```text
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

3. Restart the dev server:

```powershell
Set-Location D:\Github
npm run dev
```

## 5. Connect Gmail in the app

1. Open http://localhost:1420/
2. Go to **Settings → Manage Gmail Connection**
3. Click **Connect Gmail**
4. Sign in and approve read-only Gmail access
5. JobPulse will run an initial sync automatically

## What JobPulse reads

- Gmail search results from the last 14 days using job-related subject filters
- Message metadata only: sender, subject, snippet, received date, message ID
- No full email bodies are stored by default

## Privacy notes

- OAuth tokens are stored locally in SQLite or browser localStorage during preview mode
- Email content is classified with local keyword rules only
- No cloud backend receives your inbox data

## Troubleshooting

### Redirect URI mismatch

Make sure Google Cloud uses exactly:

```text
http://localhost:1420/oauth/google/callback
```

### Gmail API not enabled

Enable the Gmail API in Google Cloud Console for the same project as your OAuth client.

### App blocked during testing

Add your Google account under OAuth consent screen test users.

### Session expired

Disconnect and reconnect Gmail from **Settings → Email**.
