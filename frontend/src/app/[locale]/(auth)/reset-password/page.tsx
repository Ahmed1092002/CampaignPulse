'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Loader2, Lock, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.auth.verifyResetToken(token!),
    onSuccess: () => {
      setTokenValid(true);
      setStep('reset');
    },
    onError: () => {
      setTokenValid(false);
      setStep('verify');
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordData) => api.auth.resetPassword(token!, data.password),
    onSuccess: () => {
      setStep('success');
      toast.success(t('passwordResetSuccess') || 'Password has been reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('error'));
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate();
    } else {
      setTokenValid(false);
      setStep('verify');
    }
  }, [token]);

  const handleSubmit = (data: ResetPasswordData) => {
    resetMutation.mutate(data);
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <CardTitle>{t('verifyingToken') || 'Verifying reset link...'}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('invalidResetLink') || 'Invalid or expired reset link'}</CardTitle>
            <CardDescription>
              {t('invalidResetLinkDesc') || 'This password reset link is invalid or has expired. Please request a new one.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full" variant="outline">
                {t('requestNewLink') || 'Request a new link'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>{t('passwordResetSuccess') || 'Password reset successful!'}</CardTitle>
            <CardDescription>
              {t('passwordResetSuccessDesc') || 'Your password has been updated. You can now sign in with your new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">
                {t('signIn') || 'Sign In'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (data: ResetPasswordData) => {
    resetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('resetPassword') || 'Reset Password'}</CardTitle>
          <CardDescription>{t('resetPasswordSubtitle') || 'Enter your new password below'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Input
              label={t('newPassword') || 'New Password'}
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label={t('confirmPassword') || 'Confirm Password'}
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              error={form.formState.errors.confirmPassword?.message}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
              {resetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('resetPassword') || 'Reset Password'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('rememberPassword') || 'Remember your password?'} {' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('signIn') || 'Sign in'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}