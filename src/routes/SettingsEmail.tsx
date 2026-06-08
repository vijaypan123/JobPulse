import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useAiSettings } from "../context/AiSettingsContext";
import { useGmail } from "../context/GmailContext";
import { getOAuthRedirectUri } from "../lib/gmail";

export function SettingsEmail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    configured,
    builtinAvailable,
    customAvailable,
    builtinClientId,
    connected,
    authState,
    lastSyncAt,
    syncing,
    error,
    connectGmailCustom,
    completeBuiltinSignIn,
    disconnect,
    syncNow,
    reclassifyWithAi,
    clearError,
  } = useGmail();
  const { config: aiConfig } = useAiSettings();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
        `Sync complete: processed ${summary.processed}, skipped ${summary.skipped}, updated ${summary.applicationsUpdated} application(s), created ${summary.alertsCreated} alert(s).` +
          (summary.skipped > 0 && summary.processed === 0
            ? " Already-imported emails were skipped. Use Re-classify with AI to update them."
            : ""),
      );
    }
  }

  async function handleReclassifyWithAi() {
    setSyncMessage(null);
    const summary = await reclassifyWithAi();
    if (summary) {
      setSyncMessage(
        `Re-classified ${summary.total} email(s): ${summary.aiUsed} with AI, ${summary.localFallback} fell back to local rules, updated ${summary.applicationsUpdated} application(s).`,
      );
    }
  }

  const aiActive = aiConfig.enabled && aiConfig.provider !== "local";

  const displayError = localError ?? error;

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
          <h3>Gmail Not Configured Yet</h3>
          <p>
            This build does not include a built-in Google client ID, and no personal
            <code> .env </code>
            client ID was found.
          </p>
          <p>Choose one of these paths:</p>
          <ul className="settings-list">
            <li>
              <strong>Quick sign-in:</strong> maintainer sets{" "}
              <code>VITE_BUILTIN_GOOGLE_CLIENT_ID</code>
            </li>
            <li>
              <strong>Your own Gmail project:</strong> set{" "}
              <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code>
            </li>
          </ul>
          <p>
            See <code>docs/gmail-setup.md</code> for setup steps.
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
                Mode:{" "}
                {authState?.authMode === "builtin"
                  ? "Sign in with Google (JobPulse)"
                  : "Your own Google OAuth app"}
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
                {aiActive ? (
                  <button
                    className="button"
                    type="button"
                    disabled={syncing}
                    onClick={() => void handleReclassifyWithAi()}
                  >
                    {syncing ? "Re-classifying..." : "Re-classify with AI"}
                  </button>
                ) : null}
              </div>
              {aiActive ? (
                <p className="settings-note">
                  Sync Now only imports new Gmail messages. After enabling Ollama or Gemini, click
                  Re-classify with AI to update emails and applications already in JobPulse.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p>Choose how you want to connect Gmail.</p>

              {builtinAvailable && builtinClientId ? (
                <div className="connection-option">
                  <h4>Quick connect</h4>
                  <p className="settings-note">
                    One-click Sign in with Google using the shared JobPulse OAuth app.
                  </p>
                  <GoogleSignInButton
                    clientId={builtinClientId}
                    disabled={syncing}
                    onSuccess={completeBuiltinSignIn}
                    onError={(message) => {
                      clearError();
                      setLocalError(message);
                    }}
                  />
                </div>
              ) : null}

              {customAvailable ? (
                <div className="connection-option">
                  <h4>Your own Google app</h4>
                  <p className="settings-note">
                    Uses <code>VITE_GOOGLE_CLIENT_ID</code> from your local <code>.env</code>{" "}
                    file. Best if you want full control of your Google Cloud project. Google will
                    show an account picker so you can connect a non-primary Gmail.
                  </p>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void connectGmailCustom()}
                  >
                    Connect with your OAuth app
                  </button>
                </div>
              ) : (
                <div className="connection-option">
                  <h4>Your own Google app</h4>
                  <p className="settings-note">
                    Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env</code> to enable this
                    option.
                  </p>
                  <pre className="setup-code">{`VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`}</pre>
                  <p className="settings-note">
                    Redirect URI: <code>{getOAuthRedirectUri()}</code>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card settings-card">
          <h3>Connection Options</h3>
          <ul className="settings-list">
            <li>
              <strong>Sign in with Google:</strong> fastest option when a built-in client ID is
              included in the app build
            </li>
            <li>
              <strong>Your own OAuth app:</strong> keep your Gmail credentials in local{" "}
              <code>.env</code> and use your own Google Cloud project
            </li>
            <li>Both options request read-only Gmail access only</li>
            <li>OAuth tokens are stored locally on your device</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Import Behavior</h3>
          <ul className="settings-list">
            <li>Searches Gmail every 20 minutes while connected (last 30 days)</li>
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
      {displayError ? <div className="card error-state">{displayError}</div> : null}
    </div>
  );
}
