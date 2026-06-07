import { Link } from "react-router-dom";
import { ExportCsvButtons } from "../components/ExportCsvButtons";

export function Settings() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure JobPulse. Cloud AI integrations arrive in a later MVP.</p>
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
          <h3>Export</h3>
          <p>
            Download your applications, emails, and alerts as CSV files. Values with
            commas, quotes, or line breaks are escaped correctly.
          </p>
          <ExportCsvButtons />
        </div>

        <div className="card settings-card">
          <h3>Email</h3>
          <p>Connect Gmail to import job application updates automatically.</p>
          <Link className="button" to="/settings/email">
            Manage Gmail Connection
          </Link>
        </div>

        <div className="card settings-card">
          <h3>Classification</h3>
          <p>
            JobPulse uses local keyword rules by default. Email content stays on your
            device and is never sent to an external AI provider in this mode.
          </p>
          <div className="settings-status">
            <span className="pill">Active: Local Rules</span>
            <span className="settings-note">Provider: LocalRulesProvider</span>
          </div>
        </div>

        <div className="card settings-card">
          <h3>AI Processing</h3>
          <p>
            Optional cloud AI providers will improve classification later. The app
            already works without them using local rules only.
          </p>
          <button className="button secondary" type="button" disabled>
            Configure Cloud AI (MVP 6)
          </button>
        </div>

        <div className="card settings-card">
          <h3>Privacy</h3>
          <p>
            JobPulse stores your job tracker locally on your device. Export your data
            above, and full privacy controls will be added in a later MVP.
          </p>
          <button className="button secondary" type="button" disabled>
            Privacy Controls (MVP 7)
          </button>
        </div>
      </section>
    </div>
  );
}
