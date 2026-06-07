import { COMPANY_DOMAIN_MAP, JOB_DOMAIN_HINTS } from "./rules";
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

export function buildSearchText(input: ClassifierEmailInput): string {
  return [input.subject, input.snippet, input.body ?? "", input.from]
    .join(" ")
    .toLowerCase();
}

export function extractCompany(input: ClassifierEmailInput): string | undefined {
  const subject = input.subject;
  const from = input.from.toLowerCase();

  const atCompanyMatch = subject.match(/\bat\s+([A-Z][A-Za-z0-9&.\- ]{1,40})/);
  if (atCompanyMatch?.[1]) {
    return cleanupCompany(atCompanyMatch[1]);
  }

  const dashCompanyMatch = subject.match(/^[—-]\s*([A-Z][A-Za-z0-9&.\- ]{1,40})/);
  if (dashCompanyMatch?.[1]) {
    return cleanupCompany(dashCompanyMatch[1]);
  }

  const trailingCompanyMatch = subject.match(/([A-Z][A-Za-z0-9&.\- ]{1,40})\s*[—-]/);
  if (trailingCompanyMatch?.[1]) {
    return cleanupCompany(trailingCompanyMatch[1]);
  }

  const domainMatch = from.match(/@([a-z0-9-]+)\./);
  if (domainMatch?.[1]) {
    const domainRoot = domainMatch[1];
    if (COMPANY_DOMAIN_MAP[domainRoot]) {
      return COMPANY_DOMAIN_MAP[domainRoot];
    }

    if (!JOB_DOMAIN_HINTS.includes(domainRoot)) {
      return titleCase(domainRoot.replace(/[-_]/g, " "));
    }
  }

  return undefined;
}

export function extractRole(input: ClassifierEmailInput): string | undefined {
  const subject = input.subject;
  const snippet = input.snippet;

  const dashRoleMatch = subject.match(/[—-]\s*([A-Za-z0-9 /,&()-]{3,60})$/);
  if (dashRoleMatch?.[1]) {
    return cleanupRole(dashRoleMatch[1]);
  }

  const forRoleMatch = `${subject} ${snippet}`.match(
    /(?:for|role of|position of)\s+(?:the\s+)?([A-Za-z0-9 /,&()-]{3,60})/i,
  );
  if (forRoleMatch?.[1]) {
    return cleanupRole(forRoleMatch[1]);
  }

  const titleMatch = subject.match(
    /\b((?:Senior |Junior |Lead )?(?:Software|Financial|Business|Data|Product|Marketing|Operations)?\s?[A-Za-z]+(?: Analyst| Engineer| Manager| Designer| Developer| Consultant| Associate| Specialist| Coordinator| Architect| Administrator))\b/i,
  );
  if (titleMatch?.[1]) {
    return cleanupRole(titleMatch[1]);
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

function cleanupCompany(value: string): string {
  return value.replace(/\s+(team|hr|recruiting)$/i, "").trim();
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
