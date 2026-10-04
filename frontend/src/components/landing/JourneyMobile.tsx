'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Menu,Pause,Play,X} from 'lucide-react';
import {useLanguage} from '@/context/LanguageContext';
import {AUTH,RECRUIT,content,translator,type Locale} from './content';
import {journeyCopy} from './journey-copy';
import './journey-mobile.css';

const ART='/landing-assets/journey/mobile/v2';
const CARDS='/landing-assets/journey/mobile';

function Artwork({name,className='',eager=false}:{name:string;className?:string;eager?:boolean}){
  return <img className={className} src={`${ART}/${name}-480.webp`} srcSet={`${ART}/${name}-480.webp 480w, ${ART}/${name}-960.webp 960w`} sizes="(max-width:720px) 100vw, 720px" alt="" aria-hidden="true" loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'} decoding="async"/>;
}

export default function MobileJourney({locale}:{locale:Locale}){
  const copy=journeyCopy(locale),t=translator(locale),{setLanguage}=useLanguage();
  const [menu,setMenu]=useState(false),[animate,setAnimate]=useState(false),[playing,setPlaying]=useState(false);
  const video=useRef<HTMLVideoElement>(null),menuButton=useRef<HTMLButtonElement>(null);
  const faq=content(locale).faq;
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
    const update=()=>setAnimate(!reduced.matches&&!connection?.saveData);
    update();reduced.addEventListener('change',update);
    return()=>reduced.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(!menu)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);menuButton.current?.focus();}};
    window.addEventListener('keydown',escape);
    return()=>window.removeEventListener('keydown',escape);
  },[menu]);
  const links=[['#borderless',t('Pour les talents','للمواهب','Für Talente','For talent')],['#careers',t('Pour les entreprises','للشركات','Für Unternehmen','For companies')],['/crm-centre-formation',t('Centres de formation','مراكز التكوين','Bildungszentren','Training centres')],['#faq','FAQ']];
  const buttons=<><a className="m-button" href={AUTH}>{copy.create}<ArrowRight aria-hidden="true"/></a><a className="m-button m-button--outline" href={RECRUIT}>{copy.recruit}<ArrowRight aria-hidden="true"/></a></>;
  return <div className="mobile-journey" data-device="mobile" lang={locale} dir={locale==='ar'?'rtl':'ltr'}>
    <a className="m-skip" href="#journey-main">{t('Aller au contenu','انتقل إلى المحتوى','Zum Inhalt','Skip to content')}</a>
    <header className="m-header">
      <a className="m-brand" href="/" aria-label="AMUD Skills"><span className="m-brand-icon"><img src="/landing-assets/amud-logo-brand.svg" alt=""/></span><span>AMUD<small>SKILLS</small></span></a>
      <div className="m-header-actions"><select aria-label={t('Langue','اللغة','Sprache','Language')} value={locale} onChange={e=>setLanguage(e.target.value as Locale)}><option value="fr">FR</option><option value="ar">ع</option><option value="de">DE</option><option value="en">EN</option></select><button ref={menuButton} type="button" aria-controls="mobile-journey-nav" aria-expanded={menu} aria-label={menu?t('Fermer le menu','إغلاق القائمة','Menü schließen','Close menu'):t('Ouvrir le menu','فتح القائمة','Menü öffnen','Open menu')} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div>
      {menu&&<nav id="mobile-journey-nav" className="m-nav">{links.map(([href,label])=><a key={href} href={href} onClick={()=>setMenu(false)}>{label}</a>)}<a href={AUTH}>{t('Connexion','الدخول','Anmelden','Sign in')}</a></nav>}
    </header>
    <main id="journey-main">
      <section className="m-hero" aria-labelledby="mobile-title">
        <div className="m-hero-art"><Artwork name="hero-portrait" eager/>{animate&&<video ref={video} autoPlay muted loop playsInline preload="none" aria-hidden="true" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setAnimate(false)}><source src={`${ART}/hero-portrait.mp4`} type="video/mp4"/></video>}</div>
        <div className="m-hero-card"><p className="m-eyebrow">{copy.heroEyebrow}</p><h1 id="mobile-title">{copy.heroTitle}<span>{copy.heroAccent}</span></h1><p className="m-hero-description">{copy.heroBody}</p><div className="m-buttons">{buttons}</div><p className="m-note"><Check aria-hidden="true"/>{copy.heroNote}</p></div>
        {animate&&<button type="button" className="m-motion" aria-label={playing?t('Mettre l’animation en pause','إيقاف الحركة','Animation pausieren','Pause animation'):t('Lire l’animation','تشغيل الحركة','Animation abspielen','Play animation')} onClick={()=>{if(video.current?.paused)void video.current.play().catch(()=>setAnimate(false));else video.current?.pause();}}>{playing?<Pause/>:<Play/>}</button>}
      </section>
      <section className="m-borderless m-inset" id="borderless">
        <div className="m-heading"><p className="m-eyebrow">{copy.borderEyebrow}</p><h2>{locale==='fr'?<>Les compétences<br/><span>n’ont pas de frontières.</span></>:copy.borderTitle}</h2><p>{copy.borderBody}</p></div>
        <div className="m-highlights">{copy.careers.slice(0,2).map(([image,title],i)=><a href={`${AUTH}?sector=${i===0?'health':'industry'}`} className="m-highlight" key={image}><img src={`${CARDS}/${image}`} alt="" width="160" height="160" loading="lazy"/><div><h3>{title}</h3><p>{i===0?t('Des vocations qui changent des vies.','مهن تغيّر حياة الناس.','Berufe, die Leben verändern.','Careers that change lives.'):t('Des talents qui bâtissent l’avenir.','مواهب تبني المستقبل.','Talente gestalten die Zukunft.','Talent building the future.')}</p></div><ArrowRight aria-hidden="true"/></a>)}</div>
      </section>
      <section className="m-steps" id="steps" aria-labelledby="mobile-steps-title">
        <h2 id="mobile-steps-title" className="m-visually-hidden">{copy.stepTitle}</h2>
        <Artwork name="journey-stations" className="m-stations-art"/>
        <ol>{copy.steps.map(([,title,body],i)=><li key={title}><span className="m-step-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
      </section>
      <section className="m-careers m-inset" id="careers"><div className="m-heading"><p className="m-eyebrow">{copy.careerEyebrow}</p><h2>{locale==='fr'?<>Votre métier.<br/><span>Votre prochaine étape.</span></>:copy.careerTitle}</h2><p>{copy.careerBody}</p></div><div className="m-career-grid">{copy.careers.map(([image,title],i)=><a href={`${AUTH}?sector=${['health','industry','logistics','it'][i]}`} key={image}><img src={`${CARDS}/${image}`} width="320" height="240" alt="" loading="lazy"/><div><h3>{title}</h3><ArrowRight aria-hidden="true"/></div></a>)}</div></section>
      <section className="m-future m-inset"><Artwork name="future-skyline"/><div><h2>{copy.futureTitle}</h2><p>{copy.futureBody}</p></div><div className="m-buttons">{buttons}</div></section>
      <section id="faq" className="m-faq m-inset"><details><summary>{t('Des questions ?','لديك أسئلة؟','Fragen?','Questions?')}<span>+</span></summary><div>{faq.slice(0,4).map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></details></section>
    </main>
    <footer className="m-footer m-inset"><img src="/landing-assets/amud-logo-brand.svg" width="54" height="54" alt="AMUD Skills"/><nav>{links.map(([href,label])=><a key={href} href={href}>{label}</a>)}</nav><p>© 2026 AMUD Skills · {t('Tous droits réservés.','جميع الحقوق محفوظة.','Alle Rechte vorbehalten.','All rights reserved.')}</p><small>{t('Des talents. Sans frontières.','مواهب بلا حدود.','Talente ohne Grenzen.','Talent without borders.')}</small></footer>
  </div>;
}
