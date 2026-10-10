'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, isPublicAnalyticsPage } from '@/lib/analytics';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R08YBZ2XZS';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __amudAnalyticsConfigured?: boolean;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const previousPage = useRef<string | null>(null);
  const isTrackable = isPublicAnalyticsPage(pathname);

  useEffect(() => {
    const readChoice = () => {
      try {
        const choice = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
        setConsent(choice === 'granted' || choice === 'denied' ? choice : 'unknown');
      } catch {
        setConsent('unknown');
      }
    };

    readChoice();
    const handleChoice = (event: Event) => {
      const choice = (event as CustomEvent<'granted' | 'denied'>).detail;
      if (choice === 'granted' || choice === 'denied') setConsent(choice);
      else readChoice();
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleChoice);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleChoice);
  }, []);

  useEffect(() => {
    if (!isTrackable || consent !== 'granted') {
      // gtag.js may stay loaded after a visitor withdraws consent or enters a
      // private app route. Drop future automatic events until tracking is
      // explicitly enabled again.
      if (window.__amudAnalyticsConfigured) window.gtag = () => {};
      previousPage.current = null;
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);

    if (!window.__amudAnalyticsConfigured) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
      });
      window.__amudAnalyticsConfigured = true;
    }

    if (previousPage.current !== pathname) {
      previousPage.current = pathname;
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: `${window.location.origin}${pathname}`,
      });
    }
  }, [consent, isTrackable, pathname]);

  if (!isTrackable || consent !== 'granted') return null;

  return (
    <Script
      id="amud-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  );
}
