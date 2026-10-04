'use client';

import {useState} from 'react';
import {ArrowUpRight, ChevronDown, Menu, X} from 'lucide-react';
import {useLanguage} from '@/context/LanguageContext';
import {journeyCopy} from './journey-copy';
import {translator,AUTH,RECRUIT,type Locale} from './content';

export type JourneyDevice='desktop'|'tablet'|'mobile';
const COPYRIGHT_YEAR=2026;

function Marker({label}:{label:string}){
  return <div className="j-marker"><span aria-hidden="true"><i/><i/><i/><i/></span><b>{label}</b></div>;
}

export default function JourneyLayout({locale='fr',device}:{locale?:Locale;device:JourneyDevice}){
  const t=translator(locale),{setLanguage}=useLanguage(),[open,setOpen]=useState(false);
  const copy=journeyCopy(locale);
  const A=`/landing-assets/journey/${device}`;
  const G=A;
  const nav=[['#borderless',t('Pour les talents','للمواهب','Für Talente','For talent')],['#careers',t('Pour les entreprises','للشركات','Für Unternehmen','For companies')],['/crm-centre-formation',t('Centres de formation','مراكز التكوين','Bildungszentren','Training centres')],['#faq','FAQ']];
  const {steps,careers}=copy;
  const faqs=[
    t("Qui peut s’inscrire sur AMUD Skills ?","من يمكنه التسجيل؟","Wer kann sich anmelden?","Who can join AMUD Skills?"),
    t("Le service est-il gratuit pour les talents ?","هل الخدمة مجانية للمواهب؟","Ist der Service für Talente kostenlos?","Is it free for talent?"),
    t("Faut-il déjà parler allemand ?","هل يجب التحدث بالألمانية؟","Muss ich bereits Deutsch sprechen?","Do I need to speak German?"),
    t("Comment les entreprises prennent-elles contact ?","كيف تتواصل الشركات؟","Wie nehmen Unternehmen Kontakt auf?","How do companies make contact?"),
  ];
  return <div className={`journey-page journey-page--${device}`} data-device={device} dir={locale==='ar'?'rtl':'ltr'}>
    <a className="j-skip" href="#journey-main">{t('Aller au contenu','الانتقال إلى المحتوى','Zum Inhalt','Skip to content')}</a>
    <header className="j-header">
      <a href="/" className="j-logo"><img src="/landing-assets/amud-logo-brand.svg" alt="AMUD Skills"/></a>
      <nav>{nav.map(([href,label])=><a href={href} key={href}>{label}</a>)}</nav>
      <div className="j-actions"><div className="j-langs">{(['fr','ar','de','en'] as const).map(lang=><button key={lang} aria-pressed={locale===lang} onClick={()=>setLanguage(lang)}>{lang==='ar'?'ع':lang.toUpperCase()}</button>)}</div><a className="j-login" href={AUTH}>{t('Connexion','الدخول','Anmelden','Sign in')}</a><a className="j-button j-header-cta" href={AUTH}>{t('Créer mon profil','إنشاء ملفي','Profil erstellen','Create profile')}<ArrowUpRight/></a><button className="j-menu" aria-expanded={open} aria-controls="journey-mobile-nav" aria-label={open?t('Fermer le menu','إغلاق القائمة','Menü schließen','Close menu'):t('Ouvrir le menu','فتح القائمة','Menü öffnen','Open menu')} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
      {open&&<div id="journey-mobile-nav" className="j-mobile-nav">{nav.map(([href,label])=><a onClick={()=>setOpen(false)} href={href} key={href}>{label}</a>)}<a href={AUTH}>{t('Connexion','الدخول','Anmelden','Sign in')}</a></div>}
    </header>
    <main id="journey-main">
      <section className="j-hero j-shell">
        <div className="j-hero-media"><video autoPlay muted loop playsInline preload="metadata" poster={`${A}/hero.webp`} aria-label={t("Parcours du Maroc vers l’Allemagne","مسار من المغرب إلى ألمانيا","Weg von Marokko nach Deutschland","Journey from Morocco to Germany")}><source src="/landing-assets/hero/amud-journey.mp4" type="video/mp4"/></video><img className="j-hero-person" src={`${A}/walking-talent.webp`} alt="" aria-hidden="true"/></div>
        <div className="j-hero-copy"><Marker label={copy.heroEyebrow}/><h1>{copy.heroTitle}<span>{copy.heroAccent}</span></h1><p>{copy.heroBody}</p><div className="j-hero-buttons"><a className="j-button" href={AUTH}>{copy.create}<ArrowUpRight/></a><a className="j-button j-button-ghost" href={RECRUIT}>{copy.recruit}</a></div><small>✓ {copy.heroNote}</small></div>
      </section>

      <section id="borderless" className="j-section j-borderless j-shell">
        <div className="j-section-intro"><Marker label={copy.borderEyebrow}/><h2>{copy.borderTitle}</h2><p>{copy.borderBody}</p></div>
        <div className="j-cities"><img className="j-city-ma" src={`${A}/morocco-city.webp`} alt={t('Ville marocaine illustrée','مدينة مغربية مصورة','Illustrierte marokkanische Stadt','Illustrated Moroccan city')}/><img className="j-city-de" src={`${A}/germany-city.webp`} alt={t('Ville allemande illustrée','مدينة ألمانية مصورة','Illustrierte deutsche Stadt','Illustrated German city')}/><img className="j-city-road" src={`${G}/city-road.svg`} alt=""/><article><b>{t('Talents au Maroc','المواهب في المغرب','Talente in Marokko','Talent in Morocco')}</b><span>{t('Valorisez vos compétences et accédez à des opportunités.','أبرز مهاراتك واكتشف الفرص.','Zeigen Sie Ihre Kompetenzen.','Show your skills and access opportunities.')}</span></article><article><b>{t('Entreprises en Allemagne','الشركات في ألمانيا','Unternehmen in Deutschland','Companies in Germany')}</b><span>{t('Trouvez des profils motivés et qualifiés.','اكتشف ملفات مؤهلة ومحفزة.','Finden Sie motivierte Profile.','Find motivated, qualified profiles.')}</span></article></div>
      </section>

      <section id="steps" className="j-section j-steps j-shell"><div className="j-section-intro"><Marker label={copy.stepEyebrow}/><h2>{copy.stepTitle}</h2><p>{copy.stepBody}</p></div><div className="j-step-path"><img className="j-route" src={`${G}/steps-road.svg`} alt=""/>{steps.map(([icon,title,body],i)=><article key={title}><img src={`${G}/${icon}`} alt=""/><div><em>{i+1}</em><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>

      <section id="careers" className="j-section j-careers j-shell"><div className="j-section-intro"><Marker label={copy.careerEyebrow}/><h2>{copy.careerTitle}</h2><p>{copy.careerBody}</p></div><div className="j-career-grid">{careers.map(([image,title])=><article key={title}><img src={`${A}/${image}`} alt="" loading="lazy"/><b>{title}</b><ArrowUpRight/></article>)}</div></section>

      <section className="j-section j-future"><div className="j-shell"><div><Marker label={t('UN AVENIR PLUS PROCHE','مستقبل أقرب','EINE NÄHERE ZUKUNFT','A CLOSER FUTURE')}/><h2>{copy.futureTitle}</h2><p>{copy.futureBody}</p><a className="j-button" href={AUTH}>{copy.create}<ArrowUpRight/></a></div><img src={`${A}/future.webp`} alt="" loading="lazy"/></div></section>

      <section id="faq" className="j-section j-faq j-shell"><div className="j-section-intro"><Marker label={t('QUESTIONS FRÉQUENTES','الأسئلة الشائعة','HÄUFIGE FRAGEN','FREQUENTLY ASKED QUESTIONS')}/><h2>{t('Des questions ?','لديك أسئلة؟','Fragen?','Questions?')}</h2><p>{t('Trouvez rapidement les réponses essentielles.','اعثر بسرعة على الإجابات الأساسية.','Finden Sie schnell die wichtigsten Antworten.','Find the essential answers quickly.')}</p></div><div>{faqs.map(q=><details key={q}><summary>{q}<ChevronDown/></summary><p>{t('Retrouvez les informations détaillées dans notre espace d’aide.','ستجد المعلومات المفصلة في مساحة المساعدة.','Weitere Informationen finden Sie in unserem Hilfebereich.','Find detailed information in our help centre.')}</p></details>)}</div></section>
    </main>
    <footer className="j-footer j-shell"><img src="/landing-assets/amud-logo-brand.svg" alt="AMUD Skills"/><div><a href="#borderless">{t('Talents','المواهب','Talente','Talent')}</a><a href="#careers">{t('Entreprises','الشركات','Unternehmen','Companies')}</a><a href="/crm-centre-formation">{t('Centres','المراكز','Zentren','Centres')}</a><a href="#faq">FAQ</a></div><small>© {COPYRIGHT_YEAR} AMUD Skills · {t('Des compétences qui nous rapprochent.','مهارات تقرب بيننا.','Kompetenzen, die uns verbinden.','Skills that bring us together.')}</small></footer>
  </div>;
}
