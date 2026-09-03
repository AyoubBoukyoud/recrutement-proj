'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHomeContent } from '@/lib/useLocalizedContent';

<<<<<<< HEAD
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
  deviceMemory?: number;
}

const PLAYBACK_RATE = 0.5;

const VIDEO_SOURCES = {
  '720': '/assets/videos/landing/video_hero_720.webm',
  '480': '/assets/videos/landing/video_hero_480.webm',
  mp4Fallback: '/assets/videos/landing/video_hero.mp4',
} as const;
=======
interface ScrollyVideoInstance {
  video: HTMLVideoElement;
  transitioningRaf?: number;
  setVideoPercentage: (
    percentage: number,
    options?: { transitionSpeed?: number },
  ) => void;
  destroy: () => void;
}

const VIDEO_SOURCE = "/assets/videos/landing/video_hero.mp4";
const POSTER_DESKTOP = "/assets/images/landing/hero-poster-1600.webp";
const POSTER_MOBILE = "/assets/images/landing/hero-poster-800.webp";
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e

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
  }

  // 3. Choix basé sur l'appareil et l'écran
  if (isMobile) {
    // Sur smartphone : 480p WebM (4.8 Mo) est ultra net sur écran réduit,
    // démarre 2.5x plus vite et préserve la batterie et le forfait
    return '480';
  }

  return '720';
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

<<<<<<< HEAD
    return () => {
      window.removeEventListener('resize', handleResize);
      if (conn) {
        conn.removeEventListener('change', computeAndApplyQuality);
      }
    };
  }, [computeAndApplyQuality]);
=======
    let instance: ScrollyVideoInstance | null = null;
    let cancelled = false;
    let scrollRaf: number | null = null;
    let removeScrollTracking = () => {};
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e

  // Synchronisation de la source vidéo et maintien du currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

<<<<<<< HEAD
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
=======
        instance = new ScrollyVideo({
          src: VIDEO_SOURCE,
          scrollyVideoContainer: container,
          cover: true,
          sticky: true,
          full: true,
          // The package's built-in listener starts a fresh transition for every
          // raw scroll event. Driving it ourselves below keeps one transition
          // alive at a time and lets the browser batch work to animation frames.
          trackScroll: false,
          transitionSpeed: 6,
          frameThreshold: 0.03,
          // The 1080p MP4 is encoded with every frame as a keyframe.
          // Keeping native video seeking avoids retaining all 900 decoded frames.
          useWebCodecs: false,
          // The package declaration omits this callback argument, although the
          // implementation passes the current percentage on every update.
          onChange: ((percentage: number) => {
            const progress = Math.max(0, Math.min(1, percentage));
            if (progressRef.current) {
              progressRef.current.style.transform = `scaleX(${progress})`;
            }
            if (progressValueRef.current) {
              progressValueRef.current.setAttribute(
                "aria-valuenow",
                String(Math.round(progress * 100)),
              );
            }
          }) as () => void,
        }) as ScrollyVideoInstance;
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e

    const targetSrc = VIDEO_SOURCES[effectiveQuality];
    const currentPos = video.currentTime || 0;
    const wasPlaying = !video.paused;

<<<<<<< HEAD
    // Vérifier si la source actuelle correspond déjà à la qualité désirée
    const isCurrentSrc = video.currentSrc?.endsWith(targetSrc) || video.src?.endsWith(targetSrc);

    if (!isCurrentSrc) {
      // Si la vidéo a déjà démarré, bascule transparente en conservant le curseur
      video.src = targetSrc;
      video.defaultPlaybackRate = PLAYBACK_RATE;
      video.playbackRate = PLAYBACK_RATE;
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

    video.playbackRate = PLAYBACK_RATE;

    const handleLoadedMetadata = () => {
      video.playbackRate = PLAYBACK_RATE;
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Détection de buffering/stalling pour rétrograder automatiquement
    const handleWaitingOrStalled = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        if (effectiveQuality === '720') {
          setEffectiveQuality('480');
=======
        const track = container.parentElement;
        const updateFromScroll = () => {
          scrollRaf = null;
          if (!instance || !track) return;

          const bounds = track.getBoundingClientRect();
          const scrollableDistance = Math.max(
            bounds.height - window.innerHeight,
            1,
          );
          const progress = Math.max(
            0,
            Math.min(1, -bounds.top / scrollableDistance),
          );

          // Duration is unavailable until metadata has loaded. The progress
          // rail can still update immediately; video scrubbing starts once it
          // has a real timeline to seek through.
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            instance.setVideoPercentage(progress);
          } else if (progressRef.current) {
            progressRef.current.style.transform = `scaleX(${progress})`;
          }
        };

        const scheduleScrollUpdate = () => {
          if (scrollRaf !== null) return;
          scrollRaf = window.requestAnimationFrame(updateFromScroll);
        };

        window.addEventListener("scroll", scheduleScrollUpdate, {
          passive: true,
        });
        window.addEventListener("resize", scheduleScrollUpdate, {
          passive: true,
        });
        video.addEventListener("loadedmetadata", scheduleScrollUpdate);
        scheduleScrollUpdate();

        removeScrollTracking = () => {
          window.removeEventListener("scroll", scheduleScrollUpdate);
          window.removeEventListener("resize", scheduleScrollUpdate);
          video.removeEventListener("loadedmetadata", scheduleScrollUpdate);
          if (scrollRaf !== null) {
            window.cancelAnimationFrame(scrollRaf);
            scrollRaf = null;
          }
        };

        const handleReady = () => {
          setHasError(false);
          setIsReady(true);
        };
        const handleError = () => {
          setHasError(true);
          setIsReady(true);
        };

        video.addEventListener("loadeddata", handleReady, { once: true });
        video.addEventListener("canplay", handleReady, { once: true });
        video.addEventListener("error", handleError, { once: true });

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          handleReady();
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
          setIsReady(true);
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e
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
<<<<<<< HEAD
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('waiting', handleWaitingOrStalled);
      video.removeEventListener('stalled', handleWaitingOrStalled);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
=======
      cancelled = true;
      removeScrollTracking();
      if (instance?.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
      }
      instance?.video.pause();
      instance?.destroy();
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e
    };
  }, [effectiveQuality]);

  return (
<<<<<<< HEAD
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
=======
    <div className="relative h-[420svh] min-h-[1900px] bg-black motion-reduce:h-[100svh] motion-reduce:min-h-[480px]">
      <div
        ref={videoContainerRef}
        className="sticky top-0 h-[100svh] min-h-[480px] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${POSTER_DESKTOP})` }}
>>>>>>> 1bf3fe961d4cdb0a42b5aec5bc65e7d0fde6339e
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
