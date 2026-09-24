'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react_query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  Sparkles, 
  MessageSquare, 
  MousePointerClick, 
  UserPlus, 
  Save, 
  Eye, 
  Globe, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface LandingPageBuilderProps {
  campaignId: string;
  campaign: {
    id: string;
    name: string;
    slug: string;
    landingPage?: {
      hero: any;
      features: any[];
      testimonials: any[];
      cta: any;
      leadForm: any[];
      seo: any;
      customCss?: string;
      isPublished: boolean;
      publishedAt?: string;
    };
  };
}

const defaultHero = {
  headline: '',
  subheadline: '',
  ctaText: 'Get Started',
  ctaLink: '#lead-form',
  backgroundImage: '',
};

const defaultFeature = {
  title: '',
  description: '',
  icon: 'sparkles',
};

const defaultTestimonial = {
  quote: '',
  author: '',
  role: '',
  company: '',
};

const defaultCta = {
  headline: 'Ready to get started?',
  subheadline: 'Join thousands of satisfied customers',
  buttonText: 'Sign Up Now',
  buttonLink: '#lead-form',
};

const defaultLeadFormField: any = {
  id: '',
  type: 'text',
  name: '',
  label: '',
  placeholder: '',
  required: false,
  options: [],
  validation: undefined,
  conditional: undefined,
  step: 1,
  hidden: false,
  helpText: '',
  width: 'full',
  order: 0,
};

const defaultSeo = {
  title: '',
  description: '',
  ogImage: '',
  canonicalUrl: '',
};

const ICONS = [
  'sparkles', 'zap', 'shield', 'target', 'rocket', 'bar-chart', 'users', 'heart',
  'star', 'award', 'gem', 'crown', 'lightbulb', 'globe', 'lock', 'check-circle',
];

