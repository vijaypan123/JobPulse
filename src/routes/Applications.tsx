import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { ApplicationTable } from "../components/ApplicationTable";
import { ExportCsvButtons } from "../components/ExportCsvButtons";
import { useApplications } from "../context/ApplicationsContext";
import { filterApplications, sortApplications } from "../lib/db";
import { APPLICATION_STATUSES, type Application, type SortOption } from "../lib/types";
import { useMemo, useState } from "react";

export function Applications() {
  const { applications, loading, error, addApplication, editApplication, removeApplication } =
    useApplications();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("lastUpdate");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const visibleApplications = useMemo(
    () => sortApplications(filterApplications(applications, searchQuery, statusFilter), sortBy),
    [applications, searchQuery, statusFilter, sortBy],
  );

  function openCreateModal() {
    setEditingApplication(null);
    setModalOpen(true);
  }

  function openEditModal(application: Application) {
    setEditingApplication(application);
    setModalOpen(true);
  }

  async function handleDelete(application: Application) {
    const confirmed = window.confirm(
      `Delete ${application.company} — ${application.role || "application"}?`,
    );

    if (!confirmed) {
      return;
    }

    await removeApplication(application.id);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Applications</h2>
          <p>Track every role you have applied to.</p>
        </div>
        <div className="header-actions">
          <ExportCsvButtons variant="compact" applications={applications} />
          <button className="button" type="button" onClick={openCreateModal}>
            Add Application
          </button>
        </div>
      </header>

      <section className="toolbar card">
        <input
          className="search-input"
          type="search"
          placeholder="Search by company or role..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select
          className="select-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="select-input"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
        >
          <option value="lastUpdate">Sort by last update</option>
          <option value="deadline">Sort by deadline</option>
        </select>
      </section>

      {loading ? <div className="card empty-state">Loading applications...</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}

      {!loading && !error ? (
        <ApplicationTable
          applications={visibleApplications}
          showActions
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      ) : null}

      <ApplicationFormModal
        open={modalOpen}
        title={editingApplication ? "Edit Application" : "Add Application"}
        initial={editingApplication}
        onClose={() => setModalOpen(false)}
        onSubmit={async (input) => {
          if (editingApplication) {
            await editApplication(editingApplication.id, input);
          } else {
            await addApplication(input);
          }
        }}
      />
    </div>
  );
}
