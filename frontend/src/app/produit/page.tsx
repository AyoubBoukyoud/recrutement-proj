import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { ProductHome } from '@/components/home/ProductHome';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'La technologie derrière votre dossier — Amud Skills',
  description:
    "Vidéo de présentation, lecture automatique des documents, mise en relation en temps réel : découvrez comment fonctionne la plateforme Amud Skills.",
  path: '/produit',
});

/**
 * `/produit` — vitrine technique (vidéo de présentation, OCR, matching,
 * secteurs). `ProductHome` existait déjà, câblé sur `content.product`, mais
 * n'était encore rattaché à aucune route : cette page le fait, sur le même
 * modèle que `/employeurs`.
 */
export default function ProduitPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'La technologie derrière votre dossier — Amud Skills',
          ar: 'التقنية وراء ملفك — Amud Skills',
          de: 'Die Technik hinter Ihrem Profil — Amud Skills',
          en: 'The technology behind your profile — Amud Skills',
        }}
      />
      <SharedPublicHeader />
      <ProductHome />
      <SharedPublicFooter />
    </>
  );
}
