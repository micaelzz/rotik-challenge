export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export type AgentType = 'SUPPORT' | 'SALES' | 'GENERAL';
export type AgentStatus = 'ACTIVE' | 'BLOCKED';
export type ExecutionStatus = 'SUCCESS' | 'FAILED';

export interface CurrentMonthUsage {
  executionCount: number;
  percentage: number;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  monthlyExecutionLimit: number;
  currentMonthUsage: CurrentMonthUsage;
  createdAt: string;
}

export interface AvailableType {
  type: AgentType;
  monthlyExecutionLimit: number;
}

export interface Execution {
  id: string;
  agentId: string;
  executedAt: string;
  status: ExecutionStatus;
  createdAt?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
