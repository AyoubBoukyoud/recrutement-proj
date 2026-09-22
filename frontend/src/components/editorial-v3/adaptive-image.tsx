type AdaptiveImageProps = {
  name: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  position?: string;
};

/** Loads a device-specific crop. Mobile visitors never download the desktop asset. */
export function AdaptiveImage({
  name,
  alt,
  className = '',
  priority = false,
  sizes = '100vw',
  position,
}: AdaptiveImageProps) {
  const style = position ? { objectPosition: position } : undefined;
  return (
    <picture className={'adaptive-picture ' + className}>
      <source
        media="(max-width: 639px)"
        type="image/avif"
        srcSet={`/landing-assets/editorial-v3/${name}-mobile.avif`}
      />
      <source
        media="(max-width: 639px)"
        type="image/webp"
        srcSet={`/landing-assets/editorial-v3/${name}-mobile.webp`}
      />
      <source
        media="(max-width: 1023px)"
        type="image/avif"
        srcSet={`/landing-assets/editorial-v3/${name}-tablet.avif`}
      />
      <source
        media="(max-width: 1023px)"
        type="image/webp"
        srcSet={`/landing-assets/editorial-v3/${name}-tablet.webp`}
      />
      <source
        type="image/avif"
        srcSet={`/landing-assets/editorial-v3/${name}-desktop.avif`}
      />
      <img
        src={`/landing-assets/editorial-v3/${name}-desktop.webp`}
        alt={alt}
        width="1440"
        height="960"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        sizes={sizes}
        style={style}
      />
    </picture>
  );
}
