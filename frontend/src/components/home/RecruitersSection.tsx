'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { CoralButton, Icon, OutlineButton, SectionHeading } from './ui';
import { Reveal } from './Reveal';

export function RecruitersSection() {
  const { recruiters } = useHomeContent();

  return (
    <section id="recruteurs" className="scroll-mt-20 bg-home-coral-soft py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-last lg:order-first">
            <img
              src="/assets/images/landing/recruitment-company-1440.webp"
              srcSet="/assets/images/landing/recruitment-company-720.webp 720w, /assets/images/landing/recruitment-company-1440.webp 1440w"
              sizes="(min-width: 1024px) 560px, 100vw"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-72 w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(16,35,58,0.14)] sm:h-96 lg:h-[26rem]"
            />
          </Reveal>

          <Reveal delay={100}>
            <SectionHeading eyebrow={recruiters.eyebrow} title={recruiters.title} subtitle={recruiters.subtitle} />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CoralButton href="/auth-phone?intent=recruiter" size="lg">
                {recruiters.cta}
              </CoralButton>
              <OutlineButton href="/employeurs" size="lg">
                {recruiters.secondaryCta}
              </OutlineButton>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recruiters.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <div className="h-full rounded-2xl bg-home-surface p-6 shadow-[0_10px_28px_rgba(16,35,58,0.06)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-home-coral-soft text-home-coral-dark">
                  <Icon name={item.icon} className="text-xl" />
                </span>
                <h3 className="mt-4 text-base font-bold text-home-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-home-slate">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
