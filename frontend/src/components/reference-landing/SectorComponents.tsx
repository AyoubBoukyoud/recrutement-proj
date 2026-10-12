import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './sector-design.css';

export function EditorialImage({ name, alt, priority = false, className = '' }: { name: string; alt: string; priority?: boolean; className?: string }) {
  if (name.startsWith('/')) return <picture className={`sector-picture ${className}`}><img src={name} width={1440} height={960} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async"/></picture>;
  return <picture className={`sector-picture ${className}`}>
    <source type="image/webp" srcSet={`/landing-assets/sectors/${name}-640.webp 640w, /landing-assets/sectors/${name}-960.webp 960w, /landing-assets/sectors/${name}-1440.webp 1440w`} sizes="(min-width: 1100px) 620px, (min-width: 760px) 50vw, 100vw"/>
    <img src={`/landing-assets/sectors/${name}-960.webp`} width={1440} height={960} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"/>
  </picture>;
}

export function SectorHero({ eyebrow, title, intro, image, alt, children }: { eyebrow: string; title: string; intro: string; image: string; alt: string; children: ReactNode }) {
  return <section className="sector-hero">
    <div className="sector-hero-copy"><p className="sector-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="sector-intro">{intro}</p><div className="sector-actions">{children}</div></div>
    <figure className="sector-hero-visual"><EditorialImage name={image} alt={alt} priority/><figcaption><span aria-hidden="true"/>AMUD SKILLS <span aria-hidden="true">·</span> MAROC ↔ DEUTSCHLAND</figcaption></figure>
  </section>;
}

export function ImageFeatureSection({ eyebrow, title, image, alt, children, id }: { eyebrow: string; title: string; image: string; alt: string; children: ReactNode; id?: string }) {
  return <section className="sector-feature" id={id}><div className="sector-feature-image"><EditorialImage name={image} alt={alt}/></div><div className="sector-feature-copy"><p className="sector-eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</div></section>;
}

/** Values describe the page or sourced facts, never invented outcomes. */
export function StatCard({ value, label }: { value: string; label: string }) {
  return <div className="sector-stat"><dt>{label}</dt><dd>{value}</dd></div>;
}

export function StepCard({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <li className="sector-step"><span className="sector-step-number">{String(number).padStart(2, '0')}</span><h3>{title}</h3><p>{children}</p></li>;
}

export function CTASection({ title, body, href, label, image, alt }: { title: string; body: string; href: string; label: string; image?: string; alt?: string }) {
  return <section className={`sector-cta ${image ? 'sector-cta-illustrated' : ''}`}>
    <div><p className="sector-eyebrow">AMUD SKILLS</p><h2>{title}</h2><p>{body}</p><a className="sector-button" href={href}>{label}<ArrowUpRight size={18} aria-hidden="true"/></a></div>
    {image && <EditorialImage name={image} alt={alt || ''}/>}
  </section>;
}
