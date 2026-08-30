'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';

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
 * Composant de lecture vidéo Hero, purement décoratif/ambiant (autoplay en
 * boucle, muet, sans aucun contrôle visible) avec Streaming Adaptatif
 * Intelligent conservé :
 * - Détecte la vitesse réseau (4G/3G/débit/latence) et l'appareil (Mobile vs Desktop).
 * - Bascule automatiquement entre 1080p, 720p et 480p WebM (+ fallback MP4).
 * - Auto-downgrade transparent en direct en cas d'interruption/buffering réseau.
 */
export function HeroVideo() {
  const content = useHomeContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [effectiveQuality, setEffectiveQuality] = useState<ConcreteQuality>('720');
  const [connectionLabel, setConnectionLabel] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [adaptiveNotice, setAdaptiveNotice] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Initialisation et détection automatique
  const computeAndApplyQuality = useCallback(() => {
    const optimal = resolveOptimalQuality();
    const nav = navigator as NavigatorWithNetwork;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const isMobile = window.innerWidth < 640;
    setIsMobileDevice(isMobile);

    let label = '';
    if (conn?.saveData) {
      label = 'Éco données';
    } else if (conn?.effectiveType) {
      const type = conn.effectiveType.toUpperCase();
      const speed = conn.downlink ? ` · ${conn.downlink}M` : '';
      label = `${type}${speed}`;
    } else {
      label = isMobile ? 'Mobile' : 'Haut débit';
    }
    setConnectionLabel(label);
    setEffectiveQuality(optimal);
  }, []);

  useEffect(() => {
    computeAndApplyQuality();

    const nav = navigator as NavigatorWithNetwork;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    window.addEventListener('resize', computeAndApplyQuality, { passive: true });
    if (conn) {
      conn.addEventListener('change', computeAndApplyQuality);
    }

    return () => {
      window.removeEventListener('resize', computeAndApplyQuality);
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

    // Vérifier si la source actuelle correspond déjà à la qualité désirée
    const isCurrentSrc = video.currentSrc?.endsWith(targetSrc) || video.src?.endsWith(targetSrc);

    if (!isCurrentSrc) {
      // Si la vidéo a déjà démarré, bascule transparente en conservant le curseur
      video.src = targetSrc;
      video.load();

      if (currentPos > 0) {
        video.currentTime = currentPos;
      }

      video.play().catch(() => setIsPlaying(false));
    } else if (video.paused && !isPlaying) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Détection de buffering/stalling pour rétrograder automatiquement
    const handleWaitingOrStalled = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        if (effectiveQuality === '1080') {
          setEffectiveQuality('720');
          showNotification('Ajustement automatique : 720p pour éviter les coupures');
        } else if (effectiveQuality === '720') {
          setEffectiveQuality('480');
          showNotification('Ajustement automatique : 480p (Fluidité maximale)');
        }
      }, 1200);
    };

    const handlePlaying = () => {
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaitingOrStalled);
    video.addEventListener('stalled', handleWaitingOrStalled);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaitingOrStalled);
      video.removeEventListener('stalled', handleWaitingOrStalled);
      video.removeEventListener('playing', handlePlaying);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuality]);

  const showNotification = (msg: string) => {
    setAdaptiveNotice(msg);
    setTimeout(() => {
      setAdaptiveNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const posterSrc = isMobileDevice
    ? '/assets/images/landing/hero-poster-800.webp'
    : '/assets/images/landing/hero-poster-1600.webp';

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none">
      {/* Balise vidéo principale : autoplay muet en boucle, aucun contrôle visible. */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        aria-label={content.hero.mediaCaption}
        className="pointer-events-none h-full w-full object-contain lg:object-cover"
      >
        <source src={VIDEO_SOURCES[effectiveQuality]} type="video/webm" />
        <source src={VIDEO_SOURCES.mp4Fallback} type="video/mp4" />
      </video>

      {/* Dégradé cinématique supérieur & inférieur pour un contraste optimal */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50" />

      {/* Toast d'information lors d'une adaptation automatique de qualité */}
      {adaptiveNotice && (
        <div className="animate-in fade-in slide-in-from-top-4 pointer-events-none absolute top-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-black/85 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-400">bolt</span>
            <span>{adaptiveNotice}</span>
          </div>
        </div>
      )}

      {/* Header Badges : Parcours Maroc-Allemagne + Badge Flux Adaptatif */}
      <div className="pointer-events-none absolute start-4 top-4 z-20 flex flex-wrap items-center gap-2 sm:start-8 sm:top-6">
        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/65 px-3.5 py-1.5 text-white shadow-xl backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-black tracking-wide text-white sm:text-sm">
            🇲🇦 Maroc <span className="text-emerald-400">➔</span> 🇩🇪 Allemagne
          </span>
          <span className="hidden text-xs font-semibold text-white/80 md:inline">
            · Immersion vidéo
          </span>
        </div>

        {/* Badge Stream Adaptatif en direct */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white/95 backdrop-blur-md">
          <span className="material-symbols-outlined text-sm text-emerald-400">speed</span>
          <span className="hidden sm:inline">Stream</span>
          <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-400/30">
            {effectiveQuality}p (Auto)
          </span>
          {connectionLabel && (
            <span className="text-[10px] text-white/60 hidden sm:inline">
              · {connectionLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
