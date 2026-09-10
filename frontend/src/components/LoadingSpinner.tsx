import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3" role="status" aria-live="polite">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
  );
};
