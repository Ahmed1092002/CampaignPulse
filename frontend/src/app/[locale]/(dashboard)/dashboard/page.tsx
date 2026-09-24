'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentLeads } from '@/components/dashboard/RecentLeads';
import { TopCampaigns } from '@/components/dashboard/TopCampaigns';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your campaigns and leads</p>
        </div>
        
        <DashboardStats />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-1 lg:col-span-4">
            <RecentLeads />
          </div>
          <div className="col-span-1 lg:col-span-3">
            <TopCampaigns />
          </div>
        </div>
        
        <ConversionFunnel />
      </div>
    </DashboardLayout>
  );
}