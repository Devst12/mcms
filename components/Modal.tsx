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

export default function Modal({
  open,
  title,
  onClose,
  onConfirm,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-1">
          <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
        </div>
        <div className="px-5 pb-5">{children}</div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13.5px] font-semibold hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-[13.5px] font-bold text-white shadow-sm active:opacity-80 transition-opacity ${
                danger ? "bg-red-600" : "bg-gray-900"
              }`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
