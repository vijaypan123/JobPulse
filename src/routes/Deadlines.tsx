import { DeadlineList } from "../components/DeadlineList";
import { useApplications } from "../context/ApplicationsContext";
import { applicationsToDeadlines } from "../lib/db";

export function Deadlines() {
  const { applications, loading, error } = useApplications();
  const deadlines = applicationsToDeadlines(applications);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Deadlines</h2>
          <p>Upcoming tasks, assessments, and response dates.</p>
        </div>
      </header>

      {loading ? <div className="card empty-state">Loading deadlines...</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}

      {!loading && !error ? (
        deadlines.length > 0 ? (
          <DeadlineList deadlines={deadlines} />
        ) : (
          <div className="card empty-state">
            <p>No deadlines yet. Add a deadline when creating or editing an application.</p>
          </div>
        )
      ) : null}
    </div>
  );
}
