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
              <th className="company-cell">Company</th>
              <th className="role-cell">Role</th>
              <th>Status</th>
              {!compact && <th className="date-cell">Date Applied</th>}
              <th className="date-cell">Last Update</th>
              {!compact && <th className="date-cell">Deadline</th>}
              {!compact && <th>Action</th>}
              {!compact && <th>Source</th>}
              {!compact && <th className="notes-cell">Notes</th>}
              {showActions && <th className="manage-cell">Manage</th>}
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="company-cell">{application.company}</td>
                <td className="role-cell">{application.role}</td>
                <td>
                  <StatusBadge status={application.status} />
                </td>
                {!compact && <td className="date-cell">{application.dateApplied || "—"}</td>}
                <td className="date-cell">{application.lastUpdate || "—"}</td>
                {!compact && <td className="date-cell">{application.deadline ?? "—"}</td>}
                {!compact && (
                  <td>{application.actionNeeded ? "Yes" : "No"}</td>
                )}
                {!compact && <td>{application.source}</td>}
                {!compact && <td className="notes-cell">{application.notes ?? "—"}</td>}
                {showActions && (
                  <td className="manage-cell">
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
