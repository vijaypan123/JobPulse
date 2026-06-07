import type { ApplicationStatus } from "../lib/types";

const statusStyles: Record<ApplicationStatus, string> = {
  Applied: "badge-applied",
  Assessment: "badge-assessment",
  Interview: "badge-interview",
  "Final Round": "badge-interview",
  Offer: "badge-offer",
  Rejected: "badge-rejected",
  Closed: "badge-applied",
  "No Response": "badge-no-response",
  Unknown: "badge-applied",
};

type StatusBadgeProps = {
  status: ApplicationStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge ${statusStyles[status]}`}>{status}</span>;
}
