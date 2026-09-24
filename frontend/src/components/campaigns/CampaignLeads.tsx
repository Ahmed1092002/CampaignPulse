'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react_query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, getStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, Mail, Phone, Search, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CampaignLeadsProps {
  campaignId: string;
}

export function CampaignLeads({ campaignId }: CampaignLeadsProps) {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('leads');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['campaign-leads', workspaceId, campaignId, page, pageSize, search, statusFilter],
    queryFn: () => api.lead.getAll(workspaceId!, { 
      campaignId, 
      page, 
      limit: pageSize, 
      search, 
      status: statusFilter || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    enabled: !!workspaceId && !!campaignId,
  });

  const leads = leadsData?.data || [];
  const total = leadsData?.meta?.total || 0;

  const columns = [
    {
      key: 'name',
      header: t('name'),
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
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
        </div>
        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage={t('noLeads')}
        />
        {total > pageSize && (
          <div className="p-4 border-t flex items-center justify-between">
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
      </CardContent>
    </Card>
  );
}