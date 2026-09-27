'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react_query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CampaignTabs } from '@/components/campaigns/CampaignTabs';
import { CampaignOverview } from '@/components/campaigns/CampaignOverview';
import { CampaignLeads } from '@/components/campaigns/CampaignLeads';
import { CampaignSources } from '@/components/campaigns/CampaignSources';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { workspaceId } = useAuthStore();
  const t = useTranslations('campaigns');

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
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            )}
          </div>
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
      <CampaignOverview campaign={campaign.data} />
      <CampaignLeads campaignId={campaignId} />
      <CampaignSources campaignId={campaignId} />
    </DashboardLayout>
  );
}