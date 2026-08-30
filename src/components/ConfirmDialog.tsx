import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div id="confirm-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4 animate-fade-in">
      <div
        id="confirm-modal-box"
        className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6 overflow-hidden"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-[#FF9B51]/15 text-[#c45e00]' : 'bg-[#FF9B51]/15 text-[#FF9B51]'
            }`}
          >
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#25343F]">{title}</h3>
            <p className="text-sm text-[#898989] mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            id="btn-confirm-cancel"
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#BFC9D1]/25 text-[#25343F] hover:bg-[#EAEFEF] font-medium text-sm transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            id="btn-confirm-proceed"
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-white font-medium text-sm shadow-sm transition-colors cursor-pointer ${
              isDanger ? 'bg-[#FF9B51] hover:bg-[#25343F]' : 'bg-[#25343F] hover:bg-[#25343F]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
