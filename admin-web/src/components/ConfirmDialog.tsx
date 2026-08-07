// Dialog xac nhan hanh dong (vd xoa).
export function ConfirmDialog({ open, message, onConfirm, onCancel }: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel}>
            Huy
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            Xac nhan
          </button>
        </div>
      </div>
    </div>
  );
}
