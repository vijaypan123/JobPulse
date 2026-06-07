import type { AlertRecord } from "../lib/types";

type AlertFeedProps = {
  alerts: AlertRecord[];
};

export function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="card feed-card">
      <ul className="feed-list">
        {alerts.map((alert) => (
          <li key={alert.id} className={alert.read ? "feed-item read" : "feed-item unread"}>
            <div className="feed-header">
              <strong>{alert.title}</strong>
              <span className="feed-date">
                {new Date(alert.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p>{alert.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
