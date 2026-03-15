'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-secondary/10 px-6 py-4">
          {title ? <h3 className="text-xl font-semibold">{title}</h3> : <span />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-muted"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
      <button
        type="button"
        className="fixed inset-0 -z-10 cursor-default"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
    </div>
  );
}
