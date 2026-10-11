'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import landingBlurhashes from './landing-blurhash.json';
import './landing-motion.css';

const IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const BASE83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
const blurDataUrls = new Map<string, string>();

function decode83(value: string, start: number, length: number) {
  let decoded = 0;
  for (let index = start; index < start + length; index += 1) decoded = decoded * 83 + BASE83.indexOf(value[index]);
  return decoded;
}

function srgbToLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number) {
  const channel = Math.max(0, Math.min(1, value));
  return Math.round(255 * (channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055));
}

function decodeBlurhash(hash: string, width = 24, height = 18) {
  if (hash.length < 6) return null;
  const sizeFlag = decode83(hash, 0, 1);
  const componentsX = (sizeFlag % 9) + 1;
  const componentsY = Math.floor(sizeFlag / 9) + 1;
  if (hash.length !== 4 + 2 * componentsX * componentsY) return null;

  const maximum = (decode83(hash, 1, 1) + 1) / 166;
  const colors: number[][] = [];
  const dcValue = decode83(hash, 2, 4);
  colors.push([srgbToLinear(dcValue >> 16), srgbToLinear((dcValue >> 8) & 255), srgbToLinear(dcValue & 255)]);
  for (let index = 1; index < componentsX * componentsY; index += 1) {
    const value = decode83(hash, 4 + index * 2, 2);
    const signedPower = (component: number) => {
      const normalized = component - 9;
      return Math.sign(normalized) * (normalized / 9) ** 2 * maximum;
    };
    colors.push([signedPower(Math.floor(value / (19 * 19))), signedPower(Math.floor(value / 19) % 19), signedPower(value % 19)]);
  }

  const pixels: string[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = [0, 0, 0];
      for (let yComponent = 0; yComponent < componentsY; yComponent += 1) {
        for (let xComponent = 0; xComponent < componentsX; xComponent += 1) {
          const basis = Math.cos((Math.PI * xComponent * x) / width) * Math.cos((Math.PI * yComponent * y) / height);
          const factor = colors[yComponent * componentsX + xComponent];
          for (let channel = 0; channel < 3; channel += 1) color[channel] += factor[channel] * basis;
        }
      }
      const [red, green, blue] = color.map(linearToSrgb);
      pixels.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><filter id="b"><feGaussianBlur stdDeviation="1.2"/></filter></defs><g filter="url(%23b)">${pixels.join('')}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function blurDataURL(src: string) {
  const hash = (landingBlurhashes as Record<string, string>)[src];
  if (!hash) return undefined;
  let dataUrl = blurDataUrls.get(hash);
  if (!dataUrl) {
    dataUrl = decodeBlurhash(hash) ?? undefined;
    if (dataUrl) blurDataUrls.set(hash, dataUrl);
  }
  return dataUrl;
}

type ImageJob = {
  image: HTMLImageElement;
  activate: () => void;
  near: boolean;
  started: boolean;
};

const imageJobs = new Map<HTMLImageElement, ImageJob>();
let imageObserver: IntersectionObserver | null = null;
let imageInFlight: ImageJob | null = null;

function finishImageJob(job: ImageJob) {
  if (!imageJobs.has(job.image)) return;
  imageObserver?.unobserve(job.image);
  imageJobs.delete(job.image);
  if (imageInFlight === job) imageInFlight = null;
  pumpImageQueue();
}

function pumpImageQueue() {
  if (imageInFlight || typeof document === 'undefined') return;
  const next = [...imageJobs.values()]
    .filter((job) => !job.started && job.image.isConnected)
    .sort((left, right) => {
      const position = left.image.compareDocumentPosition(right.image);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    })[0];

  // Keep the original document order: a later image waits until the next
  // image above it is close to the viewport and has finished loading.
  if (!next?.near) return;
  next.started = true;
  imageInFlight = next;
  next.activate();
}

function registerLandingImage(image: HTMLImageElement, activate: () => void) {
  const job: ImageJob = {
    image,
    activate,
    near: false,
    started: false,
  };
  imageJobs.set(image, job);

  if (typeof IntersectionObserver === 'undefined') {
    job.near = true;
    queueMicrotask(pumpImageQueue);
  } else {
    imageObserver ??= new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const observedJob = imageJobs.get(entry.target as HTMLImageElement);
        if (observedJob && entry.isIntersecting) observedJob.near = true;
      });
      pumpImageQueue();
    }, { rootMargin: '320px 0px', threshold: 0 });
    imageObserver.observe(image);
  }

  return () => {
    if (imageInFlight === job) imageInFlight = null;
    imageObserver?.unobserve(image);
    imageJobs.delete(image);
    pumpImageQueue();
  };
}

