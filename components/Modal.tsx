"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function Modal({ open, title, onClose, onConfirm, children, confirmText = "Confirm", cancelText = "Cancel", danger = false }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          {children}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 min-h-touch border rounded-lg text-sm font-medium">
            {cancelText}
          </button>
          {onConfirm && (
            <button onClick={onConfirm} className={`px-4 py-2 min-h-touch rounded-lg text-sm font-medium text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
