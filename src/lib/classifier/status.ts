import type { ApplicationStatus } from "../types";
import type { ClassificationResult, EmailCategory } from "./types";

const STATUS_PRIORITY: Record<ApplicationStatus, number> = {
  Offer: 6,
  "Final Round": 5,
  Interview: 4,
  Assessment: 3,
  Applied: 2,
  "No Response": 1,
  Rejected: 0,
  Closed: 0,
  Unknown: 0,
};

export function statusFromCategory(category: EmailCategory | string): ApplicationStatus {
  switch (category) {
    case "application_confirmation":
      return "Applied";
    case "interview_invitation":
      return "Interview";
    case "assessment":
    case "deadline":
      return "Assessment";
    case "offer":
      return "Offer";
    case "rejection":
      return "Rejected";
    case "recruiter_message":
      return "Interview";
    default:
      return "Unknown";
  }
}

export function normalizeApplicationStatus(
  suggestedStatus: ApplicationStatus,
  currentStatus: ApplicationStatus,
): ApplicationStatus {
  if (suggestedStatus === "Unknown") {
    return currentStatus;
  }

  if (suggestedStatus === "Rejected") {
    return "Rejected";
  }

  const suggestedPriority = STATUS_PRIORITY[suggestedStatus] ?? 0;
  const currentPriority = STATUS_PRIORITY[currentStatus] ?? 0;
  return suggestedPriority >= currentPriority ? suggestedStatus : currentStatus;
}

export function resolveApplicationStatus(
  classification: ClassificationResult,
  currentStatus: ApplicationStatus = "Applied",
): ApplicationStatus {
  const fromCategory = statusFromCategory(classification.category);
  const suggested =
    classification.suggestedStatus === "Unknown" ? fromCategory : classification.suggestedStatus;

  return normalizeApplicationStatus(suggested, currentStatus);
}

export function pickBestApplicationStatus(
  currentStatus: ApplicationStatus,
  candidates: ApplicationStatus[],
): ApplicationStatus {
  return candidates.reduce(
    (best, candidate) => normalizeApplicationStatus(candidate, best),
    currentStatus,
  );
}
