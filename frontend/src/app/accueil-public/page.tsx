import type { Metadata } from 'next';
import { PublicHome } from '@/components/home/PublicHome';
import '@/components/landing/landing.css';
export const metadata: Metadata = {
 title: 'AMUD Skills — Talents au Maroc, opportunités en Allemagne',
 description: 'AMUD Skills relie les talents au Maroc, avec ou sans allemand, aux entreprises en Allemagne. Découvrez aussi le CRM pour les centres de formation.',
};
export default function AccueilPublicPage() { return <PublicHome/>; }
