'use client'.

import { useState } from 'react'.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react_query'.
import { DashboardLayout } from '@/components/layout/DashboardLayout'.
import { DataTable } from '@/components/ui/DataTable'.
import { Button } from '@/components/ui/Button'.
import { Input } from '@/components/ui/Input'.
import { Select } from '@/components/ui/Input'.
import { Badge, getStatusBadge } from '@/components/ui/Badge'.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'.
import { api } from '@/lib/api'.
import { useAuthStore } from '@/store/authStore'.
import { formatDate } from '@/lib/utils'.
import { MoreHorizontal, Search, Filter, Mail, Phone, Download, Plus } from 'lucide-react'.
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu'.
import { useTranslations } from 'next-intl'.
import { toast } from 'sonner'.

export default function LeadsPage() {
  const { workspaceId } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', workspaceId, page, pageSize, search, statusFilter, campaignFilter],
    queryFn: () => api.lead.getAll(workspaceId!, { 
      page, 
      limit: pageSize, 
      search, 
      status: statusFilter || undefined,
      campaignId: campaignFilter || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    enabled: !!workspaceId,
  });

  const { data: statsData } = useQuery({
    queryKey: ['lead-stats', workspaceId],
    queryFn: () => api.lead.getStats(workspaceId!),
    enabled: !!workspaceId,
  });

  const leads = leadsData?.data || [];
  const total = leadsData?.meta?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.lead.delete(workspaceId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats', workspaceId] });
      toast.success(t('leadDeleted'));
    },
    onError: () => toast.error(t('error')),
  });

  const columns = [
    {
      key: 'name',
      header: t('name'),
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
          {row.phone && <p className="text-sm text-muted-foreground">{row.phone}</p>}
        </div>
      ),
    },
    {
      key: 'campaign',
      header: t('campaign'),
      render: (row: any) => (
        <p className="font-medium">{row.campaign?.name || 'N/A'}</p>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (row: any) => <Badge variant={getStatusBadge(row.status).variant}>{t(`status${row.status}`)}</Badge>,
    },
    {
      key: 'source',
      header: t('source'),
      render: (row: any) => (
        <div className="flex items-center gap-2">
          {row.utmSource && row.utmMedium && (
            <Badge variant="secondary" className="text-xs">{row.utmSource}/{row.utmMedium}</Badge>
          )}
          {row.source && (
            <Badge variant="primary" className="text-xs">{row.source.channel}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('createdAt'),
      sortable: true,
      render: (row: any) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      render: (row: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-accent transition-colors" aria-label="More options">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {}} icon={<Mail className="h-4 w-4" />}>
              Send Email
            </DropdownMenuItem>
            {row.phone && (
              <DropdownMenuItem onClick={() => {}} icon={<Phone className="h-4 w-4" />}>
                Call
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>Change Status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => deleteMutation.mutate(row.id)} icon={<Trash2 className="h-4 w-4" />} className="text-destructive focus:text-destructive">
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">Manage and track your leads</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('totalLeads')}</p>
                  <p className="text-3xl font-bold mt-1">{statsData?.data?.totalLeads || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          {Object.entries(statsData?.data?.byStatus || {}).map(([status, count]) => (
            <Card key={status}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t(`status${status}`)}</p>
                    <p className="text-3xl font-bold mt-1">{count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-500">
                    <Badge variant={getStatusBadge(status).variant}>{t(`status${status}`)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: t('filterByStatus') },
              { value: 'NEW', label: t('statusNew') },
              { value: 'CONTACTED', label: t('statusContacted') },
              { value: 'QUALIFIED', label: t('statusQualified') },
              { value: 'WON', label: t('statusWon') },
              { value: 'LOST', label: t('statusLost') },
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={campaignFilter}
            onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: t('filterByCampaign') },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage={t('noLeads')}
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

import { Users, Trash2 } from 'lucide-react';