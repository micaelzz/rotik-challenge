import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PaginationMeta } from '../types/api';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  isSubmitting?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange, isSubmitting }) => {
  const { t } = useTranslation();
  if (meta.last_page <= 1) return null;

  const from = ((meta.current_page - 1) * meta.per_page) + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <nav className="flex items-center justify-between border-t border-slate-800 px-4 py-3 sm:px-6" aria-label="Pagination Navigation">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1 || isSubmitting}
          className="relative inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.previous')}
        </button>
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page || isSubmitting}
          className="relative ml-3 inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.next')}
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {t('common.showingResults', { from, to, total: meta.total })}
          </p>
        </div>
        <div>
          <div className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-900 border border-slate-800 p-1 space-x-1">
            <button
              onClick={() => onPageChange(meta.current_page - 1)}
              disabled={meta.current_page <= 1 || isSubmitting}
              className="relative inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous Page"
            >
              ← {t('common.previous')}
            </button>
            <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold text-indigo-400">
              {t('common.page', { current: meta.current_page, last: meta.last_page })}
            </span>
            <button
              onClick={() => onPageChange(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page || isSubmitting}
              className="relative inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next Page"
            >
              {t('common.next')} →
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
