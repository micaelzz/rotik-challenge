import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Agent } from '../types/api';

interface AgentCardProps {
  agent: Agent;
  onExecute?: (agentId: string) => void;
  isExecuting?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onExecute, isExecuting }) => {
  const { t } = useTranslation();
  const usageCount = agent.currentMonthUsage?.executionCount ?? 0;
  const percentage = agent.currentMonthUsage?.percentage ?? 0;
  const isBlocked = agent.status === 'BLOCKED';

  // Calculate progress bar color based on percentage
  const getProgressColor = () => {
    if (isBlocked || percentage >= 100) return 'from-red-500 to-rose-600';
    if (percentage >= 80) return 'from-amber-500 to-orange-600';
    return 'from-indigo-500 to-emerald-500';
  };

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/5 flex flex-col justify-between">
      <div>
        {/* Header: Name + Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-2.5 py-1 text-xs font-mono font-medium tracking-wider uppercase text-indigo-400 bg-indigo-500/10 rounded-md mb-2">
              {agent.type}
            </span>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
              {agent.name}
            </h3>
          </div>

          {/* Status Badge (Icon + Text) */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isBlocked
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
            aria-label={`Status: ${agent.status}`}
          >
            {isBlocked ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>{t('common.blocked')}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('common.active')}</span>
              </>
            )}
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div className="my-5 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">{t('agentCard.monthlyUsage')}</span>
            <span className="text-slate-200 font-mono">
              {usageCount.toLocaleString()} / {agent.monthlyExecutionLimit.toLocaleString()} ({percentage}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Usage: ${percentage}%`}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/80 mt-2">
        <Link
          to={`/agents/${agent.id}`}
          className="flex-1 text-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {t('agentCard.viewHistory')}
        </Link>

        {onExecute && (
          <button
            onClick={() => onExecute(agent.id)}
            disabled={isExecuting || isBlocked}
            className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 ${
              isBlocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 focus:ring-indigo-400'
            }`}
            title={isBlocked ? t('agentCard.blockedTooltip') : t('common.execute')}
          >
            {isExecuting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{t('common.execute')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