export function LandingPageBuilder({ campaignId, campaign }: LandingPageBuilderProps) {
  const { workspaceId } = useAuthStore();
  const queryClient = useQueryClient();
  const t = useTranslations('landingPage');
  const [activeTab, setActiveTab] = useState('hero');
  const [hero, setHero] = useState(campaign.landingPage?.hero || defaultHero);
  const [features, setFeatures] = useState(campaign.landingPage?.features || [defaultFeature]);
  const [testimonials, setTestimonials] = useState(campaign.landingPage?.testimonials || [defaultTestimonial]);
  const [cta, setCta] = useState(campaign.landingPage?.cta || defaultCta);
  const [leadForm, setLeadForm] = useState(campaign.landingPage?.leadForm || [defaultLeadFormField]);
  const [seo, setSeo] = useState(campaign.landingPage?.seo || defaultSeo);
  const [customCss, setCustomCss] = useState(campaign.landingPage?.customCss || '');
  const [isPublished, setIsPublished] = useState(campaign.landingPage?.isPublished || false);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.landingPage.update(workspaceId!, campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', workspaceId, campaignId] });
      toast.success(t('savedSuccess'));
    },
    onError: () => toast.error(t('error')),
  });

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => api.landingPage.update(workspaceId!, campaignId, { isPublished: publish }),
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', workspaceId, campaignId] });
      toast.success(publish ? t('publishedSuccess') : t('unpublishedSuccess'));
      setIsPublished(publish);
    },
    onError: () => toast.error(t('error')),
  });

  const handleSave = (publish = false) => {
    const data = {
      hero,
      features,
      testimonials,
      cta,
      leadForm,
      seo,
      customCss,
      isPublished: publish || isPublished,
    };
    if (publish) {
      publishMutation.mutate(true);
    } else {
      saveMutation.mutate(data);
    }
  };

  const tabs = [
    { id: 'hero', label: t('sections.hero'), icon: LayoutDashboard },
    { id: 'features', label: t('sections.features'), icon: Sparkles },
    { id: 'testimonials', label: t('sections.testimonials'), icon: MessageSquare },
    { id: 'cta', label: t('sections.cta'), icon: MousePointerClick },
    { id: 'leadForm', label: t('sections.leadForm'), icon: UserPlus },
    { id: 'seo', label: t('seo.title'), icon: Globe },
  ];

  const isSaving = saveMutation.isPending || publishMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('builder')}</h2>
          <p className="text-muted-foreground">Build your landing page with drag-and-drop sections</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open(`/p/${campaign.slug}`, '_blank')} disabled={!isPublished}>
            <Eye className="h-4 w-4 mr-2" />
            {t('preview')}
          </Button>
          <Button variant={isPublished ? 'secondary' : 'primary'} onClick={() => handleSave(true)} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPublished ? (t('unpublish') || 'Unpublish') : (t('publish') || 'Publish')}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {t('save')}
          </Button>
        </div>
      </div>

      {isPublished && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-400">
            Published at {campaign.landingPage?.publishedAt ? format(new Date(campaign.landingPage.publishedAt), 'MMM d, yyyy HH:mm') : 'Just now'}
          </span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="hero" className="mt-6">
          <Card>
            <CardHeader><CardTitle>{t('sections.hero')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t('hero.headline')} placeholder="Welcome to Our Campaign" value={hero.headline} onChange={(e) => setHero({...hero, headline: e.target.value})} />
              <Textarea label={t('hero.subheadline')} placeholder="Discover amazing features..." value={hero.subheadline} onChange={(e) => setHero({...hero, subheadline: e.target.value})} rows={3} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label={t('hero.ctaText')} placeholder="Get Started" value={hero.ctaText} onChange={(e) => setHero({...hero, ctaText: e.target.value})} />
                <Input label={t('hero.ctaLink')} placeholder="#lead-form" value={hero.ctaLink} onChange={(e) => setHero({...hero, ctaLink: e.target.value})} />
              </div>
              <Input label={t('hero.backgroundImage')} placeholder="https://example.com/image.jpg" value={hero.backgroundImage} onChange={(e) => setHero({...hero, backgroundImage: e.target.value})} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('sections.features')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setFeatures([...features, { ...defaultFeature }])}>
                <Plus className="h-4 w-4 mr-2" />{t('features.addFeature') || 'Add Feature'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Feature {index + 1}</h4>
                    {features.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setFeatures(features.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input label={t('features.featureTitle')} value={feature.title} onChange={(e) => setFeatures(features.map((f, i) => i === index ? { ...f, title: e.target.value } : f))} />
                    <Select
                      label={t('features.featureIcon')}
                      value={feature.icon}
                      onChange={(e) => setFeatures(features.map((f, i) => i === index ? { ...f, icon: e.target.value } : f))}
                      options={ICONS.map(icon => ({ value: icon, label: icon }))}
                    />
                  </div>
                  <Textarea label={t('features.featureDescription')} value={feature.description} onChange={(e) => setFeatures(features.map((f, i) => i === index ? { ...f, description: e.target.value } : f))} rows={2} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('sections.testimonials')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setTestimonials([...testimonials, { ...defaultTestimonial }])}>
                <Plus className="h-4 w-4 mr-2" />{t('testimonials.addTestimonial') || 'Add Testimonial'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Testimonial {index + 1}</h4>
                    {testimonials.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setTestimonials(testimonials.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea label={t('testimonials.quote')} value={testimonial.quote} onChange={(e) => setTestimonials(testimonials.map((t, i) => i === index ? { ...t, quote: e.target.value } : t))} rows={3} />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label={t('testimonials.author')} value={testimonial.author} onChange={(e) => setTestimonials(testimonials.map((t, i) => i === index ? { ...t, author: e.target.value } : t))} />
                      <Input label={t('testimonials.role')} value={testimonial.role} onChange={(e) => setTestimonials(testimonials.map((t, i) => i === index ? { ...t, role: e.target.value } : t))} />
                      <Input label={t('testimonials.company')} value={testimonial.company} onChange={(e) => setTestimonials(testimonials.map((t, i) => i === index ? { ...t, company: e.target.value } : t))} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="mt-6">
          <Card>
            <CardHeader><CardTitle>{t('sections.cta')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t('cta.headline')} value={cta.headline} onChange={(e) => setCta({...cta, headline: e.target.value})} />
              <Textarea label={t('cta.subheadline')} value={cta.subheadline} onChange={(e) => setCta({...cta, subheadline: e.target.value})} rows={2} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label={t('cta.buttonText')} value={cta.buttonText} onChange={(e) => setCta({...cta, buttonText: e.target.value})} />
                <Input label={t('cta.buttonLink')} value={cta.buttonLink} onChange={(e) => setCta({...cta, buttonLink: e.target.value})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leadForm" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('sections.leadForm')}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setLeadForm([...leadForm, { ...defaultLeadFormField, name: `field_${Date.now()}` }])}>
                <Plus className="h-4 w-4 mr-2" />{t('leadForm.addField') || 'Add Field'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {leadForm.map((field, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Field {index + 1}</h4>
                    {leadForm.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setLeadForm(leadForm.filter((_, i) => i !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Select
                      label={t('leadForm.fieldType')}
                      value={field.type}
                      onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, type: e.target.value as any } : f))}
                      options={[
                        { value: 'text', label: t('leadForm.types.text') },
                        { value: 'email', label: t('leadForm.types.email') },
                        { value: 'phone', label: t('leadForm.types.phone') },
                        { value: 'select', label: t('leadForm.types.select') },
                        { value: 'textarea', label: t('leadForm.types.textarea') },
                      ]}
                    />
                    <Input label={t('leadForm.fieldName')} value={field.name} onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, name: e.target.value } : f))} />
                    <Input label={t('leadForm.fieldLabel')} value={field.label} onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, label: e.target.value } : f))} />
                    <Input label={t('leadForm.fieldPlaceholder')} value={field.placeholder} onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, placeholder: e.target.value } : f))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, required: e.target.checked } : f))}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{t('leadForm.fieldRequired')}</span>
                    </label>
                    {field.type === 'select' && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('leadForm.fieldOptions') || 'Options (comma separated)'}</label>
                        <Input
                          value={field.options.join(', ')}
                          onChange={(e) => setLeadForm(leadForm.map((f, i) => i === index ? { ...f, options: e.target.value.split(',').map(s => s.trim()) } : f))}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader><CardTitle>{t('seo.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t('seo.metaTitle')} value={seo.title} onChange={(e) => setSeo({...seo, title: e.target.value})} />
              <Textarea label={t('seo.metaDescription')} value={seo.description} onChange={(e) => setSeo({...seo, description: e.target.value})} rows={3} />
              <Input label={t('seo.ogImage')} placeholder="https://example.com/og-image.jpg" value={seo.ogImage} onChange={(e) => setSeo({...seo, ogImage: e.target.value})} />
              <Input label={t('seo.canonicalUrl')} placeholder="https://example.com/campaign" value={seo.canonicalUrl} onChange={(e) => setSeo({...seo, canonicalUrl: e.target.value})} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Custom CSS</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                label="Custom CSS"
                placeholder="/* Add your custom CSS here */"
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { LeadFormBuilder } from './LeadFormBuilder';
import { ValidationEditor } from './ValidationEditor';
import { ConditionalEditor } from './ConditionalEditor';
import { StepEditor } from './StepEditor';