export function finishLandingImage(image: HTMLImageElement | null) {
  const job = image ? imageJobs.get(image) : undefined;
  if (job?.started) finishImageJob(job);
}

export function LandingScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-landing-motion-scope]');
    if (!root) return;

    const targets = new Set<HTMLElement>();
    root.querySelectorAll<HTMLElement>('main > :not(script), main > * > header:not(.r-header), main section > *, main section article, main section figure, main details, main .r-step, main .r-level, main .r-seo-card-grid > a, main .r-faq-list > details, main .industry-benefit-grid > article, main .candidate-grid > article, main .centre-module-grid > article, main .company-service-grid > article, main .company-startup-facts > article, main .company-startup-goals-grid > article').forEach((element) => {
      if (element.closest('header.r-header, footer.r-footer')) return;
      targets.add(element);
    });

    const delayByParent = new Map<HTMLElement, number>();
    targets.forEach((element) => {
      const parent = element.parentElement;
      if (!parent) return;
      const index = delayByParent.get(parent) ?? 0;
      element.dataset.landingReveal = '';
      element.style.setProperty('--landing-reveal-delay', `${Math.min(index * 75, 300)}ms`);
      delayByParent.set(parent, index + 1);
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-in-view'));
      return () => targets.forEach((element) => {
        delete element.dataset.landingReveal;
        element.classList.remove('is-in-view');
        element.style.removeProperty('--landing-reveal-delay');
      });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    targets.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      targets.forEach((element) => {
        delete element.dataset.landingReveal;
        element.classList.remove('is-in-view');
        element.style.removeProperty('--landing-reveal-delay');
      });
    };
  }, [pathname]);

  return null;
}

type ResponsiveSource = { media: string; srcSet: string; type?: string };
type SequentialImageProps = {
  src: string;
  sources?: ResponsiveSource[];
  width: number;
  height: number;
  alt: string;
  className?: string;
  pictureClassName?: string;
  priority?: boolean;
};

export function SequentialLandingImage({
  src, sources = [], width, height, alt, className, pictureClassName, priority = false,
}: SequentialImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const isActive = useRef(priority);
  const [active, setActive] = useState(priority);
  const placeholder = blurDataURL(src);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || priority) return;
    return registerLandingImage(image, () => {
      isActive.current = true;
      setActive(true);
    });
  }, [priority, src]);

  const image = <Image
    ref={imageRef}
    src={active ? src : IMAGE_PLACEHOLDER}
    width={width}
    height={height}
    alt={alt}
    className={className}
    placeholder={placeholder ? 'blur' : 'empty'}
    blurDataURL={placeholder}
    priority={priority}
    loading={active ? 'eager' : 'lazy'}
    decoding="async"
    unoptimized
    onLoad={() => { if (isActive.current) finishLandingImage(imageRef.current); }}
    onError={() => { if (isActive.current) finishLandingImage(imageRef.current); }}
  />;

  if (!sources.length) return image;
  return <picture className={pictureClassName}>
    {sources.map(({ media, srcSet, type }) => <source key={media} media={media} srcSet={active ? srcSet : undefined} type={type}/>)
    }
    {image}
  </picture>;
}
