'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, leadApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, MapPin, Globe, Calendar, Tag, ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-700',
  CONTACTED: 'bg-amber-500/10 text-amber-700',
  QUALIFIED: 'bg-purple-500/10 text-purple-700',
  WON: 'bg-green-500/10 text-green-700',
  LOST: 'bg-red-500/10 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  WON: 'Won',
  LOST: 'Lost',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceId } = useAuthStore();
  const t = useTranslations('leads');
  const [deleting, setDeleting] = useState(false);

  const leadId = params.id as string;

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', workspaceId, leadId],
    queryFn: () => leadApi.getById(workspaceId!, leadId),
    enabled: !!workspaceId && !!leadId,
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    setDeleting(true);
    try {
      await leadApi.delete(workspaceId!, leadId);
      toast.success('Lead deleted successfully');
      router.push(`/${params.locale}/leads`);
    } catch (error) {
      toast.error('Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await leadApi.update(workspaceId!, leadId, { status: newStatus });
      toast.success('Status updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
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

  if (error || !lead?.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const leadData = lead.data;
  const customFields = leadData.customFields as Record<string, any> || {};
  const utmParams = {
    utm_source: leadData.utmSource,
    utm_medium: leadData.utmMedium,
    utm_campaign: leadData.utmCampaign,
    utm_term: leadData.utmTerm,
    utm_content: leadData.utmContent,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{leadData.firstName} {leadData.lastName}</h1>
              <p className="text-muted-foreground">{leadData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={leadData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <Button variant="outline" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{leadData.firstName} {leadData.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{leadData.email}</p>
                  </div>
                </div>
                {leadData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{leadData.phone}</p>
                    </div>
                  </div>
                )}
                {leadData.referrer && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Referrer</p>
                      <p className="font-medium text-sm truncate max-w-xs">{leadData.referrer}</p>
                    </div>
                  </div>
                )}
                {leadData.ipAddress && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">IP Address</p>
                      <p className="font-medium text-sm">{leadData.ipAddress}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {Object.keys(customFields).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) && (
              <Card>
                <CardHeader>
                  <CardTitle>UTM Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(utmParams).map(([key, value]) => value && (
                    <div key={key} className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(leadData.createdAt)}</p>
                    </div>
                  </div>
                  <Badge className={cn(STATUS_STYLES[leadData.status], 'text-capitalize')}>
                    {leadData.status}
                  </Badge>
                </div>
                {leadData.campaign && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="font-medium">{leadData.campaign.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Lead
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Tracking Events
                </Button>
                <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete Lead'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}