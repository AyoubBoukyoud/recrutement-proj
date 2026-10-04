import type { Metadata } from 'next';
import { PublicHome } from '@/components/home/PublicHome';

/**
 * La page d'accueil publique vit à la racine. L'ancienne adresse
 * `/accueil-public` y redirige de façon permanente (next.config.mjs), pour
 * que liens partagés et pages déjà indexées aboutissent ici.
 */
export const metadata: Metadata = {
  title: 'AMUD Skills — Un profil vivant pour aller plus loin',
  description:
    'Créez votre profil, valorisez vos compétences et entrez en contact avec des employeurs en Allemagne, avec ou sans allemand.',
};

export default function HomePage() {
  return <PublicHome />;
}
