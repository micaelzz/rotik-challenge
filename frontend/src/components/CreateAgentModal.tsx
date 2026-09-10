import React, { useState, useEffect } from 'react';
import type { AvailableType } from '../types/api';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, type: string) => Promise<void>;
  availableTypes: AvailableType[];
  isLoadingTypes?: boolean;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableTypes,
  isLoadingTypes,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (availableTypes.length > 0 && !type) {
      setType(availableTypes[0].type);
    }
  }, [availableTypes, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an agent name.');
      return;
    }
    if (!type) {
      setError('Please select an agent type.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(name.trim(), type);
      setName('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create agent.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = availableTypes.find((t) => t.type === type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            Create New Agent
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400" role="alert">
            {error}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="agent-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Agent Name
            </label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Support Bot Alpha"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="agent-type" className="block text-sm font-medium text-slate-300 mb-1.5">
              Agent Type
            </label>
            {isLoadingTypes ? (
              <div className="h-10 rounded-xl bg-slate-800 animate-pulse border border-slate-700" />
            ) : availableTypes.length === 0 ? (
              <p className="text-sm text-amber-400">No agent types available in your current plan.</p>
            ) : (
              <select
                id="agent-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              >
                {availableTypes.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.type} ({item.monthlyExecutionLimit.toLocaleString()} monthly limit)
                  </option>
                ))}
              </select>
            )}
            {selectedTypeInfo && (
              <p className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
                <svg className="w-4 h-4 text-indigo-400 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execution limit for this type is configured automatically by your plan: <strong className="text-slate-200 ml-1">{selectedTypeInfo.monthlyExecutionLimit.toLocaleString()} executions/month</strong>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableTypes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Agent</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
