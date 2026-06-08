import {
  ATS_SENDER_DOMAINS,
  COMPANY_DOMAIN_MAP,
  JOB_DOMAIN_HINTS,
  NON_APPLICATION_SENDER_DOMAINS,
} from "./rules";
import type { ClassifierEmailInput } from "./types";

const MONTHS: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const GENERIC_SENDER_NAMES = [
  "noreply",
  "no reply",
  "donotreply",
  "do not reply",
  "notifications",
  "mail",
  "recruiting",
  "careers",
  "talent",
  "hiring",
  "hr",
  "jobs",
  "system",
];

const INVALID_COMPANY_PHRASES = [
  "thank you for your application",
  "thank you for applying",
  "thanks for applying",
  "your application",
  "application received",
  "application update",
  "job application",
  "dear candidate",
  "hello candidate",
];

export function buildSearchText(input: ClassifierEmailInput): string {
  return [input.subject, input.snippet, input.body ?? "", input.from]
    .join(" ")
    .toLowerCase();
}

export function isNonApplicationSender(from: string): boolean {
  const lowerFrom = from.toLowerCase();
  return NON_APPLICATION_SENDER_DOMAINS.some((domain) => lowerFrom.includes(`@${domain}`));
}

export function isInvalidCompanyName(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2) {
    return true;
  }

  return INVALID_COMPANY_PHRASES.some(
    (phrase) => normalized === phrase || normalized.startsWith(`${phrase} `),
  );
}

function acceptCompany(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = cleanupCompany(value);
  return isInvalidCompanyName(cleaned) ? undefined : cleaned;
}

export function extractCompany(input: ClassifierEmailInput): string | undefined {
  const subject = input.subject;
  const from = input.from;
  const bodyText = `${input.snippet} ${input.body ?? ""}`;

  const displayNameCompany = acceptCompany(extractCompanyFromDisplayName(from));
  if (displayNameCompany) {
    return displayNameCompany;
  }

  const snippetCompany = acceptCompany(extractCompanyFromBody(bodyText));
  if (snippetCompany) {
    return snippetCompany;
  }

  const roleAtCompanyMatch = subject.match(
    /([A-Za-z0-9 /,&().-]{3,80})\s+at\s+([A-Z][A-Za-z0-9&.\- ]{1,50})/,
  );
  if (roleAtCompanyMatch?.[2]) {
    return acceptCompany(roleAtCompanyMatch[2]);
  }

  const applicationToMatch = subject.match(
    /(?:application to|applied to|position at|role at)\s+([A-Z][A-Za-z0-9&.\- ]{1,50})/i,
  );
  if (applicationToMatch?.[1]) {
    return acceptCompany(applicationToMatch[1]);
  }

  const atCompanyMatch = subject.match(/\bat\s+([A-Z][A-Za-z0-9&.\- ]{1,50})/);
  if (atCompanyMatch?.[1]) {
    return acceptCompany(atCompanyMatch[1]);
  }

  const dashCompanyMatch = subject.match(/^[—-]\s*([A-Z][A-Za-z0-9&.\- ]{1,50})/);
  if (dashCompanyMatch?.[1]) {
    return acceptCompany(dashCompanyMatch[1]);
  }

  const trailingCompanyMatch = subject.match(/([A-Z][A-Za-z0-9&.\- ]{1,50})\s*[—-]/);
  if (trailingCompanyMatch?.[1]) {
    return acceptCompany(trailingCompanyMatch[1]);
  }

  const domainRoot = extractDomainRoot(from.toLowerCase());
  if (domainRoot) {
    if (COMPANY_DOMAIN_MAP[domainRoot]) {
      return COMPANY_DOMAIN_MAP[domainRoot];
    }

    if (ATS_SENDER_DOMAINS.some((domain) => from.toLowerCase().includes(domain))) {
      return undefined;
    }

    if (!JOB_DOMAIN_HINTS.includes(domainRoot)) {
      return acceptCompany(titleCase(domainRoot.replace(/[-_]/g, " ")));
    }
  }

  return undefined;
}

