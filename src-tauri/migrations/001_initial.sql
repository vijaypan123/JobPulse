CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'Applied',
  date_applied TEXT,
  last_update TEXT,
  deadline TEXT,
  source TEXT DEFAULT 'Manual',
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
