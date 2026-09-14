import type { Metadata } from 'next';
import { PublicHome } from '@/components/home/PublicHome';
import '@/components/landing/landing.css';
import '@/components/landing/apple-refinements.css';
export const metadata: Metadata = {title:'CRM pour centres de formation — AMUD Skills',description:'Découvrez le CRM AMUD Skills pour organiser votre centre de formation et accompagner vos apprenants.'};
export default function Page() { return <PublicHome crmOnly/>; }
