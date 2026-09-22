'use client';
import {useLanguage} from '@/context/LanguageContext';
import EditorialLanding from '@/components/editorial-v3/landing';
import LegacyLanding from '@/components/landing/landing';

export function PublicHome({crmOnly=false}:{crmOnly?:boolean}){
 const {language,setLanguage}=useLanguage();
 if(crmOnly)return <LegacyLanding locale={language} crmOnly/>;
 return <EditorialLanding locale={language} onLocaleChange={setLanguage}/>;
}
