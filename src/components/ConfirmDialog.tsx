type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  loadingLabel = "Working...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal card confirm-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modal-header">
          <h3 id="confirm-dialog-title">{title}</h3>
          <button className="icon-button" type="button" onClick={onCancel} disabled={loading}>
            ×
          </button>
        </div>

        <p className="confirm-dialog-message">{message}</p>

        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="button danger" type="button" disabled={loading} onClick={() => void onConfirm()}>
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
