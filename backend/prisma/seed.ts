import { PrismaClient, UserRole, CampaignStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@campaignpulse.com' },
    update: {},
    create: {
      email: 'admin@campaignpulse.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      locale: 'en',
    },
  });

  const marketerUser = await prisma.user.upsert({
    where: { email: 'marketer@campaignpulse.com' },
    update: {},
    create: {
      email: 'marketer@campaignpulse.com',
      passwordHash,
      firstName: 'Marketer',
      lastName: 'User',
      locale: 'en',
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@campaignpulse.com' },
    update: {},
    create: {
      email: 'viewer@campaignpulse.com',
      passwordHash,
      firstName: 'Viewer',
      lastName: 'User',
      locale: 'en',
    },
  });

  console.log('✅ Created demo users');

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      description: 'A demo workspace for testing CampaignPulse',
      settings: {
        darkMode: false,
        emailNotifications: true,
        leadNotifications: true,
        statusChangeNotifications: true,
        dailySummary: false,
        weeklyReport: false,
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
      },
    },
  });

  console.log('✅ Created demo workspace');

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: adminUser.id, workspaceId: workspace.id } },
    update: { role: UserRole.ADMIN },
    create: { userId: adminUser.id, workspaceId: workspace.id, role: UserRole.ADMIN },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: marketerUser.id, workspaceId: workspace.id } },
    update: { role: UserRole.MARKETER },
    create: { userId: marketerUser.id, workspaceId: workspace.id, role: UserRole.MARKETER },
  });

  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: viewerUser.id, workspaceId: workspace.id } },
    update: { role: UserRole.VIEWER },
    create: { userId: viewerUser.id, workspaceId: workspace.id, role: UserRole.VIEWER },
  });

  console.log('✅ Added members to workspace');

  const campaign1 = await prisma.campaign.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: 'summer-sale-2024' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Summer Sale 2024',
      slug: 'summer-sale-2024',
      description: 'Our biggest summer sale campaign with up to 50% off',
      goal: 'Generate 1000 qualified leads',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      budget: 50000,
      channels: ['facebook', 'instagram', 'google', 'email'],
      status: CampaignStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: 'product-launch' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Product Launch Campaign',
      slug: 'product-launch',
      description: 'Launch campaign for our new product line',
      goal: 'Get 500 early signups',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-10-31'),
      budget: 25000,
      channels: ['facebook', 'linkedin', 'google'],
      status: CampaignStatus.DRAFT,
    },
  });

  console.log('✅ Created demo campaigns');

  const defaultLandingPage = {
    hero: {
      headline: 'Welcome to Our Campaign',
      subheadline: 'Discover amazing features and benefits tailored for you',
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
      subheadline: 'Join thousands of satisfied customers today',
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

  await prisma.landingPage.upsert({
    where: { campaignId: campaign1.id },
    update: {},
    create: {
      campaignId: campaign1.id,
      ...defaultLandingPage,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await prisma.landingPage.upsert({
    where: { campaignId: campaign2.id },
    update: {},
    create: {
      campaignId: campaign2.id,
      ...defaultLandingPage,
      isPublished: false,
    },
  });

  console.log('✅ Created landing pages');

  const channels = [
    { channel: 'facebook', name: 'Facebook', utmSource: 'facebook', utmMedium: 'social', utmCampaign: campaign1.slug },
    { channel: 'instagram', name: 'Instagram', utmSource: 'instagram', utmMedium: 'social', utmCampaign: campaign1.slug },
    { channel: 'google', name: 'Google Ads', utmSource: 'google', utmMedium: 'cpc', utmCampaign: campaign1.slug },
    { channel: 'direct', name: 'Direct Traffic', utmSource: 'direct', utmMedium: 'direct', utmCampaign: campaign1.slug },
  ];

  for (const ch of channels) {
    await prisma.campaignSource.upsert({
      where: { campaignId_channel: { campaignId: campaign1.id, channel: ch.channel } },
      update: {},
      create: {
        campaignId: campaign1.id,
        ...ch,
      },
    });
  }

  console.log('✅ Created UTM sources');

  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];
  const sources = ['facebook/social', 'instagram/social', 'google/cpc', 'direct/direct'];

  for (let i = 0; i < 20; i++) {
    await prisma.lead.create({
      data: {
        campaignId: campaign1.id,
        workspaceId: workspace.id,
        firstName: `Lead${i + 1}`,
        lastName: `User${i + 1}`,
        email: `lead${i + 1}@example.com`,
        phone: `+1-555-${String(i).padStart(4, '0')}`,
        status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)] as any,
        utmSource: sources[Math.floor(Math.random() * sources.length)].split('/')[0],
        utmMedium: sources[Math.floor(Math.random() * sources.length)].split('/')[1],
        utmCampaign: campaign1.slug,
        customFields: { company: `Company ${i + 1}`, interest: 'Product Demo' },
      });
    }

  console.log('✅ Created demo leads');

  const eventTypes = ['PAGE_VIEW', 'CTA_CLICK', 'FORM_START', 'FORM_SUBMIT'];
  const sessionIds = Array.from({ length: 50 }, () => Math.random().toString(36).substr(2, 16));

  for (let i = 0; i < 200; i++) {
    await prisma.trackingEvent.create({
      data: {
        campaignId: campaign1.id,
        workspaceId: workspace.id,
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
        sessionId: sessionIds[Math.floor(Math.random() * sessionIds.length)],
        pageUrl: `https://campaignpulse.com/p/${campaign1.slug}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Created demo tracking events');

  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: adminUser.id,
        entityType: 'Workspace',
        entityId: workspace.id,
        action: 'WORKSPACE_CREATED',
        newData: { name: workspace.name, slug: workspace.slug },
      },
      {
        workspaceId: workspace.id,
        userId: adminUser.id,
        entityType: 'Campaign',
        entityId: campaign1.id,
        action: 'CAMPAIGN_CREATED',
        newData: { name: campaign1.name, slug: campaign1.slug },
      },
      {
        workspaceId: workspace.id,
        userId: adminUser.id,
        entityType: 'Campaign',
        entityId: campaign1.id,
        action: 'CAMPAIGN_PUBLISHED',
        newData: { status: 'PUBLISHED' },
      },
    ],
  });

  console.log('✅ Created audit logs');

  console.log('🎉 Seed completed successfully!');
  console.log(`
Demo Accounts:
- Admin: admin@campaignpulse.com / password123
- Marketer: marketer@campaignpulse.com / password123
- Viewer: viewer@campaignpulse.com / password123

Workspace: demo-workspace
Campaigns: summer-sale-2024 (published), product-launch (draft)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });