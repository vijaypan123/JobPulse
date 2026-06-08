import type {
  AlertInput,
  AlertRecord,
  AlertRow,
  Application,
  ApplicationInput,
  ApplicationRow,
  ApplicationStatus,
  EmailInput,
  EmailRecord,
  EmailRow,
} from "./types";

const DB_CONNECTION = "sqlite:jobpulse.db";
const BROWSER_STORAGE_KEY = "jobpulse-browser-db";

const ACTION_STATUSES: ApplicationStatus[] = [
  "Assessment",
  "Interview",
  "Final Round",
  "Offer",
];

export function computeActionNeeded(
  status: ApplicationStatus,
  deadline?: string | null,
): boolean {
  return ACTION_STATUSES.includes(status) || Boolean(deadline);
}

export function mapApplicationRow(row: ApplicationRow): Application {
  const status = row.status as ApplicationStatus;

  return {
    id: row.id,
    company: row.company,
    role: row.role ?? "",
    status,
    dateApplied: row.date_applied ?? "",
    lastUpdate: row.last_update ?? row.updated_at ?? "",
    deadline: row.deadline ?? undefined,
    source: row.source ?? "Manual",
    notes: row.notes ?? undefined,
    actionNeeded: computeActionNeeded(status, row.deadline),
  };
}

function mapEmailRow(row: EmailRow): EmailRecord {
  return {
    id: row.id,
    gmailMessageId: row.gmail_message_id,
    applicationId: row.application_id ?? undefined,
    sender: row.sender ?? "",
    subject: row.subject ?? "",
    snippet: row.snippet ?? "",
    receivedAt: row.received_at ?? "",
    category: row.category ?? "unknown",
    importance: (row.importance as EmailRecord["importance"]) ?? "low",
    requiresAction: row.requires_action === 1,
    summary: row.summary ?? undefined,
    aiUsed: row.ai_used === 1,
  };
}

