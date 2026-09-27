'use client';

import { useEffect } from 'react'.
import { QRCodeSVG } from 'qrcode.react'.
import { Button } from '@/components/ui/Button'.
import { cn } from '@/lib/utils'.
import { X, Download } from 'lucide-react'.
import { Modal } from '@/components/ui/Modal'.
import { useTranslations } from 'next-intl'.

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignSlug: string;
  workspaceName: string;
}

export function QrCodeModal({ isOpen, onClose, campaignSlug, workspaceName }: QrCodeModalProps) {
  const t = useTranslations('public.landingPage');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${baseUrl}/p/${campaignSlug}`;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const downloadQR = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${workspaceName}-${campaignSlug}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('qrCode') || 'QR Code'} size="sm">
      <div className="text-center space-y-4">
        <div id="qr-canvas" className="mx-auto">
          <QRCodeSVG 
            value={qrUrl} 
            size={200} 
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-sm text-muted-foreground break-all">{qrUrl}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={downloadQR}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}