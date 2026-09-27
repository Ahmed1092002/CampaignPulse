'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react_query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar as CalendarIcon, Download, TrendingUp, BarChart3, Users, Eye, Target, ArrowUpRight, Globe, Monitor, Smartphone, Tablet, MapPin, Filter, ChevronDown, GitBranch, FileText, TrendingDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTranslations } from 'next-intl';
import { cn, formatDate, formatNumber, exportToCSV, exportToPDF } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { differenceInDays, format, subDays, startOfDay, endOfDay } from 'date-fns';

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
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">Track and analyze your campaign performance</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start gap-2">
                  <CalendarIcon className="h-4 w-4" />
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

            {/* Comparison Toggle */}
            <Button
              variant={compareEnabled ? 'primary' : 'outline'}
              onClick={() => setCompareEnabled(!compareEnabled)}
              className="gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {compareEnabled ? 'Compare Enabled' : 'Enable Comparison'}
            </Button>

            {compareEnabled && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[300px] justify-start gap-2 bg-amber-500/10 border-amber-500/30 text-amber-700">
                    <CalendarIcon className="h-4 w-4" />
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

        {/* Comparison Notice */}
        {compareEnabled && compareData && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
            <GitCompare className="h-5 w-5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-800">Comparison Mode Active</p>
              <p className="text-sm text-amber-700">
                Showing current period vs {formatDate(compareRange.from)} - {formatDate(compareRange.to)}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
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

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab data={data} compareData={compareData} dateRange={dateRange} groupBy={groupBy} compareEnabled={compareEnabled} />}
        {activeTab === 'sources' && <SourcesTab data={data} compareData={compareData} />}
        {activeTab === 'devices' && <DevicesTab data={devicesData?.data} loading={devicesLoading} />}
        {activeTab === 'geo' && <GeoTab data={geoData?.data} loading={geoLoading} />}
        {activeTab === 'funnel' && <FunnelTab data={data} compareData={compareData} />}
      </div>
    </DashboardLayout>
  );
}

// Date Range Picker Component
function DateRangePicker({ range, onChange, maxDate, label }: any) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selecting, setSelecting] = useState<'from' | 'to'>('from');

  const handleDayClick = (date: Date) => {
    if (maxDate && date > maxDate) return;
    
    if (selecting === 'from') {
      onChange({ ...range, from: startOfDay(date) });
      setSelecting('to');
    } else {
      const newTo = date < range.from ? range.from : endOfDay(date);
      onChange({ ...range, to: newTo });
      setSelecting('from');
    }
  };

  const monthsToShow = 2;
  const currentMonth = range.from;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{label || 'Select Date Range'}</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: monthsToShow }).map((_, i) => {
          const monthDate = new Date(currentMonth);
          monthDate.setMonth(monthDate.getMonth() + i);
          return <MonthCalendar month={monthDate} range={range} hoveredDate={hoveredDate} onDayClick={handleDayClick} onHover={setHoveredDate} selecting={selecting} maxDate={maxDate} />;
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{range.from ? format(range.from, 'MMM d, yyyy') : 'Start'}</span>
          <span>→</span>
          <span>{range.to ? format(range.to, 'MMM d, yyyy') : 'End'}</span>
        </div>
      </div>
    </div>
  );
}

