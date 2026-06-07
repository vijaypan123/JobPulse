import { useEffect, useState, type FormEvent } from "react";
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
} from "../lib/types";

type ApplicationFormModalProps = {
  open: boolean;
  title: string;
  initial?: Application | null;
  onClose: () => void;
  onSubmit: (input: ApplicationInput) => Promise<void>;
};

const emptyForm = (): ApplicationInput => ({
  company: "",
  role: "",
  status: "Applied",
  dateApplied: new Date().toISOString().slice(0, 10),
  lastUpdate: new Date().toISOString().slice(0, 10),
  deadline: "",
  source: "Manual",
  notes: "",
});

export function ApplicationFormModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: ApplicationFormModalProps) {
  const [form, setForm] = useState<ApplicationInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initial) {
      setForm({
        company: initial.company,
        role: initial.role,
        status: initial.status,
        dateApplied: initial.dateApplied,
        lastUpdate: initial.lastUpdate,
        deadline: initial.deadline ?? "",
        source: initial.source,
        notes: initial.notes ?? "",
      });
    } else {
      setForm(emptyForm());
    }

    setError(null);
  }, [open, initial]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.company.trim()) {
      setError("Company is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        ...form,
        deadline: form.deadline || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the application.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
      >
        <div className="modal-header">
          <h3 id="application-form-title">{title}</h3>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Company *
            <input
              value={form.company}
              onChange={(event) =>
                setForm((current) => ({ ...current, company: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Role
            <input
              value={form.role ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ApplicationStatus,
                }))
              }
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date Applied
            <input
              type="date"
              value={form.dateApplied ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dateApplied: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Last Update
            <input
              type="date"
              value={form.lastUpdate ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastUpdate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Deadline
            <input
              type="date"
              value={form.deadline ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deadline: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Source
            <input
              value={form.source ?? "Manual"}
              onChange={(event) =>
                setForm((current) => ({ ...current, source: event.target.value }))
              }
            />
          </label>

          <label className="full-width">
            Notes
            <textarea
              rows={4}
              value={form.notes ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>

          {error ? <p className="form-error full-width">{error}</p> : null}

          <div className="modal-actions full-width">
            <button className="button secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
