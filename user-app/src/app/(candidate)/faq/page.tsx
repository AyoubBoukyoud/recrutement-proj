'use client';

// Centre d'aide / FAQ — accessible depuis la page Support (réclamation).

import { useState } from 'react';
import Link from 'next/link';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Mon profil',
    icon: 'person',
    items: [
      {
        question: 'Comment modifier mes informations personnelles ?',
        answer: 'Rendez-vous sur l’onglet Profil puis appuyez sur « Modifier » pour mettre à jour votre métier, votre ville ou vos autres informations.',
      },
      {
        question: 'Puis-je ajouter une langue supplémentaire ?',
        answer: 'Oui. Lors de l’étape « Compétences linguistiques » de la création de profil, utilisez le sélecteur « Ajouter une autre langue » pour compléter la liste au-delà de l’allemand, l’anglais et le français.',
      },
    ],
  },
  {
    title: 'Candidature & documents',
    icon: 'description',
    items: [
      {
        question: 'Quels documents dois-je fournir ?',
        answer: 'Un CV, une copie de passeport et vos diplômes sont requis. Vous pouvez les téléverser depuis l’onglet Documents.',
      },
      {
        question: 'Combien de temps prend la vérification de mes documents ?',
        answer: 'Nos équipes vérifient généralement vos documents sous 48 à 72 heures ouvrées.',
      },
    ],
  },
  {
    title: 'Formation & test de langue',
    icon: 'school',
    items: [
      {
        question: 'Le test de langue est-il obligatoire ?',
        answer: 'Il n’est pas obligatoire mais fortement recommandé : il renforce la confiance des employeurs allemands envers votre profil.',
      },
      {
        question: 'Comment accéder aux cours d’allemand ?',
        answer: 'Depuis l’accueil, la section « Cours d’allemand » vous propose des leçons quotidiennes gratuites.',
      },
    ],
  },
  {
    title: 'Après le recrutement',
    icon: 'flight_takeoff',
    items: [
      {
        question: 'Qui m’accompagne pour le visa et le départ ?',
        answer: 'Un conseiller Amud Skills vous contacte dès qu’un employeur confirme votre recrutement pour vous accompagner dans les démarches administratives et le départ.',
      },
    ],
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-6 lg:px-10">
        <Link href="/reclamation" className="mr-4 text-primary-dark transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">Centre d&apos;aide</h1>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8 lg:max-w-4xl lg:px-10 lg:pt-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span className="material-symbols-outlined fill text-on-primary" style={{ fontSize: 44 }}>
              quiz
            </span>
          </div>
          <h2 className="text-2xl font-bold text-primary-dark">Questions fréquentes</h2>
          <p className="mt-2 text-sm text-onSurface-variant">
            Retrouvez les réponses aux questions les plus posées par nos candidats.
          </p>
        </div>

        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:gap-y-8 lg:space-y-0">
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
        </div>

        <Link
          href="/reclamation"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-dark/30 bg-surface-container-low py-4 text-sm font-semibold text-primary-dark transition-all hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>support_agent</span>
          Je n&apos;ai pas trouvé ma réponse, contacter le support
        </Link>
      </main>
    </div>
  );
}
