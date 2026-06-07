# JobPulse — Private Local Job Application Email Agent

## 1. Product Summary

**JobPulse** is a privacy-first desktop app that connects to a user’s email inbox, detects job application updates, tracks applications locally, and shows a dashboard of job-search activity.

The key product promise:

> Your job tracker stays on your device. AI is optional, and you choose the provider.

This app should **not** require a cloud backend or cloud database. It should work as a local desktop app where users control their data.

---

## 2. Core Goals

### Main Goals

- Monitor a user’s email for job application updates.
- Detect important messages such as:
  - Interview invitations
  - Assessments
  - Offers
  - Rejections
  - Recruiter availability requests
  - Deadlines
  - Application confirmations
- Store application data locally.
- Show a dashboard with application statuses, deadlines, and alerts.
- Let users export their data as CSV.
- Let users choose whether they want AI features enabled.

### Privacy Goals

- No central server storing user emails.
- No cloud database storing job application data.
- Store data locally using SQLite.
- Allow CSV export.
- AI should be optional.
- The default mode should work without sending email content to any AI provider.
- Users should be able to disconnect Gmail and delete all local data.

---

## 3. Recommended App Type

Build this as a **desktop app**, not a traditional SaaS app.

Recommended stack:

```text
Frontend/Dashboard:
React + TypeScript

Desktop App Wrapper:
Tauri

Local Database:
SQLite

Email Integration:
Gmail API first
Outlook later

AI Layer:
Optional provider-based integration

Notifications:
Local desktop notifications

Export:
CSV
```

Recommended MVP stack:

```text
Tauri + React + TypeScript + SQLite
```

Alternative beginner MVP stack:

```text
Python + Streamlit + SQLite
```

The Python/Streamlit version is easier to build quickly, but the Tauri version is better if the goal is a polished app that can eventually be given to other people.

---

## 4. Product Positioning

Do **not** market this as an “AI email reader.” That sounds invasive.

Better positioning:

> A private job search dashboard that updates from your inbox.

Possible names:

- JobPulse
- ApplyWatch
- CareerInbox
- OfferSignal
- InboxTrack

Recommended name:

```text
JobPulse
```

Recommended tagline:

```text
Track your job search from your inbox — privately, on your device.
```

---

## 5. Important Privacy Design

The app should have two main modes.

### Mode 1: Private Mode

Default mode.

```text
- No AI API required
- No email content leaves the device
- Uses local rules and keyword matching
- Stores all data locally
- Sends only local desktop notifications
```

### Mode 2: Smart AI Mode

Optional mode.

```text
- User chooses an AI provider
- User provides their own API key if using a cloud AI provider
- App sends only selected job-related snippets to the AI provider
- AI improves summaries, classification, extraction, and suggested actions
```

### Optional Future Mode: Local AI Mode

```text
- Uses Ollama or LM Studio
- AI runs on the user’s computer
- Email content does not leave the device
```

---

## 6. AI Should Be an Integration Choice

AI should not be hardcoded into the app.

Do not design the flow like this:

```text
Email → OpenAI → Database
```

Design it like this:

```text
Email → Classifier Interface → Database
```

Then the classifier can be swapped.

Supported classifier providers:

```text
1. LocalRulesProvider
2. OpenAIProvider
3. AnthropicProvider
4. GeminiProvider
5. OllamaProvider
6. CustomOpenAICompatibleProvider
```

The app should work even when AI is disabled.

---

## 7. AI Provider Interface

Example TypeScript interface:

