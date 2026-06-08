# AI Setup for JobPulse (MVP 6)

JobPulse supports **optional AI classification** to improve company, role, and status detection. The app still works without AI using local keyword rules.

## Recommended free options

### Option A — Ollama (best for privacy, 100% free)

Runs on your computer. No API key. No email content leaves your device.

1. Install [Ollama](https://ollama.com)
2. Pull a model:

```powershell
ollama pull llama3.2
```

3. In JobPulse: **Settings → Configure AI**
4. Enable AI classification
5. Provider: **Ollama (free, local)**
6. Model: `llama3.2`
7. Base URL: `http://localhost:11434`
8. Click **Test Connection**, then **Save AI Settings**
9. Run **Sync Now** on Gmail to classify new emails with AI

Optional `.env` defaults:

```text
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

---

### Option B — Google Gemini (free tier, cloud)

Uses Google's free API tier. Requires a free API key.

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. In JobPulse: **Settings → Configure AI**
4. Enable AI classification
5. Provider: **Google Gemini (free tier)**
6. Model: `gemini-2.0-flash-lite` (better free-tier availability than `gemini-2.0-flash`)
7. Paste your API key
8. Data mode: **Subject + snippet** (recommended)
9. Click **Test Connection**, then **Save AI Settings**

Only the fields you select (subject/snippet) are sent to Google.

### Gemini quota error (429 / limit: 0)

If you see **quota exceeded** even though you never used Gemini:

- You likely pasted a **Google Cloud OAuth secret** or wrong credential — not an AI Studio key
- Or your account has **no free quota** for `gemini-2.0-flash` — switch to `gemini-2.0-flash-lite`
- Create a fresh key at [Google AI Studio](https://aistudio.google.com/apikey) (separate from Gmail OAuth setup)

JobPulse falls back to local rules when Gemini fails, so the app still works.

---

### Option C — Groq / OpenAI-compatible (free tier)

Works with any OpenAI-compatible endpoint. Groq offers a fast free tier.

1. Create a free key at [console.groq.com](https://console.groq.com)
2. In JobPulse: **Settings → Configure AI**
3. Provider: **OpenAI-compatible API**
4. Base URL: `https://api.groq.com/openai/v1`
5. Model: `llama-3.1-8b-instant`
6. Paste your API key and test

---

## Data modes

| Mode | What is sent |
|------|----------------|
| Subject only | Sender + subject line |
| Subject + snippet | Sender, subject, Gmail snippet (recommended) |
| Subject + snippet + body | Above plus email body when available |

Default: **Subject + snippet**

---

## Fallback behavior

If AI is enabled but the request fails (Ollama not running, bad API key, etc.), JobPulse **automatically falls back to local rules** so imports still work.

---

## Re-classifying old emails

Already-processed Gmail messages are skipped to avoid duplicates. AI applies to **new syncs** after you enable it. To re-run classification on old mail, clear processed message history (coming in MVP 7 privacy controls) or delete and reconnect Gmail.

---

## Privacy summary

| Provider | Cost | Email leaves device? |
|----------|------|--------------------|
| Local rules | Free | No |
| Ollama | Free | No |
| Gemini | Free tier | Yes (selected fields only) |
| Groq / OpenAI-compatible | Free tier available | Yes (selected fields only) |

API keys are stored locally in your JobPulse database / browser storage. They are not sent to any JobPulse server.
