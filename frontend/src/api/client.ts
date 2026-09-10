import type { ApiErrorResponse } from '../types/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(code: string, message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const BASE_URL = '/api';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && (data as ApiErrorResponse).error) {
        const err = (data as ApiErrorResponse).error;
        throw new ApiError(err.code, err.message, response.status, err.details);
      }
      throw new ApiError('HTTP_ERROR', `Request failed with status ${response.status}`, response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connection error
    throw new ApiError('NETWORK_ERROR', 'Unable to connect to the server. Please check your internet connection.', 0);
  }
}
