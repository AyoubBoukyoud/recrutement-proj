'use client';
import { useLanguage } from '@/context/LanguageContext';
import Landing from '@/components/landing/landing';
export function PublicHome({crmOnly=false}:{crmOnly?:boolean}) {
 const { language } = useLanguage();
 return <Landing locale={language} crmOnly={crmOnly}/>;
}
