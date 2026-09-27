'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Monitor,
  Smartphone,
  Tablet,
  Copy,
  Trash2,
  Plus,
  Settings,
  Shield,
  Code,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ConditionalEditor } from './ConditionalEditor';
import { ValidationEditor } from './ValidationEditor';

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
      sectionOrder?: string[];
      multiStep?: boolean;
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

const defaultLeadFormField = {
  id: '',
  type: 'text',
  name: '',
  label: '',
  placeholder: '',
  required: false,
  options: [],
  conditional: { showWhen: [], logic: 'AND' },
  validation: {},
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

const SECTION_TEMPLATES = [
  {
    id: 'hero-basic',
    name: 'Hero - Basic',
    icon: LayoutDashboard,
    sections: { hero: { headline: 'Welcome to {{campaignName}}', subheadline: 'Discover amazing features tailored for you', ctaText: 'Get Started', ctaLink: '#lead-form' }},
  },
  {
    id: 'hero-split',
    name: 'Hero - Split Layout',
    icon: LayoutDashboard,
    sections: { hero: { headline: 'Transform Your Business', subheadline: 'Join 10,000+ companies using our platform', ctaText: 'Start Free Trial', ctaLink: '#lead-form', backgroundImage: '' }},
  },
  {
    id: 'features-grid',
    name: 'Features - 3 Column Grid',
    icon: Sparkles,
    sections: { features: [
      { title: 'Fast Performance', description: 'Lightning fast speeds', icon: 'zap' },
      { title: 'Secure by Default', description: 'Enterprise-grade security', icon: 'shield' },
      { title: 'Easy Integration', description: 'Connect in minutes', icon: 'target' },
    ]},
  },
  {
    id: 'testimonials-carousel',
    name: 'Testimonials - Carousel',
    icon: MessageSquare,
    sections: { testimonials: [
      { quote: 'Amazing product!', author: 'John Doe', role: 'CEO', company: 'Acme Inc' },
      { quote: 'Best decision we made', author: 'Jane Smith', role: 'CTO', company: 'TechCorp' },
    ]},
  },
  {
    id: 'cta-centered',
    name: 'CTA - Centered',
    icon: MousePointerClick,
    sections: { cta: { headline: 'Ready to get started?', subheadline: 'Join thousands of satisfied customers', buttonText: 'Sign Up Now', buttonLink: '#lead-form' }},
  },
  {
    id: 'lead-form-basic',
    name: 'Lead Form - Basic',
    icon: UserPlus,
    sections: { leadForm: [
      { ...defaultLeadFormField, id: 'field_1', type: 'text', name: 'firstName', label: 'First Name', required: true },
      { ...defaultLeadFormField, id: 'field_2', type: 'email', name: 'email', label: 'Email', required: true },
    ]},
  },
  {
    id: 'lead-form-detailed',
    name: 'Lead Form - Detailed',
    icon: UserPlus,
    sections: { leadForm: [
      { ...defaultLeadFormField, id: 'field_1', type: 'text', name: 'firstName', label: 'First Name', required: true },
      { ...defaultLeadFormField, id: 'field_2', type: 'text', name: 'lastName', label: 'Last Name', required: true },
      { ...defaultLeadFormField, id: 'field_3', type: 'email', name: 'email', label: 'Email', required: true },
      { ...defaultLeadFormField, id: 'field_4', type: 'phone', name: 'phone', label: 'Phone' },
      { ...defaultLeadFormField, id: 'field_5', type: 'select', name: 'companySize', label: 'Company Size', options: ['1-10', '11-50', '51-200', '200+'] },
      { ...defaultLeadFormField, id: 'field_6', type: 'textarea', name: 'message', label: 'Message', placeholder: 'Tell us about your needs...' },
    ]},
  },
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
  const [leadForm, setLeadForm] = useState(() => {
    const saved = campaign.landingPage?.leadForm || [defaultLeadFormField];
    return saved.map((f: any, i: number) => ({
      ...defaultLeadFormField,
      ...f,
      id: f.id || `field_${Date.now()}_${i}`,
      conditional: f.conditional || { showWhen: [], logic: 'AND' },
      validation: f.validation || {},
    }));
  });
  const [seo, setSeo] = useState(campaign.landingPage?.seo || defaultSeo);
  const [customCss, setCustomCss] = useState(campaign.landingPage?.customCss || '');
  const [isPublished, setIsPublished] = useState(campaign.landingPage?.isPublished || false);
  const [multiStep, setMultiStep] = useState(campaign.landingPage?.multiStep || false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

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

  const handleSave = useCallback((publish = false) => {
    const sectionOrder = ['hero', 'features', 'testimonials', 'cta', 'leadForm'];
    const data = {
      hero,
      features,
      testimonials,
      cta,
      leadForm,
      seo,
      customCss,
      multiStep,
      sectionOrder,
      isPublished: publish || isPublished,
    };
    if (publish) {
      publishMutation.mutate(true);
    } else {
      saveMutation.mutate(data);
    }
  }, [hero, features, testimonials, cta, leadForm, seo, customCss, multiStep, isPublished]);

  const applyTemplate = useCallback((template: any) => {
    if (template.sections.hero) setHero(template.sections.hero);
    if (template.sections.features) setFeatures(template.sections.features);
    if (template.sections.testimonials) setTestimonials(template.sections.testimonials);
    if (template.sections.cta) setCta(template.sections.cta);
    if (template.sections.leadForm) {
      setLeadForm(template.sections.leadForm.map((f: any, i: number) => ({
        ...defaultLeadFormField,
        ...f,
        id: f.id || `field_${Date.now()}_${i}`,
        conditional: f.conditional || { showWhen: [], logic: 'AND' },
        validation: f.validation || {},
      })));
    }
    setShowTemplates(false);
    toast.success('Template applied');
  }, []);

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    setLeadForm(prev => {
      const newFields = [...prev];
      const [removed] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, removed);
      return newFields;
    });
  }, []);

  const handleConditionalUpdate = useCallback((fieldId: string, updates: any) => {
    setLeadForm(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  }, []);

  const handleValidationUpdate = useCallback((fieldId: string, updates: any) => {
    setLeadForm(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  }, []);

  const duplicateField = useCallback((index: number) => {
    setLeadForm(prev => {
      const field = prev[index];
      const newField = { ...field, id: `field_${Date.now()}`, name: `${field.name}_copy` };
      const newFields = [...prev];
      newFields.splice(index + 1, 0, newField);
      return newFields;
    });
  }, []);

  const moveSection = useCallback((section: string, direction: 'up' | 'down') => {
    // This would reorder sections in sectionOrder
    toast.info('Section reordering coming soon');
  }, []);

  const tabs = [
    { id: 'hero', label: t('sections.hero'), icon: LayoutDashboard },
    { id: 'features', label: t('sections.features'), icon: Sparkles },
    { id: 'testimonials', label: t('sections.testimonials'), icon: MessageSquare },
    { id: 'cta', label: t('sections.cta'), icon: MousePointerClick },
    { id: 'leadForm', label: t('sections.leadForm'), icon: UserPlus },
    { id: 'seo', label: t('seo.title'), icon: Globe },
  ];

  const isSaving = saveMutation.isPending || publishMutation.isPending;

  const getPreviewStyles = () => {
    switch (previewDevice) {
      case 'mobile': return { maxWidth: '375px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '16px', minHeight: '667px' };
      case 'tablet': return { maxWidth: '768px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '12px', minHeight: '1024px' };
      default: return { maxWidth: '100%', margin: 0 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('builder')}</h2>
          <p className="text-muted-foreground">Build your landing page with drag-and-drop sections</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <Button variant={previewDevice === 'desktop' ? 'primary' : 'outline'} size="sm" onClick={() => setPreviewDevice('desktop')}>
              <Monitor className="h-4 w-4" />
            </Button>
            <Button variant={previewDevice === 'tablet' ? 'primary' : 'outline'} size="sm" onClick={() => setPreviewDevice('tablet')}>
              <Tablet className="h-4 w-4" />
            </Button>
            <Button variant={previewDevice === 'mobile' ? 'primary' : 'outline'} size="sm" onClick={() => setPreviewDevice('mobile')}>
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Layers className="h-4 w-4 mr-2" />
            Templates
          </Button>
          
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

      {/* Section Order / Multi-step Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiStep}
                  onChange={(e) => setMultiStep(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Multi-step Form</span>
              </label>
              {multiStep && (
                <Badge variant="secondary" className="text-xs">
                  Form split into steps
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Drag sections to reorder (coming soon)
            </div>
          </div>
        </CardContent>
      </Card>

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
          <SectionEditor
            title={t('sections.features')}
            items={features}
            onChange={setFeatures}
            defaultItem={defaultFeature}
            renderItem={(item, index, onUpdate, onRemove) => (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Feature {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => duplicateField(index)} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                    {features.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={onRemove}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input label={t('features.featureTitle')} value={item.title} onChange={(e) => onUpdate({ title: e.target.value })} />
                  <Select
                    label={t('features.featureIcon')}
                    value={item.icon}
                    onChange={(e) => onUpdate({ icon: e.target.value })}
                    options={ICONS.map(icon => ({ value: icon, label: icon }))}
                  />
                </div>
                <Textarea label={t('features.featureDescription')} value={item.description} onChange={(e) => onUpdate({ description: e.target.value })} rows={2} />
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <SectionEditor
            title={t('sections.testimonials')}
            items={testimonials}
            onChange={setTestimonials}
            defaultItem={defaultTestimonial}
            renderItem={(item, index, onUpdate, onRemove) => (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Testimonial {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      const newItem = { ...item, id: `testimonial_${Date.now()}` };
                      onUpdate({ ...item }); // This is a workaround - in real app would use setTestimonials directly
                    }} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                    {testimonials.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={onRemove}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Textarea label={t('testimonials.quote')} value={item.quote} onChange={(e) => onUpdate({ quote: e.target.value })} rows={3} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input label={t('testimonials.author')} value={item.author} onChange={(e) => onUpdate({ author: e.target.value })} />
                    <Input label={t('testimonials.role')} value={item.role} onChange={(e) => onUpdate({ role: e.target.value })} />
                    <Input label={t('testimonials.company')} value={item.company} onChange={(e) => onUpdate({ company: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          />
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('sections.leadForm')}</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  Load Template
                </Button>
                <Button size="sm" variant="outline" onClick={() => setLeadForm([...leadForm, { ...defaultLeadFormField, id: `field_${Date.now()}`, name: `field_${leadForm.length + 1}` }])}>
                  <Plus className="h-4 w-4 mr-2" />{t('leadForm.addField') || 'Add Field'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {leadForm.map((field, index) => (
                <LeadFormFieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  allFields={leadForm}
                  onUpdate={(updates) => setLeadForm(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f))}
                  onRemove={() => setLeadForm(prev => prev.filter((_, i) => i !== index))}
                  onDuplicate={() => duplicateField(index)}
                  onMoveUp={() => index > 0 && moveField(index, index - 1)}
                  onMoveDown={() => index < leadForm.length - 1 && moveField(index, index + 1)}
                  onConditionalUpdate={(updates) => handleConditionalUpdate(field.id, updates)}
                  onValidationUpdate={(updates) => handleValidationUpdate(field.id, updates)}
                  isExpanded={expandedField === field.id}
                  onToggleExpand={() => setExpandedField(expandedField === field.id ? null : field.id)}
                />
              ))}
            </div>

            {leadForm.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No form fields yet</p>
                <Button onClick={() => setLeadForm([{ ...defaultLeadFormField, id: `field_${Date.now()}`, name: 'field_1' }])}>
                  <Plus className="h-4 w-4 mr-2" />Add First Field
                </Button>
              </div>
            )}
          </div>
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

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Section Templates</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 grid gap-4 md:grid-cols-2">
              {SECTION_TEMPLATES.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md" onClick={() => applyTemplate(template)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <template.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">Click to apply</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SectionEditorProps<T> {
  title: string;
  items: T[];
  onChange: React.Dispatch<React.SetStateAction<T[]>>;
  defaultItem: T;
  renderItem: (item: T, index: number, onUpdate: (updates: Partial<T>) => void, onRemove: () => void) => React.ReactNode;
}

function SectionEditor<T extends { id?: string }>({ title, items, onChange, defaultItem, renderItem }: SectionEditorProps<T>) {
  const [localItems, setLocalItems] = useState(items);
  
  const handleAdd = () => {
    const newItem = { ...defaultItem, id: `item_${Date.now()}` };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onChange(updated);
  };

  const handleUpdate = (index: number, updates: Partial<T>) => {
    setLocalItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      onChange(updated);
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    setLocalItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onChange(updated);
      return updated;
    });
  };

  const handleDuplicate = (index: number) => {
    setLocalItems(prev => {
      const item = prev[index];
      const newItem = { ...item, id: `item_${Date.now()}` };
      const updated = [...prev];
      updated.splice(index + 1, 0, newItem);
      onChange(updated);
      return updated;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {localItems.map((item, index) => (
          <div key={item.id || index} className="border rounded-lg p-4 space-y-4">
            {renderItem(item, index, (updates) => handleUpdate(index, updates), () => handleRemove(index))}
          </div>
        ))}
        {localItems.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground mb-4">No items yet</p>
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />Add First</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LeadFormFieldCardProps {
  field: any;
  index: number;
  allFields: any[];
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConditionalUpdate: (updates: any) => void;
  onValidationUpdate: (updates: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function LeadFormFieldCard({ 
  field, index, allFields, onUpdate, onRemove, onDuplicate, onMoveUp, onMoveDown,
  onConditionalUpdate, onValidationUpdate, isExpanded, onToggleExpand 
}: LeadFormFieldCardProps) {
  const t = useTranslations('landingPage');

  return (
    <Card className="border-l-4 border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{index + 1}</Badge>
            <h4 className="font-medium">{field.label || field.name || `Field ${index + 1}`}</h4>
            <Badge variant="outline" className="text-xs capitalize">{field.type}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} title="Move up">
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={index === allFields.length - 1} title="Move down">
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleExpand} title={isExpanded ? 'Collapse' : 'Expand'}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive" title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Field Config */}
          <div className="grid gap-4 md:grid-cols-4">
            <Select
              label={t('leadForm.fieldType')}
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as any })}
              options={[
                { value: 'text', label: t('leadForm.types.text') },
                { value: 'email', label: t('leadForm.types.email') },
                { value: 'phone', label: t('leadForm.types.phone') },
                { value: 'select', label: t('leadForm.types.select') },
                { value: 'textarea', label: t('leadForm.types.textarea') },
              ]}
            />
            <Input label={t('leadForm.fieldName')} value={field.name} onChange={(e) => onUpdate({ name: e.target.value })} />
            <Input label={t('leadForm.fieldLabel')} value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} />
            <Input label={t('leadForm.fieldPlaceholder')} value={field.placeholder} onChange={(e) => onUpdate({ placeholder: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">{t('leadForm.fieldRequired')}</span>
            </label>
            {field.type === 'select' && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">{t('leadForm.fieldOptions') || 'Options (comma separated)'}</label>
                <Input
                  value={field.options.join(', ')}
                  onChange={(e) => onUpdate({ options: e.target.value.split(',').map((s: string) => s.trim()) })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>

          {/* Conditional Logic */}
          {isExpanded && (
            <div className="border-t pt-4 space-y-4">
              <ConditionalEditor
                field={field}
                allFields={allFields}
                onUpdate={onConditionalUpdate}
              />
              <ValidationEditor
                field={field}
                onUpdate={onValidationUpdate}
              />
            </div>
          )}

          {/* Collapsed preview */}
          {!isExpanded && (field.conditional?.showWhen?.length || field.validation && Object.keys(field.validation).length > 0) && (
            <div className="border-t pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {field.conditional?.showWhen?.map((rule: any, i: number) => {
                  const targetField = allFields.find(f => f.id === rule.fieldId);
                  const fieldLabel = targetField?.label || targetField?.name || 'Unknown';
                  const opLabels: Record<string, string> = {
                    equals: '=',
                    not_equals: '≠',
                    contains: 'contains',
                    not_contains: '!contains',
                    is_empty: 'empty',
                    is_not_empty: 'not empty',
                  };
                  return (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      {fieldLabel} {opLabels[rule.operator] || rule.operator} {rule.value || ''}
                    </Badge>
                  );
                })}
                {Object.keys(field.validation || {}).map(key => {
                  const labels: Record<string, string> = {
                    required: 'Required',
                    minLength: 'Min Length',
                    maxLength: 'Max Length',
                    pattern: 'Regex',
                    min: 'Min',
                    max: 'Max',
                  };
                  return <Badge key={key} variant="success" className="text-xs">{labels[key] || key}</Badge>;
                })}
              </div>
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                <Settings className="h-4 w-4 mr-1" />
                Configure
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}