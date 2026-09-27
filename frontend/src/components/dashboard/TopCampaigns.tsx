'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';
import { TrendingUp, Target, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TopCampaigns() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('dashboard');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: () => api.analytics.getDashboardStats(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });

  const campaigns = stats?.data?.leadsByCampaign || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('topCampaigns')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No campaigns yet
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {campaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.campaignId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{campaign.campaignName}</p>
                    <p className="text-sm text-muted-foreground">{t('leads')}: {formatNumber(campaign.count)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(campaign.count)}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}