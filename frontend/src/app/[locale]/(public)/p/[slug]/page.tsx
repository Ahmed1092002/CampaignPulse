import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicLandingPage } from '@/components/landing-page/PublicLandingPage';
import { api } from '@/lib/api';

interface PageProps {
  params: { slug: string; locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const data = await api.landingPage.getPublic(params.slug);
    const campaign = data.data?.campaign;
    const landingPage = data.data?.landingPage;
    const seo = landingPage?.seo || {};

    return {
      title: seo.title || campaign?.name || 'CampaignPulse',
      description: seo.description || campaign?.description || 'Check out this campaign',
      openGraph: {
        title: seo.title || campaign?.name || 'CampaignPulse',
        description: seo.description || campaign?.description || 'Check out this campaign',
        type: 'website',
        locale: params.locale,
        url: `/p/${params.slug}`,
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
        canonical: seo.canonicalUrl || `/p/${params.slug}`,
      },
      robots: 'index, follow',
    };
  } catch {
    return {
      title: 'CampaignPulse',
      robots: 'noindex, nofollow',
    };
  }
}

export const revalidate = 60;

export default async function PublicLandingPageRoute({ params }: PageProps) {
  try {
    const data = await api.landingPage.getPublic(params.slug);
    const campaign = data.data?.campaign;
    const landingPage = data.data?.landingPage;
    const workspace = data.data?.workspace;

    if (!campaign || !landingPage) {
      notFound();
    }

    return <PublicLandingPage campaign={campaign} landingPage={landingPage} workspace={workspace} locale={params.locale} searchParams={params} />;
  } catch {
    notFound();
  }
}