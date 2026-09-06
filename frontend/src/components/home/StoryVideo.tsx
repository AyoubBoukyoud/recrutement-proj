'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';

export type ConcreteQuality = '720' | '480';

interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
}

interface NavigatorWithNetwork extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

const VIDEO_SOURCES = {
  '720': '/assets/videos/landing/video_hero_720.webm',
  '480': '/assets/videos/landing/video_hero_480.webm',
  mp4Fallback: '/assets/videos/landing/video_hero.mp4',
} as const;

const POSTER = '/assets/images/landing/hero-poster-1600.webp';

/**
 * Choisit la résolution à charger : mode économie de données, qualité réseau
 * réelle (Network Information API), puis taille d'écran. Identique à l'ancien
 * fond vidéo du hero — c'est le seul morceau de cette logique qui reste utile
 * maintenant que la vidéo est une section à part.
 */
function resolveOptimalQuality(): ConcreteQuality {
  if (typeof window === 'undefined') return '720';

  const nav = navigator as NavigatorWithNetwork;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const prefersReducedData = window.matchMedia?.('(prefers-reduced-data: reduce)')?.matches;
  if (conn?.saveData || prefersReducedData) return '480';

  if (conn) {
    const { effectiveType, downlink, rtt } = conn;
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') return '480';
    if ((typeof downlink === 'number' && downlink < 2.5) || (typeof rtt === 'number' && rtt > 400)) return '480';
  }

  return window.innerWidth < 640 ? '480' : '720';
}

/**
 * Vidéo de présentation, dans sa propre section : rien ne se lance tout seul.
 * Tant que le visiteur n'a pas cliqué, seule l'affiche est chargée (`preload`
 * à `none`) — la vidéo ne coûte donc rien au chargement de la page, ce qui
 * était l'inconvénient principal de l'ancien fond vidéo plein écran.
 */
export function StoryVideo() {
  const content = useHomeContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [quality, setQuality] = useState<ConcreteQuality>('720');

  useEffect(() => {
    setQuality(resolveOptimalQuality());
  }, []);

  // La qualité n'est plus ajustée une fois la lecture lancée : un changement
  // de source en cours de lecture couperait le son et la position.
  const start = useCallback(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started) return;
    videoRef.current?.play().catch(() => {});
  }, [started]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-black shadow-floating">
      <div className="relative aspect-video w-full">
        {started ? (
          <video
            ref={videoRef}
            controls
            playsInline
            webkit-playsinline="true"
            preload="auto"
            poster={POSTER}
            aria-label={content.hero.mediaCaption}
            className="h-full w-full bg-black object-cover"
          >
            <source src={VIDEO_SOURCES[quality]} type="video/webm" />
            <source src={VIDEO_SOURCES.mp4Fallback} type="video/mp4" />
            {content.video.unsupported}
          </video>
        ) : (
          <button
            type="button"
            onClick={start}
            className="group absolute inset-0 h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <img
              src={POSTER}
              srcSet="/assets/images/landing/hero-poster-800.webp 800w, /assets/images/landing/hero-poster-1600.webp 1600w"
              sizes="(min-width: 1024px) 900px, 100vw"
              alt={content.video.posterAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary-dark shadow-floating transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                <span className="material-symbols-outlined text-4xl rtl:rotate-180">play_arrow</span>
              </span>
            </span>

            <span className="absolute inset-x-0 bottom-0 flex items-baseline gap-2 p-4 text-start sm:p-6">
              <span className="text-sm font-semibold text-white sm:text-base">
                {content.video.playLabel}
              </span>
              {/* Le titre de la vidéo passe à la trappe sous `sm` : sur 390px il
                  repassait sur trois lignes derrière le bouton de lecture. */}
              <span className="hidden text-sm text-white/70 sm:inline sm:text-base">
                — {content.hero.mediaCaption}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
