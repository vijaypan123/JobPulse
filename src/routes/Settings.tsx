import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExportCsvButtons } from "../components/ExportCsvButtons";
import { useAiSettings } from "../context/AiSettingsContext";
import { useApplications } from "../context/ApplicationsContext";
import { providerLabel } from "../lib/classifier";
import { isSampleApplication } from "../lib/db";

export function Settings() {
  const { applications, removeSampleApplications } = useApplications();
  const { config: aiConfig } = useAiSettings();
  const [clearSamplesOpen, setClearSamplesOpen] = useState(false);
  const [clearingSamples, setClearingSamples] = useState(false);
  const [sampleMessage, setSampleMessage] = useState<string | null>(null);

  const sampleApplications = useMemo(
    () => applications.filter(isSampleApplication),
    [applications],
  );
  const sampleCount = sampleApplications.length;

  async function confirmClearSamples() {
    try {
      setClearingSamples(true);
      setSampleMessage(null);
      const removed = await removeSampleApplications();
      setClearSamplesOpen(false);
      setSampleMessage(
        removed > 0
          ? `Removed ${removed} sample application${removed === 1 ? "" : "s"}.`
          : "No sample applications were found. Demo entries are RBC, CGI, KPMG, TD Bank, CIBC, and SLC Management with source Manual or Sample.",
      );
    } finally {
      setClearingSamples(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure JobPulse. AI is optional — local rules work without any API key.</p>
        </div>
      </header>

      <section className="settings-grid">
        <div className="card settings-card">
          <h3>Sample Data</h3>
          <p>
            Remove demo applications such as RBC, CGI, and KPMG that were added when you first
            opened JobPulse. Gmail imports are not removed.
          </p>
          <p className="settings-note">
            {sampleCount > 0
              ? `${sampleCount} sample application${sampleCount === 1 ? "" : "s"} found.`
              : "No sample applications found."}
          </p>
          <button
            className="button secondary"
            type="button"
            disabled={clearingSamples}
            onClick={() => setClearSamplesOpen(true)}
          >
            Remove Sample Applications
          </button>
          {sampleMessage ? <p className="settings-note">{sampleMessage}</p> : null}
        </div>

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
            JobPulse classifies Gmail imports to detect interviews, offers, rejections, and more.
            Local keyword rules are the default fallback.
          </p>
          <div className="settings-status">
            <span className="pill">
              Active:{" "}
              {aiConfig.enabled && aiConfig.provider !== "local"
                ? providerLabel(aiConfig.provider)
                : "Local Rules"}
            </span>
            <span className="settings-note">
              Model: {aiConfig.enabled && aiConfig.model ? aiConfig.model : "LocalRulesProvider"}
            </span>
          </div>
        </div>

        <div className="card settings-card">
          <h3>AI Processing</h3>
          <p>
            Enable free local AI through Ollama, or use Google Gemini&apos;s free tier for better
            company, role, and status detection.
          </p>
          <Link className="button" to="/settings/ai">
            Configure AI
          </Link>
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

      <ConfirmDialog
        open={clearSamplesOpen}
        title="Remove sample applications?"
        message={
          sampleCount > 0
            ? `Remove ${sampleCount} demo application${sampleCount === 1 ? "" : "s"} from your tracker? Gmail imports will be kept.`
            : "No demo applications were detected. You can still run this to double-check. Gmail imports are not removed."
        }
        confirmLabel="Remove samples"
        loading={clearingSamples}
        loadingLabel="Removing..."
        onConfirm={confirmClearSamples}
        onCancel={() => {
          if (!clearingSamples) {
            setClearSamplesOpen(false);
          }
        }}
      />
    </div>
  );
}
