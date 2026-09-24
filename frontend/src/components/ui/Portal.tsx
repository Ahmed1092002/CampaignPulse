'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!container && typeof document !== 'undefined') {
      portalRef.current = document.createElement('div');
      document.body.appendChild(portalRef.current);
    }
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
      }
    };
  }, [container]);

  if (!mounted) return null;

  const target = container || portalRef.current;
  if (!target) return null;

  return createPortal(children, target);
}