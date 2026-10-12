'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { COMPANY, companyPlace } from '@/lib/company';
import { LEGAL, LEGAL_PATHS, LEGAL_UPDATED, type LegalDocKey } from '@/content/legal';
import type { Language } from '@/lib/types';

const LABELS: Record<Language, {
  updated: string; frenchPrevails: string; seeAlso: string;
  publisher: string; legalName: string; registration: string; headquarters: string; contact: string;
}> = {
  fr: { updated: 'Dernière mise à jour', frenchPrevails: '', seeAlso: 'Voir aussi', publisher: 'Éditeur du site', legalName: 'Raison sociale', registration: 'Immatriculation', headquarters: 'Siège', contact: 'Contact' },
  en: { updated: 'Last updated', frenchPrevails: 'If the translations differ, the French version prevails.', seeAlso: 'See also', publisher: 'Site publisher', legalName: 'Legal name', registration: 'Registration', headquarters: 'Headquarters', contact: 'Contact' },
  de: { updated: 'Zuletzt aktualisiert', frenchPrevails: 'Bei Abweichungen gilt die französische Fassung.', seeAlso: 'Siehe auch', publisher: 'Herausgeber der Website', legalName: 'Firmenname', registration: 'Registrierung', headquarters: 'Sitz', contact: 'Kontakt' },
  ar: { updated: 'آخر تحديث', frenchPrevails: 'في حال وجود اختلاف بين الترجمات، تُعتمد النسخة الفرنسية.', seeAlso: 'انظر أيضًا', publisher: 'ناشر الموقع', legalName: 'الاسم القانوني', registration: 'التسجيل', headquarters: 'المقر', contact: 'التواصل' },
};

const DATE_LOCALE: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', ar: 'ar-MA' };
const DOC_KEYS: LegalDocKey[] = ['privacy', 'terms', 'notice'];

/**
 * Corps d'un texte juridique public. La langue n'étant connue que du
 * navigateur, il vit côté client, comme les autres pages publiques.
 */
export function LegalPage({ docKey }: { docKey: LegalDocKey }) {
  const { language } = useLanguage();
  const doc = LEGAL[language][docKey];
  const labels = LABELS[language];
  const updated = new Date(`${LEGAL_UPDATED}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[language], {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

  const place = companyPlace(language);
  const publisher: [string, string][] = [
    [labels.legalName, [COMPANY.legalName ?? COMPANY.name, COMPANY.legalForm].filter(Boolean).join(' · ')],
    ...(COMPANY.registration ? [[labels.registration, COMPANY.registration] as [string, string]] : []),
    ...(place ? [[labels.headquarters, place] as [string, string]] : []),
    [labels.contact, COMPANY.email],
  ];

  return (
    <article
      className="mx-auto w-full max-w-[820px] px-6 pb-20 pt-8 lg:px-12"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      lang={language}
    >
      <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight text-onSurface">{doc.title}</h1>
      <p className="mt-3 text-sm text-onSurface-variant">
        {labels.updated} : <time dateTime={LEGAL_UPDATED}>{updated}</time>
        {labels.frenchPrevails && <><br />{labels.frenchPrevails}</>}
      </p>

      {doc.intro.map((paragraph) => (
        <p key={paragraph} className="mt-6 text-base leading-relaxed text-onSurface-variant">{paragraph}</p>
      ))}

      {docKey === 'notice' && (
        <section className="mt-10" aria-labelledby="legal-publisher">
          <h2 id="legal-publisher" className="text-xl font-black text-onSurface">{labels.publisher}</h2>
          <dl className="mt-4 grid gap-3 rounded-2xl border border-outline-variant bg-surface-lowest p-5 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-6">
            {publisher.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-black text-onSurface">{label}</dt>
                <dd className="text-onSurface-variant">
                  {value === COMPANY.email ? <a href={`mailto:${value}`} dir="ltr" className="underline underline-offset-2">{value}</a> : value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {doc.sections.map((section, index) => {
        const headingId = `legal-${docKey}-${index}`;
        return (
          <section key={section.title} className="mt-10" aria-labelledby={headingId}>
            <h2 id={headingId} className="text-xl font-black text-onSurface">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-base leading-relaxed text-onSurface-variant">{paragraph}</p>
            ))}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 ps-6 text-base leading-relaxed text-onSurface-variant">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            {section.closing?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-base leading-relaxed text-onSurface-variant">{paragraph}</p>
            ))}
          </section>
        );
      })}

      <nav className="mt-14 border-t border-outline-variant pt-6" aria-label={labels.seeAlso}>
        <p className="text-sm font-black uppercase tracking-wider text-onSurface-variant">{labels.seeAlso}</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
          {DOC_KEYS.filter((key) => key !== docKey).map((key) => (
            <li key={key}>
              <Link href={LEGAL_PATHS[key]} className="text-primary underline underline-offset-2 hover:no-underline">
                {LEGAL[language][key].title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
