'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, CheckCircle, MessageSquare, Star, Zap, Shield, Target, ArrowRight, X } from 'lucide-react';
import { QrCodeModal } from './QrCodeModal';

interface PublicLandingPageProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    workspace: { id: string; name: string; logoUrl?: string };
  };
  landingPage: {
    hero: any;
    features: any[];
    testimonials: any[];
    cta: any;
    leadForm: any[];
    seo: any;
    customCss?: string;
  };
  workspace: { id: string; name: string; logoUrl?: string };
  locale: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

const leadFormSchema = z.record(z.any());

type LeadFormData = z.infer<typeof leadFormSchema>;

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  target: Target,
  star: Star,
  message: MessageSquare,
};

export function PublicLandingPage({ campaign, landingPage, workspace, locale }: PublicLandingPageProps) {
  const t = useTranslations('public.landingPage');
  const isRTL = locale === 'ar';
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {},
  });

  const handleSubmit = async (data: LeadFormData) => {
    setSubmitting(true);
    try {
      const utmParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && !Array.isArray(value)) utmParams.set(key, value);
      });
      const payload = {
        campaignId: campaign.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        customFields: data,
        utmSource: utmParams.get('utm_source') || undefined,
        utmMedium: utmParams.get('utm_medium') || undefined,
        utmCampaign: utmParams.get('utm_campaign') || undefined,
        utmTerm: utmParams.get('utm_term') || undefined,
        utmContent: utmParams.get('utm_content') || undefined,
        referrer: document.referrer || undefined,
      };

      await api.lead.create(campaign.workspace.id, payload);
      setFormSubmitted(true);
      toast.success(t('leadForm.successTitle'), { description: t('leadForm.successMessage') });
      
      // Track form submit event
      trackEvent('FORM_SUBMIT');
    } catch (error: any) {
      toast.error(t('leadForm.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  const trackEvent = async (type: string) => {
    try {
      await api.tracking.trackEvent(campaign.workspace.id, {
        campaignId: campaign.id,
        type: type as any,
        sessionId: getSessionId(),
        pageUrl: window.location.href,
      });
    } catch (error) {
      console.error('Tracking failed:', error);
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('cp_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 16);
      sessionStorage.setItem('cp_session_id', sessionId);
    }
    return sessionId;
  };

  // Track page view on mount
  useEffect(() => {
    trackEvent('PAGE_VIEW');
  }, []);

  const handleFieldFocus = (fieldName: string) => {
    if (!activeSection) {
      setActiveSection('leadForm');
    }
    trackEvent('FORM_START');
  };

  const renderIcon = (iconName: string) => {
    const Icon = ICON_COMPONENTS[iconName] || Sparkles;
    return <Icon className="h-6 w-6" />;
  };

  const Hero = landingPage.hero || {};
  const Features = landingPage.features || [];
  const Testimonials = landingPage.testimonials || [];
  const CTA = landingPage.cta || {};
  const LeadForm = landingPage.leadForm || [];

  return (
    <div className={cn('min-h-screen bg-background', isRTL && 'rtl')}>
      <style dangerouslySetInnerHTML={{ __html: landingPage.customCss || '' }} />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container-app h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workspace.logoUrl && <img src={workspace.logoUrl} alt={workspace.name} className="h-8 w-auto" />}
            <span className="font-semibold text-lg">{workspace.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setShowQr(true)}>
              <span className="hidden sm:inline">{t('qrCode') || 'QR Code'}</span>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center pt-16"
        style={{ backgroundImage: Hero.backgroundImage ? `url(${Hero.backgroundImage})` : 'none' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="container-app relative py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {Hero.headline || t('hero.defaultHeadline', { campaignName: campaign.name })}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {Hero.subheadline || t('hero.defaultSubheadline')}
            </p>
            <Button 
              size="lg" 
              className="w-auto"
              onClick={() => {
                const formSection = document.getElementById('lead-form');
                formSection?.scrollIntoView({ behavior: 'smooth' });
                trackEvent('CTA_CLICK');
              }}
            >
              {Hero.ctaText || t('hero.defaultCtaText')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {Features.length > 0 && (
        <section id="features" className="py-20 bg-muted/30">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{t('features.defaultTitle') || 'Features'}</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Features.map((feature, index) => (
                <Card key={index} className="h-full text-center p-6">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {renderIcon(feature.icon || 'sparkles')}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {Testimonials.length > 0 && (
        <section id="testimonials" className="py-20">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">{t('testimonials.defaultTitle') || 'What Our Customers Say'}</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {Testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="border-t pt-4">
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}{testimonial.company && `, ${testimonial.company}`}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {CTA.headline && (
        <section id="cta" className="py-20 bg-primary text-primary-foreground">
          <div className="container-app text-center">
            <h2 className="text-3xl font-bold mb-4">{CTA.headline}</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">{CTA.subheadline}</p>
            <Button 
              size="lg" 
              variant="secondary"
              className="w-auto"
              onClick={() => {
                const formSection = document.getElementById('lead-form');
                formSection?.scrollIntoView({ behavior: 'smooth' });
                trackEvent('CTA_CLICK');
              }}
            >
              {CTA.buttonText || t('cta.defaultButtonText')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Lead Form Section */}
      <section id="lead-form" className="py-20" ref={formRef}>
        <div className="container-app">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                {formSubmitted ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t('leadForm.successTitle')}</h2>
                    <p className="text-muted-foreground">{t('leadForm.successMessage')}</p>
                    <Button 
                      className="mt-6" 
                      onClick={() => { setFormSubmitted(false); form.reset(); }}
                    >
                      {t('leadForm.submitAnother') || 'Submit Another'}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-center mb-2">{t('leadForm.title')}</h2>
                    <p className="text-center text-muted-foreground mb-6">{t('leadForm.subtitle')}</p>
                    
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      {LeadForm.map((field, index) => (
                        <div key={`${field.name}-${index}`}>
                          <label htmlFor={field.name} className="label">
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <Textarea
                              id={field.name}
                              placeholder={field.placeholder}
                              {...form.register(field.name, { 
                                required: field.required ? t('common.required') : false 
                              })}
                              onFocus={() => handleFieldFocus(field.name)}
                            />
                          ) : field.type === 'select' ? (
                            <Select
                              id={field.name}
                              placeholder={field.placeholder}
                              options={field.options.map((opt: string) => ({ value: opt, label: opt }))}
                              {...form.register(field.name, { 
                                required: field.required ? t('common.required') : false 
                              })}
                              onFocus={() => handleFieldFocus(field.name)}
                            />
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                              placeholder={field.placeholder}
                              {...form.register(field.name, { 
                                required: field.required ? t('common.required') : false 
                              })}
                              onFocus={() => handleFieldFocus(field.name)}
                            />
                          )}
                          {form.formState.errors[field.name] && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors[field.name].message}</p>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        size="lg"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('leadForm.submitting')}
                          </>
                        ) : (
                          t('leadForm.submit')
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container-app">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {t('footer.copyright', { year: new Date().getFullYear(), workspaceName: workspace.name })}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">{t('footer.privacy')}</a>
              <a href="#" className="hover:text-foreground">{t('footer.terms')}</a>
              <a href="#" className="hover:text-foreground">{t('footer.contact')}</a>
            </div>
          </div>
        </div>
      </footer>

      <QrCodeModal 
        isOpen={showQr} 
        onClose={() => setShowQr(false)} 
        campaignSlug={campaign.slug}
        workspaceName={workspace.name}
      />
    </div>
  );
}