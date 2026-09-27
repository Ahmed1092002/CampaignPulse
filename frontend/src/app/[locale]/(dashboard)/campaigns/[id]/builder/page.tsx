'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CampaignTabs } from '@/components/campaigns/CampaignTabs';
import { LandingPageBuilder } from '@/components/landing-page/LandingPageBuilder';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function CampaignBuilderPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { workspaceId } = useAuthStore();
  const t = useTranslations('landingPage');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', workspaceId, campaignId],
    queryFn: () => api.campaign.getById(workspaceId!, campaignId),
    enabled: !!workspaceId && !!campaignId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign?.data) {
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
      <CampaignTabs campaign={campaign.data} />
      <LandingPageBuilder campaignId={campaignId} campaign={campaign.data} />
    </DashboardLayout>
  );
}