```ts
export type EmailInput = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body?: string;
  receivedAt: string;
};

export type ClassificationResult = {
  isJobRelated: boolean;
  company?: string;
  role?: string;
  category:
    | "application_confirmation"
    | "interview_invitation"
    | "assessment"
    | "offer"
    | "rejection"
    | "deadline"
    | "recruiter_message"
    | "job_alert"
    | "unknown";
  importance: "low" | "medium" | "high";
  requiresAction: boolean;
  deadline?: string;
  suggestedStatus:
    | "Applied"
    | "Assessment"
    | "Interview"
    | "Final Round"
    | "Offer"
    | "Rejected"
    | "Closed"
    | "No Response"
    | "Unknown";
  summary: string;
  confidence: number;
};

export interface AIProvider {
  classifyEmail(input: EmailInput): Promise<ClassificationResult>;
  summarizeEmail?(input: EmailInput): Promise<string>;
}
```

---

## 8. AI Settings Design

In the app settings, users should see:

```text
AI Processing

[ ] Enable AI features

Provider:
[ None - local rules only ]
[ OpenAI ]
[ Anthropic ]
[ Gemini ]
[ Ollama - local model ]
[ Custom OpenAI-compatible API ]

Data sent to AI:
[ Subject only ]
[ Subject + snippet ]
[ Full job-related email body ]

Recommended:
Subject + snippet
```

Default:

```text
AI disabled.
Local rules only.
```

---

## 9. Email Privacy Rules

The app should follow these rules:

```text
- Do not scan the full inbox unnecessarily.
- Use Gmail search filters to find likely job-related emails.
- Do not save full email bodies by default.
- Store only metadata, summaries, and extracted job details.
- Store Gmail message IDs so duplicate alerts are avoided.
- Let users manually delete records.
- Let users delete all local data.
- Let users disconnect Gmail.
```

---

## 10. Gmail Integration

### Gmail Search Query

Start with search-based polling.

Example Gmail search query:

```text
newer_than:14d (
  subject:interview OR
  subject:application OR
  subject:assessment OR
  subject:offer OR
  subject:recruiter OR
  subject:"next steps" OR
  subject:"thank you for applying" OR
  subject:unfortunately OR
  subject:congratulations
)
```

The app should search Gmail every 15–30 minutes in the MVP.

### Gmail API Permissions

Use the least privileged scope possible.

Potential scopes:

```text
https://www.googleapis.com/auth/gmail.metadata
https://www.googleapis.com/auth/gmail.readonly
```

Avoid this unless necessary:

```text
https://www.googleapis.com/auth/gmail.modify
```

Important note:

Gmail scopes such as `gmail.readonly`, `gmail.metadata`, and `gmail.modify` are restricted scopes. If this app is distributed publicly and uses these scopes, Google OAuth verification may be required. If restricted Gmail data is stored or transmitted through your servers, a security assessment may also be required.

Because this product is local-first and avoids server storage, the privacy story is much stronger.

### MVP Gmail Flow

```text
1. User connects Gmail.
2. App stores OAuth token securely on device.
3. App searches Gmail for likely job-related emails.
4. App fetches only message metadata, subject, sender, snippet, and optionally body.
5. App checks whether the message ID has already been processed.
6. App classifies the email using local rules or optional AI.
7. App updates local SQLite database.
8. App sends local notification if important.
```

---

## 11. Email Processing Pipeline

```text
Gmail Search
→ Fetch Email Metadata/Snippet
→ Deduplicate by Gmail Message ID
→ Rule-Based Filter
→ Optional AI Classification
→ Extract Company/Role/Status/Deadline
→ Save to SQLite
→ Update Dashboard
→ Send Notification if Important
```

---

## 12. Classification Categories

The classifier should categorize emails into:

```text
application_confirmation
interview_invitation
assessment
offer
rejection
deadline
recruiter_message
job_alert
unknown
```

### Important Categories

Notify the user for:

```text
interview_invitation
assessment
offer
deadline
recruiter_message
rejection
```

Usually do not notify for:

```text
application_confirmation
job_alert
unknown
```

The user should be able to change notification preferences.

---

## 13. Local Rule-Based Classifier

The app should work without AI.

Example keyword rules:

### Interview Invitation

Keywords:

```text
interview
schedule a call
meet with
hiring manager
availability
select a time
calendar invite
```

