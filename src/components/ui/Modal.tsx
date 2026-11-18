'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog (Pure Light Mode) */}
      <div className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden z-10 transition-all text-zinc-900`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
          <h3 className="text-base font-bold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 bg-white text-zinc-800 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 border-t border-zinc-100 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
