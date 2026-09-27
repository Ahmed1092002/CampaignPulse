'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input'.
import { Switch } from '@/components/ui/Switch'.
import { Badge } from '@/components/ui/Badge'.
import { api } from '@/lib/api'.
import { useAuthStore } from '@/store/authStore'.
import { formatDate } from '@/lib/utils'.
import { UserPlus, Mail, Trash2, Loader2, Shield, Crown, User, Eye, Edit2 } from 'lucide-react'.
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu'.
import { Modal, ConfirmModal } from '@/components/ui/Modal'.
import { useTranslations } from 'next-intl'.
import { toast } from 'sonner'.

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MARKETER', 'VIEWER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleLabels = {
  ADMIN: 'Admin',
  MARKETER: 'Marketer',
  VIEWER: 'Viewer',
};

const roleColors = {
  ADMIN: 'bg-purple-500/10 text-purple-500',
  MARKETER: 'bg-blue-500/10 text-blue-500',
  VIEWER: 'bg-gray-500/10 text-gray-500',
};

export default function TeamSettingsPage() {
  const { workspaceId, user, workspaces, switchWorkspace } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('settings');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data: membersData, isLoading, refetch } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => api.member.getAll(workspaceId!),
    enabled: !!workspaceId,
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'VIEWER' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) => api.member.invite(workspaceId!, data),
    onSuccess: () => {
      refetch();
      setInviteOpen(false);
      inviteForm.reset({ role: 'VIEWER' });
      toast.success(t('memberInvited') || 'Member invited successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.error?.message || t('error')),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.member.remove(workspaceId!, memberId),
    onSuccess: () => {
      refetch();
      setRemoveMemberId(null);
      toast.success(t('memberRemoved') || 'Member removed successfully');
    },
    onError: () => toast.error(t('error')),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.member.leave(workspaceId!),
    onSuccess: () => {
      setLeaveOpen(false);
      toast.success(t('leftWorkspace') || 'Left workspace successfully');
    },
    onError: () => toast.error(t('error')),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) => 
      api.member.updateRole(workspaceId!, memberId, role),
    onSuccess: () => {
      refetch();
      toast.success(t('roleUpdated') || 'Role updated successfully');
    },
    onError: () => toast.error(t('error')),
  });

  const members = membersData?.data || [];

  const handleInvite = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  const handleRemove = (memberId: string) => {
    setRemoveMemberId(memberId);
  };

  const handleRoleChange = (memberId: string, role: string) => {
    updateRoleMutation.mutate({ memberId, role });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('team')}</h1>
          <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('teamMembers')}</CardTitle>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('inviteMember')}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded" />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member: any) => {
                  const isCurrentUser = member.user.id === user?.id;
                  const isAdmin = member.role === 'ADMIN';
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                        <Badge variant="secondary" className={roleColors[member.role as keyof typeof roleColors]}>
                          {roleLabels[member.role as keyof typeof roleLabels]}
                        </Badge>
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2">
                            <User className="h-3 w-3 mr-1" /> You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={isCurrentUser}
                          options={[
                            { value: 'ADMIN', label: t('roleAdmin') },
                            { value: 'MARKETER', label: t('roleMarketer') },
                            { value: 'VIEWER', label: t('roleViewer') },
                          ]}
                          className="w-40"
                        />
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{member.user.firstName} {member.user.lastName}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemove(member.id)} 
                                icon={<Trash2 className="h-4 w-4" />} 
                                className="text-destructive focus:text-destructive"
                              >
                                {t('removeMember')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No team members yet. Invite your first member!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!currentWorkspace?.workspace?.role || currentWorkspace?.role === 'ADMIN' ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('dangerZone') || 'Danger Zone'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium text-destructive">{t('leaveWorkspace')}</p>
                    <p className="text-sm text-muted-foreground">{t('confirmLeave')}</p>
                  </div>
                  <Button variant="destructive" onClick={() => setLeaveOpen(true)}>
                    {t('leaveWorkspace')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title={t('inviteMember')}>
          <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
            <Input
              label={t('memberEmail')}
              type="email"
              placeholder="member@example.com"
              {...inviteForm.register('email')}
              error={inviteForm.formState.errors.email?.message}
            />
            <Select
              label={t('memberRole')}
              value={inviteForm.watch('role')}
              onChange={(e) => inviteForm.setValue('role', e.target.value as any)}
              options={[
                { value: 'ADMIN', label: t('roleAdmin') },
                { value: 'MARKETER', label: t('roleMarketer') },
                { value: 'VIEWER', label: t('roleViewer') },
              ]}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('inviteMember')}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={!!removeMemberId}
          onClose={() => setRemoveMemberId(null)}
          onConfirm={() => removeMutation.mutate(removeMemberId!)}
          title={t('removeMember')}
          message={t('confirmRemove')}
          confirmText={t('removeMember')}
          cancelText={t('cancel')}
          variant="danger"
        />

        <ConfirmModal
          isOpen={leaveOpen}
          onClose={() => setLeaveOpen(false)}
          onConfirm={() => leaveMutation.mutate()}
          title={t('leaveWorkspace')}
          message={t('confirmLeave')}
          confirmText={t('leaveWorkspace')}
          cancelText={t('cancel')}
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}