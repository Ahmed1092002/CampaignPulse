'use client'.

import { useState } from 'react'.
import { useQuery } from '@tanstack/react_query'.
import { DashboardLayout } from '@/components/layout/DashboardLayout'.
import { DataTable } from '@/components/ui/DataTable'.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'.
import { Input } from '@/components/ui/Input'.
import { Select } from '@/components/ui/Input'.
import { Button } from '@/components/ui/Button'.
import { api } from '@/lib/api'.
import { useAuthStore } from '@/store/authStore'.
import { formatDate } from '@/lib/utils'.
import { Search, Filter, Calendar, Download, Eye } from 'lucide-react'.
import { useTranslations } from 'next-intl'.
import { cn } from '@/lib/utils'.

export default function AuditLogsPage() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('auditLogs');
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', workspaceId, page, pageSize, search, entityFilter, actionFilter, dateRange],
    queryFn: () => api.auditLog.getAll(workspaceId!, { 
      page, 
      limit: pageSize, 
      entityType: entityFilter || undefined,
      action: actionFilter || undefined,
      search,
      startDate: getStartDate(dateRange),
      endDate: new Date().toISOString(),
    }),
    enabled: !!workspaceId,
  });

  const logs = logsData?.data || [];
  const total = logsData?.meta?.total || 0;

  const getStartDate = (range: string) => {
    const date = new Date();
    switch (range) {
      case '7d': date.setDate(date.getDate() - 7); break;
      case '30d': date.setDate(date.getDate() - 30); break;
      case '90d': date.setDate(date.getDate() - 90); break;
      default: return undefined;
    }
    return date.toISOString();
  };

  const columns = [
    {
      key: 'timestamp',
      header: t('timestamp'),
      sortable: true,
      render: (row: any) => formatDate(row.createdAt, 'en-US', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'entityType',
      header: t('entityType'),
      sortable: true,
      render: (row: any) => row.entityType,
    },
    {
      key: 'action',
      header: t('action'),
      sortable: true,
      render: (row: any) => (
        <span className="font-medium capitalize">{row.action.toLowerCase().replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'user',
      header: t('user'),
      render: (row: any) => row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System',
    },
    {
      key: 'entityId',
      header: t('entityId'),
      render: (row: any) => <code className="text-xs">{row.entityId.slice(0, 8)}...</code>,
    },
    {
      key: 'details',
      header: '',
      render: (row: any) => (
        <Button variant="ghost" size="sm" onClick={() => viewDetails(row)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const viewDetails = (log: any) => {
    alert(JSON.stringify({ oldData: log.oldData, newData: log.newData }, null, 2));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">Track all changes in your workspace</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search') || 'Search...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: t('filterByEntity') },
              { value: 'Workspace', label: 'Workspace' },
              { value: 'Campaign', label: 'Campaign' },
              { value: 'LandingPage', label: 'Landing Page' },
              { value: 'Lead', label: 'Lead' },
              { value: 'WorkspaceMember', label: 'Team Member' },
              { value: 'CampaignSource', label: 'UTM Source' },
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: t('filterByAction') },
              { value: 'CREATED', label: 'Created' },
              { value: 'UPDATED', label: 'Updated' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'PAUSED', label: 'Paused' },
              { value: 'ARCHIVED', label: 'Archived' },
              { value: 'DELETED', label: 'Deleted' },
              { value: 'INVITED', label: 'Invited' },
              { value: 'REMOVED', label: 'Removed' },
              { value: 'ROLE_CHANGED', label: 'Role Changed' },
              { value: 'STATUS_CHANGED', label: 'Status Changed' },
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Time' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
            ]}
            className="w-full sm:w-40"
          />
        </div>

        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage={t('noLogs')}
        />

        {total > pageSize && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}