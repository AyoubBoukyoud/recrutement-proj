import type {Metadata} from 'next';
import {PublicHome} from '@/components/home/PublicHome';
import '@/components/landing/landing.css';
import '@/components/editorial-v3/editorial.css';

export const metadata:Metadata={
 title:'AMUD Skills — Talents au Maroc, opportunités en Allemagne',
 description:'AMUD Skills relie les talents au Maroc, avec ou sans allemand, aux entreprises en Allemagne.'
};

export default function AccueilPublicPage(){return <PublicHome/>;}
