'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';

export type VideoQuality = 'auto' | '1080' | '720' | '480';
export type ConcreteQuality = '1080' | '720' | '480';

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
  deviceMemory?: number;
}

const VIDEO_SOURCES = {
  '1080': '/assets/videos/landing/video_hero_1080.webm',
  '720': '/assets/videos/landing/video_hero_720.webm',
  '480': '/assets/videos/landing/video_hero_480.webm',
  mp4Fallback: '/assets/videos/landing/video_hero.mp4',
} as const;

/**
 * Détermine intelligemment la résolution optimale en combinant :
 * 1. Le mode Économie de données (Data-Saver / prefers-reduced-data).
 * 2. La rapidité réseau réelle (Network Information API : 4G/3G/2G, downlink en Mbps, RTT).
 * 3. Le type d'appareil et taille d'écran (Mobile < 640px, Tablette 640-1024px, Desktop >= 1024px).
 * 4. La puissance matérielle (deviceMemory) si disponible.
 */
function resolveOptimalQuality(): ConcreteQuality {
  if (typeof window === 'undefined') return '720';

  const nav = navigator as NavigatorWithNetwork;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const width = window.innerWidth;
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // 1. Économiseur de données activé par l'utilisateur
  const prefersReducedData = window.matchMedia?.('(prefers-reduced-data: reduce)')?.matches;
  if (conn?.saveData || prefersReducedData) {
    return '480';
  }

  // 2. Détection de la qualité réseau
  if (conn) {
    const { effectiveType, downlink, rtt } = conn;

    // Réseau 2G ou 3G faible -> 480p pour démarrage immédiat
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
      return '480';
    }

    // Débit mesuré faible (< 2.5 Mbps) ou latence élevée (> 400ms)
    if ((typeof downlink === 'number' && downlink < 2.5) || (typeof rtt === 'number' && rtt > 400)) {
      return '480';
    }

    // Débit moyen (2.5 à 6 Mbps)
    if (typeof downlink === 'number' && downlink < 6) {
      return isMobile ? '480' : '720';
    }
  }

  // 3. Choix basé sur l'appareil et l'écran
  if (isMobile) {
    // Sur smartphone : 480p WebM (4.8 Mo) est ultra net sur écran réduit,
    // démarre 2.5x plus vite et préserve la batterie et le forfait
    return '480';
  }

  if (isTablet) {
    return '720';
  }

  // 4. Sur grand écran Desktop
  // Si mémoire RAM faible (<= 4Go), privilégier 720p pour éviter les saccades GPU
  if (nav.deviceMemory && nav.deviceMemory <= 4) {
    return '720';
  }

  return isDesktop ? '1080' : '720';
}

/**
 * Vidéo Hero en pur arrière-plan : aucune commande visible (play/pause, son,
 * qualité, plein écran, progression). La résolution s'adapte silencieusement
 * au réseau/appareil et se dégrade automatiquement en cas de buffering.
 */
export function HeroVideo() {
  const content = useHomeContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [effectiveQuality, setEffectiveQuality] = useState<ConcreteQuality>('720');

  // Initialisation et détection automatique
  const computeAndApplyQuality = useCallback(() => {
    setEffectiveQuality(resolveOptimalQuality());
  }, []);

  useEffect(() => {
    computeAndApplyQuality();

    const nav = navigator as NavigatorWithNetwork;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const handleResize = () => computeAndApplyQuality();

    window.addEventListener('resize', handleResize, { passive: true });
    if (conn) {
      conn.addEventListener('change', computeAndApplyQuality);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (conn) {
        conn.removeEventListener('change', computeAndApplyQuality);
      }
    };
  }, [computeAndApplyQuality]);

  // Synchronisation de la source vidéo et maintien du currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    const targetSrc = VIDEO_SOURCES[effectiveQuality];
    const currentPos = video.currentTime || 0;
    const wasPlaying = !video.paused;

    // Vérifier si la source actuelle correspond déjà à la qualité désirée
    const isCurrentSrc = video.currentSrc?.endsWith(targetSrc) || video.src?.endsWith(targetSrc);

    if (!isCurrentSrc) {
      // Si la vidéo a déjà démarré, bascule transparente en conservant le curseur
      video.src = targetSrc;
      video.load();

      if (currentPos > 0) {
        video.currentTime = currentPos;
      }

      if (wasPlaying) {
        video.play().catch(() => {});
      }
    } else if (video.paused) {
      video.play().catch(() => {});
    }

    // Détection de buffering/stalling pour rétrograder automatiquement
    const handleWaitingOrStalled = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        if (effectiveQuality === '1080') {
          setEffectiveQuality('720');
        } else if (effectiveQuality === '720') {
          setEffectiveQuality('480');
        }
      }, 1200);
    };

    const handlePlaying = () => {
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
    };

    video.addEventListener('waiting', handleWaitingOrStalled);
    video.addEventListener('stalled', handleWaitingOrStalled);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('waiting', handleWaitingOrStalled);
      video.removeEventListener('stalled', handleWaitingOrStalled);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [effectiveQuality]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Balise vidéo principale en pur arrière-plan, sans aucune commande */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        aria-label={content.hero.mediaCaption}
        className="pointer-events-none h-full w-full object-cover object-center"
      >
        <source src={VIDEO_SOURCES[effectiveQuality]} type="video/webm" />
        <source src={VIDEO_SOURCES.mp4Fallback} type="video/mp4" />
      </video>

      {/* Dégradé cinématique supérieur & inférieur pour un contraste optimal */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/60" />

      {/* Guide de défilement mobile discret au bas de la vidéo */}
      <a
        href="#main-content"
        className="sm:hidden absolute bottom-1.5 start-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-3 py-0.5 text-[10px] font-bold text-white/90 shadow-lg backdrop-blur-md transition-all active:scale-95 animate-pulse"
        aria-label={content.hero.scrollCue}
      >
        <span>{content.hero.scrollCue}</span>
        <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
      </a>
    </div>
  );
}
