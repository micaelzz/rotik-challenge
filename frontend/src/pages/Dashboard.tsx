import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { AgentCard } from '../components/AgentCard';
import { CreateAgentModal } from '../components/CreateAgentModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { fetchAgents, fetchAvailableTypes, createAgent, executeAgent } from '../api/agents';
import { useAuthStore } from '../stores/authStore';
import type { Agent, AvailableType } from '../types/api';
import { ApiError } from '../api/client';

export const Dashboard: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availableTypes, setAvailableTypes] = useState<AvailableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionNotification, setExecutionNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executingAgentId, setExecutingAgentId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAgents(token);
      setAgents(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load agents.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    if (!token) return;
    setIsLoadingTypes(true);
    try {
      const types = await fetchAvailableTypes(token);
      setAvailableTypes(types);
    } catch (err: unknown) {
      console.error('Failed to load available types', err);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleCreateAgent = async (name: string, type: string) => {
    if (!token) return;
    const newAgent = await createAgent(token, name, type);
    setAgents((prev) => [newAgent, ...prev]);
  };

  const handleExecuteAgent = async (agentId: string) => {
    if (!token) return;
    setExecutingAgentId(agentId);
    setExecutionNotification(null);

    try {
      await executeAgent(token, agentId);
      setExecutionNotification({
        type: 'success',
        message: t('dashboard.executedSuccess'),
      });
      // Refresh list to show updated monthly usage count and status
      const updated = await fetchAgents(token);
      setAgents(updated);
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
      // Still refresh list in case agent was blocked
      if (token) {
        const updated = await fetchAgents(token).catch(() => agents);
        setAgents(updated);
      }
    } finally {
      setExecutingAgentId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('dashboard.createAgentBtn')}
          </button>
        </div>

        {/* Execution Toast Banner */}
        {executionNotification && (
          <div
            className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between shadow-lg backdrop-blur-md transition-all ${
              executionNotification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
            role="status"
          >
            <div className="flex items-center space-x-2">
              {executionNotification.type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{executionNotification.message}</span>
            </div>
            <button
              onClick={() => setExecutionNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content States */}
        {isLoading ? (
          <LoadingSpinner label={t('dashboard.fetchingAgents')} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : agents.length === 0 ? (
          <EmptyState
            title={t('dashboard.emptyTitle')}
            description={t('dashboard.emptyDesc')}
            actionLabel={t('dashboard.createAgentBtn')}
            onAction={handleOpenModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onExecute={handleExecuteAgent}
                isExecuting={executingAgentId === agent.id}
              />
            ))}
          </div>
        )}

        {/* Create Agent Modal */}
        <CreateAgentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateAgent}
          availableTypes={availableTypes}
          isLoadingTypes={isLoadingTypes}
        />
      </div>
    </Layout>
  );
};
