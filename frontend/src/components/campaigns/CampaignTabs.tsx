'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge, getStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Target, LayoutDashboard, Users, BarChart2, Edit, ExternalLink, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CampaignTabsProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    status: string;
    description?: string;
    goal?: string;
    startDate: string;
    endDate?: string;
    budget?: number;
    channels: string[];
    landingPage?: { isPublished: boolean };
  };
}

export function CampaignTabs({ campaign }: CampaignTabsProps) {
  const pathname = usePathname();
  const t = useTranslations('campaigns');

  const tabs = [
    { name: t('campaignDetails'), href: `/campaigns/${campaign.id}`, icon: LayoutDashboard },
    { name: t('landingPage'), href: `/campaigns/${campaign.id}/builder`, icon: Edit },
    { name: t('analytics'), href: `/campaigns/${campaign.id}/analytics`, icon: BarChart2 },
    { name: t('leads'), href: `/campaigns/${campaign.id}/leads`, icon: Users },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold truncate">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant={getStatusBadge(campaign.status).variant}>{t(`status${campaign.status}`)}</Badge>
                <span>/p/{campaign.slug}</span>
              </div>
            </div>
          </div>
          {campaign.description && (
            <p className="mt-2 text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{campaign.name}</DropdownMenuLabel>
              <DropdownMenuItem asChild icon={<ExternalLink className="h-4 w-4" />}>
                <Link href={`/p/${campaign.slug}`} target="_blank">{t('publicUrl')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild icon={<Edit className="h-4 w-4" />}>
                <Link href={`/campaigns/${campaign.id}`}>{t('edit')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}} icon={<Copy className="h-4 w-4" />}>
                {t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {campaign.status === 'DRAFT' && (
                <DropdownMenuItem onClick={() => {}} icon={<ExternalLink className="h-4 w-4" />}>
                  {t('publish')}
                </DropdownMenuItem>
              )}
              {campaign.status === 'PUBLISHED' && (
                <DropdownMenuItem onClick={() => {}} icon={<Trash2 className="h-4 w-4" />} className="text-orange-600">
                  {t('pause')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent          </DropdownMenu>
          <Button asChild variant="outline" size="sm">
            <Link href={`/campaigns/${campaign.id}/builder`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('landingPage')}
            </Link>
          </Button>
        </div>
      </div>

      <nav className="flex gap-4 border-b" aria-label="Campaign tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

import { Trash2 } from 'lucide-react';