function mapAlertRow(row: AlertRow): AlertRecord {
  return {
    id: row.id,
    emailId: row.email_id ?? undefined,
    applicationId: row.application_id ?? undefined,
    title: row.title,
    message: row.message,
    alertType: row.alert_type ?? "unknown",
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeApplicationInput(input: ApplicationInput): Required<
  Pick<ApplicationInput, "company" | "role" | "status" | "source">
> &
  ApplicationInput {
  const today = todayIsoDate();

  return {
    company: input.company.trim(),
    role: input.role?.trim() ?? "",
    status: input.status,
    dateApplied: input.dateApplied || today,
    lastUpdate: input.lastUpdate || today,
    deadline: input.deadline || undefined,
    source: input.source?.trim() || "Manual",
    notes: input.notes?.trim() || undefined,
  };
}

type BrowserStore = {
  applications: ApplicationRow[];
  emails: EmailRow[];
  alerts: AlertRow[];
  processedMessages: { gmail_message_id: string; processed_at: string; category?: string; important?: number }[];
  settings: Record<string, string>;
  nextApplicationId: number;
  nextEmailId: number;
  nextAlertId: number;
};

function emptyBrowserStore(): BrowserStore {
  return {
    applications: [],
    emails: [],
    alerts: [],
    processedMessages: [],
    settings: {},
    nextApplicationId: 1,
    nextEmailId: 1,
    nextAlertId: 1,
  };
}

function nextIdFromRows<T extends { id: number }>(
  rows: T[],
  fallback: number,
): number {
  if (rows.length === 0) {
    return fallback;
  }

  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

function normalizeBrowserStore(parsed: Partial<BrowserStore> | null | undefined): BrowserStore {
  const empty = emptyBrowserStore();
  if (!parsed || typeof parsed !== "object") {
    return empty;
  }

  const applications = Array.isArray(parsed.applications) ? parsed.applications : empty.applications;
  const emails = Array.isArray(parsed.emails) ? parsed.emails : empty.emails;
  const alerts = Array.isArray(parsed.alerts) ? parsed.alerts : empty.alerts;

  return {
    applications,
    emails,
    alerts,
    processedMessages: Array.isArray(parsed.processedMessages)
      ? parsed.processedMessages
      : empty.processedMessages,
    settings:
      parsed.settings && typeof parsed.settings === "object"
        ? parsed.settings
        : empty.settings,
    nextApplicationId:
      typeof parsed.nextApplicationId === "number"
        ? parsed.nextApplicationId
        : nextIdFromRows(applications, empty.nextApplicationId),
    nextEmailId:
      typeof parsed.nextEmailId === "number"
        ? parsed.nextEmailId
        : nextIdFromRows(emails, empty.nextEmailId),
    nextAlertId:
      typeof parsed.nextAlertId === "number"
        ? parsed.nextAlertId
        : nextIdFromRows(alerts, empty.nextAlertId),
  };
}

function readBrowserStore(): BrowserStore {
  const raw = localStorage.getItem(BROWSER_STORAGE_KEY);
  if (!raw) {
    return emptyBrowserStore();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BrowserStore>;
    const store = normalizeBrowserStore(parsed);

    if (!parsed.settings || typeof parsed.settings !== "object") {
      writeBrowserStore(store);
    }

    return store;
  } catch {
    return emptyBrowserStore();
  }
}

function writeBrowserStore(store: BrowserStore) {
  localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(store));
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

type SqlDatabase = {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<{ lastInsertId?: number; rowsAffected?: number }>;
};

let dbPromise: Promise<SqlDatabase> | null = null;

async function getSqlDatabase(): Promise<SqlDatabase> {
  if (!dbPromise) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    dbPromise = Database.load(DB_CONNECTION) as Promise<SqlDatabase>;
  }

  return dbPromise;
}

const SAMPLE_SEED_FLAG = "sample_applications_seeded";

const seedApplications: ApplicationInput[] = [
  {
    company: "RBC",
    role: "Financial Analyst",
    status: "Interview",
    dateApplied: "2026-06-01",
    lastUpdate: "2026-06-07",
    deadline: "2026-06-10",
    source: "Sample",
    notes: "Recruiter asked for availability",
  },
  {
    company: "CGI",
    role: "Business Analyst",
    status: "Applied",
    dateApplied: "2026-06-04",
    lastUpdate: "2026-06-04",
    source: "Sample",
    notes: "Application confirmation received",
  },
  {
    company: "SLC Management",
    role: "Financial Analyst",
    status: "Rejected",
    dateApplied: "2026-05-28",
    lastUpdate: "2026-06-03",
    source: "Sample",
    notes: "Not selected",
  },
  {
    company: "KPMG",
    role: "Analyst",
    status: "Assessment",
    dateApplied: "2026-05-20",
    lastUpdate: "2026-06-06",
    deadline: "2026-06-10",
    source: "Sample",
    notes: "Online assessment pending",
  },
  {
    company: "CIBC",
    role: "Financial Analyst",
    status: "No Response",
    dateApplied: "2026-05-15",
    lastUpdate: "2026-05-15",
    source: "Sample",
  },
  {
    company: "TD Bank",
    role: "Associate Analyst",
    status: "Offer",
    dateApplied: "2026-04-10",
    lastUpdate: "2026-06-05",
    deadline: "2026-06-12",
    source: "Sample",
    notes: "Offer letter received",
  },
];

function sampleFingerprint(
  input: Pick<ApplicationInput, "company" | "role" | "status" | "dateApplied" | "notes">,
): string {
  return [
    input.company.trim().toLowerCase(),
    (input.role ?? "").trim().toLowerCase(),
    input.status,
    input.dateApplied ?? "",
    (input.notes ?? "").trim().toLowerCase(),
  ].join("|");
}

const SAMPLE_FINGERPRINTS = new Set(seedApplications.map(sampleFingerprint));

const DEMO_COMPANY_NAMES = new Set(
  seedApplications.map((application) => application.company.trim().toLowerCase()),
);

export function isSampleApplication(application: Application): boolean {
  if (application.source === "Sample") {
    return true;
  }

  if (SAMPLE_FINGERPRINTS.has(sampleFingerprint(application))) {
    return true;
  }

  if (
    application.source === "Manual" &&
    DEMO_COMPANY_NAMES.has(application.company.trim().toLowerCase())
  ) {
    return true;
  }

  return false;
}

export async function countSampleApplications(): Promise<number> {
  const applications = await getApplications();
  return applications.filter(isSampleApplication).length;
}

export async function clearSampleApplications(): Promise<number> {
  const applications = await getApplications();
  const sampleApplications = applications.filter(isSampleApplication);

  for (const application of sampleApplications) {
    await deleteApplication(application.id);
  }

  return sampleApplications.length;
}

async function seedInitialApplicationsIfEmpty(): Promise<void> {
  const alreadySeeded = await getSetting(SAMPLE_SEED_FLAG);
  if (alreadySeeded === "1") {
    return;
  }

  const existing = await getApplications();
  if (existing.length > 0) {
    await setSetting(SAMPLE_SEED_FLAG, "1");
    return;
  }

  for (const application of seedApplications) {
    await createApplication(application);
  }

  await setSetting(SAMPLE_SEED_FLAG, "1");
}

export async function initializeDatabase(): Promise<void> {
  if (isTauriRuntime()) {
    await getSqlDatabase();
  } else {
    readBrowserStore();
  }

  await seedInitialApplicationsIfEmpty();
}

export async function getApplications(): Promise<Application[]> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const rows = await db.select<ApplicationRow[]>(
      "SELECT * FROM applications ORDER BY last_update DESC, id DESC",
    );
    return rows.map(mapApplicationRow);
  }

  const store = readBrowserStore();
  return store.applications
    .map(mapApplicationRow)
    .sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const data = normalizeApplicationInput(input);

  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const result = await db.execute(
      `INSERT INTO applications (
        company, role, status, date_applied, last_update, deadline, source, notes, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.company,
        data.role,
        data.status,
        data.dateApplied,
        data.lastUpdate,
        data.deadline ?? null,
        data.source,
        data.notes ?? null,
        data.lastUpdate,
      ],
    );

    const rows = await db.select<ApplicationRow[]>(
      "SELECT * FROM applications WHERE id = $1",
      [result.lastInsertId ?? 0],
    );

    return mapApplicationRow(rows[0]);
  }

  const store = readBrowserStore();
  const now = new Date().toISOString();
  const row: ApplicationRow = {
    id: store.nextApplicationId++,
    company: data.company,
    role: data.role,
    status: data.status,
    date_applied: data.dateApplied ?? null,
    last_update: data.lastUpdate ?? null,
    deadline: data.deadline ?? null,
    source: data.source ?? null,
    notes: data.notes ?? null,
    created_at: now,
    updated_at: now,
  };

  store.applications.push(row);
  writeBrowserStore(store);
  return mapApplicationRow(row);
}

export async function updateApplication(
  id: number,
  input: ApplicationInput,
): Promise<Application> {
  const data = normalizeApplicationInput(input);

  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute(
      `UPDATE applications SET
        company = $1,
        role = $2,
        status = $3,
        date_applied = $4,
        last_update = $5,
        deadline = $6,
        source = $7,
        notes = $8,
        updated_at = $9
      WHERE id = $10`,
      [
        data.company,
        data.role,
        data.status,
        data.dateApplied,
        data.lastUpdate,
        data.deadline ?? null,
        data.source,
        data.notes ?? null,
        data.lastUpdate,
        id,
      ],
    );

    const rows = await db.select<ApplicationRow[]>(
      "SELECT * FROM applications WHERE id = $1",
      [id],
    );

    return mapApplicationRow(rows[0]);
  }

  const store = readBrowserStore();
  const index = store.applications.findIndex((row) => row.id === id);
  if (index === -1) {
    throw new Error("Application not found");
  }

  const now = new Date().toISOString();
  store.applications[index] = {
    ...store.applications[index],
    company: data.company,
    role: data.role,
    status: data.status,
    date_applied: data.dateApplied ?? null,
    last_update: data.lastUpdate ?? null,
    deadline: data.deadline ?? null,
    source: data.source ?? null,
    notes: data.notes ?? null,
    updated_at: now,
  };

  writeBrowserStore(store);
  return mapApplicationRow(store.applications[index]);
}

export async function deleteApplication(id: number): Promise<void> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute("DELETE FROM applications WHERE id = $1", [id]);
    return;
  }

  const store = readBrowserStore();
  store.applications = store.applications.filter((row) => row.id !== id);
  writeBrowserStore(store);
}

export async function getEmails(): Promise<EmailRecord[]> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const rows = await db.select<EmailRow[]>(
      "SELECT * FROM emails ORDER BY received_at DESC, id DESC",
    );
    return rows.map(mapEmailRow);
  }

  return readBrowserStore().emails.map(mapEmailRow);
}

export async function createEmail(input: EmailInput): Promise<EmailRecord> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const result = await db.execute(
      `INSERT INTO emails (
        gmail_message_id, application_id, sender, subject, snippet, received_at,
        category, importance, requires_action, summary, ai_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        input.gmailMessageId,
        input.applicationId ?? null,
        input.sender ?? null,
        input.subject ?? null,
        input.snippet ?? null,
        input.receivedAt ?? null,
        input.category ?? null,
        input.importance ?? null,
        input.requiresAction ? 1 : 0,
        input.summary ?? null,
        input.aiUsed ? 1 : 0,
      ],
    );

    const rows = await db.select<EmailRow[]>("SELECT * FROM emails WHERE id = $1", [
      result.lastInsertId ?? 0,
    ]);

    return mapEmailRow(rows[0]);
  }

  const store = readBrowserStore();
  const row: EmailRow = {
    id: store.nextEmailId++,
    gmail_message_id: input.gmailMessageId,
    application_id: input.applicationId ?? null,
    sender: input.sender ?? null,
    subject: input.subject ?? null,
    snippet: input.snippet ?? null,
    received_at: input.receivedAt ?? null,
    category: input.category ?? null,
    importance: input.importance ?? null,
    requires_action: input.requiresAction ? 1 : 0,
    summary: input.summary ?? null,
    ai_used: input.aiUsed ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  store.emails.push(row);
  writeBrowserStore(store);
  return mapEmailRow(row);
}

