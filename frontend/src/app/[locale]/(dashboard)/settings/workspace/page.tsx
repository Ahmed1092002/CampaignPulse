'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react_query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Save, Image, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export default function WorkspaceSettingsPage() {
  const { workspaceId, workspaces, switchWorkspace } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('settings');
  const currentWorkspace = workspaces.find(w => w.workspace.id === workspaceId)?.workspace;

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['workspace-settings', workspaceId],
    queryFn: () => api.workspace.getSettings(workspaceId!),
    enabled: !!workspaceId,
  });

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: currentWorkspace?.name || '',
      slug: currentWorkspace?.slug || '',
      description: currentWorkspace?.description || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: WorkspaceFormData) => api.workspace.update(workspaceId!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success(t('saveSuccess'));
    },
    onError: (error: any) => toast.error(error.response?.data?.error?.message || t('error')),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => api.workspace.updateSettings(workspaceId!, settings),
    onSuccess: () => {
      refetch();
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('error')),
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(currentWorkspace?.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (data: WorkspaceFormData) => {
    updateMutation.mutate(data);
  };

  const settings = settingsData?.data?.settings || {};
  const [darkMode, setDarkMode] = useState(settings.darkMode === true);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications !== false);
  const [leadNotifications, setLeadNotifications] = useState(settings.leadNotifications !== false);
  const [statusChangeNotifications, setStatusChangeNotifications] = useState(settings.statusChangeNotifications !== false);
  const [dailySummary, setDailySummary] = useState(settings.dailySummary === true);
  const [weeklyReport, setWeeklyReport] = useState(settings.weeklyReport === true);

  const handleSettingsChange = () => {
    const newSettings = {
      darkMode,
      emailNotifications,
      leadNotifications,
      statusChangeNotifications,
      dailySummary,
      weeklyReport,
      timezone: settings.timezone || 'UTC',
      dateFormat: settings.dateFormat || 'MM/DD/YYYY',
      currency: settings.currency || 'USD',
    };
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('workspace')}</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('general')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={t('workspaceName')}
                  {...form.register('name')}
                  error={form.formState.errors.name?.message}
                />
                <Input
                  label={t('workspaceSlug')}
                  {...form.register('slug')}
                  error={form.formState.errors.slug?.message}
                />
              </div>

              <Textarea
                label={t('workspaceDescription')}
                placeholder="Describe your workspace..."
                {...form.register('description')}
                error={form.formState.errors.description?.message}
                rows={3}
              />

              <div className="space-y-4">
                <label className="label">{t('workspaceLogo')}</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border border-input bg-background overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Image className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="btn-outline cursor-pointer">
                      <Image className="h-4 w-4 mr-2" />
                      {t('uploadLogo') || 'Upload Logo'}
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                    {logoPreview && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => { setLogoPreview(null); setLogoFile(null); }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('removeLogo') || 'Remove Logo'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {t('save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notifications')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">{t('emailNotifications')}</h4>
              <div className="space-y-3 pl-4">
                <SettingToggle 
                  label={t('leadNotifications')} 
                  description="Receive email when a new lead is captured"
                  checked={leadNotifications} 
                  onChange={setLeadNotifications} 
                />
                <SettingToggle 
                  label={t('statusChangeNotifications')} 
                  description="Receive email when lead status changes"
                  checked={statusChangeNotifications} 
                  onChange={setStatusChangeNotifications} 
                />
                <SettingToggle 
                  label={t('dailySummary')} 
                  description="Receive daily summary email"
                  checked={dailySummary} 
                  onChange={setDailySummary} 
                />
                <SettingToggle 
                  label={t('weeklyReport')} 
                  description="Receive weekly report email"
                  checked={weeklyReport} 
                  onChange={setWeeklyReport} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('dangerZone') || 'Danger Zone'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
              <div>
                <p className="font-medium text-destructive">{t('deleteWorkspace')}</p>
                <p className="text-sm text-muted-foreground">{t('confirmDeleteWorkspace')}</p>
              </div>
              <Button variant="destructive" onClick={() => {}} disabled>
                {t('deleteWorkspace')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SettingToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

import { Switch } from '@/components/ui/Switch';