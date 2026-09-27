'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Eye, DollarSign, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor, trend = 'neutral' }: StatCardProps) {
  const t = useTranslations('dashboard');
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2 text-sm', trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground')}>
                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                <span>{change >= 0 ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('dashboard');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: () => api.analytics.getDashboardStats(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });

  const statsData = stats?.data;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="animate-pulse h-8 bg-muted rounded w-1/4" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('totalVisits')}
        value={formatNumber(statsData?.totalVisits || 0)}
        change={12.5}
        changeLabel={t('vsLastPeriod')}
        icon={Eye}
        iconColor="bg-blue-500/10 text-blue-500"
        trend="up"
      />
      <StatCard
        title={t('totalLeads')}
        value={formatNumber(statsData?.totalLeads || 0)}
        change={8.2}
        changeLabel={t('vsLastPeriod')}
        icon={Users}
        iconColor="bg-green-500/10 text-green-500"
        trend="up"
      />
      <StatCard
        title={t('conversionRate')}
        value={`${(statsData?.conversionRate || 0).toFixed(2)}%`}
        change={-2.1}
        changeLabel={t('vsLastPeriod')}
        icon={ArrowUpRight}
        iconColor="bg-purple-500/10 text-purple-500"
        trend="down"
      />
      <StatCard
        title={t('activeCampaigns')}
        value={statsData?.leadsByCampaign?.length || 0}
        change={0}
        icon={DollarSign}
        iconColor="bg-orange-500/10 text-orange-500"
        trend="neutral"
      />
    </div>
  );
}