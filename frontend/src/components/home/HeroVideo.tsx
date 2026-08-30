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
 * Composant de lecture vidéo Hero avec Streaming Adaptatif Intelligent et Design Mobile Réactif :
 * - Détecte la vitesse réseau (4G/3G/débit/latence) et l'appareil (Mobile vs Desktop).
 * - Bascule automatiquement entre 1080p, 720p et 480p WebM (+ fallback MP4).
 * - Auto-downgrade transparent en direct en cas d'interruption/buffering réseau.
 * - Cadrage vidéo responsive et commandes tactiles optimisées pour smartphone.
 */
export function HeroVideo() {
  const content = useHomeContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('auto');
  const [effectiveQuality, setEffectiveQuality] = useState<ConcreteQuality>('720');
  const [connectionLabel, setConnectionLabel] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
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
      label = 'Éco';
    } else if (conn?.effectiveType) {
      const type = conn.effectiveType.toUpperCase();
      const speed = conn.downlink ? ` · ${conn.downlink}M` : '';
      label = `${type}${speed}`;
    } else {
      label = isMobile ? 'Mobile' : 'Fibre/Wifi';
    }
    setConnectionLabel(label);

    if (selectedQuality === 'auto') {
      setEffectiveQuality(optimal);
    } else {
      setEffectiveQuality(selectedQuality);
    }
  }, [selectedQuality]);

  useEffect(() => {
    computeAndApplyQuality();

    const nav = navigator as NavigatorWithNetwork;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const handleResize = () => {
      if (selectedQuality === 'auto') {
        computeAndApplyQuality();
      }
    };

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
  }, [selectedQuality, computeAndApplyQuality]);

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

      if (wasPlaying || isPlaying) {
        video.play().catch(() => setIsPlaying(false));
      }
    } else if (video.paused && !isPlaying) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    // Événements de suivi
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Détection de buffering/stalling en mode 'auto' pour rétrograder automatiquement
    const handleWaitingOrStalled = () => {
      if (selectedQuality !== 'auto') return;

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

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaitingOrStalled);
    video.addEventListener('stalled', handleWaitingOrStalled);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaitingOrStalled);
      video.removeEventListener('stalled', handleWaitingOrStalled);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [effectiveQuality, selectedQuality]);

  const showNotification = (msg: string) => {
    setAdaptiveNotice(msg);
    setTimeout(() => {
      setAdaptiveNotice((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * (video.duration || 0);
  };

  const handleSelectQuality = (quality: VideoQuality) => {
    setSelectedQuality(quality);
    if (quality === 'auto') {
      const optimal = resolveOptimalQuality();
      setEffectiveQuality(optimal);
      showNotification(`Qualité Automatique activée (${optimal}p)`);
    } else {
      setEffectiveQuality(quality);
      showNotification(`Qualité fixée à ${quality}p`);
    }
    setShowQualityMenu(false);
  };

  const posterSrc = isMobileDevice
    ? '/assets/images/landing/hero-poster-800.webp'
    : '/assets/images/landing/hero-poster-1600.webp';

  return (
    <div ref={containerRef} className="group/video relative h-full w-full overflow-hidden bg-black select-none touch-manipulation">
      {/* Balise vidéo principale avec cadrage adapté mobile & desktop */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        poster={posterSrc}
        aria-label={content.hero.mediaCaption}
        onClick={togglePlay}
        className="h-full w-full cursor-pointer object-cover object-center"
      >
        <source src={VIDEO_SOURCES[effectiveQuality]} type="video/webm" />
        <source src={VIDEO_SOURCES.mp4Fallback} type="video/mp4" />
      </video>

      {/* Dégradé cinématique supérieur & inférieur pour un contraste optimal */}
      <div 
        onClick={togglePlay}
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/60" 
      />

      {/* Toast d'information lors d'une adaptation automatique de qualité */}
      {adaptiveNotice && (
        <div className="animate-in fade-in slide-in-from-top-4 pointer-events-none absolute top-16 sm:top-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-400/40 bg-black/85 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl transition-all duration-300 max-w-[90vw] text-center">
          <div className="flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-sm sm:text-base text-emerald-400">bolt</span>
            <span className="truncate">{adaptiveNotice}</span>
          </div>
        </div>
      )}

      {/* Header Badges : Positionnés sous l'en-tête (top-3.5 sur mobile, top-24 sur desktop fixed) */}
      <div className="pointer-events-none absolute start-3.5 top-3.5 sm:start-8 sm:top-24 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/65 px-3 py-1 text-white shadow-xl backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-black tracking-wide text-white sm:text-sm">
            🇲🇦 Maroc <span className="text-emerald-400">➔</span> 🇩🇪 Allemagne
          </span>
          <span className="hidden text-xs font-semibold text-white/80 md:inline">
            · Immersion vidéo
          </span>
        </div>

        {/* Badge Stream Adaptatif en direct */}
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white/95 backdrop-blur-md">
          <span className="material-symbols-outlined text-xs sm:text-sm text-emerald-400">speed</span>
          <span className="rounded bg-emerald-500/25 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-extrabold text-emerald-300 border border-emerald-400/30">
            {effectiveQuality}p {selectedQuality === 'auto' ? '(Auto)' : ''}
          </span>
          {connectionLabel && (
            <span className="text-[9px] sm:text-[10px] text-white/60 hidden xs:inline">
              · {connectionLabel}
            </span>
          )}
        </div>
      </div>

      {/* Bouton de lecture central (affiché quand la vidéo est en pause) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Lire la vidéo"
          className="absolute inset-0 z-20 m-auto flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-white/40 bg-emerald-600/90 text-white shadow-[0_0_50px_rgba(16,185,129,0.6)] backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-emerald-500 focus:outline-none"
        >
          <span className="material-symbols-outlined ps-1 text-2xl sm:text-4xl">play_arrow</span>
        </button>
      )}

      {/* Barre de contrôles vidéo en bas (dégagée au-dessus de la transition de feuille montante) */}
      <div className="absolute inset-x-0 bottom-8 sm:bottom-12 z-20 flex flex-col justify-end px-3.5 sm:px-10 pb-[env(safe-area-inset-bottom)]">
        {/* Barre de progression interactive */}
        <div 
          onClick={handleSeek}
          className="group/progress relative mb-2.5 sm:mb-3 h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/30 backdrop-blur-sm transition-all duration-200 hover:h-2.5"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Boutons d'action : Play, Mute, Sélecteur de qualité, Plein écran */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>

            {/* Menu Sélecteur de Résolution (Auto / 1080p / 720p / 480p) */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu((prev) => !prev)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/25 bg-black/60 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
                aria-label="Sélectionner la qualité vidéo"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">tune</span>
                <span className="text-[11px] sm:text-xs">{selectedQuality === 'auto' ? `Auto (${effectiveQuality}p)` : `${selectedQuality}p`}</span>
                <span className="material-symbols-outlined text-xs">expand_less</span>
              </button>

              {/* Menu Popover */}
              {showQualityMenu && (
                <div className="absolute bottom-full start-0 mb-2 w-52 sm:w-56 max-w-[calc(100vw-32px)] rounded-2xl border border-white/25 bg-black/95 p-2 shadow-2xl backdrop-blur-2xl z-50">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/50 border-b border-white/10 mb-1">
                    Qualité & Rapidité
                  </div>
                  
                  {/* Option Automatique */}
                  <button
                    onClick={() => handleSelectQuality('auto')}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-start ${
                      selectedQuality === 'auto'
                        ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-emerald-400">bolt</span>
                        <span>Auto (Recommandé)</span>
                      </div>
                      <span className="text-[10px] text-white/50 block ps-4">
                        S&apos;adapte au réseau &amp; écran
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/15 px-1.5 py-0.5 rounded">
                      {effectiveQuality}p
                    </span>
                  </button>

                  {/* Option 1080p */}
                  <button
                    onClick={() => handleSelectQuality('1080')}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-start ${
                      selectedQuality === '1080'
                        ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">1080p Full HD</div>
                      <span className="text-[10px] text-white/50 block">PC · Connexion Fibre</span>
                    </div>
                    <span className="text-[10px] text-white/40">10 Mo</span>
                  </button>

                  {/* Option 720p */}
                  <button
                    onClick={() => handleSelectQuality('720')}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-start ${
                      selectedQuality === '720'
                        ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">720p HD</div>
                      <span className="text-[10px] text-white/50 block">Équilibré &amp; fluide</span>
                    </div>
                    <span className="text-[10px] text-white/40">10 Mo</span>
                  </button>

                  {/* Option 480p */}
                  <button
                    onClick={() => handleSelectQuality('480')}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all text-start ${
                      selectedQuality === '480'
                        ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">480p Économique</div>
                      <span className="text-[10px] text-white/50 block">Mobile · Débit limité</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">4.8 Mo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              aria-label="Plein écran"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">fullscreen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
