'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatNumber, formatPercent, formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Globe, Monitor, Smartphone, Tablet, MapPin, Filter, ExternalLink, Users, Eye, Target, ArrowUpRight } from 'lucide-react';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const DEVICE_COLORS = { desktop: '#0ea5e9', mobile: '#22c55e', tablet: '#f59e0b' };

interface OverviewTabProps {
  data: any;
  compareData?: any;
  dateRange: { from: Date; to: Date };
  groupBy: 'day' | 'week' | 'month';
  compareEnabled: boolean;
}

export function OverviewTab({ data, compareData, dateRange, groupBy, compareEnabled }: OverviewTabProps) {
  const t = useTranslations('analytics');
  
  if (!data) return <div className="text-center py-12 text-muted-foreground">No data available</div>;

  const dailyTrends = data.dailyTrends || [];
  const funnel = data.funnel || {};
  const compareTrends = compareData?.dailyTrends || [];

  const getComparisonValue = (current: number, compare: number) => {
    if (!compareEnabled || compare === 0) return null;
    const change = ((current - compare) / compare) * 100;
    return { value: change.toFixed(1), positive: change >= 0 };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('totalVisits')}
          value={formatNumber(data.totalVisits)}
          icon={<Eye className="h-5 w-5 text-blue-500" />}
          comparison={getComparisonValue(data.totalVisits, compareData?.totalVisits || 0)}
        />
        <StatCard
          title={t('totalLeads')}
          value={formatNumber(data.totalLeads)}
          icon={<Users className="h-5 w-5 text-green-500" />}
          comparison={getComparisonValue(data.totalLeads, compareData?.totalLeads || 0)}
        />
        <StatCard
          title={t('conversionRate')}
          value={formatPercent(data.conversionRate)}
          icon={<Target className="h-5 w-5 text-amber-500" />}
          comparison={getComparisonValue(data.conversionRate, compareData?.conversionRate || 0)}
        />
        <StatCard
          title={t('avgSessionDuration')}
          value={`${data.avgSessionDuration || 0}s`}
          icon={<ArrowUpRight className="h-5 w-5 text-purple-500" />}
          comparison={getComparisonValue(data.avgSessionDuration || 0, compareData?.avgSessionDuration || 0)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('visitsTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  formatter={(value: number) => [formatNumber(value), t('visits')]}
                />
                <Legend />
                <Area type="monotone" dataKey="visits" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVisits)" name={t('visits')} />
                {compareEnabled && compareTrends.length > 0 && (
                  <Area type="monotone" dataKey="visits" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCompare)" name={t('compareVisits')} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('leadsTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  formatter={(value: number) => [formatNumber(value), t('leads')]}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name={t('leads')} />
                {compareEnabled && compareTrends.length > 0 && (
                  <Line type="monotone" dataKey="leads" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name={t('compareLeads')} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('conversionFunnel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <FunnelStep 
                label={t('visits')} 
                value={funnel.visits || data.totalVisits} 
                percentage={100} 
                color="#0ea5e9"
              />
              <FunnelStep 
                label={t('ctaClicks')} 
                value={funnel.ctaClicks || 0} 
                percentage={funnel.visits ? ((funnel.ctaClicks || 0) / funnel.visits) * 100 : 0} 
                color="#22c55e"
              />
              <FunnelStep 
                label={t('formStarts')} 
                value={funnel.formStarts || 0} 
                percentage={funnel.visits ? ((funnel.formStarts || 0) / funnel.visits) * 100 : 0} 
                color="#f59e0b"
              />
              <FunnelStep 
                label={t('formSubmits')} 
                value={funnel.formSubmits || data.totalLeads} 
                percentage={funnel.visits ? ((funnel.formSubmits || data.totalLeads) / funnel.visits) * 100 : 0} 
                color="#ef4444"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('topCampaigns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">{t('campaign')}</th>
                    <th className="pb-2 pr-4 text-right">{t('visits')}</th>
                    <th className="pb-2 pr-4 text-right">{t('leads')}</th>
                    <th className="pb-2 pr-4 text-right">{t('conversionRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.leadsByCampaign || []).slice(0, 10).map((campaign: any, index: number) => (
                    <tr key={campaign.campaignId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{campaign.campaignName}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(campaign.visits)}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(campaign.leads)}</td>
                      <td className="py-3 pr-4 text-right">{formatPercent(campaign.conversionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface SourcesTabProps {
  data: any;
  compareData?: any;
}

export function SourcesTab({ data, compareData }: SourcesTabProps) {
  const t = useTranslations('analytics');
  const leadsBySource = data?.leadsBySource || [];
  const totalLeads = leadsBySource.reduce((sum: number, s: any) => sum + (s.count || 0), 0);

  if (!leadsBySource.length) return <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('leadsBySource')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {leadsBySource.map((source: any, index: number) => (
                <SourceRow 
                  key={source.source}
                  source={source.source}
                  count={source.count}
                  percentage={totalLeads ? (source.count / totalLeads) * 100 : 0}
                  color={COLORS[index % COLORS.length]}
                />
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="source"
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadsBySource.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), t('leads')]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('trafficSources')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsBySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="source" type="category" width={100} />
              <Tooltip formatter={(value: number) => [formatNumber(value), t('leads')]} />
              <Legend />
              <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name={t('leads')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface DevicesTabProps {
  data: any[];
  loading: boolean;
}

export function DevicesTab({ data, loading }: DevicesTabProps) {
  const t = useTranslations('analytics');

  if (loading) return <Card><CardContent className="h-64 animate-pulse bg-muted" /></Card>;
  if (!data?.length) return <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>;

  const total = data.reduce((sum: number, d: any) => sum + (d.count || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('devicesBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {data.map((device: any) => (
              <DeviceCard
                key={device.device}
                label={device.device.charAt(0).toUpperCase() + device.device.slice(1)}
                count={device.count}
                percentage={total ? (device.count / total) * 100 : 0}
                color={DEVICE_COLORS[device.device as keyof typeof DEVICE_COLORS] || '#888'}
                icon={device.device === 'desktop' ? Monitor : device.device === 'mobile' ? Smartphone : Tablet}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('deviceTrends')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip labelFormatter={(value) => formatDate(new Date(value), undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
              <Legend />
              {['desktop', 'mobile', 'tablet'].map((device) => (
                <Line
                  key={device}
                  type="monotone"
                  dataKey={device}
                  stroke={DEVICE_COLORS[device as keyof typeof DEVICE_COLORS]}
                  strokeWidth={2}
                  dot={{ fill: DEVICE_COLORS[device as keyof typeof DEVICE_COLORS] }}
                  name={device.charAt(0).toUpperCase() + device.slice(1)}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface GeoTabProps {
  data: any[];
  loading: boolean;
}

export function GeoTab({ data, loading }: GeoTabProps) {
  const t = useTranslations('analytics');

  if (loading) return <Card><CardContent className="h-64 animate-pulse bg-muted" /></Card>;
  if (!data?.length) return <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>;

  const total = data.reduce((sum: number, d: any) => sum + (d.count || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('topCountries')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 flex items-center gap-2">{t('country')}</th>
                  <th className="pb-2 pr-4 text-right">{t('visits')}</th>
                  <th className="pb-2 pr-4 text-right">{t('leads')}</th>
                  <th className="pb-2 pr-4 text-right">{t('conversionRate')}</th>
                  <th className="pb-2">{t('percentage')}</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 20).map((country: any) => (
                  <tr key={country.country} className="border-b last:border-0">
                    <td className="py-3 pr-4 flex items-center gap-2">
                      <span className="text-xl">{country.flag || '🌍'}</span>
                      <span className="font-medium">{country.country}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">{formatNumber(country.visits)}</td>
                    <td className="py-3 pr-4 text-right">{formatNumber(country.leads)}</td>
                    <td className="py-3 pr-4 text-right">{formatPercent(country.conversionRate)}</td>
                    <td className="py-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${total ? (country.visits / total) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('worldMap')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
            <MapPin className="h-12 w-12" />
            <span className="ml-2">{t('mapPlaceholder')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FunnelTabProps {
  data: any;
  compareData?: any;
}

export function FunnelTab({ data, compareData }: FunnelTabProps) {
  const t = useTranslations('analytics');
  const funnel = data?.funnel || {};

  const steps = [
    { key: 'visits', label: t('visits'), value: funnel.visits || data?.totalVisits || 0, color: '#0ea5e9' },
    { key: 'ctaClicks', label: t('ctaClicks'), value: funnel.ctaClicks || 0, color: '#22c55e' },
    { key: 'formStarts', label: t('formStarts'), value: funnel.formStarts || 0, color: '#f59e0b' },
    { key: 'formSubmits', label: t('formSubmits'), value: funnel.formSubmits || data?.totalLeads || 0, color: '#ef4444' },
  ];

  const compareSteps = compareData?.funnel ? [
    { key: 'visits', value: compareData.funnel.visits || compareData.totalVisits || 0 },
    { key: 'ctaClicks', value: compareData.funnel.ctaClicks || 0 },
    { key: 'formStarts', value: compareData.funnel.formStarts || 0 },
    { key: 'formSubmits', value: compareData.funnel.formSubmits || compareData.totalLeads || 0 },
  ] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('conversionFunnel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {steps.map((step, index) => (
              <FunnelStepDetailed
                key={step.key}
                label={step.label}
                value={step.value}
                percentage={index === 0 ? 100 : steps[0].value ? (step.value / steps[0].value) * 100 : 0}
                dropOff={index > 0 && steps[index - 1].value ? ((steps[index - 1].value - step.value) / steps[index - 1].value) * 100 : 0}
                color={step.color}
                compareValue={compareSteps?.[index]?.value}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={step.key}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${step.color}20` }}>
                <Filter className="h-8 w-8" style={{ color: step.color }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: step.color }}>{formatNumber(step.value)}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.label}</p>
              {index > 0 && steps[0].value && (
                <p className="text-xs text-muted-foreground mt-2">
                  {((step.value / steps[0].value) * 100).toFixed(1)}% of visits
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('funnelAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="font-medium text-blue-700">{t('visitToCta')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {steps[0].value && steps[1].value ? ((steps[1].value / steps[0].value) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <p className="font-medium text-green-700">{t('ctaToFormStart')}</p>
              <p className="text-2xl font-bold text-green-600">
                {steps[1].value && steps[2].value ? ((steps[2].value / steps[1].value) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-lg">
              <p className="font-medium text-amber-700">{t('formStartToSubmit')}</p>
              <p className="text-2xl font-bold text-amber-600">
                {steps[2].value && steps[3].value ? ((steps[3].value / steps[2].value) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, comparison }: { title: string; value: string; icon: React.ReactNode; comparison: { value: string; positive: boolean } | null }) {
  const t = useTranslations('analytics');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {comparison && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: comparison.positive ? '#22c55e' : '#ef4444' }}>
                {comparison.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {comparison.value}% vs previous
              </p>
            )}
          </div>
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStep({ label, value, percentage, color }: { label: string; value: number; percentage: number; color: string }) {
  const t = useTranslations('analytics');
  return (
    <div className="text-center">
      <div className="relative mb-2">
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{formatNumber(value)}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
    </div>
  );
}

function SourceRow({ source, count, percentage, color }: { source: string; count: number; percentage: number; color: string }) {
  const t = useTranslations('analytics');
  const sourceLabels: Record<string, string> = {
    'direct': t('direct'),
    'organic': t('organic'),
    'paid': t('paid'),
    'social': t('social'),
    'email': t('email'),
    'referral': t('referral'),
    'unknown': t('unknown'),
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium w-24">{sourceLabels[source] || source}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono w-16 text-right">{formatNumber(count)}</span>
      <span className="text-sm text-muted-foreground w-12 text-right">{percentage.toFixed(1)}%</span>
    </div>
  );
}

function DeviceCard({ label, count, percentage, color, icon: Icon }: { label: string; count: number; percentage: number; color: string; icon: React.ComponentType<{ className?: string }> }) {
  const t = useTranslations('analytics');
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon className="h-5 w-5" style={{ color }} />
          <span className="font-medium">{label}</span>
        </div>
        <p className="text-3xl font-bold" style={{ color }}>{formatNumber(count)}</p>
        <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}% {t('ofVisits')}</p>
      </CardContent>
    </Card>
  );
}

function FunnelStepDetailed({ label, value, percentage, dropOff, color, compareValue }: { label: string; value: number; percentage: number; dropOff: number; color: string; compareValue?: number }) {
  const t = useTranslations('analytics');
  return (
    <div className="flex flex-col items-center min-w-[140px]">
      <div className="relative w-full max-w-xs">
        <div className="h-32 relative">
          <svg viewBox="0 0 200 128" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`funnel-${label}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <polygon
              points="0,0 200,0 160,128 40,128"
              fill="url(#funnel-1)"
              stroke={color}
              strokeWidth="2"
            />
            {percentage < 100 && (
              <polygon
                points={`40,${(1 - percentage / 100) * 128} 160,${(1 - percentage / 100) * 128} 160,128 40,128`}
                fill="#fef3c7"
                opacity={0.5}
              />
            )}
          </svg>
        </div>
      </div>
      <p className="text-lg font-bold mt-2" style={{ color }}>{formatNumber(value)}</p>
      <p className="text-sm text-muted-foreground text-center">{label}</p>
      <p className="text-xs text-center">{percentage.toFixed(1)}%</p>
      {dropOff > 0 && (
        <p className="text-xs text-red-600 mt-1">-{dropOff.toFixed(1)}% drop-off</p>
      )}
      {compareValue !== undefined && compareValue > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          vs {formatNumber(compareValue)}
        </p>
      )}
    </div>
  );
}