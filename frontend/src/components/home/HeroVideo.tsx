"use client";

import { useEffect, useRef, useState } from "react";
import { useHomeContent } from "@/lib/useLocalizedContent";

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

/**
 * A long scroll track containing one sticky video viewport. ScrollyVideo maps
 * the track's vertical progress to the source video's current frame.
 */
export function HeroVideo() {
  const content = useHomeContent();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressValueRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // En dessous de `sm`, la piste de scroll de 420svh retombe à 100svh (cf.
    // le conteneur plus bas) : inutile d'y lancer le décodage d'une vidéo de
    // 70 Mo qu'aucun scroll ne viendra parcourir — la même affiche statique
    // que le mode "mouvement réduit" suffit, et c'est justement le public le
    // plus sensible au poids de la page (mobile, réseau cellulaire).
    const skipVideo = reducedMotion || window.innerWidth < 640;
    if (skipVideo) {
      setIsReady(true);
      return;
    }

    let instance: ScrollyVideoInstance | null = null;
    let cancelled = false;
    let scrollRaf: number | null = null;
    let removeScrollTracking = () => {};

    const start = async () => {
      try {
        const { default: ScrollyVideo } = await import(
          "scrolly-video/dist/ScrollyVideo.js"
        );
        if (cancelled) return;

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

        const video = instance.video;
        video.poster = window.innerWidth < 768 ? POSTER_MOBILE : POSTER_DESKTOP;
        // "metadata" plutôt que "auto" : le navigateur récupère juste la durée
        // et la première frame au chargement de la page, pas les 70 Mo entiers
        // avant même que quelqu'un ait commencé à défiler.
        video.preload = "metadata";
        video.tabIndex = -1;
        video.setAttribute("aria-label", content.hero.mediaCaption);
        video.setAttribute("playsinline", "");
        video.disablePictureInPicture = true;

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
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      removeScrollTracking();
      if (instance?.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
      }
      instance?.video.pause();
      instance?.destroy();
    };
  }, [content.hero.mediaCaption]);

  return (
    <div className="relative h-[100svh] min-h-[480px] bg-black sm:h-[420svh] sm:min-h-[1900px] motion-reduce:h-[100svh] motion-reduce:min-h-[480px]">
      <div
        ref={videoContainerRef}
        className="sticky top-0 h-[100svh] min-h-[480px] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${POSTER_DESKTOP})` }}
        aria-label={content.hero.mediaCaption}
        role="img"
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 h-[100svh] min-h-[480px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

          <div
            className={`absolute inset-0 bg-black/25 transition-opacity duration-700 ${isReady ? "opacity-0" : "opacity-100"}`}
            aria-hidden="true"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 origin-left animate-pulse bg-primary-light/70" />
          </div>

          {hasError && (
            <div className="absolute inset-x-6 bottom-24 mx-auto max-w-md rounded-2xl border border-white/25 bg-primary-dark/90 p-4 text-center text-sm font-semibold text-white shadow-floating backdrop-blur-xl">
              {content.hero.videoError}
            </div>
          )}

          {/* Piste de progression du scroll-scrub : sans objet en dessous de
              `sm`, où la vidéo est remplacée par une affiche statique. */}
          <div className="hidden sm:absolute sm:inset-x-10 sm:bottom-10 sm:block">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-white/85 sm:text-xs">
              <span>{content.journey.startLabel}</span>
              <span>{content.journey.endLabel}</span>
            </div>
            <div
              ref={progressValueRef}
              className="h-1 overflow-hidden rounded-full bg-white/30"
              role="progressbar"
              aria-label={content.hero.videoProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
            >
              <div
                ref={progressRef}
                className="h-full origin-left scale-x-0 bg-primary-light will-change-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
