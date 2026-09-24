import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicLandingPage } from '@/components/landing-page/PublicLandingPage';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  try {
    const response = await api.landingPage.getPublishedCampaigns();
    return response.data?.data?.map((c: any) => ({ slug: c.slug })) || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  try {
    const data = await api.landingPage.getPublic(resolvedParams.slug);
    const campaign = data.data?.campaign;
    const landingPage = data.data?.landingPage;
    const seo = landingPage?.seo || {};

    const utmParams = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (value && !Array.isArray(value)) utmParams.set(key, value);
    });

    return {
      title: seo.title || campaign?.name || 'CampaignPulse',
      description: seo.description || campaign?.description || 'Check out this campaign',
      openGraph: {
        title: seo.title || campaign?.name || 'CampaignPulse',
        description: seo.description || campaign?.description || 'Check out this campaign',
        type: 'website',
        locale: 'en_US',
        url: `/p/${resolvedParams.slug}${utmParams.toString() ? '?' + utmParams.toString() : ''}`,
        siteName: 'CampaignPulse',
        images: seo.ogImage ? [{ url: seo.ogImage }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.title || campaign?.name || 'CampaignPulse',
        description: seo.description || campaign?.description || 'Check out this campaign',
        images: seo.ogImage ? [seo.ogImage] : [],
      },
      alternates: {
        canonical: seo.canonicalUrl || `/p/${resolvedParams.slug}`,
      },
      robots: 'index, follow',
      other: {
        'utm_source': resolvedSearchParams.utm_source as string || '',
        'utm_medium': resolvedSearchParams.utm_medium as string || '',
        'utm_campaign': resolvedSearchParams.utm_campaign as string || '',
      },
    };
  } catch {
    return {
      title: 'CampaignPulse',
      robots: 'noindex, nofollow',
    };
  }
}

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function PublicLandingPageRoute({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  try {
    const data = await api.landingPage.getPublic(resolvedParams.slug);
    const campaign = data.data?.campaign;
    const landingPage = data.data?.landingPage;
    const workspace = data.data?.workspace;

    if (!campaign || !landingPage || !landingPage.isPublished) {
      notFound();
    }

    return <PublicLandingPage campaign={campaign} landingPage={landingPage} workspace={workspace} locale="en" searchParams={resolvedSearchParams} />;
  } catch {
    notFound();
  }
}