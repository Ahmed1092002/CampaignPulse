'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CampaignTabs } from '@/components/campaigns/CampaignTabs';
import { api, analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { OverviewTab, SourcesTab, DevicesTab, GeoTab, FunnelTab } from '@/components/dashboard/AnalyticsTabs';
import { formatDate, subDays } from '@/lib/utils';
import { Loader2, BarChart3, Globe, Monitor, MapPin, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { workspaceId } = useAuthStore();
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'devices' | 'geo' | 'funnel'>('overview');
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['campaign-analytics', workspaceId, campaignId, dateRange.from.toISOString(), dateRange.to.toISOString(), groupBy],
    queryFn: () => analyticsApi.getCampaignAnalytics(workspaceId!, campaignId, {
      groupBy,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }),
    enabled: !!workspaceId && !!campaignId,
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['campaign-analytics-devices', workspaceId, campaignId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => api.analytics.getDeviceBreakdown(workspaceId!, { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }),
    enabled: !!workspaceId && !!campaignId,
  });

  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['campaign-analytics-geo', workspaceId, campaignId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => api.analytics.getGeoBreakdown(workspaceId!, { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }),
    enabled: !!workspaceId && !!campaignId,
  });

  const data = stats?.data;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Campaign not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Campaign Analytics</h1>
              <p className="text-muted-foreground">{data.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="border rounded-lg px-3 py-2 text-sm w-32"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1 border-b">
          {[
            { id: 'overview', label: t('overview'), icon: BarChart3 },
            { id: 'sources', label: t('sources'), icon: Globe },
            { id: 'devices', label: 'Devices', icon: Monitor },
            { id: 'geo', label: 'Geography', icon: MapPin },
            { id: 'funnel', label: t('funnel'), icon: Filter },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              className="h-10 px-4 gap-2 border-b-2 border-transparent"
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab data={data} compareData={undefined} dateRange={dateRange} groupBy={groupBy} compareEnabled={false} />}
        {activeTab === 'sources' && <SourcesTab data={data} compareData={undefined} />}
        {activeTab === 'devices' && <DevicesTab data={devicesData?.data} loading={devicesLoading} />}
        {activeTab === 'geo' && <GeoTab data={geoData?.data} loading={geoLoading} />}
        {activeTab === 'funnel' && <FunnelTab data={data} compareData={undefined} />}
      </div>
    </DashboardLayout>
  );
}