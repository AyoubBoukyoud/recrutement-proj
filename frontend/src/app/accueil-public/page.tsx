import type {Metadata} from 'next';
import {PublicHome} from '@/components/home/PublicHome';

export const metadata:Metadata={
 title:'AMUD Skills — Un profil vivant pour aller plus loin',
 description:'Créez votre profil, valorisez vos compétences et entrez en contact avec des employeurs en Allemagne, avec ou sans allemand.'
};

export default function AccueilPublicPage(){return <PublicHome/>;}
