'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, Mail, Phone, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  campaign: { name: string };
  createdAt: string;
}

export function RecentLeads() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('leads');

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['recent-leads', workspaceId],
    queryFn: () => api.lead.getAll(workspaceId!, { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });

  const leads = leadsData?.data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recentLeads')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            )}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {t('noLeads')}
          </div>
        ) : (
          <div className="divide-y">
            {leads.map((lead: Lead) => (
              <div key={lead.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadge(lead.status).variant}>{t(`status${lead.status}`)}</Badge>
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
                        {lead.phone && (
                          <DropdownMenuItem onClick={() => {}} icon={<Phone className="h-4 w-4" />}>
                            Call
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {}}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {}}>Change Status</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{lead.campaign.name}</span>
                  <span>{format(new Date(lead.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}