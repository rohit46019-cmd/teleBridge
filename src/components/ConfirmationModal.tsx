import React from 'react';
import { Icons } from '../constants.tsx';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-6">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex-shrink-0 flex items-center justify-center">
            <Icons.AlertTriangle size={28} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight mb-2">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all active:scale-95 border border-black/5 dark:border-white/5"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/25 active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;