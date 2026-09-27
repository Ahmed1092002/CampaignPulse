'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatDate, format, subDays, cn } from '@/lib/utils';
import { Calendar, TrendingUp, BarChart3, Users, Eye, Target, ArrowUpRight, Globe, Monitor, MapPin, Filter, ChevronDown, GitMerge, FileText, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { OverviewTab, SourcesTab, DevicesTab, GeoTab, FunnelTab } from '@/components/dashboard/AnalyticsTabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const DEVICE_COLORS = { desktop: '#0ea5e9', mobile: '#22c55e', tablet: '#f59e0b' };

interface DateRange {
  from: Date;
  to: Date;
}

export default function AnalyticsPage() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('analytics');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareRange, setCompareRange] = useState<DateRange>({
    from: subDays(new Date(), 60),
    to: subDays(new Date(), 31),
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'devices' | 'geo' | 'funnel'>('overview');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', workspaceId, dateRange.from.toISOString(), dateRange.to.toISOString(), groupBy, campaignFilter, compareEnabled, compareRange.from.toISOString(), compareRange.to.toISOString()],
    queryFn: () => api.analytics.getDashboardStats(workspaceId!, {
      campaignId: campaignFilter || undefined,
      groupBy,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      compareStartDate: compareEnabled ? compareRange.from.toISOString() : undefined,
      compareEndDate: compareEnabled ? compareRange.to.toISOString() : undefined,
    }),
    enabled: !!workspaceId,
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['analytics-devices', workspaceId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => api.analytics.getDeviceBreakdown(workspaceId!, { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }),
    enabled: !!workspaceId,
  });

  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['analytics-geo', workspaceId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => api.analytics.getGeoBreakdown(workspaceId!, { startDate: dateRange.from.toISOString(), endDate: dateRange.to.toISOString() }),
    enabled: !!workspaceId,
  });

  const data = stats?.data;
  const compareData = stats?.data?.compareData;

  const handleExport = () => {
    if (!data) return;
    
    const exportData = {
      summary: {
        'Total Visits': data.totalVisits,
        'Total Leads': data.totalLeads,
        'Conversion Rate': `${data.conversionRate.toFixed(2)}%`,
        'Date Range': `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
      },
      dailyTrends: data.dailyTrends || [],
      funnel: data.funnel || {},
      leadsBySource: data.leadsBySource || [],
      leadsByCampaign: data.leadsByCampaign || [],
      devices: devicesData?.data || [],
      geo: geoData?.data || [],
    };

    if (exportFormat === 'csv') {
      const csv = convertToCSV(exportData);
      downloadFile(csv, `analytics-${format(dateRange.from, 'yyyy-MM-dd')}-${format(dateRange.to, 'yyyy-MM-dd')}.csv`, 'text/csv');
    } else {
      exportToPDF('Analytics Report', exportData, `analytics-${format(dateRange.from, 'yyyy-MM-dd')}-${format(dateRange.to, 'yyyy-MM-dd')}.pdf`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6 h-24 bg-muted" /></Card>
            })}
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
            <p className="text-muted-foreground mt-1">Track and analyze your campaign performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(dateRange.from, 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -{' '}
                    {formatDate(dateRange.to, 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" sideOffset={5}>
                <DateRangePicker
                  range={dateRange}
                  onChange={setDateRange}
                  maxDate={new Date()}
                />
              </PopoverContent>
            </Popover>

            {compareEnabled && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[300px] justify-start gap-2 bg-amber-500/10 border-amber-500/30 text-amber-700">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">
                      Compare: {formatDate(compareRange.from, 'en-US', { month: 'short', day: 'numeric' })} -{' '}
                      {formatDate(compareRange.to, 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" sideOffset={5}>
                  <DateRangePicker
                    range={compareRange}
                    onChange={setCompareRange}
                    maxDate={subDays(dateRange.from, 1)}
                    label="Comparison Period"
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant={compareEnabled ? 'primary' : 'outline'}
              onClick={() => setCompareEnabled(!compareEnabled)}
              className="gap-2"
            >
              <GitMerge className="h-4 w-4" />
              {compareEnabled ? 'Compare Enabled' : 'Enable Comparison'}
            </Button>

            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              options={[
                { value: 'day', label: t('day') },
                { value: 'week', label: t('week') },
                { value: 'month', label: t('month') },
              ]}
              className="w-32"
            />

            <Select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              options={[
                { value: '', label: 'All Campaigns' },
                ...(data?.leadsByCampaign?.map((c: any) => ({ value: c.campaignId, label: c.campaignName })) || []),
              ]}
              className="w-48"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" onClick={() => setExportFormat('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </PopoverTrigger>
              <PopoverContent sideOffset={5} align="end">
                <div className="p-2 space-y-1">
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setExportFormat('csv'); handleExport(); }}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setExportFormat('pdf'); handleExport(); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {compareEnabled && compareData && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
            <GitMerge className="h-5 w-5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-800">Comparison Mode Active</p>
              <p className="text-sm text-amber-700">
                Showing current period vs {formatDate(compareRange.from)} - {formatDate(compareRange.to)}
              </p>
            </div>
          </div>
        )}

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

        {activeTab === 'overview' && <OverviewTab data={data} compareData={compareData} dateRange={dateRange} groupBy={groupBy} compareEnabled={compareEnabled} />}
        {activeTab === 'sources' && <SourcesTab data={data} compareData={compareData} />}
        {activeTab === 'devices' && <DevicesTab data={devicesData?.data} loading={devicesLoading} />}
        {activeTab === 'geo' && <GeoTab data={geoData?.data} loading={geoLoading} />}
        {activeTab === 'funnel' && <FunnelTab data={data} compareData={compareData} />}
      </div>
    </DashboardLayout>
  );
}