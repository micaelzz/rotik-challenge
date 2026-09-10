import { request } from './client';
import type { Agent, AvailableType, Execution } from '../types/api';

export async function fetchAgents(token: string): Promise<Agent[]> {
  const res = await request<{ data: Agent[] }>('/agents', {}, token);
  return res.data;
}

export async function fetchAgentDetails(token: string, agentId: string): Promise<Agent> {
  const res = await request<{ data: Agent }>(`/agents/${agentId}`, {}, token);
  return res.data;
}

export async function fetchAvailableTypes(token: string): Promise<AvailableType[]> {
  const res = await request<{ data: AvailableType[] }>('/agents/available-types', {}, token);
  return res.data;
}

export async function createAgent(token: string, name: string, type: string): Promise<Agent> {
  const res = await request<{ data: Agent }>('/agents', {
    method: 'POST',
    body: JSON.stringify({ name, type }),
  }, token);
  return res.data;
}

export async function executeAgent(token: string, agentId: string): Promise<Execution> {
  const res = await request<{ data: Execution }>(`/agents/${agentId}/executions`, {
    method: 'POST',
  }, token);
  return res.data;
}
