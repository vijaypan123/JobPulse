import { AlertFeed } from "../components/AlertFeed";
import { mockAlerts } from "../lib/mockData";

export function Alerts() {
  const unreadCount = mockAlerts.filter((alert) => !alert.read).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Alerts</h2>
          <p>Important job search updates that need your attention.</p>
        </div>
        <span className="pill">{unreadCount} unread</span>
      </header>

      <AlertFeed alerts={mockAlerts} />
    </div>
  );
}
