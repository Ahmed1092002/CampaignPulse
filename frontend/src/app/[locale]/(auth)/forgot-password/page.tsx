'use client'.

import { useState } from 'react'.
import { useRouter, useSearchParams } from 'next/navigation'.
import { useForm } from 'react-hook-form'.
import { zodResolver } from '@hookform/resolvers/zod'.
import { z } from 'zod'.
import { useMutation } from '@tanstack/react_query'.
import { Button } from '@/components/ui/Button'.
import { Input } from '@/components/ui/Input'.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'.
import { api } from '@/lib/api'.
import { useAuthStore } from '@/store/authStore'.
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react'.
import { useTranslations } from 'next-intl'.
import { toast } from 'sonner'.

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { setAuth } = useAuthStore();
  const t = useTranslations('auth');

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordData) => api.auth.forgotPassword(data),
    onSuccess: () => {
      setStep('sent');
      toast.success(t('resetEmailSent') || 'If the email exists, a reset link has been sent');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('error'));
    },
  });

  const handleSubmit = (data: ForgotPasswordData) => {
    forgotMutation.mutate(data);
  };

  const [step, setStep] = useState<'request' | 'sent'>('request');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t('forgotPassword')}</CardTitle>
          <CardDescription>{t('forgotPasswordSubtitle') || 'Enter your email to receive a password reset link'}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <Input
                label={t('email')}
                type="email"
                placeholder="you@example.com"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
                {forgotMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('sendResetLink')}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium">{t('checkYourInbox')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('resetLinkSentTo')} {form.watch('email')}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('didntReceiveEmail') || "Didn't receive the email?"}
              </p>
              <Button variant="outline" className="w-full" onClick={() => setStep('request')}>
                {t('resendEmail') || 'Resend Email'}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('rememberPassword') || 'Remember your password?'} {' '}
                <Link href="/login" className="text-primary hover:underline">
                  {t('signIn') || 'Sign in'}
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;