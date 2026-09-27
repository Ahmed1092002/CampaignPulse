'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge, getStatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Filter, MoreHorizontal, Edit, Eye, Copy, Trash2, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const { workspaceId } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('campaigns');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', workspaceId, page, pageSize, search, statusFilter],
    queryFn: () => api.campaign.getAll(workspaceId!, { page, limit: pageSize, search, status: statusFilter || undefined }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.campaign.delete(workspaceId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
    },
  });

  const campaigns = campaignsData?.data || [];
  const total = campaignsData?.meta?.total || 0;
  const totalPages = campaignsData?.meta?.totalPages || 1;

  const columns = [
    {
      key: 'name',
      header: t('name'),
      sortable: true,
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground truncate max-w-xs">{row.description || 'No description'}</p>
        </div>
      ),
    },
    {
      key: 'slug',
      header: t('slug'),
      sortable: true,
      render: (row: any) => <code className="text-sm">{row.slug}</code>,
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      render: (row: any) => {
        const badge = getStatusBadge(row.status);
        return <Badge variant={badge.variant}>{t(`status${row.status}`)}</Badge>;
      },
    },
    {
      key: 'channels',
      header: t('channels'),
      render: (row: any) => (
        <div className="flex flex-wrap gap-1">
          {row.channels.map((ch: string) => (
            <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'startDate',
      header: t('startDate'),
      sortable: true,
      render: (row: any) => formatDate(row.startDate),
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
            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {}} icon={<Eye className="h-4 w-4" />}>
              {t('view')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild icon={<Edit className="h-4 w-4" />}>
              <Link href={`/campaigns/${row.id}`}>{t('edit')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild icon={<ExternalLink className="h-4 w-4" />}>
              <Link href={`/campaigns/${row.id}/builder`}>{t('landingPage')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild icon={<ExternalLink className="h-4 w-4" />}>
              <Link href={`/campaigns/${row.id}/analytics`}>{t('analytics')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild icon={<ExternalLink className="h-4 w-4" />}>
              <Link href={`/p/${row.slug}`} target="_blank">{t('publicUrl')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}} icon={<Copy className="h-4 w-4" />}>
              {t('duplicate')}
            </DropdownMenuItem>
            {row.status === 'DRAFT' && (
              <DropdownMenuItem onClick={() => {}} icon={<ExternalLink className="h-4 w-4" />}>
                {t('publish')}
              </DropdownMenuItem>
            )}
            {row.status === 'PUBLISHED' && (
              <DropdownMenuItem onClick={() => {}} icon={<Trash2 className="h-4 w-4" />} className="text-orange-600">
                {t('pause')}
              </DropdownMenuItem>
            )}
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
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <Button asChild>
            <Link href="/campaigns/new"><Plus className="h-4 w-4 mr-2" />{t('createNew')}</Link>
          </Button>
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
              { value: 'DRAFT', label: t('statusDraft') },
              { value: 'PUBLISHED', label: t('statusPublished') },
              { value: 'PAUSED', label: t('statusPaused') },
              { value: 'ARCHIVED', label: t('statusArchived') },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        <DataTable
          columns={columns}
          data={campaigns}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage={t('noCampaigns')}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: () => {},
          }}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}