'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Label } from '@/components/ui/Label';
import { api, workspaceApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Save, Eye, Edit, Trash2, AlertTriangle, Upload, CheckCircle } from 'lucide-react';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});

type WorkspaceData = z.infer<typeof workspaceSchema>;

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspaceId } = useAuthStore();
  const t = useTranslations('settings');
  const params = router.pathname.split('/');
  const locale = params[1] || 'en';

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getById(workspaceId!),
    enabled: !!workspaceId,
  });

  const form = useForm<WorkspaceData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: WorkspaceData) => workspaceApi.update(workspaceId!, data),
    onSuccess: () => {
      toast.success(t('saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: () => {
      toast.error('Failed to update workspace');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workspaceApi.delete(workspaceId!),
    onSuccess: () => {
      toast.success('Workspace deleted');
      router.push(`/${locale}/dashboard`);
    },
    onError: () => {
      toast.error('Failed to delete workspace');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <Card><CardContent className="p-6 h-64 bg-muted" /></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!workspace?.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Workspace not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const ws = workspace.data;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('workspace')}</h1>
          <p className="text-muted-foreground mt-1">{t('workspaceDescription')}</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">{t('general')}</TabsTrigger>
            <TabsTrigger value="danger">{t('dangerZone')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('general')}</CardTitle>
                <CardDescription>Update your workspace information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('workspaceName')}</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      defaultValue={ws.name}
                      disabled={updateMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('workspaceSlug')}</Label>
                    <Input
                      id="slug"
                      {...form.register('slug')}
                      defaultValue={ws.slug}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-sm text-muted-foreground">This will be part of your workspace URL</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('workspaceDescription')}</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      defaultValue={ws.description || ''}
                      disabled={updateMutation.isPending}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('save')}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
                </div>
                <CardDescription>{t('deleteWorkspaceDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workspace</p>
                  <p className="text-sm text-muted-foreground">{t('confirmDeleteWorkspace')}</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('This action cannot be undone. Are you absolutely sure?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('deleteWorkspace')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}