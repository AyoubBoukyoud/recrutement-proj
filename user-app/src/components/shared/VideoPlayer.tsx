'use client';

import { useRef, useState } from 'react';

interface VideoPlayerProps {
  src: string | null;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-primary-dark text-xs font-medium text-primary-light">
        Aucune vidéo disponible
      </div>
    );
  }

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
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

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-floating">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="h-full w-full object-cover"
        onEnded={() => setIsPlaying(false)}
        playsInline
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-3">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary transition-transform hover:scale-105"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          <span className="material-symbols-outlined fill" style={{ fontSize: 20 }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      </div>
    </div>
  );
}