export async function updateEmail(
  id: number,
  input: Partial<EmailInput> & { applicationId?: number | null },
): Promise<EmailRecord> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const existingRows = await db.select<EmailRow[]>("SELECT * FROM emails WHERE id = $1", [id]);
    const existing = existingRows[0];
    if (!existing) {
      throw new Error("Email not found");
    }

    await db.execute(
      `UPDATE emails SET
        application_id = $1,
        sender = $2,
        subject = $3,
        snippet = $4,
        received_at = $5,
        category = $6,
        importance = $7,
        requires_action = $8,
        summary = $9,
        ai_used = $10
      WHERE id = $11`,
      [
        input.applicationId !== undefined ? (input.applicationId ?? null) : existing.application_id,
        input.sender ?? existing.sender,
        input.subject ?? existing.subject,
        input.snippet ?? existing.snippet,
        input.receivedAt ?? existing.received_at,
        input.category ?? existing.category,
        input.importance ?? existing.importance,
        input.requiresAction !== undefined
          ? input.requiresAction
            ? 1
            : 0
          : existing.requires_action,
        input.summary ?? existing.summary,
        input.aiUsed !== undefined ? (input.aiUsed ? 1 : 0) : existing.ai_used,
        id,
      ],
    );

    const rows = await db.select<EmailRow[]>("SELECT * FROM emails WHERE id = $1", [id]);
    return mapEmailRow(rows[0]);
  }

  const store = readBrowserStore();
  const index = store.emails.findIndex((row) => row.id === id);
  if (index === -1) {
    throw new Error("Email not found");
  }

  const existing = store.emails[index];
  store.emails[index] = {
    ...existing,
    application_id:
      input.applicationId !== undefined ? (input.applicationId ?? null) : existing.application_id,
    sender: input.sender ?? existing.sender,
    subject: input.subject ?? existing.subject,
    snippet: input.snippet ?? existing.snippet,
    received_at: input.receivedAt ?? existing.received_at,
    category: input.category ?? existing.category,
    importance: input.importance ?? existing.importance,
    requires_action:
      input.requiresAction !== undefined
        ? input.requiresAction
          ? 1
          : 0
        : existing.requires_action,
    summary: input.summary ?? existing.summary,
    ai_used: input.aiUsed !== undefined ? (input.aiUsed ? 1 : 0) : existing.ai_used,
  };

  writeBrowserStore(store);
  return mapEmailRow(store.emails[index]);
}

