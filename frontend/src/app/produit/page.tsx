import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { ProductHome } from '@/components/home/ProductHome';

export const metadata: Metadata = {
  title: 'La technologie derrière votre dossier — Amud Skills',
  description:
    "Vidéo de présentation, lecture automatique des documents, mise en relation en temps réel : découvrez comment fonctionne la plateforme Amud Skills.",
};

/**
 * `/produit` — vitrine technique (vidéo de présentation, OCR, matching,
 * secteurs). `ProductHome` existait déjà, câblé sur `content.product`, mais
 * n'était encore rattaché à aucune route : cette page le fait, sur le même
 * modèle que `/employeurs`.
 */
export default function ProduitPage() {
  return (
    <>
      <SiteHeader />


      <ProductHome />
      <SiteFooter />
    </>
  );
}
