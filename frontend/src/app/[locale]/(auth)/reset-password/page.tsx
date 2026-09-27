'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { api, authApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'auth.weakPassword' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.passwordMismatch',
  path: ['confirmPassword'],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setValidToken(false);
        return;
      }

      try {
        await authApi.verifyResetToken(token);
        setValidToken(true);
      } catch (error) {
        setValidToken(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;
    
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, data.password);
      toast.success(t('resetPasswordSuccess'), { description: t('resetPasswordSuccessDesc') });
      router.push(`/${searchParams.get('locale') || 'en'}/login`);
    } catch (error: any) {
      toast.error(t('invalidResetLink'));
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p>{t('verifyingTokenDesc')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{t('invalidResetLink')}</CardTitle>
            <CardDescription>{t('invalidResetLinkDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${searchParams.get('locale') || 'en'}/forgot-password`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('requestNewLink')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
          <CardDescription>{t('resetPasswordSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="password" className="label">{t('newPassword')}</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('newPassword')}
                  className="pl-10"
                  {...form.register('password')}
                  disabled={submitting}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">{t('confirmNewPassword')}</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmNewPassword')}
                  className="pl-10"
                  {...form.register('confirmPassword')}
                  disabled={submitting}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('resetPassword')}
                </>
              ) : (
                t('resetPassword')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href={`/${searchParams.get('locale') || 'en'}/login`} className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t('rememberPassword')} {t('signInLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}