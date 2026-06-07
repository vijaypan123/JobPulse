import { useEffect, useState } from "react";
import { AlertFeed } from "../components/AlertFeed";
import { getAlerts } from "../lib/db";
import type { AlertRecord } from "../lib/types";

export function Alerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        setAlerts(await getAlerts());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load alerts.");
      } finally {
        setLoading(false);
      }
    }

    void loadAlerts();
  }, []);

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Alerts</h2>
          <p>Important job search updates that need your attention.</p>
        </div>
        <span className="pill">{unreadCount} unread</span>
      </header>

      {loading ? <div className="card empty-state">Loading alerts...</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}

      {!loading && !error && alerts.length === 0 ? (
        <div className="card empty-state">
          <p>
            No alerts yet. Connect Gmail or classify sample emails to generate important
            updates.
          </p>
        </div>
      ) : null}

      {!loading && !error && alerts.length > 0 ? <AlertFeed alerts={alerts} /> : null}
    </div>
  );
}
