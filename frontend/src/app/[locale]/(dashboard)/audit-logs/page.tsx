'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api, auditLogApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { formatDate, cn } from '@/lib/utils';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, Eye, Database, User, Edit, Trash2, Plus } from 'lucide-react';

const ENTITY_TYPES = ['Campaign', 'Lead', 'LandingPage', 'Workspace', 'WorkspaceMember', 'User', 'AuditLog'];
const ACTIONS = ['CREATED', 'UPDATED', 'DELETED', 'PUBLISHED', 'PAUSED', 'ARCHIVED', 'LOGIN', 'LOGOUT', 'INVITED', 'REMOVED', 'ROLE_CHANGED'];

export default function AuditLogsPage() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('auditLogs');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', workspaceId, page, filters],
    queryFn: () => auditLogApi.getAll(workspaceId!, {
      page,
      limit,
      entityType: filters.entityType || undefined,
      action: filters.action || undefined,
      userId: filters.userId || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    }),
    enabled: !!workspaceId,
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('PUBLISHED')) return 'bg-green-500/10 text-green-700';
    if (action.includes('UPDATED') || action.includes('ROLE_CHANGED')) return 'bg-blue-500/10 text-blue-700';
    if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('ARCHIVED')) return 'bg-red-500/10 text-red-700';
    if (action.includes('PAUSED')) return 'bg-amber-500/10 text-amber-700';
    return 'bg-gray-500/10 text-gray-700';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Campaign': return <Database className="h-4 w-4" />;
      case 'Lead': return <User className="h-4 w-4" />;
      case 'LandingPage': return <Eye className="h-4 w-4" />;
      case 'Workspace': return <Database className="h-4 w-4" />;
      case 'WorkspaceMember': return <User className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6 h-20 bg-muted" /></Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">Track all important actions across your workspace</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder') || 'Search...'}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                options={[
                  { value: '', label: t('filterByEntity') || 'All Entities' },
                  ...ENTITY_TYPES.map(t => ({ value: t, label: t })),
                ]}
              />
              <Select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                options={[
                  { value: '', label: t('filterByAction') || 'All Actions' },
                  ...ACTIONS.map(a => ({ value: a, label: a })),
                ]}
              />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                placeholder="End Date"
              />
              <Button variant="outline" onClick={() => setFilters({ entityType: '', action: '', userId: '', search: '', startDate: '', endDate: '' })}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('timestamp')}</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('entityType')}</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('entityId')}</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('action')}</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('user')}</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">{t('ipAddress')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">{t('noLogs')}</td>
                    </tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="p-4 text-sm whitespace-nowrap">{formatDate(log.createdAt, undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <span className="font-medium">{log.entityType}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-mono text-muted-foreground">{log.entityId}</td>
                        <td className="p-4 text-sm">
                          <Badge className={cn(getActionColor(log.action), 'text-capitalize')}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{log.user?.email || 'System'}</td>
                        <td className="p-4 text-sm text-muted-foreground font-mono">{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}