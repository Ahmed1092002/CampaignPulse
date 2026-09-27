import { z } from 'zod';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types';

export function successResponse<T>(data: T, meta?: PaginatedResponse<T>['meta']): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function getPaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const sortBy = query.sortBy as string || 'createdAt';
  const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';
  const search = query.search as string || '';

  return { page, limit, sortBy, sortOrder, search };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginatedResponse<unknown>['meta'] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = slugify(base);
  let counter = 1;
  const originalSlug = slug;

  const checkAndIncrement = async (): Promise<string> => {
    if (!(await exists(slug))) {
      return slug;
    }
    counter++;
    slug = `${originalSlug}-${counter}`;
    return checkAndIncrement();
  };

  return checkAndIncrement();
}

export function calculateConversionRate(visits: number, leads: number): number {
  if (visits === 0) return 0;
  return Math.round((leads / visits) * 10000) / 100;
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatDate(date: Date | string, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function getDateRange(groupBy: 'day' | 'week' | 'month', startDate?: Date, endDate?: Date): { start: Date; end: Date } {
  const end = endDate || new Date();
  const start = startDate || new Date();

  switch (groupBy) {
    case 'day':
      start.setDate(end.getDate() - 30);
      break;
    case 'week':
      start.setDate(end.getDate() - 84);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 12);
      break;
  }

  return { start, end };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return fn().catch(err => {
    if (retries <= 0) throw err;
    return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
  });
}