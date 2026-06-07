export function Settings() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure JobPulse. Gmail and AI integrations arrive in later MVPs.</p>
        </div>
      </header>

      <section className="settings-grid">
        <div className="card settings-card">
          <h3>Local Storage</h3>
          <p>
            Applications are stored locally in SQLite when running the desktop app.
            Browser preview uses localStorage for testing.
          </p>
        </div>

        <div className="card settings-card">
          <h3>Email</h3>
          <p>Connect Gmail to import job application updates automatically.</p>
          <button className="button secondary" type="button" disabled>
            Connect Gmail (MVP 3)
          </button>
        </div>

        <div className="card settings-card">
          <h3>AI Processing</h3>
          <p>
            AI is optional. The default mode uses local rules only and sends no
            email content to external providers.
          </p>
          <button className="button secondary" type="button" disabled>
            Configure AI (MVP 4)
          </button>
        </div>

        <div className="card settings-card">
          <h3>Privacy</h3>
          <p>
            JobPulse stores your job tracker locally on your device. Export and
            delete controls will be added in a later MVP.
          </p>
          <button className="button secondary" type="button" disabled>
            Privacy Controls (MVP 5)
          </button>
        </div>

        <div className="card settings-card">
          <h3>Export</h3>
          <p>Download your applications, emails, and alerts as CSV files.</p>
          <button className="button secondary" type="button" disabled>
            Export CSV (MVP 3)
          </button>
        </div>
      </section>
    </div>
  );
}
