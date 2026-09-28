'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook_form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(2000).optional(),
  goal: z.string().max(1000).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  budget: z.number().positive().max(999999999.99).optional().nullable(),
  channels: z.array(z.string()).min(1, 'At least one channel is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED']).default('DRAFT'),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const CHANNELS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google Ads' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'direct', label: 'Direct Traffic' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspaceId } = useAuthStore();
  const t = useTranslations('campaigns');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: 'DRAFT',
      startDate: new Date().toISOString().split('T')[0],
      channels: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignFormData) => api.campaign.create(workspaceId!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] });
      toast.success(t('createdSuccess'));
      router.push(`/campaigns/${response.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('error'));
    },
  });

  const handleSubmit = (data: CampaignFormData) => {
    createMutation.mutate({
      ...data,
      channels: selectedChannels,
      budget: data.budget || null,
      endDate: data.endDate || null,
    });
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    setSelectedChannels(prev => checked ? [...prev, channel] : prev.filter(c => c !== channel));
    form.setValue('channels', checked ? [...selectedChannels, channel] : selectedChannels.filter(c => c !== channel), { shouldValidate: true });
  };

  return (
    <DashboardLayout>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/campaigns"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('createNew')}</h1>
            <p className="text-muted-foreground mt-1">Create a new marketing campaign</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('campaignDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t('name')}
                placeholder="Summer Sale 2024"
                {...form.register('name')}
                error={form.formState.errors.name?.message}
              />
              <Input
                label={t('slug')}
                placeholder="summer-sale-2024"
                {...form.register('slug')}
                error={form.formState.errors.slug?.message}
              />
            </div>

            <Textarea
              label={t('description')}
              placeholder="Describe your campaign..."
              {...form.register('description')}
              error={form.formState.errors.description?.message}
              rows={3}
            />

            <Textarea
              label={t('goal')}
              placeholder="Increase sales by 20%"
              {...form.register('goal')}
              error={form.formState.errors.goal?.message}
              rows={2}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label={t('startDate')}
                type="date"
                {...form.register('startDate')}
                error={form.formState.errors.startDate?.message}
              />
              <Input
                label={t('endDate')}
                type="date"
                {...form.register('endDate')}
                error={form.formState.errors.endDate?.message}
              />
              <Input
                label={t('budget')}
                type="number"
                step="0.01"
                min="0"
                placeholder="10000"
                {...form.register('budget', { valueAsNumber: true })}
                error={form.formState.errors.budget?.message}
              />
            </div>

            <div>
              <label className="label">{t('channels')}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHANNELS.map((channel) => (
                  <label key={channel.value} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={channel.value}
                      checked={selectedChannels.includes(channel.value)}
                      onChange={(e) => handleChannelChange(channel.value, e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{channel.label}</span>
                  </label>
                ))}
              </div>
              {form.formState.errors.channels && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.channels.message}</p>
              )}
            </div>

            <Select
              label={t('status')}
              value={form.watch('status')}
              onChange={(e) => form.setValue('status', e.target.value as any)}
              options={[
                { value: 'DRAFT', label: t('statusDraft') },
                { value: 'PUBLISHED', label: t('statusPublished') },
                { value: 'PAUSED', label: t('statusPaused') },
                { value: 'ARCHIVED', label: t('statusArchived') },
              ]}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/campaigns">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('create')}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}