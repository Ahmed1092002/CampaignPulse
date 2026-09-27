import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export function useTracking() {
  const trackEvent = useCallback(async (event: {
    campaignId: string;
    type: 'PAGE_VIEW' | 'CTA_CLICK' | 'FORM_START' | 'FORM_SUBMIT';
    sessionId: string;
    pageUrl?: string;
    elementId?: string;
    elementType?: string;
    metadata?: Record<string, unknown>;
    leadId?: string;
  }) => {
    try {
      await api.tracking.trackEvent('workspace', event);
    } catch (error) {
      console.error('Tracking failed:', error);
    }
  }, []);

  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('cp_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 16);
      sessionStorage.setItem('cp_session_id', sessionId);
    }
    return sessionId;
  }, []);

  return { trackEvent, getSessionId };
}