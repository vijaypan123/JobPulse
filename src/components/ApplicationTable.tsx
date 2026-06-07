import type { Application } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

type ApplicationTableProps = {
  applications: Application[];
  compact?: boolean;
  showActions?: boolean;
  onEdit?: (application: Application) => void;
  onDelete?: (application: Application) => void;
};

export function ApplicationTable({
  applications,
  compact = false,
  showActions = false,
  onEdit,
  onDelete,
}: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <div className="card empty-state">
        <p>No applications yet. Add your first application to get started.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              {!compact && <th>Date Applied</th>}
              <th>Last Update</th>
              {!compact && <th>Deadline</th>}
              {!compact && <th>Action</th>}
              {!compact && <th>Source</th>}
              {!compact && <th>Notes</th>}
              {showActions && <th>Manage</th>}
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.role}</td>
                <td>
                  <StatusBadge status={application.status} />
                </td>
                {!compact && <td>{application.dateApplied || "—"}</td>}
                <td>{application.lastUpdate || "—"}</td>
                {!compact && <td>{application.deadline ?? "—"}</td>}
                {!compact && (
                  <td>{application.actionNeeded ? "Yes" : "No"}</td>
                )}
                {!compact && <td>{application.source}</td>}
                {!compact && <td className="notes-cell">{application.notes ?? "—"}</td>}
                {showActions && (
                  <td>
                    <div className="table-actions">
                      <button
                        className="button-link"
                        type="button"
                        onClick={() => onEdit?.(application)}
                      >
                        Edit
                      </button>
                      <button
                        className="button-link danger"
                        type="button"
                        onClick={() => onDelete?.(application)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
