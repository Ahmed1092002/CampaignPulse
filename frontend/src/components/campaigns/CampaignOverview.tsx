'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Calendar, DollarSign, Hash, Globe, Users, Target, CheckCircle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CampaignOverviewProps {
  campaign: {
    name: string;
    slug: string;
    description?: string;
    goal?: string;
    startDate: string;
    endDate?: string;
    budget?: number;
    channels: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
    landingPage?: { isPublished: boolean; publishedAt?: string };
    _count?: { leads: number; trackingEvents: number };
  };
}

export function CampaignOverview({ campaign }: CampaignOverviewProps) {
  const t = useTranslations('campaigns');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalLeads')}</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(campaign._count?.leads || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('trackingEvents')}</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(campaign._count?.trackingEvents || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('channels')}</p>
                <p className="text-3xl font-bold mt-1">{campaign.channels.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <Hash className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('budget')}</p>
                <p className="text-3xl font-bold mt-1">{campaign.budget ? formatCurrency(campaign.budget) : '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('campaignInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign.goal && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('goal')}</p>
                  <p>{campaign.goal}</p>
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('startDate')}</p>
                  <p>{formatDate(campaign.startDate, 'en-US', { dateStyle: 'long' })}</p>
                </div>
              </div>
              {campaign.endDate && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('endDate')}</p>
                    <p>{formatDate(campaign.endDate, 'en-US', { dateStyle: 'long' })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('channels')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.channels.map((ch) => (
                      <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('landingPage')}</p>
                  <p>{campaign.landingPage?.isPublished ? 'Published' : 'Not Published'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('timeline')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Campaign created</p>
                <p className="text-sm text-muted-foreground">{formatDate(campaign.createdAt, 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
            </div>
            {campaign.landingPage?.publishedAt && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Landing page published</p>
                  <p className="text-sm text-muted-foreground">{formatDate(campaign.landingPage.publishedAt, 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
              </div>
            )}
            {campaign.publishedAt && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Campaign published</p>
                  <p className="text-sm text-muted-foreground">{formatDate(campaign.publishedAt, 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Last updated</p>
                <p className="text-sm text-muted-foreground">{formatDate(campaign.updatedAt, 'en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Target, CheckCircle, Clock } from 'lucide-react';