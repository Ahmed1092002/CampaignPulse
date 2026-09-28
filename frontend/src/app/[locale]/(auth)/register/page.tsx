'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const t = useTranslations('auth');

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const registerMutationOptions = {
    mutationFn: (data: RegisterFormData) => api.auth.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    }),
    onSuccess: (response: any) => {
      const { user, tokens, workspaces } = response.data;
      setAuth({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, workspaces });
      toast.success(t('registerSuccess'));
      router.push('/dashboard');
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('error'));
    },
  };

  const registerMutation = useMutation(registerMutationOptions);

  const handleSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('register')}</CardTitle>
          <CardDescription>{t('registerSubtitle') || 'Create your account to get started'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t('firstName')}
                placeholder="John"
                {...form.register('firstName')}
                error={form.formState.errors.firstName?.message}
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label={t('lastName')}
                placeholder="Doe"
                {...form.register('lastName')}
                error={form.formState.errors.lastName?.message}
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>
            <Input
              label={t('email')}
              type="email"
              placeholder="you@example.com"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label={t('password')}
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label={t('confirmPassword')}
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              error={form.formState.errors.confirmPassword?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('signUp')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('or')}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
            <Mail className="h-4 w-4 mr-2" />
            {t('hasAccount')} {t('signIn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;