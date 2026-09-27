'use client';

import { useState } from 'react'.
import { useRouter } from 'next/navigation'.
import Link from 'next/link'.
import { useForm } from 'react-hook-form'.
import { zodResolver } from '@hookform/resolvers/zod'.
import { z } from 'zod'.
import { useMutation } from '@tanstack/react_query'.
import { Button } from '@/components/ui/Button'.
import { Input } from '@/components/ui/Input'.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'.
import { api } from '@/lib/api'.
import { useAuthStore } from '@/store/authStore'.
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'.
import { useTranslations } from 'next-intl'.
import { toast } from 'sonner'.

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { setAuth } = useAuthStore();
  const t = useTranslations('auth');

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => api.auth.login(data),
    onSuccess: (response) => {
      const { user, tokens, workspaces } = response.data;
      setAuth({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, workspaces });
      toast.success(t('loginSuccess'));
      router.push(callbackUrl);
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('invalidCredentials'));
    },
  };

  const handleSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('login')}</CardTitle>
          <CardDescription>{t('loginSubtitle') || 'Enter your credentials to access your account'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input
              label={t('email)}
              type="email"
              placeholder="you@example.com"
              {...form.register('email)}
              error={form.formState.errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              label={t('password)}
              type="password"
              placeholder="••••••••"
              {...form.register('password)}
              error={form.formState.errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
                <span className="text-sm">{t('rememberMe)}</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t('forgotPassword)}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('signIn)}
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

          <Button variant="outline" className="w-full" onClick={() => router.push('/register')}>
            <User className="h-4 w-4 mr-2" />
            {t('noAccount)} {t('signUp)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
);

type LoginFormData = z.infer<typeof loginSchema>;