import { useState } from "react";
import {
  exportAlertsCsv,
  exportApplicationsCsv,
  exportEmailsCsv,
} from "../lib/csvExport";

type ExportCsvButtonsProps = {
  variant?: "compact" | "full";
  applications?: Parameters<typeof exportApplicationsCsv>[0];
};

export function ExportCsvButtons({
  variant = "full",
  applications,
}: ExportCsvButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runExport(label: string, action: () => Promise<void>) {
    try {
      setExporting(label);
      setError(null);
      await action();
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not export CSV data.",
      );
    } finally {
      setExporting(null);
    }
  }

  if (variant === "compact") {
    return (
      <div className="export-actions">
        <button
          className="button secondary"
          type="button"
          disabled={exporting !== null}
          onClick={() => void runExport("applications", () => exportApplicationsCsv(applications))}
        >
          {exporting === "applications" ? "Exporting..." : "Export CSV"}
        </button>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="export-actions">
      <button
        className="button secondary"
        type="button"
        disabled={exporting !== null}
        onClick={() => void runExport("applications", () => exportApplicationsCsv())}
      >
        {exporting === "applications" ? "Exporting..." : "Export Applications"}
      </button>
      <button
        className="button secondary"
        type="button"
        disabled={exporting !== null}
        onClick={() => void runExport("emails", exportEmailsCsv)}
      >
        {exporting === "emails" ? "Exporting..." : "Export Emails"}
      </button>
      <button
        className="button secondary"
        type="button"
        disabled={exporting !== null}
        onClick={() => void runExport("alerts", exportAlertsCsv)}
      >
        {exporting === "alerts" ? "Exporting..." : "Export Alerts"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