Suggested status:

```text
Interview
```

Importance:

```text
High
```

Requires action:

```text
True
```

### Assessment

Keywords:

```text
assessment
test
case study
complete by
online assessment
coding challenge
video interview
one-way interview
```

Suggested status:

```text
Assessment
```

Importance:

```text
High
```

Requires action:

```text
True
```

### Offer

Keywords:

```text
offer
congratulations
pleased to offer
employment agreement
compensation package
```

Suggested status:

```text
Offer
```

Importance:

```text
High
```

Requires action:

```text
True
```

### Rejection

Keywords:

```text
unfortunately
not selected
moving forward with other candidates
will not be proceeding
position has been filled
```

Suggested status:

```text
Rejected
```

Importance:

```text
Medium
```

Requires action:

```text
False
```

### Application Confirmation

Keywords:

```text
thank you for applying
application received
we received your application
your application has been submitted
```

Suggested status:

```text
Applied
```

Importance:

```text
Low
```

Requires action:

```text
False
```

---

## 14. Local Database

Use SQLite.

Local database file:

```text
jobpulse.db
```

Recommended tables:

```text
applications
emails
alerts
processed_messages
settings
ai_providers
```

---

## 15. SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'Applied',
  date_applied TEXT,
  last_update TEXT,
  deadline TEXT,
  source TEXT DEFAULT 'Gmail',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gmail_message_id TEXT UNIQUE NOT NULL,
  application_id INTEGER,
  sender TEXT,
  subject TEXT,
  snippet TEXT,
  received_at TEXT,
  category TEXT,
  importance TEXT,
  requires_action INTEGER DEFAULT 0,
  summary TEXT,
  ai_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER,
  application_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE IF NOT EXISTS processed_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gmail_message_id TEXT UNIQUE NOT NULL,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category TEXT,
  important INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS ai_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  base_url TEXT,
  api_key_encrypted TEXT,
  model TEXT,
  enabled INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 16. CSV Export Format

The app should allow export to:

```text
applications.csv
emails.csv
alerts.csv
```

Example `applications.csv`:

```csv
company,role,status,date_applied,last_update,deadline,source,notes
RBC,Financial Analyst,Interview,2026-06-01,2026-06-07,2026-06-10,Gmail,Recruiter asked for availability
CGI,Business Analyst,Applied,2026-06-04,2026-06-04,,Gmail,Application confirmation received
SLC Management,Financial Analyst,Rejected,2026-05-28,2026-06-03,,Gmail,Not selected
```

---

## 17. Dashboard Requirements

The dashboard should include:

### Overview Cards

```text
Total Applications
Applied
Interviews
Assessments
Offers
Rejected
No Response
Action Needed
```

### Main Tracker Table

Columns:

```text
Company
Role
Status
Date Applied
Last Update
Deadline
Action Needed
Source
Notes
```

Features:

```text
- Search
- Filter by status
- Sort by last update
- Sort by deadline
- Manual edit
- Delete record
- Export CSV
```

### Important Updates Feed

Show recent important emails:

```text
RBC invited you to interview.
KPMG asked you to complete an assessment.
CIBC rejected your application.
```

### Deadlines Page

Show upcoming deadlines:

```text
Complete assessment by June 10
Reply to recruiter by June 8
Interview scheduled for June 12
```

### Analytics Page

Charts or metrics:

```text
Applications by status
Response rate
Interview rate
Offer rate
Rejection rate
Companies with no response after 14 days
Applications sent per week
```

---

## 18. Suggested App Pages

```text
/dashboard
/applications
/emails
/alerts
/deadlines
/settings
/settings/email
/settings/ai
/settings/privacy
```

---

## 19. UI Design Direction

Keep the UI clean and professional.

Suggested style:

```text
- Minimal dashboard
- Card-based layout
- Neutral colors
- Status badges
- Clear privacy settings
- Big “AI is optional” message in settings
```

Status badge examples:

