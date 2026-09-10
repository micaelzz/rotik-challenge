import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { fetchAgentDetails, executeAgent } from '../api/agents';
import { fetchExecutions } from '../api/executions';
import { useAuthStore } from '../stores/authStore';
import type { Agent, Execution, PaginationMeta } from '../types/api';
import { ApiError } from '../api/client';

export const AgentDetails: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const token = useAuthStore((state) => state.token);
  const { t } = useTranslation();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionNotification, setExecutionNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadAgent = useCallback(async () => {
    if (!token || !agentId) return;
    setIsLoadingAgent(true);
    setError(null);
    try {
      const data = await fetchAgentDetails(token, agentId);
      setAgent(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load agent details.');
      }
    } finally {
      setIsLoadingAgent(false);
    }
  }, [token, agentId]);

  const loadExecutions = useCallback(
    async (page: number) => {
      if (!token || !agentId) return;
      setIsLoadingExecutions(true);
      try {
        const res = await fetchExecutions(token, agentId, page, 10);
        setExecutions(res.data);
        setMeta(res.meta);
        setCurrentPage(res.meta.current_page);
      } catch (err: unknown) {
        console.error('Failed to load executions', err);
      } finally {
        setIsLoadingExecutions(false);
      }
    },
    [token, agentId]
  );

  useEffect(() => {
    loadAgent();
    loadExecutions(1);
  }, [loadAgent, loadExecutions]);

  const handleExecute = async () => {
    if (!token || !agentId) return;
    setIsExecuting(true);
    setExecutionNotification(null);

    try {
      await executeAgent(token, agentId);
      setExecutionNotification({
        type: 'success',
        message: t('dashboard.executedSuccess'),
      });
      // Refresh agent stats & execution list
      await loadAgent();
      await loadExecutions(1);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setExecutionNotification({
          type: 'error',
          message: err.message,
        });
      } else {
        setExecutionNotification({
          type: 'error',
          message: t('dashboard.executedError'),
        });
      }
      await loadAgent();
      await loadExecutions(currentPage);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoadingAgent) {
    return (
      <Layout>
        <LoadingSpinner label={t('agentDetails.loadingDetails')} />
      </Layout>
    );
  }

  if (error || !agent) {
    return (
      <Layout>
        <ErrorState
          title={t('agentDetails.notFoundTitle')}
          message={error || t('agentDetails.notFoundDesc')}
          onRetry={loadAgent}
        />
        <div className="text-center mt-4">
          <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
            {t('agentDetails.backToDashboard')}
          </Link>
        </div>
      </Layout>
    );
  }

  const usageCount = agent.currentMonthUsage?.executionCount ?? 0;
  const percentage = agent.currentMonthUsage?.percentage ?? 0;
  const isBlocked = agent.status === 'BLOCKED';

  return (
    <Layout>
      <div className="space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link to="/dashboard" className="hover:text-white transition-colors">
            {t('agentDetails.breadcrumbDashboard')}
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{agent.name}</span>
        </div>

        {/* Agent Info Header Banner */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 rounded-md">
                  {agent.type}
                </span>
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isBlocked
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isBlocked ? `⛔ ${t('common.blocked')}` : `✓ ${t('common.active')}`}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{agent.name}</h1>
              <p className="text-xs font-mono text-slate-500">{t('agentDetails.idLabel')} {agent.id}</p>
            </div>

            {/* Quota Stats Box */}
            <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 space-y-3 min-w-[280px]">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">{t('agentDetails.monthlyUsage')}</span>
                <span className="text-slate-200 font-mono">
                  {usageCount.toLocaleString()} / {agent.monthlyExecutionLimit.toLocaleString()} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBlocked || percentage >= 100
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : percentage >= 80
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <button
                onClick={handleExecute}
                disabled={isExecuting || isBlocked}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center space-x-2 ${
                  isBlocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-400'
                }`}
              >
                {isExecuting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{t('agentDetails.executeBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Execution Toast Banner */}
        {executionNotification && (
          <div
            className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between shadow-lg backdrop-blur-md ${
              executionNotification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            <span>{executionNotification.message}</span>
            <button
              onClick={() => setExecutionNotification(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Execution History Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('agentDetails.executionHistory')}</span>
          </h2>

          {isLoadingExecutions ? (
            <LoadingSpinner label={t('common.loading')} />
          ) : executions.length === 0 ? (
            <EmptyState
              title={t('agentDetails.emptyHistoryTitle')}
              description={t('agentDetails.emptyHistoryDesc')}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th scope="col" className="px-6 py-4">{t('agentDetails.tableId')}</th>
                      <th scope="col" className="px-6 py-4">{t('agentDetails.tableExecutedAt')}</th>
                      <th scope="col" className="px-6 py-4">{t('agentDetails.tableStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {executions.map((exec) => (
                      <tr key={exec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                          {exec.id}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(exec.executedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              exec.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                          >
                            {exec.status === 'SUCCESS' ? `✓ ${t('common.success')}` : `✕ ${t('common.failed')}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && <Pagination meta={meta} onPageChange={loadExecutions} />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
