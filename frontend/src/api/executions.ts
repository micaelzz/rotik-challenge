import { request } from './client';
import type { Execution, PaginatedResponse } from '../types/api';

export async function fetchExecutions(
  token: string,
  agentId: string,
  page: number = 1,
  perPage: number = 15
): Promise<PaginatedResponse<Execution>> {
  return request<PaginatedResponse<Execution>>(
    `/agents/${agentId}/executions?page=${page}&per_page=${perPage}`,
    {},
    token
  );
}