```text
Applied: gray
Assessment: yellow
Interview: blue
Offer: green
Rejected: red
No Response: purple
```

---

## 20. Local Notifications

Send local desktop notifications for important updates.

Example notification:

```text
Important job update: RBC — Financial Analyst

You received an interview invitation.
Action needed: reply with your availability.
```

Notification triggers:

```text
- Interview invitation
- Assessment request
- Offer
- Deadline
- Recruiter availability request
- Rejection if user enables rejection alerts
```

---

## 21. Security Requirements

### Local Data

```text
- Store data in local SQLite.
- Do not store full email bodies by default.
- Encrypt sensitive values such as OAuth tokens and AI API keys.
- Support “Delete all local data.”
- Support “Disconnect Gmail.”
```

### API Keys

For AI integrations:

```text
- Let users bring their own API key.
- Store API keys encrypted locally.
- Never log API keys.
- Never send API keys to your own server.
```

### Email OAuth Tokens

```text
- Store OAuth tokens securely using OS keychain where possible.
- On macOS, use Keychain.
- On Windows, use Windows Credential Manager.
- On Linux, use Secret Service/libsecret if available.
```

---

## 22. MVP Scope

### MVP 1 — Local Tracker

Build:

```text
- Tauri + React project
- SQLite database
- Manual application tracker
- Dashboard cards
- Application table
- CSV export
```

No Gmail yet.

Goal:

```text
User can manually track job applications locally.
```

### MVP 2 — Gmail Import

Build:

```text
- Gmail OAuth
- Gmail search
- Fetch recent job-related email subjects/snippets
- Deduplicate processed messages
- Save emails locally
- Basic rule-based classification
```

Goal:

```text
User can connect Gmail and automatically import likely job application updates.
```

### MVP 3 — Notifications

Build:

```text
- Important update detection
- Local desktop notifications
- Alerts feed
- Settings for notification preferences
```

Goal:

```text
User is notified when important job updates arrive.
```

### MVP 4 — Optional AI

Build:

```text
- AI settings page
- Provider interface
- Local rules provider
- OpenAI-compatible provider
- Optional AI classification
- User chooses what data is sent to AI
```

Goal:

```text
AI improves classification but is not required.
```

### MVP 5 — Polish

Build:

```text
- Better dashboard UI
- App packaging
- Privacy page
- Delete data flow
- Error handling
- Onboarding
```

Goal:

```text
App feels usable by non-technical users.
```

---

## 23. Suggested Folder Structure

```text
jobpulse/
  README.md
  package.json
  src/
    main.tsx
    App.tsx
    routes/
      Dashboard.tsx
      Applications.tsx
      Emails.tsx
      Alerts.tsx
      Deadlines.tsx
      Settings.tsx
    components/
      StatCard.tsx
      ApplicationTable.tsx
      StatusBadge.tsx
      AlertFeed.tsx
      DeadlineList.tsx
    lib/
      db.ts
      gmail.ts
      classifier/
        types.ts
        LocalRulesProvider.ts
        OpenAICompatibleProvider.ts
        OllamaProvider.ts
        index.ts
      notifications.ts
      csvExport.ts
      privacy.ts
    styles/
      globals.css
  src-tauri/
    src/
      main.rs
    tauri.conf.json
    Cargo.toml
  docs/
    product-spec.md
    privacy-model.md
    ai-integrations.md
```

---

## 24. Cursor Build Instructions

Use Cursor to build this in small steps.

Do not ask Cursor to build the entire app in one prompt. Use staged prompts.

---

## 25. Cursor Prompt 1 — Create Project Skeleton

Paste this into Cursor:

```text
Create a Tauri + React + TypeScript desktop app called JobPulse.

The app is a privacy-first local job application tracker. It should use React for the UI and prepare for SQLite local storage.

Create these pages:
- Dashboard
- Applications
- Emails
- Alerts
- Deadlines
- Settings

Create a sidebar navigation layout.
Use clean card-based styling.
Do not add Gmail or AI functionality yet.
Use mock data for now.

Create reusable components:
- StatCard
- ApplicationTable
- StatusBadge
- AlertFeed
- DeadlineList

Keep the code modular and easy to extend.
```

