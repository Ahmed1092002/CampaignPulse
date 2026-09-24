'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react_query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatDate } from '@/lib/utils';
import { Calendar, TrendingUp, BarChart3, Users, Eye, Target, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AnalyticsPage() {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('analytics');
  const [dateRange, setDateRange] = useState('30d');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [campaignFilter, setCampaignFilter] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', workspaceId, dateRange, groupBy, campaignFilter],
    queryFn: () => api.analytics.getDashboardStats(workspaceId!, { 
      campaignId: campaignFilter || undefined,
      groupBy,
      startDate: getStartDate(dateRange),
      endDate: new Date().toISOString(),
    }),
    enabled: !!workspaceId,
  });

  const data = stats?.data;

  const getStartDate = (range: string) => {
    const date = new Date();
    switch (range) {
      case '7d': date.setDate(date.getDate() - 7); break;
      case '30d': date.setDate(date.getDate() - 30); break;
      case '90d': date.setDate(date.getDate() - 90); break;
      default: date.setDate(date.getDate() - 30);
    }
    return date.toISOString();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">Track and analyze your campaign performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: '7d', label: t('last7Days') },
                { value: '30d', label: t('last30Days') },
                { value: '90d', label: t('last90Days') },
              ]}
              className="w-40"
            />
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              options={[
                { value: 'day', label: t('day') },
                { value: 'week', label: t('week') },
                { value: 'month', label: t('month') },
              ]}
              className="w-36"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('totalVisits')}
            value={formatNumber(data?.totalVisits || 0)}
            icon={Eye}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            title={t('totalLeads')}
            value={formatNumber(data?.totalLeads || 0)}
            icon={Users}
            color="bg-green-500/10 text-green-500"
          />
          <StatCard
            title={t('conversionRate')}
            value={`${(data?.conversionRate || 0).toFixed(2)}%`}
            icon={ArrowUpRight}
            color="bg-purple-500/10 text-purple-500"
          />
          <StatCard
            title={t('activeCampaigns')}
            value={data?.leadsByCampaign?.length || 0}
            icon={Target}
            color="bg-orange-500/10 text-orange-500"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dailyTrends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.dailyTrends || []}>
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
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatNumber(value), name]}
                      labelFormatter={(v) => formatDate(v, 'en-US', { dateStyle: 'long' })}
                    />
                    <Area type="monotone" dataKey="visits" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVisits)" name="Visits" />
                    <Area type="monotone" dataKey="leads" stroke="#22c55e" fillOpacity={1} fill="url(#colorLeads)" name="Leads" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('funnel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: t('pageViews'), value: data?.funnel?.pageViews || 0 },
                    { name: t('ctaClicks'), value: data?.funnel?.ctaClicks || 0 },
                    { name: t('formStarts'), value: data?.funnel?.formStarts || 0 },
                    { name: t('formSubmits'), value: data?.funnel?.formSubmits || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatNumber(value), 'Count']} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('leadsBySource')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.leadsBySource || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="source"
                      label={({ source, count, percent }) => `${source}: ${formatNumber(count)} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data?.leadsBySource?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatNumber(value), 'Leads']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('topCampaigns')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.leadsByCampaign?.slice(0, 5).map((campaign, index) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between">
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
                      <p className="text-xs text-green-600">+12%</p>
                    </div>
                  </div>
                ))}
                {(!data?.leadsByCampaign || data.leadsByCampaign.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No campaign data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {data?.bestCampaign && (
          <Card>
            <CardHeader>
              <CardTitle>{t('bestCampaign')}</CardTitle>
            </CardHeader>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentActivity?.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.createdAt, 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
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

import { CheckCircle } from 'lucide-react';