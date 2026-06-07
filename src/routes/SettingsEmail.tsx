import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGmail } from "../context/GmailContext";
import { getOAuthRedirectUri } from "../lib/gmail";

export function SettingsEmail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    configured,
    connected,
    authState,
    lastSyncAt,
    syncing,
    error,
    connectGmail,
    disconnect,
    syncNow,
  } = useGmail();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("connected") !== "1") {
      return;
    }

    searchParams.delete("connected");
    setSearchParams(searchParams, { replace: true });

    void (async () => {
      const summary = await syncNow();
      if (summary) {
        setSyncMessage(
          `Initial sync complete: processed ${summary.processed}, skipped ${summary.skipped}, updated ${summary.applicationsUpdated} application(s), created ${summary.alertsCreated} alert(s).`,
        );
      }
    })();
  }, [searchParams, setSearchParams, syncNow]);

  async function handleSyncNow() {
    setSyncMessage(null);
    const summary = await syncNow();
    if (summary) {
      setSyncMessage(
        `Sync complete: processed ${summary.processed}, skipped ${summary.skipped}, updated ${summary.applicationsUpdated} application(s), created ${summary.alertsCreated} alert(s).`,
      );
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Email Settings</h2>
          <p>
            Connect Gmail to import likely job-related messages. JobPulse reads subject,
            sender, and snippet only — not full email bodies by default.
          </p>
        </div>
        <Link className="button secondary" to="/settings">
          Back to Settings
        </Link>
      </header>

      {!configured ? (
        <section className="card settings-card">
          <h3>Setup Required</h3>
          <p>
            Add your Google OAuth client ID to a local <code>.env</code> file before
            connecting Gmail.
          </p>
          <pre className="setup-code">{`VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`}</pre>
          <p>
            Redirect URI to register in Google Cloud Console:
            <br />
            <code>{getOAuthRedirectUri()}</code>
          </p>
          <p>
            See <code>docs/gmail-setup.md</code> for full setup steps.
          </p>
        </section>
      ) : null}

      <section className="settings-grid">
        <div className="card settings-card">
          <h3>Gmail Connection</h3>
          {connected ? (
            <>
              <p>
                Connected as <strong>{authState?.email ?? "Gmail account"}</strong>
              </p>
              <p className="settings-note">
                Scope: read-only Gmail access for local classification on your device.
              </p>
              <div className="export-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={syncing}
                  onClick={() => void handleSyncNow()}
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => void disconnect()}
                >
                  Disconnect Gmail
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Connect Gmail to search for likely job-related emails from the last 14 days.
              </p>
              <button className="button" type="button" onClick={() => void connectGmail()}>
                Connect Gmail
              </button>
            </>
          )}
        </div>

        <div className="card settings-card">
          <h3>Import Behavior</h3>
          <ul className="settings-list">
            <li>Searches Gmail every 20 minutes while connected</li>
            <li>Fetches metadata, subject, sender, and snippet only</li>
            <li>Skips messages already processed by Gmail message ID</li>
            <li>Classifies locally with keyword rules — no cloud AI</li>
            <li>Creates or updates applications and important alerts</li>
          </ul>
          {lastSyncAt ? (
            <p className="settings-note">Last sync: {new Date(lastSyncAt).toLocaleString()}</p>
          ) : (
            <p className="settings-note">No Gmail sync has run yet.</p>
          )}
        </div>
      </section>

      {syncMessage ? <div className="card success-state">{syncMessage}</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}
    </div>
  );
}