export async function clearProcessedMessages(): Promise<void> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute("DELETE FROM processed_messages");
    return;
  }

  const store = readBrowserStore();
  store.processedMessages = [];
  writeBrowserStore(store);
}

export async function getAlerts(): Promise<AlertRecord[]> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const rows = await db.select<AlertRow[]>(
      "SELECT * FROM alerts ORDER BY created_at DESC, id DESC",
    );
    return rows.map(mapAlertRow);
  }

  return readBrowserStore().alerts.map(mapAlertRow);
}

export async function createAlert(input: AlertInput): Promise<AlertRecord> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const result = await db.execute(
      `INSERT INTO alerts (
        email_id, application_id, title, message, alert_type, read
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.emailId ?? null,
        input.applicationId ?? null,
        input.title,
        input.message,
        input.alertType ?? null,
        input.read ? 1 : 0,
      ],
    );

    const rows = await db.select<AlertRow[]>("SELECT * FROM alerts WHERE id = $1", [
      result.lastInsertId ?? 0,
    ]);

    return mapAlertRow(rows[0]);
  }

  const store = readBrowserStore();
  const row: AlertRow = {
    id: store.nextAlertId++,
    email_id: input.emailId ?? null,
    application_id: input.applicationId ?? null,
    title: input.title,
    message: input.message,
    alert_type: input.alertType ?? null,
    read: input.read ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  store.alerts.push(row);
  writeBrowserStore(store);
  return mapAlertRow(row);
}

export async function markMessageProcessed(
  gmailMessageId: string,
  category?: string,
  important = false,
): Promise<void> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute(
      `INSERT OR IGNORE INTO processed_messages (
        gmail_message_id, category, important
      ) VALUES ($1, $2, $3)`,
      [gmailMessageId, category ?? null, important ? 1 : 0],
    );
    return;
  }

  const store = readBrowserStore();
  if (store.processedMessages.some((item) => item.gmail_message_id === gmailMessageId)) {
    return;
  }

  store.processedMessages.push({
    gmail_message_id: gmailMessageId,
    processed_at: new Date().toISOString(),
    category,
    important: important ? 1 : 0,
  });
  writeBrowserStore(store);
}

export async function isMessageProcessed(gmailMessageId: string): Promise<boolean> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const rows = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM processed_messages WHERE gmail_message_id = $1",
      [gmailMessageId],
    );
    return rows[0]?.count > 0;
  }

  const store = readBrowserStore();
  return store.processedMessages.some((item) => item.gmail_message_id === gmailMessageId);
}

export async function getSetting(key: string): Promise<string | null> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    const rows = await db.select<{ value: string }[]>(
      "SELECT value FROM settings WHERE key = $1",
      [key],
    );
    return rows[0]?.value ?? null;
  }

  return readBrowserStore().settings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
    return;
  }

  const store = readBrowserStore();
  store.settings[key] = value;
  writeBrowserStore(store);
}

export async function deleteSetting(key: string): Promise<void> {
  if (isTauriRuntime()) {
    const db = await getSqlDatabase();
    await db.execute("DELETE FROM settings WHERE key = $1", [key]);
    return;
  }

  const store = readBrowserStore();
  delete store.settings[key];
  writeBrowserStore(store);
}

export async function findApplicationByCompanyAndRole(
  company: string,
  role?: string,
): Promise<Application | null> {
  const applications = await getApplications();
  const normalizedCompany = normalizeCompanyKey(company);
  const normalizedRole = role?.trim().toLowerCase();

  const companyMatches = applications.filter((application) =>
    companiesMatch(normalizedCompany, normalizeCompanyKey(application.company)),
  );

  if (companyMatches.length === 0) {
    return null;
  }

  if (normalizedRole) {
    const exactRoleMatch = companyMatches.find(
      (application) => application.role.trim().toLowerCase() === normalizedRole,
    );
    if (exactRoleMatch) {
      return exactRoleMatch;
    }
  }

  return companyMatches.sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate))[0];
}

function normalizeCompanyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s&]/g, "")
    .replace(/\s+(inc|ltd|llc|corp|corporation|limited|company|co)\.?$/i, "")
    .replace(/\s+/g, " ");
}

function companiesMatch(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }

  if (left.length >= 3 && right.length >= 3) {
    return left.includes(right) || right.includes(left);
  }

  return false;
}

export function getDashboardStats(applications: Application[]) {
  const countByStatus = (status: Application["status"]) =>
    applications.filter((app) => app.status === status).length;

  return {
    total: applications.length,
    applied: countByStatus("Applied"),
    interviews: countByStatus("Interview") + countByStatus("Final Round"),
    assessments: countByStatus("Assessment"),
    offers: countByStatus("Offer"),
    rejected: countByStatus("Rejected"),
    noResponse: countByStatus("No Response"),
    actionNeeded: applications.filter((app) => app.actionNeeded).length,
  };
}

export function applicationsToDeadlines(applications: Application[]) {
  const today = todayIsoDate();

  return applications
    .filter((application) => application.deadline)
    .map((application) => {
      const dueDate = application.deadline!;
      let urgency: "low" | "medium" | "high" = "low";

      if (dueDate <= today) {
        urgency = "high";
      } else {
        const daysUntil = Math.ceil(
          (new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000,
        );
        urgency = daysUntil <= 3 ? "high" : daysUntil <= 7 ? "medium" : "low";
      }

      let label = "Follow up";
      if (application.status === "Assessment") {
        label = "Complete assessment";
      } else if (application.status === "Interview" || application.status === "Final Round") {
        label = "Interview follow-up";
      } else if (application.status === "Offer") {
        label = "Respond to offer";
      }

      return {
        id: application.id,
        company: application.company,
        role: application.role,
        label,
        dueDate,
        urgency,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function filterApplications(
  applications: Application[],
  query: string,
  statusFilter: string,
): Application[] {
  const normalizedQuery = query.trim().toLowerCase();

  return applications.filter((application) => {
    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      application.company.toLowerCase().includes(normalizedQuery) ||
      application.role.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });
}

export function sortApplications(
  applications: Application[],
  sortBy: "lastUpdate" | "deadline",
): Application[] {
  const sorted = [...applications];

  if (sortBy === "deadline") {
    return sorted.sort((a, b) => {
      if (!a.deadline && !b.deadline) {
        return b.lastUpdate.localeCompare(a.lastUpdate);
      }
      if (!a.deadline) {
        return 1;
      }
      if (!b.deadline) {
        return -1;
      }
      return a.deadline.localeCompare(b.deadline);
    });
  }

  return sorted.sort((a, b) => b.lastUpdate.localeCompare(a.lastUpdate));
}
