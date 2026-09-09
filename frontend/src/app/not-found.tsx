import type { Metadata } from 'next';
import { PrimaryCta, GhostCta } from '@/components/home/Cta';

export const metadata: Metadata = {
  title: 'Page introuvable — Amud Skills',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-16 text-center text-onSurface">
      <span className="text-sm font-bold uppercase tracking-widest text-primary">Erreur 404</span>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Cette page n&apos;existe pas ou plus</h1>
      <p className="max-w-md text-sm leading-relaxed text-onSurface-variant">
        Le lien est peut-être obsolète, ou l&apos;adresse a été mal saisie. Retrouvez votre chemin depuis l&apos;accueil,
        la liste des métiers, ou votre espace de connexion.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <PrimaryCta href="/accueil-public">Retour à l&apos;accueil</PrimaryCta>
        <GhostCta href="/produit">Voir les métiers</GhostCta>
        <GhostCta href="/auth-phone">Se connecter</GhostCta>
      </div>
    </main>
  );
}
