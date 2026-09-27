'use client';

import { useQuery } from '@tanstack/react_query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const funnelSteps = [
  { key: 'pageViews', label: 'Page Views', icon: '👁️' },
  { key: 'ctaClicks', label: 'CTA Clicks', icon: '🖱️' },
  { key: 'formStarts', label: 'Form Starts', icon: '📝' },
  { key: 'formSubmits', label: 'Form Submits', icon: '✅' },
] as const;

export function ConversionFunnel() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('dashboard');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: () => api.analytics.getDashboardStats(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });

  const funnel = stats?.data?.funnel;
  const maxValue = funnel ? Math.max(...Object.values(funnel)) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('funnel')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.key} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : funnel ? (
          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const value = funnel[step.key];
              const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const prevValue = index > 0 ? funnel[funnelSteps[index - 1].key] : maxValue;
              const conversionRate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : '0';

              return (
                <div key={step.key} className="relative">
                  <div className="flex items-center gap-4 mb-1">
                    <span className="text-2xl w-10 text-center">{step.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{t(step.label.toLowerCase().replace(' ', ''))}</span>
                        <span className="font-semibold">{formatNumber(value)}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm text-muted-foreground">
                      {index > 0 && `${conversionRate}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}