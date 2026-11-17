'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isPublicAnalyticsPage } from '@/lib/analytics';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R08YBZ2XZS';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __amudAnalyticsConfigured?: boolean;
  }
}

/**
 * Google's documented opt-out switch: while `window['ga-disable-<ID>']` is true,
 * an already-loaded gtag.js sends nothing, automatic events included (scroll,
 * outbound clicks…), which replacing `window.gtag` alone cannot stop.
 */
function setCollectionDisabled(disabled: boolean) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const previousPage = useRef<string | null>(null);
  const isTrackable = isPublicAnalyticsPage(pathname);

  useEffect(() => {
    if (!isTrackable) {
      // An already-loaded gtag.js must stop collecting on private app routes.
      setCollectionDisabled(true);
      previousPage.current = null;
      return;
    }

    setCollectionDisabled(false);
    window.dataLayer = window.dataLayer || [];
    // gtag.js only executes commands pushed as an `arguments` object. A rest
    // parameter (`(...args) => dataLayer.push(args)`) pushes a plain array,
    // which it ignores: no hit would ever be sent.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

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
  }, [isTrackable, pathname]);

  if (!isTrackable) return null;

  return (
    <Script
      id="amud-google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
  );
}
