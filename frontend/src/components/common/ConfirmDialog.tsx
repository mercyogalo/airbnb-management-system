'use client';

import { Modal } from '@/components/common/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Please Confirm">
      <p className="text-sm text-dark/80">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="btn-primary">
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
