import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Sparkles } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onDeepDive?: () => void;
  isDeepDiving?: boolean;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, onDownload, onDeepDive, isDeepDiving, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
          >
            <div className="border-b border-white/5 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 pr-10 sm:pr-0">
                <h2 className="max-w-full truncate text-lg font-bold text-white sm:max-w-md sm:text-xl">{title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {onDeepDive && (
                    <button
                      onClick={onDeepDive}
                      disabled={isDeepDiving}
                      className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      <Sparkles size={14} className={isDeepDiving ? 'animate-pulse' : ''} />
                      {isDeepDiving ? 'Deep Diving...' : 'Deep Dive (Read More)'}
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={onDownload}
                      className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white sm:right-4 sm:top-4"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 sm:p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
