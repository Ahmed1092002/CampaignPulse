'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { api, memberApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Save, UserPlus, Mail, Users, Trash2, Shield, User, Edit, MoreHorizontal, Check } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MARKETER', 'VIEWER']),
});

type InviteData = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MARKETER: 'Marketer',
  VIEWER: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-500/10 text-purple-700',
  MARKETER: 'bg-blue-500/10 text-blue-700',
  VIEWER: 'bg-gray-500/10 text-gray-700',
};

export default function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const { workspaceId } = useAuthStore();
  const t = useTranslations('settings');
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => memberApi.getAll(workspaceId!),
    enabled: !!workspaceId,
  });

  const inviteForm = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'MARKETER',
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteData) => memberApi.invite(workspaceId!, data),
    onSuccess: () => {
      toast.success('Member invited successfully');
      inviteForm.reset();
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) => memberApi.updateRole(workspaceId!, memberId, role),
    onSuccess: () => {
      toast.success('Role updated');
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: () => {
      toast.error('Failed to update role');
      setEditingMember(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => memberApi.remove(workspaceId!, memberId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => memberApi.leave(workspaceId!),
    onSuccess: () => {
      toast.success('Left workspace');
      window.location.href = '/dashboard';
    },
    onError: () => {
      toast.error('Failed to leave workspace');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6 h-20 bg-muted" /></Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const memberList = members?.data || [];
  const currentUserId = useAuthStore.getState().user?.id;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('team')}</h1>
            <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
          </div>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('inviteMember')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members ({memberList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {memberList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No team members yet</p>
                <Button className="mt-4" onClick={() => setShowInvite(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('inviteMember')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {memberList.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <Avatar src={member.user?.avatarUrl} fallback={`${member.user?.firstName} ${member.user?.lastName}`} className="h-10 w-10" />
                      <div>
                        <p className="font-medium">{member.user?.firstName} {member.user?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      </div>
                      <Badge className={cn(ROLE_COLORS[member.role], 'text-capitalize')}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                      {member.user?.id === currentUserId && (
                        <Badge className="bg-green-500/10 text-green-700">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {member.user?.id !== currentUserId && (
                        <>
                          {editingMember === member.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MARKETER">Marketer</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                              <Button size="sm" onClick={() => updateRoleMutation.mutate({ memberId: member.id, role: editRole })} disabled={updateRoleMutation.isPending}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => { setEditingMember(member.id); setEditRole(member.role); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this member?')) {
                                removeMutation.mutate(member.id);
                              }
                            }}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {member.user?.id === currentUserId && memberList.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('Are you sure you want to leave this workspace?')) {
                              leaveMutation.mutate();
                            }
                          }}
                          disabled={leaveMutation.isPending}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Leave
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showInvite && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Invite New Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={inviteForm.handleSubmit((data) => inviteMutation.mutate(data))} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('memberEmail')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...inviteForm.register('email')}
                      disabled={inviteMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t('memberRole')}</Label>
                    <Select
                      id="role"
                      {...inviteForm.register('role')}
                      options={[
                        { value: 'ADMIN', label: 'Admin' },
                        { value: 'MARKETER', label: 'Marketer' },
                        { value: 'VIEWER', label: 'Viewer' },
                      ]}
                      disabled={inviteMutation.isPending}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        {t('inviteMember')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}