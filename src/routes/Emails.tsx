import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { useGmail } from "../context/GmailContext";
import { useAiSettings } from "../context/AiSettingsContext";
import { formatCategoryLabel, providerLabel, statusFromCategory } from "../lib/classifier";
import { getEmails } from "../lib/db";
import { processClassifierEmails } from "../lib/processEmail";
import { sampleClassifierEmails } from "../lib/sampleEmails";
import type { EmailRecord } from "../lib/types";

export function Emails() {
  const { connected, syncing, syncNow } = useGmail();
  const { config: aiConfig } = useAiSettings();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadEmails() {
    try {
      setLoading(true);
      setError(null);
      const rows = await getEmails();
      setEmails(rows);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load emails.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmails();
  }, []);

  async function handleClassifySamples() {
    try {
      setProcessing(true);
      setError(null);
      setStatusMessage(null);

      const result = await processClassifierEmails(sampleClassifierEmails, {
        linkApplication: false,
        createAlerts: false,
      });
      await loadEmails();

      setStatusMessage(
        `Classified ${result.processed.length} sample email(s)` +
          (result.skipped.length > 0
            ? `, skipped ${result.skipped.length} already processed.`
            : "."),
      );
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Could not classify sample emails.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Emails</h2>
          <p>
            Job-related messages classified locally on your device using keyword rules.
            No email content is sent to an AI provider.
          </p>
        </div>
        <div className="header-actions">
          {connected ? (
            <button
              className="button secondary"
              type="button"
              disabled={syncing}
              onClick={() =>
                void (async () => {
                  await syncNow();
                  await loadEmails();
                })()
              }
            >
              {syncing ? "Syncing Gmail..." : "Sync Gmail"}
            </button>
          ) : (
            <Link className="button secondary" to="/settings/email">
              Connect Gmail
            </Link>
          )}
          <button
            className="button"
            type="button"
            disabled={processing}
            onClick={() => void handleClassifySamples()}
          >
            {processing ? "Classifying..." : "Classify Sample Emails"}
          </button>
        </div>
      </header>

      <section className="card info-banner">
        <strong>
          {aiConfig.enabled && aiConfig.provider !== "local"
            ? `${providerLabel(aiConfig.provider)} mode`
            : "Local rules mode"}
        </strong>
        <p>
          {aiConfig.enabled && aiConfig.provider !== "local"
            ? "JobPulse sends the selected email fields to your chosen AI provider for classification. If AI fails, local rules are used automatically."
            : "JobPulse uses the built-in LocalRulesProvider. No email content is sent to an AI provider."}
        </p>
      </section>

      {statusMessage ? <div className="card success-state">{statusMessage}</div> : null}
      {loading ? <div className="card empty-state">Loading emails...</div> : null}
      {error ? <div className="card error-state">{error}</div> : null}

      {!loading && !error && emails.length === 0 ? (
        <div className="card empty-state">
          <p>No classified emails yet. Click "Classify Sample Emails" to run the local classifier.</p>
        </div>
      ) : null}

      {!loading && !error && emails.length > 0 ? (
        <div className="card feed-card">
          <ul className="email-list">
            {emails.map((email) => (
              <li key={email.id} className="email-item">
                <div className="email-meta">
                  <strong>{email.subject}</strong>
                  <span>{new Date(email.receivedAt).toLocaleString()}</span>
                </div>
                <p className="email-sender">{email.sender}</p>
                <p className="email-snippet">{email.snippet}</p>
                {email.summary ? <p className="email-summary">{email.summary}</p> : null}
                <div className="email-tags">
                  <span className="tag">{formatCategoryLabel(email.category)}</span>
                  <span className="tag">{email.importance} importance</span>
                  {email.aiUsed ? (
                    <span className="tag">AI used</span>
                  ) : (
                    <span className="tag tag-local">Local rules</span>
                  )}
                  {email.requiresAction ? (
                    <span className="tag tag-action">Action needed</span>
                  ) : null}
                </div>
                <div className="email-footer">
                  <StatusBadge status={statusFromCategory(email.category)} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