---

## 26. Cursor Prompt 2 — Add SQLite Schema

```text
Add SQLite local storage to the JobPulse app.

Create tables:
- applications
- emails
- alerts
- processed_messages
- settings
- ai_providers

Use the schema from the product spec.

Add database helper functions:
- initializeDatabase()
- createApplication()
- getApplications()
- updateApplication()
- deleteApplication()
- createEmail()
- getEmails()
- createAlert()
- getAlerts()
- markMessageProcessed()
- isMessageProcessed()

The app should initialize the database on startup.
Replace mock application data with data from SQLite.
```

---

## 27. Cursor Prompt 3 — Manual Tracker CRUD

```text
Build the manual job application tracker.

On the Applications page:
- Show all applications from SQLite.
- Add a button to create a new application.
- Add edit functionality.
- Add delete functionality.
- Add filters by status.
- Add search by company or role.
- Add sort by last update and deadline.

Application fields:
- company
- role
- status
- date_applied
- last_update
- deadline
- source
- notes

Keep everything local.
```

---

## 28. Cursor Prompt 4 — CSV Export

```text
Add CSV export functionality.

Allow the user to export:
- applications.csv
- emails.csv
- alerts.csv

Add an Export button on the Settings page and Applications page.

The exported CSV should include headers and all visible database fields.
Make sure commas, quotes, and newlines are escaped correctly.
```

---

## 29. Cursor Prompt 5 — Local Rule-Based Classifier

```text
Create a local rule-based email classifier.

Create a provider interface:
- AIProvider
- EmailInput
- ClassificationResult

Create LocalRulesProvider that classifies emails without any external API.

It should detect:
- application_confirmation
- interview_invitation
- assessment
- offer
- rejection
- deadline
- recruiter_message
- job_alert
- unknown

Use keyword matching and confidence scores.

The classifier should return:
- isJobRelated
- company
- role
- category
- importance
- requiresAction
- deadline
- suggestedStatus
- summary
- confidence

No email content should leave the device.
```

---

## 30. Cursor Prompt 6 — Gmail OAuth and Import

```text
Add Gmail integration to JobPulse.

Requirements:
- Add a Gmail connection page in Settings.
- Let the user connect Gmail using OAuth.
- Use the least privileged Gmail scope possible.
- Search for likely job-related emails using Gmail search queries.
- Fetch only sender, subject, snippet, received date, and message ID first.
- Do not save full email bodies by default.
- Do not process the same Gmail message ID twice.
- Use LocalRulesProvider to classify fetched emails.
- Save job-related emails to SQLite.
- Create or update application records.
- Create alerts for important emails.

Important:
This app is local-first. Do not add any cloud backend.
```

---

## 31. Cursor Prompt 7 — Alerts and Local Notifications

```text
Add local desktop notifications.

When an email is classified as important, create an alert and show a desktop notification.

Important categories:
- interview_invitation
- assessment
- offer
- deadline
- recruiter_message
- rejection

Add notification preferences in Settings:
- Interview alerts
- Assessment alerts
- Offer alerts
- Deadline alerts
- Recruiter message alerts
- Rejection alerts

Store preferences in SQLite settings table.
```

---

## 32. Cursor Prompt 8 — Optional AI Integrations

```text
Add optional AI integrations.

AI must not be required for the app to work.

Create an AI settings page where the user can select:
- None / Local rules only
- OpenAI-compatible provider
- Ollama local model
- Custom endpoint

Create provider classes:
- LocalRulesProvider
- OpenAICompatibleProvider
- OllamaProvider

The user should be able to choose what data is sent:
- Subject only
- Subject + snippet
- Full job-related email body

Default should be:
- AI disabled
- Local rules only
- Subject + snippet if AI is enabled

The app should clearly explain:
- Local rules mode sends no email data to AI.
- Cloud AI sends selected job-related content to the chosen provider.
- Local AI through Ollama keeps data on device.

Store API keys encrypted locally.
Do not log API keys.
```

