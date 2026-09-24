import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { CreateLandingPageInput, UpdateLandingPageInput } from '../../types';
import { UserRole } from '@prisma/client';

const defaultLandingPage = {
  hero: {
    headline: 'Welcome to Our Campaign',
    subheadline: 'Discover amazing features and benefits',
    ctaText: 'Get Started',
    ctaLink: '#lead-form',
    backgroundImage: '',
  },
  features: [
    { title: 'Feature 1', description: 'Description of feature 1', icon: 'sparkles' },
    { title: 'Feature 2', description: 'Description of feature 2', icon: 'zap' },
    { title: 'Feature 3', description: 'Description of feature 3', icon: 'shield' },
  ],
  testimonials: [
    { quote: 'Amazing product!', author: 'John Doe', role: 'CEO', company: 'Acme Inc' },
    { quote: 'Highly recommended', author: 'Jane Smith', role: 'CTO', company: 'TechCorp' },
  ],
  cta: {
    headline: 'Ready to get started?',
    subheadline: 'Join thousands of satisfied customers',
    buttonText: 'Sign Up Now',
    buttonLink: '#lead-form',
  },
  leadForm: [
    { type: 'text', name: 'firstName', label: 'First Name', required: true, placeholder: 'John' },
    { type: 'text', name: 'lastName', label: 'Last Name', required: true, placeholder: 'Doe' },
    { type: 'email', name: 'email', label: 'Email', required: true, placeholder: 'john@example.com' },
    { type: 'tel', name: 'phone', label: 'Phone', required: false, placeholder: '+1 (555) 000-0000' },
    { type: 'textarea', name: 'message', label: 'Message', required: false, placeholder: 'Tell us about your needs' },
  ],
  seo: {
    title: 'Campaign Landing Page',
    description: 'Discover our amazing campaign',
    ogImage: '',
    canonicalUrl: '',
  },
};

export async function getLandingPage(workspaceId: string, userId: string, campaignId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: { landingPage: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (!campaign.landingPage) {
    const landingPage = await prisma.landingPage.create({
      data: {
        campaignId,
        hero: defaultLandingPage.hero,
        features: defaultLandingPage.features,
        testimonials: defaultLandingPage.testimonials,
        cta: defaultLandingPage.cta,
        leadForm: defaultLandingPage.leadForm,
        seo: defaultLandingPage.seo,
      },
    });
    return landingPage;
  }

  return campaign.landingPage;
}

export async function updateLandingPage(workspaceId: string, userId: string, campaignId: string, input: UpdateLandingPageInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !['ADMIN', 'MARKETER'].includes(membership.role)) {
    throw new AuthorizationError('Only admins and marketers can update landing pages');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: { landingPage: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (!campaign.landingPage) {
    throw new NotFoundError('Landing page');
  }

  const oldData = { ...campaign.landingPage };

  const updateData: Record<string, unknown> = {};
  if (input.hero !== undefined) updateData.hero = input.hero;
  if (input.features !== undefined) updateData.features = input.features;
  if (input.testimonials !== undefined) updateData.testimonials = input.testimonials;
  if (input.cta !== undefined) updateData.cta = input.cta;
  if (input.leadForm !== undefined) updateData.leadForm = input.leadForm;
  if (input.seo !== undefined) updateData.seo = input.seo;
  if (input.customCss !== undefined) updateData.customCss = input.customCss;
  if (input.isPublished !== undefined) {
    updateData.isPublished = input.isPublished;
    if (input.isPublished && !campaign.landingPage.isPublished) {
      updateData.publishedAt = new Date();
    }
  }

  const landingPage = await prisma.landingPage.update({
    where: { id: campaign.landingPage.id },
    data: updateData,
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'LandingPage',
    entityId: landingPage.id,
    action: input.isPublished && !campaign.landingPage.isPublished ? AuditActions.LANDING_PAGE_PUBLISHED : AuditActions.LANDING_PAGE_UPDATED,
    oldData,
    newData: updateData,
  });

  return landingPage;
}

export async function getPublicLandingPage(campaignSlug: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { slug: campaignSlug, status: 'PUBLISHED' },
    include: {
      landingPage: true,
      workspace: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  if (!campaign || !campaign.landingPage || !campaign.landingPage.isPublished) {
    throw new NotFoundError('Landing page');
  }

  return { campaign, landingPage: campaign.landingPage };
}

export async function getPublishedCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: { 
      status: 'PUBLISHED',
      landingPage: { isPublished: true }
    },
    select: { slug: true },
  });

  return campaigns;
}

export async function duplicateLandingPage(workspaceId: string, userId: string, campaignId: string, targetCampaignId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !['ADMIN', 'MARKETER'].includes(membership.role)) {
    throw new AuthorizationError('Only admins and marketers can duplicate landing pages');
  }

  const sourceCampaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: { landingPage: true },
  });

  if (!sourceCampaign || !sourceCampaign.landingPage) {
    throw new NotFoundError('Source landing page');
  }

  const targetCampaign = await prisma.campaign.findFirst({
    where: { id: targetCampaignId, workspaceId },
  });

  if (!targetCampaign) {
    throw new NotFoundError('Target campaign');
  }

  const existing = await prisma.landingPage.findUnique({
    where: { campaignId: targetCampaignId },
  });

  if (existing) {
    await prisma.landingPage.update({
      where: { id: existing.id },
      data: {
        hero: sourceCampaign.landingPage.hero,
        features: sourceCampaign.landingPage.features,
        testimonials: sourceCampaign.landingPage.testimonials,
        cta: sourceCampaign.landingPage.cta,
        leadForm: sourceCampaign.landingPage.leadForm,
        seo: sourceCampaign.landingPage.seo,
        customCss: sourceCampaign.landingPage.customCss,
        isPublished: false,
        publishedAt: null,
      },
    });

    return prisma.landingPage.findUnique({ where: { id: existing.id } });
  }

  return prisma.landingPage.create({
    data: {
      campaignId: targetCampaignId,
      hero: sourceCampaign.landingPage.hero,
      features: sourceCampaign.landingPage.features,
      testimonials: sourceCampaign.landingPage.testimonials,
      cta: sourceCampaign.landingPage.cta,
      leadForm: sourceCampaign.landingPage.leadForm,
      seo: sourceCampaign.landingPage.seo,
      customCss: sourceCampaign.landingPage.customCss,
      isPublished: false,
    },
  });
}