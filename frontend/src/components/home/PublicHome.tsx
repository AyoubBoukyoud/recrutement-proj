'use client';
import {useLanguage} from '@/context/LanguageContext';
import ReferenceLanding from '@/components/reference-landing/ReferenceLanding';

/*
 * La page d'accueil publique. L'ancienne variante `crmOnly` (components/landing)
 * n'avait plus aucun appelant, mais son import statique l'embarquait dans le
 * JavaScript de chaque visite de l'accueil.
 */
export function PublicHome(){
 const {language}=useLanguage();
 return <ReferenceLanding locale={language}/>;
}
