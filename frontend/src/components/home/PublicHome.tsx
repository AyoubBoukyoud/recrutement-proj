'use client';
import {useLanguage} from '@/context/LanguageContext';
import ReferenceLanding from '@/components/reference-landing/ReferenceLanding';
import LegacyLanding from '@/components/landing/landing';

export function PublicHome({crmOnly=false}:{crmOnly?:boolean}){
 const {language}=useLanguage();
 if(crmOnly)return <LegacyLanding locale={language} crmOnly/>;
 return <ReferenceLanding locale={language}/>;
}
