'use client';

// Centre d'aide / FAQ — accessible depuis la page Support (réclamation).

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { WithPageSkeleton } from '@/components/shared/SkeletonLoader';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: string;
  items: FaqItem[];
}

export default function FaqPage() {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  const FAQ_SECTIONS: FaqSection[] = [
    {
      title: t('candidateA:faq.sections.profile.title'),
      icon: 'person',
      items: [
        {
          question: t('candidateA:faq.sections.profile.items.editInfo.question'),
          answer: t('candidateA:faq.sections.profile.items.editInfo.answer'),
        },
        {
          question: t('candidateA:faq.sections.profile.items.addLanguage.question'),
          answer: t('candidateA:faq.sections.profile.items.addLanguage.answer'),
        },
      ],
    },
    {
      title: t('candidateA:faq.sections.application.title'),
      icon: 'description',
      items: [
        {
          question: t('candidateA:faq.sections.application.items.documents.question'),
          answer: t('candidateA:faq.sections.application.items.documents.answer'),
        },
        {
          question: t('candidateA:faq.sections.application.items.verificationTime.question'),
          answer: t('candidateA:faq.sections.application.items.verificationTime.answer'),
        },
      ],
    },
    {
      title: t('candidateA:faq.sections.training.title'),
      icon: 'school',
      items: [
        {
          question: t('candidateA:faq.sections.training.items.languageTestMandatory.question'),
          answer: t('candidateA:faq.sections.training.items.languageTestMandatory.answer'),
        },
        {
          question: t('candidateA:faq.sections.training.items.germanCourses.question'),
          answer: t('candidateA:faq.sections.training.items.germanCourses.answer'),
        },
      ],
    },
    {
      title: t('candidateA:faq.sections.afterRecruitment.title'),
      icon: 'flight_takeoff',
      items: [
        {
          question: t('candidateA:faq.sections.afterRecruitment.items.visaSupport.question'),
          answer: t('candidateA:faq.sections.afterRecruitment.items.visaSupport.answer'),
        },
      ],
    },
  ];

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <WithPageSkeleton layout="list">
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-6">
        <Link href="/reclamation" className="mr-4 text-primary-dark transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">{t('candidateA:faq.headerTitle')}</h1>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span className="material-symbols-outlined fill text-on-primary" style={{ fontSize: 44 }}>
              quiz
            </span>
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">{t('candidateA:faq.heroTitle')}</h2>
          <p className="mt-2 text-sm text-onSurface-variant">
            {t('candidateA:faq.heroSubtitle')}
          </p>
        </div>

        {FAQ_SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 20 }}>
                {section.icon}
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-dark">{section.title}</h3>
            </div>
            <div className="space-y-2.5">
              {section.items.map((item, idx) => {
                const id = `${section.title}-${idx}`;
                const isOpen = openId === id;
                return (
                  <div key={id} className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-soft">
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <span className="text-sm font-semibold text-onSurface">{item.question}</span>
                      <span
                        className={`material-symbols-outlined shrink-0 text-primary-dark transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        style={{ fontSize: 20 }}
                      >
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <p className="border-t border-outline-variant px-4 pb-4 pt-3 text-sm leading-relaxed text-onSurface-variant">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <Link
          href="/reclamation"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-dark/30 bg-surface-container-low py-4 text-sm font-semibold text-primary-dark transition-all hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>support_agent</span>
          {t('candidateA:faq.contactCta')}
        </Link>
      </main>
    </div>
    </WithPageSkeleton>
  );
}