export function extractRole(input: ClassifierEmailInput): string | undefined {
  const subject = input.subject;
  const snippet = input.snippet;
  const bodyText = `${snippet} ${input.body ?? ""}`;

  const applicationSubjectRole = subject.match(
    /thank you for (?:your )?application\s*[-–—]\s*(.+)$/i,
  );
  if (applicationSubjectRole?.[1]) {
    const role = cleanupRole(applicationSubjectRole[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  const applyingForRoleMatch = bodyText.match(
    /applying for(?: the role of)?\s+([A-Za-z0-9 /,&().-]{3,80}?)(?:\s*\(|\.|,|$)/i,
  );
  if (applyingForRoleMatch?.[1]) {
    const role = cleanupRole(applyingForRoleMatch[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  const roleAtCompanyMatch = subject.match(
    /^(.+?)\s+at\s+[A-Z][A-Za-z0-9&.\- ]{1,50}$/,
  );
  if (roleAtCompanyMatch?.[1]) {
    const role = cleanupRole(roleAtCompanyMatch[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  const dashRoleMatch = subject.match(/[—-]\s*([A-Za-z0-9 /,&().-]{3,80})$/);
  if (dashRoleMatch?.[1]) {
    const role = cleanupRole(dashRoleMatch[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  const forRoleMatch = `${subject} ${snippet}`.match(
    /(?:for|role of|position of)\s+(?:the\s+)?([A-Za-z0-9 /,&().-]{3,80})/i,
  );
  if (forRoleMatch?.[1]) {
    const role = cleanupRole(forRoleMatch[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  const titleMatch = subject.match(
    /\b((?:Senior |Junior |Lead |Staff )?(?:Software|Financial|Business|Data|Product|Marketing|Operations|IT|Technical|Support|Sales|Customer )?[A-Za-z]+(?: Analyst| Engineer| Manager| Designer| Developer| Consultant| Associate| Specialist| Coordinator| Architect| Administrator| Support Specialist))\b/i,
  );
  if (titleMatch?.[1]) {
    const role = cleanupRole(titleMatch[1]);
    if (isPlausibleRole(role)) {
      return role;
    }
  }

  return undefined;
}

export function extractDeadline(text: string): string | undefined {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) {
    return isoMatch[1];
  }

  const monthDayMatch = text.match(
    /\b(?:by|before|until|due)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i,
  );
  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1].toLowerCase()];
    const day = monthDayMatch[2].padStart(2, "0");
    const year = monthDayMatch[3] ?? String(new Date().getFullYear());
    return `${year}-${month}-${day}`;
  }

  const numericDateMatch = text.match(/\b(?:by|before|until|due)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (numericDateMatch?.[1]) {
    return normalizeSlashDate(numericDateMatch[1]);
  }

  return undefined;
}

function extractCompanyFromBody(text: string): string | undefined {
  const regardsMatch = text.match(
    /(?:regards,?|sincerely,?|best,?)\s+([A-Z][A-Za-z0-9&.\- ]{2,50}(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Canada|Team|Recruiting Team))?)/i,
  );
  if (regardsMatch?.[1]) {
    return cleanupCompany(regardsMatch[1]);
  }

  const fromTeamMatch = text.match(
    /\bfrom\s+([A-Z][A-Za-z0-9&.\- ]{2,40})\s+(?:Recruiting|Careers|Talent|HR|Hiring)\b/i,
  );
  if (fromTeamMatch?.[1]) {
    return cleanupCompany(fromTeamMatch[1]);
  }

  return undefined;
}

function extractCompanyFromDisplayName(from: string): string | undefined {
  const displayNameMatch = from.match(/^"?([^"<]+)"?\s*</);
  if (!displayNameMatch?.[1]) {
    return undefined;
  }

  const displayName = cleanupCompany(displayNameMatch[1]);
  const normalized = displayName.toLowerCase();

  if (!displayName || GENERIC_SENDER_NAMES.some((name) => normalized === name)) {
    return undefined;
  }

  if (GENERIC_SENDER_NAMES.some((name) => normalized.startsWith(`${name} `))) {
    return undefined;
  }

  const recruitingSuffixMatch = displayName.match(
    /^(.+?)\s+(?:Recruiting(?: Team)?|Careers|Talent|HR|Hiring)(?:\s+Team)?$/i,
  );
  if (recruitingSuffixMatch?.[1]) {
    return cleanupCompany(recruitingSuffixMatch[1]);
  }

  return displayName;
}

function extractDomainRoot(from: string): string | null {
  const domainMatch = from.match(/@([a-z0-9-]+)\./);
  return domainMatch?.[1] ?? null;
}

function isPlausibleRole(role: string): boolean {
  if (role.length < 3 || role.length > 80) {
    return false;
  }

  if (role.split(/\s+/).length > 8) {
    return false;
  }

  if (/https?:|unsubscribe|click here|view this email|privacy policy|thank you for/i.test(role)) {
    return false;
  }

  return true;
}

function cleanupCompany(value: string): string {
  return value
    .replace(/\s+(team|hr|recruiting|careers|talent|hiring)$/i, "")
    .replace(/\s+via\s+.+/i, "")
    .trim();
}

function cleanupRole(value: string): string {
  return value.replace(/\.$/, "").trim();
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSlashDate(value: string): string | undefined {
  const parts = value.split("/").map((part) => part.trim());
  if (parts.length < 2) {
    return undefined;
  }

  const month = parts[0].padStart(2, "0");
  const day = parts[1].padStart(2, "0");
  const year = parts[2]
    ? parts[2].length === 2
      ? `20${parts[2]}`
      : parts[2]
    : String(new Date().getFullYear());

  return `${year}-${month}-${day}`;
}

export function formatCategoryLabel(category: string): string {
  return category.replace(/_/g, " ");
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
