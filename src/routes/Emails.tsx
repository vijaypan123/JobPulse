import { mockEmails } from "../lib/mockData";

export function Emails() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Emails</h2>
          <p>Job-related messages detected from your inbox.</p>
        </div>
      </header>

      <div className="card feed-card">
        <ul className="email-list">
          {mockEmails.map((email) => (
            <li key={email.id} className="email-item">
              <div className="email-meta">
                <strong>{email.subject}</strong>
                <span>{new Date(email.receivedAt).toLocaleString()}</span>
              </div>
              <p className="email-sender">{email.sender}</p>
              <p className="email-snippet">{email.snippet}</p>
              <div className="email-tags">
                <span className="tag">{email.category.replace(/_/g, " ")}</span>
                <span className="tag">{email.importance} importance</span>
                {email.requiresAction ? (
                  <span className="tag tag-action">Action needed</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
