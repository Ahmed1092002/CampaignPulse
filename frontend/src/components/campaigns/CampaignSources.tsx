'use client';

import { useQuery } from '@tanstack/react_query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';
import { QrCode, ExternalLink, Copy, Download, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CampaignSourcesProps {
  campaignId: string;
}

export function CampaignSources({ campaignId }: CampaignSourcesProps) {
  const { workspaceId } = useAuthStore();
  const t = useTranslations('campaigns');
  const [showQr, setShowQr] = useState<string | null>(null);

  const { data: sourcesData, isLoading, refetch } = useQuery({
    queryKey: ['campaign-sources', workspaceId, campaignId],
    queryFn: () => api.lead.getSources(workspaceId!, campaignId),
    enabled: !!workspaceId && !!campaignId,
  });

  const createSourcesMutation = useMutation({
    mutationFn: () => api.lead.createSources(workspaceId!, campaignId),
    onSuccess: () => {
      refetch();
      toast.success(t('sourcesCreated'));
    },
    onError: () => {
      toast.error(t('error'));
    },
  });

  const sources = sourcesData?.data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('sources')}</CardTitle>
        <Button onClick={() => createSourcesMutation.mutate()} disabled={createSourcesMutation.isPending}>
          {createSourcesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('createSources') || 'Generate UTM Sources'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p>No UTM sources generated yet. Click "Generate UTM Sources" to create tracking links for Facebook, Instagram, Google, and Direct traffic.</p>
          </div>
        ) : (
          <div className="divide-y">
            {sources.map((source: any) => (
              <div key={source.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{source.name}</p>
                        <Badge variant="secondary" className="text-xs">{source.channel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        utm_source={source.utmSource}&utm_medium={source.utmMedium}&utm_campaign={source.utmCampaign}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(source.clicks)}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-accent transition-colors" aria-label="More options">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{source.name}</DropdownMenuLabel>
                        {source.qrCodeUrl && (
                          <DropdownMenuItem
                            onClick={() => setShowQr(source.qrCodeUrl)}
                            icon={<QrCode className="h-4 w-4" />}
                          >
                            View QR Code
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(source.shortUrl)}
                          icon={<Copy className="h-4 w-4" />}
                        >
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          icon={<ExternalLink className="h-4 w-4" />}
                        >
                          <a href={source.shortUrl} target="_blank" rel="noopener noreferrer">
                            Open Link
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {}}
                          icon={<Download className="h-4 w-4" />}
                        >
                          Download QR
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useMutation } from '@tanstack/react_query';