---

## 33. Cursor Prompt 9 — Privacy Settings

```text
Create a Privacy settings page.

Add:
- View local database location
- Export all data
- Delete all local data
- Disconnect Gmail
- Disable AI
- Clear processed emails
- Toggle whether full email bodies are saved
- Toggle whether snippets are saved

Add clear copy explaining:
“JobPulse stores your job tracker locally on your device. AI is optional. If AI is disabled, no email content is sent to an AI provider.”
```

---

## 34. Cursor Prompt 10 — Polish Dashboard

```text
Polish the dashboard.

Add:
- Overview stat cards
- Applications by status chart
- Recent important updates
- Upcoming deadlines
- Applications needing action
- No response after 14 days section
- Search and filter UI

Make the app feel like a polished privacy-first productivity tool.
```

---

## 35. Recommended Development Order

Build in this order:

```text
1. Tauri + React skeleton
2. Dashboard with mock data
3. SQLite schema
4. Manual application tracker
5. CSV export
6. Rule-based classifier
7. Gmail integration
8. Alerts and notifications
9. Optional AI integrations
10. Privacy settings
11. App packaging
```

---

## 36. What Not to Build First

Avoid these at the beginning:

```text
- Multi-user cloud accounts
- Payments
- Mobile app
- Outlook integration
- Full local LLM support
- Real-time Gmail push notifications
- Browser extension
```

Build the local desktop MVP first.

---

## 37. Future Features

After MVP:

```text
- Outlook support
- Local LLM with Ollama
- Resume/job matching
- Suggested follow-up email drafts
- Interview prep reminders
- Calendar integration
- Auto-detect interview dates
- Import from LinkedIn/Indeed manually
- Encrypted backup file
- Portable app mode
```

---

## 38. Technical Notes

### Gmail Polling vs Push Notifications

For the local MVP, use polling every 15–30 minutes.

Real-time Gmail push notifications require Google Pub/Sub, which introduces cloud infrastructure. That goes against the local-first goal.

Recommended:

```text
MVP:
Local polling

Later optional advanced mode:
Cloud push notifications
```

### Why SQLite Instead of CSV as Main Storage

Use SQLite because:

```text
- Better updates
- Better searching
- Better filtering
- Less risk of file corruption
- Easier deduplication
- Still fully local
```

Still support CSV export because users like portable data.

---

## 39. Example Notification Copy

```text
Important job update: RBC — Financial Analyst

You received an interview invitation.
Action needed: reply with your availability.
```

```text
Assessment deadline: KPMG — Analyst

You need to complete an online assessment by June 10.
```

```text
Application update: CIBC — Financial Analyst

CIBC has decided not to move forward with your application.
```

---

## 40. Success Criteria

The MVP is successful when:

```text
- User can manually add applications.
- User can connect Gmail.
- App detects job-related emails.
- App avoids duplicate processing.
- App updates statuses locally.
- App shows a useful dashboard.
- App sends alerts for important updates.
- App works without AI.
- User can enable AI optionally.
- User can export data as CSV.
- User can delete all local data.
```

---

## 41. Simple README Description

```text
JobPulse is a privacy-first desktop job application tracker. It connects to your email, detects job application updates, and builds a local dashboard of your job search. Your data stays on your device. AI is optional, and you choose the provider.
```

---

## 42. References to Check During Development

- Gmail API scopes documentation
- Gmail API messages.list documentation
- Gmail API users.watch documentation, only if adding push notifications later
- Tauri 2 documentation
- Tauri SQL plugin documentation
- SQLite documentation
- OAuth desktop app best practices
- OS keychain/credential manager libraries