function MonthCalendar({ month, range, hoveredDate, onDayClick, onHover, selecting, maxDate }: any) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const firstDayOfWeek = monthStart.getDay();
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

  return (
    <div>
      <div className="text-center font-medium mb-2">{format(month, 'MMMM yyyy')}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-muted-foreground py-1">{d}</div>)}
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={i} className="h-8" />)}
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(monthStart);
          date.setDate(i + 1);
          const isToday = isSameDay(date, new Date());
          const isSelected = (range.from && isSameDay(date, range.from)) || (range.to && isSameDay(date, range.to));
          const isInRange = range.from && range.to && date > range.from && date < range.to;
          const isHovered = hoveredDate && isSameDay(date, hoveredDate);
          const isDisabled = maxDate && date > maxDate;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !isDisabled && onDayClick(date)}
              onMouseEnter={() => !isDisabled && onHover(date)}
              className={cn(
                'h-8 w-full rounded transition-colors',
                isSelected && 'bg-primary text-primary-foreground font-medium',
                isInRange && 'bg-primary/10',
                isHovered && !isSelected && 'bg-muted',
                isToday && 'ring-2 ring-primary',
                isDisabled && 'text-muted-foreground/50 cursor-not-allowed',
                selecting === 'to' && range.from && date < range.from && 'text-muted-foreground/50 cursor-not-allowed'
              )}
              disabled={isDisabled}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ data, compareData, dateRange, groupBy, compareEnabled }: any) {
  if (!data) return <div className="text-center py-8 text-muted-foreground">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Visits" value={formatNumber(data.totalVisits)} change={compareEnabled && compareData ? calculateChange(compareData.totalVisits, data.totalVisits) : undefined} icon={Eye} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Total Leads" value={formatNumber(data.totalLeads)} change={compareEnabled && compareData ? calculateChange(compareData.totalLeads, data.totalLeads) : undefined} icon={Users} color="bg-green-500/10 text-green-500" />
        <StatCard title="Conversion Rate" value={`${data.conversionRate.toFixed(2)}%`} change={compareEnabled && compareData ? calculateChange(compareData.conversionRate, data.conversionRate) : undefined} icon={ArrowUpRight} color="bg-purple-500/10 text-purple-500" isRate />
        <StatCard title="Active Campaigns" value={data.leadsByCampaign?.length || 0} icon={Target} color="bg-orange-500/10 text-orange-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trends ({groupBy})</CardTitle>
            <Badge variant={compareEnabled ? 'default' : 'secondary'}>{compareEnabled ? 'Comparison' : 'Current'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrends || []}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={(v) => formatDate(v, 'en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name]} labelFormatter={(v) => formatDate(v, 'en-US', { dateStyle: 'long' })} />
                  <Area type="monotone" dataKey="visits" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVisits)" name="Visits" />
                  <Area type="monotone" dataKey="leads" stroke="#22c55e" fillOpacity={1} fill="url(#colorLeads)" name="Leads" />
                  {compareEnabled && compareData?.dailyTrends && (
                    <>
                      <Area type="monotone" dataKey="visits" data={compareData.dailyTrends} stroke="#0ea5e9" strokeDasharray="5 5" fill="none" name="Visits (Compare)" />
                      <Area type="monotone" dataKey="leads" data={compareData.dailyTrends} stroke="#22c55e" strokeDasharray="5 5" fill="none" name="Leads (Compare)" />
                    </>
                  }
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Campaigns</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.leadsByCampaign?.slice(0, 10).map((campaign: any, index: number) => (
                <div key={campaign.campaignId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{campaign.campaignName}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(campaign.count)} leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatNumber(campaign.count)}</p>
                    {compareEnabled && compareData?.leadsByCampaign && (
                      <p className="text-xs text-green-600">
                        {calculateChange(
                          compareData.leadsByCampaign.find((c: any) => c.campaignId === campaign.campaignId)?.count || 0,
                          campaign.count
                        )}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Page Views', value: data.funnel?.pageViews || 0, color: '#0ea5e9' },
                  { name: 'CTA Clicks', value: data.funnel?.ctaClicks || 0, color: '#8b5cf6' },
                  { name: 'Form Starts', value: data.funnel?.formStarts || 0, color: '#f59e0b' },
                  { name: 'Form Submits', value: data.funnel?.formSubmits || 0, color: '#22c55e' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatNumber(value), 'Count']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      { name: 'Page Views', color: '#0ea5e9' },
                      { name: 'CTA Clicks', color: '#8b5cf6' },
                      { name: 'Form Starts', color: '#f59e0b' },
                      { name: 'Form Submits', color: '#22c55e' },
                    ].map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                  {compareEnabled && compareData?.funnel && (
                    <>
                      <Bar dataKey="pageViews" data={[{ value: compareData.funnel.pageViews }]} fill="none" stroke="#0ea5e9" strokeDasharray="5 5" />
                      <Bar dataKey="ctaClicks" data={[{ value: compareData.funnel.ctaClicks }]} fill="none" stroke="#8b5cf6" strokeDasharray="5 5" />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.leadsBySource || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count" nameKey="source" label={({ source, count, percent }) => `${source}: ${formatNumber(count)} (${(percent * 100).toFixed(0)}%)`}>
                    {(data.leadsBySource || []).map((_, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), 'Leads']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.bestCampaign && (
        <Card>
          <CardHeader><CardTitle>Best Performing Campaign</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">{data.bestCampaign.campaignName}</p>
                  <p className="text-sm text-muted-foreground">{formatNumber(data.bestCampaign.leads)} leads • {data.bestCampaign.conversionRate.toFixed(2)}% conversion</p>
                </div>
              </div>
              <Button variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SourcesTab({ data, compareData }: any) {
  if (!data?.leadsBySource?.length) return <div className="text-center py-8 text-muted-foreground">No source data available</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Leads by UTM Source</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.leadsBySource.map((source: any, index: number) => {
              const compareSource = compareData?.leadsBySource?.find((c: any) => c.source === source.source);
              return (
                <div key={source.source} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{source.source}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(source.count)} leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatNumber(source.count)}</p>
                    {compareEnabled && compareSource && (
                      <p className="text-xs text-green-600">{calculateChange(compareSource.count, source.count)}%</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DevicesTab({ data, loading }: any) {
  if (loading) return <div className="animate-pulse h-64" />;
  if (!data?.length) return <div className="text-center py-8 text-muted-foreground">No device data available</div>;

  const total = data.reduce((sum: number, d: any) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {data.map((device: any) => (
              <Card key={device.device} className="text-center p-6">
                <div className="text-4xl font-bold mb-2" style={{ color: DEVICE_COLORS[device.device as keyof typeof DEVICE_COLORS] }}>
                  {formatNumber(device.count)}
                </div>
                <p className="text-sm text-muted-foreground capitalize">{device.device}</p>
                <p className="text-xs text-muted-foreground mt-1">{(device.count / total * 100).toFixed(1)}%</p>
              </Card>
            ))}
          </div>
          <div className="h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count" nameKey="device" label={({ device, count, percent }) => `${device}: ${formatNumber(count)} (${(percent * 100).toFixed(0)}%)`}>
                  {data.map((_, index: number) => <Cell key={`cell-${index}`} fill={DEVICE_COLORS[data[index]?.device as keyof typeof DEVICE_COLORS] || COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [formatNumber(value), 'Visits']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GeoTab({ data, loading }: any) {
  if (loading) return <div className="animate-pulse h-64" />;
  if (!data?.length) return <div className="text-center py-8 text-muted-foreground">No geographic data available</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Top Countries</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 20).map((country: any, index: number) => (
              <div key={country.country} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag || '🌍'}</span>
                  <div>
                    <p className="font-medium">{country.country}</p>
                    <p className="text-sm text-muted-foreground">{country.city ? `${country.city}, ` : ''}{country.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(country.visits)}</p>
                  <p className="text-xs text-muted-foreground">{country.leads} leads</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Cities</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.flatMap((c: any) => c.cities?.slice(0, 5).map((city: any) => ({ ...city, country: c.country, flag: c.flag })) || [])
              .sort((a: any, b: any) => b.visits - a.visits)
              .slice(0, 20)
              .map((city: any, index: number) => (
                <div key={`${city.country}-${city.city}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{city.flag || '🏙️'}</span>
                    <div>
                      <p className="font-medium">{city.city}</p>
                      <p className="text-sm text-muted-foreground">{city.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatNumber(city.visits)}</p>
                    <p className="text-xs text-muted-foreground">{city.leads} leads</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelTab({ data, compareData }: any) {
  if (!data) return <div className="text-center py-8 text-muted-foreground">No data available</div>;

  const funnelSteps = [
    { key: 'pageViews', label: 'Page Views', color: '#0ea5e9' },
    { key: 'ctaClicks', label: 'CTA Clicks', color: '#8b5cf6' },
    { key: 'formStarts', label: 'Form Starts', color: '#f59e0b' },
    { key: 'formSubmits', label: 'Form Submits', color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {funnelSteps.map((step, index) => {
              const value = data.funnel?.[step.key] || 0;
              const prevValue = index > 0 ? data.funnel?.[funnelSteps[index - 1].key] : value;
              const conversionRate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : '100';
              const compareValue = compareData?.funnel?.[step.key];
              
              return (
                <Card key={step.key} className="border-l-4" style={{ borderLeftColor: step.color }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{step.label}</span>
                      <Badge variant="secondary" style={{ backgroundColor: step.color + '20', color: step.color }}>
                        {conversionRate}%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold">{formatNumber(value)}</p>
                    {compareEnabled && compareValue !== undefined && (
                      <p className="text-xs text-green-600 mt-1">{calculateChange(compareValue, value)}% vs comparison</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelSteps.map(s => ({ name: s.label, value: data.funnel?.[s.key] || 0, color: s.color }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatNumber(value), 'Count']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelSteps.map(s => <Cell key={s.key} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader><CardTitle>Funnel Visualization</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {funnelSteps.map((step, index) => {
              const value = data.funnel?.[step.key] || 0;
              const maxValue = data.funnel?.pageViews || 1;
              const width = (value / maxValue) * 100;
              
              return (
                <div key={step.key} className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-sm font-semibold">{formatNumber(value)}</span>
                  </div>
                  <div className="h-8 bg-muted rounded-full relative overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-white text-xs font-medium" 
                         style={{ width: `${width}%`, backgroundColor: step.color }}>
                      {width > 15 && formatNumber(value)}
                    </div>
                  </div>
                  {index < funnelSteps.length - 1 && (
                    <div className="text-center text-muted-foreground text-xs">↓ {((value / (data.funnel?.[funnelSteps[index + 1].key] || 1)) * 100).toFixed(1)}% continue</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color, isRate }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 mt-2 text-sm', change >= 0 ? 'text-green-600' : 'text-red-600')}>
                {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-muted-foreground">vs comparison</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'lead_created': return <Users className="h-4 w-4 text-primary" />;
    case 'PAGE_VIEW': return <Eye className="h-4 w-4 text-blue-500" />;
    case 'CTA_CLICK': return <Target className="h-4 w-4 text-purple-500" />;
    case 'FORM_START': return <MessageSquare className="h-4 w-4 text-yellow-500" />;
    case 'FORM_SUBMIT': return <CheckCircle className="h-4 w-4 text-green-500" />;
    default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
  }
}

function calculateChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / oldVal) * 100;
}

function convertToCSV(data: any): string {
  const rows: string[] = [];
  
  // Summary
  rows.push('Summary');
  Object.entries(data.summary).forEach(([key, value]) => rows.push(`${key},${value}`));
  rows.push('');
  
  // Daily Trends
  rows.push('Daily Trends');
  rows.push('Date,Visits,Leads');
  data.dailyTrends.forEach((d: any) => rows.push(`${d.date},${d.visits},${d.leads}`));
  rows.push('');
  
  // Funnel
  rows.push('Funnel');
  Object.entries(data.funnel).forEach(([key, value]) => rows.push(`${key},${value}`));
  rows.push('');
  
  // Sources
  rows.push('Leads by Source');
  rows.push('Source,Count');
  data.leadsBySource.forEach((s: any) => rows.push(`${s.source},${s.count}`));
  rows.push('');
  
  // Campaigns
  rows.push('Leads by Campaign');
  rows.push('Campaign,Leads');
  data.leadsByCampaign.forEach((c: any) => rows.push(`"${c.campaignName}",${c.count}`));
  rows.push('');

  // Devices
  if (data.devices.length) {
    rows.push('Devices');
    rows.push('Device,Count');
    data.devices.forEach((d: any) => rows.push(`${d.device},${d.count}`));
    rows.push('');
  }

  // Geo
  if (data.geo.length) {
    rows.push('Geography');
    rows.push('Country,Visits,Leads');
    data.geo.forEach((g: any) => rows.push(`"${g.country}",${g.visits},${g.leads}`));
  }

  return rows.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { GitCompare, FileText, ChevronUp, TrendingDown, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameDay, differenceInDays } from 'date-fns';