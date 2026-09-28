'use client';

import { Fragment, ReactNode, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  }
  rowActions?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  rowActions,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'asc' | 'desc' } | null>(
    sortBy ? { key: sortBy, order: sortOrder || 'asc' } : null
  );

  const handleSort = (key: string) => {
    const column = columns.find(c => c.key === key);
    if (!column?.sortable) return;

    let order: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig?.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
    onSort?.(key, order);
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const isSelected = (row: T) => selectedKeys.includes(keyExtractor(row));
  const isAllSelected = data.length > 0 && data.every(row => isSelected(row));
  const isIndeterminate = data.some(row => isSelected(row)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(keyExtractor));
    }
  }

  const handleSelectRow = (row: T) => {
    const key = keyExtractor(row);
    if (isSelected(row)) {
      onSelectionChange?.(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      column.align && `text-${column.align}`,
                      column.width && `w-[${column.width}]`,
                      column.sortable && 'cursor-pointer select-none hover:bg-muted',
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                    aria-sort={sortConfig?.key === column.key ? (sortConfig.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && (
                        <span className="inline-flex">
                          {sortConfig?.key === column.key ? (
                            sortConfig.order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead>
            <tr className="border-b">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    indeterminate={isIndeterminate}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                    column.align && `text-${column.align}`,
                    column.width && `w-[${column.width}]`,
                    column.sortable && 'cursor-pointer select-none hover:bg-muted',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  aria-sort={sortConfig?.key === column.key ? (sortConfig.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="inline-flex">
                        {sortConfig?.key === column.key ? (
                          sortConfig.order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                className={cn('border-b transition-colors', onRowClick && 'cursor-pointer hover:bg-muted/50', index % 2 === 0 ? 'bg-background' : 'bg-card')}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected(row)}
                      onCheckedChange={() => handleSelectRow(row)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-sm', column.align && `text-${column.align}`, column.className)}
                  >
                    {column.render ? column.render(row, index) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rowActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="input w-auto"
              aria-label="Rows per page"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page * pagination.pageSize >= pagination.total}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};