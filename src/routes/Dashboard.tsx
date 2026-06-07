import { useEffect, useState } from "react";
import { AlertFeed } from "../components/AlertFeed";
import { ApplicationTable } from "../components/ApplicationTable";
import { DeadlineList } from "../components/DeadlineList";
import { StatCard } from "../components/StatCard";
import { useApplications } from "../context/ApplicationsContext";
import {
  applicationsToDeadlines,
  getAlerts,
  getDashboardStats,
  sortApplications,
} from "../lib/db";
import type { AlertRecord } from "../lib/types";

export function Dashboard() {
  const { applications, loading, error } = useApplications();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const stats = getDashboardStats(applications);
  const recentApplications = sortApplications(applications, "lastUpdate").slice(0, 5);
  const deadlines = applicationsToDeadlines(applications);
  const unreadAlerts = alerts.filter((alert) => !alert.read);

  useEffect(() => {
    void getAlerts().then(setAlerts);
  }, [applications]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your job search activity.</p>
        </div>
      </header>

      {loading ? <div className="card empty-state">Loading dashboard...</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}

      {!loading && !error ? (
        <>
          <section className="card-grid stats-grid">
            <StatCard label="Total Applications" value={stats.total} />
            <StatCard label="Applied" value={stats.applied} />
            <StatCard label="Interviews" value={stats.interviews} />
            <StatCard label="Assessments" value={stats.assessments} />
            <StatCard label="Offers" value={stats.offers} />
            <StatCard label="Rejected" value={stats.rejected} />
            <StatCard label="No Response" value={stats.noResponse} />
            <StatCard
              label="Action Needed"
              value={stats.actionNeeded}
              hint="Requires follow-up"
            />
          </section>

          <section className="page-section">
            <div className="section-header">
              <h3>Recent Applications</h3>
            </div>
            <ApplicationTable applications={recentApplications} compact />
          </section>

          <section className="two-column">
            <div className="page-section">
              <div className="section-header">
                <h3>Important Updates</h3>
                <span className="section-meta">{unreadAlerts.length} unread</span>
              </div>
              {alerts.length > 0 ? (
                <AlertFeed alerts={alerts.slice(0, 3)} />
              ) : (
                <div className="card empty-state">
                  <p>No important updates yet. Connect Gmail to start importing alerts.</p>
                </div>
              )}
            </div>

            <div className="page-section">
              <div className="section-header">
                <h3>Upcoming Deadlines</h3>
              </div>
              {deadlines.length > 0 ? (
                <DeadlineList deadlines={deadlines} />
              ) : (
                <div className="card empty-state">
                  <p>No deadlines yet. Add deadlines to applications to track them here.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
