'use client';

import {useEffect,useState} from 'react';
import {ArrowRight,ArrowUpRight,BarChart3,Camera,Check,ChevronDown,Compass,GraduationCap,MessageCircle,MessagesSquare,UserRound} from 'lucide-react';
import Image from 'next/image';
import {AUTH,RECRUIT,content,translator,type Locale} from '@/components/landing/content';
import {journeyCopy} from '@/components/landing/journey-copy';
import './reference.css';
import {PublicSiteHeader,PublicSiteFooter} from './PublicSiteChrome';

const MEDIA='/landing-assets/reference-v4';

function ResponsiveStepArtwork({ name }: { name: string }) {
  return <picture className="r-step-image">
    <source media="(min-width: 1024px)" srcSet={`${MEDIA}/${name}-desktop.webp`} type="image/webp"/>
    <source media="(min-width: 640px)" srcSet={`${MEDIA}/${name}-tablet.webp`} type="image/webp"/>
    <Image className="r-step-art" src={`${MEDIA}/${name}-mobile.webp`} alt="" width={1200} height={460} loading="lazy" decoding="async" unoptimized/>
  </picture>;
}

export default function ReferenceLanding({locale='fr'}:{locale?:Locale}){
  const t=translator(locale),copy=journeyCopy(locale),c=content(locale);
  const [motion,setMotion]=useState(false),[heroVideo,setHeroVideo]=useState(false),[heroSource,setHeroSource]=useState<'responsive'|'webm'|'mp4'>('responsive'),[allFaq,setAllFaq]=useState(false);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData=Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const update=()=>{setMotion(!query.matches);setHeroVideo(!query.matches&&!saveData);};
    update();query.addEventListener('change',update);
    return()=>query.removeEventListener('change',update);
  },[]);
  const steps=[
    {image:'profile',Icon:UserRound,title:c.steps[0][0],body:t('Créez votre profil et partagez votre parcours, vos motivations et vos centres d’intérêt.','أنشئ ملفك وشارك مسارك ودوافعك واهتماماتك.','Erstellen Sie Ihr Profil und teilen Sie Ihren Werdegang, Ihre Motivation und Interessen.','Create your profile and share your experience, motivation and interests.'),note:t('Un profil qui vous ressemble.','ملف يعكس شخصيتك.','Ein Profil, das zu Ihnen passt.','A profile that reflects you.')},
    {image:'skills',Icon:GraduationCap,title:c.steps[1][0],body:t('Ajoutez vos formations, expériences, compétences et langues.','أضف تكويناتك وخبراتك ومهاراتك ولغاتك.','Ergänzen Sie Ausbildungen, Erfahrungen, Kompetenzen und Sprachen.','Add your education, experience, skills and languages.'),note:t('Mettez en avant ce que vous savez faire.','أبرز ما تتقنه.','Zeigen Sie, was Sie können.','Show what you can do.')},
    {image:'video',Icon:Camera,title:c.steps[2][0],body:t('Enregistrez une courte vidéo pour montrer votre personnalité et votre motivation.','سجّل فيديو قصيرًا لإظهار شخصيتك ودوافعك.','Zeigen Sie Ihre Persönlichkeit und Motivation in einem kurzen Video.','Record a short video to show your personality and motivation.'),note:t('Parce qu’un visage dit souvent plus qu’un CV.','لأن الوجه يعبّر أحيانًا أكثر من السيرة الذاتية.','Ein Gesicht sagt oft mehr als ein Lebenslauf.','A face often says more than a CV.')},
    {image:'conversation',Icon:MessageCircle,title:c.steps[3][0],body:t('Votre profil devient visible et vous pouvez être contacté par des entreprises en Allemagne.','يصبح ملفك مرئيًا ويمكن للشركات في ألمانيا التواصل معك.','Ihr Profil wird sichtbar und Unternehmen in Deutschland können Sie kontaktieren.','Your profile becomes visible so companies in Germany can contact you.'),note:t('Échangez directement avec les employeurs.','تواصل مباشرة مع المشغّلين.','Sprechen Sie direkt mit Arbeitgebern.','Talk directly with employers.')},
  ];
  const levels=[
    {Icon:Compass,tone:'rose',title:t('Je découvre','أكتشف اللغة','Ich entdecke','I’m getting started'),body:t('Je ne parle pas encore allemand mais je souhaite commencer.','لا أتحدث الألمانية بعد، وأرغب في البدء.','Ich spreche noch kein Deutsch, möchte aber anfangen.','I don’t speak German yet, but I want to begin.')},
    {Icon:BarChart3,tone:'gold',title:t('J’apprends déjà','أتعلّم حاليًا','Ich lerne bereits','I’m already learning'),body:t('J’ai des bases en allemand et je veux progresser.','لدي أساسيات في الألمانية وأريد التقدم.','Ich habe Grundkenntnisse und möchte mich verbessern.','I know some German and want to progress.')},
    {Icon:MessagesSquare,tone:'green',title:t('Je parle allemand','أتحدث الألمانية','Ich spreche Deutsch','I speak German'),body:t('Je suis à l’aise en allemand et je veux trouver des opportunités.','أتقن الألمانية وأبحث عن فرص.','Ich spreche gut Deutsch und suche Chancen.','I’m comfortable with German and want to find opportunities.')},
  ];
  const faq=[
    [t('Le service est-il vraiment gratuit ?','هل الخدمة مجانية حقًا؟','Ist der Service wirklich kostenlos?','Is the service really free?'),c.faq[5][1]],
    [t('Est-ce que je peux m’inscrire sans parler allemand ?','هل يمكنني التسجيل دون التحدث بالألمانية؟','Kann ich mich ohne Deutschkenntnisse anmelden?','Can I join without speaking German?'),c.faq[0][1]],
    [t('Qui peut voir mon profil ?','من يمكنه رؤية ملفي؟','Wer kann mein Profil sehen?','Who can see my profile?'),c.faq[3][1]],
    [t('Comment sont sélectionnées les offres ?','كيف يتم اختيار الفرص؟','Wie werden Angebote ausgewählt?','How are opportunities selected?'),c.faq[4][1]],
    c.faq[1],c.faq[2],c.faq[6],
  ];
  return <div className="reference-home" data-motion={motion ? 'on' : 'off'} dir={locale==='ar'?'rtl':'ltr'} lang={locale}>
    <PublicSiteHeader locale={locale}/>
    <main id="main-content" className="r-container">
      <section className="r-hero" aria-labelledby="r-title">
        <div className="r-hero-media"><picture className="r-poster-picture"><source media="(min-width: 1024px)" srcSet="/landing-assets/hero/amud-journey-poster-desktop.webp" type="image/webp"/><source media="(min-width: 640px)" srcSet="/landing-assets/hero/amud-journey-poster-tablet.webp" type="image/webp"/><Image className="r-poster" src="/landing-assets/hero/amud-journey-poster-mobile.webp" alt="" width={1280} height={720} priority unoptimized/></picture>{heroVideo&&<video key={heroSource} autoPlay muted loop playsInline preload="none" poster="/landing-assets/hero/amud-journey-poster-mobile.webp" onError={(event)=>{if(heroSource==='responsive')setHeroSource(event.currentTarget.currentSrc.endsWith('.mp4')?'webm':'mp4');else if(heroSource==='webm')setHeroSource('mp4');else event.currentTarget.style.display='none';}} aria-hidden="true">{heroSource==='responsive'?<><source media="(max-width: 639px)" src="/landing-assets/hero/amud-journey-mobile.webm" type="video/webm"/><source src="/landing-assets/hero/amud-journey.mp4" type="video/mp4"/></>:<source src={heroSource==='webm'?'/landing-assets/hero/amud-journey-mobile.webm':'/landing-assets/hero/amud-journey.mp4'} type={heroSource==='webm'?'video/webm':'video/mp4'}/>}</video>}
        </div>
        <div className="r-hero-card"><p className="r-eyebrow">{copy.heroEyebrow}</p><h1 id="r-title">{copy.heroTitle}<span>{copy.heroAccent}</span></h1><p className="r-hero-description">{copy.heroBody}</p><div className="r-hero-buttons"><a className="r-button" href={AUTH}>{copy.create}<ArrowUpRight/></a><a className="r-button r-button--outline" href={RECRUIT}>{copy.recruit}</a></div><p className="r-note"><Check/>{copy.heroNote}</p></div>
      </section>
      <section className="r-process" id="parcours"><div className="r-heading"><p className="r-eyebrow">{t('VOTRE PARCOURS','مسارك','IHR WEG','YOUR JOURNEY')}</p><h2>{t('Votre profil, en','ملفك، في','Ihr Profil in','Your profile in')} <span>{t('quatre étapes.','أربع خطوات.','vier Schritten.','four steps.')}</span></h2><p>{t('Un parcours simple et guidé pour vous rapprocher des employeurs en Allemagne.','مسار بسيط وموجّه يقرّبك من المشغّلين في ألمانيا.','Ein einfacher, begleiteter Weg zu Arbeitgebern in Deutschland.','A simple, guided journey to connect with employers in Germany.')}</p></div>
        <ol className="r-step-list">{steps.map(({image,Icon,title,body,note},index)=><li className={`r-step r-step--${index%2?'reverse':'forward'}`} key={image}><ResponsiveStepArtwork name={image}/><div className="r-step-copy"><span className="r-step-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{body}</p></div></div><aside className="r-step-note"><span><Icon aria-hidden="true"/></span><p>{note}</p></aside></li>)}</ol>
      </section>
      <section className="r-start" id="commencer"><div className="r-heading"><p className="r-eyebrow">{t('COMMENCEZ AUJOURD’HUI','ابدأ اليوم','STARTEN SIE HEUTE','START TODAY')}</p><h2>{t('Avec ou sans allemand,','مع الألمانية أو بدونها،','Mit oder ohne Deutsch,','With or without German,')} <span>{t('commencez maintenant.','ابدأ الآن.','starten Sie jetzt.','start now.')}</span></h2><p>{t('Choisissez votre situation et découvrez le parcours adapté à votre profil.','اختر وضعك واكتشف المسار المناسب لملفك.','Wählen Sie Ihre Situation und entdecken Sie Ihren passenden Weg.','Choose your situation and discover the path that fits your profile.')}</p></div>
        <div className="r-levels">{levels.map(({Icon,tone,title,body})=><a href={AUTH} className={`r-level r-level--${tone}`} key={tone}><span className="r-level-icon"><Icon aria-hidden="true"/></span><div><h3>{title}</h3><p>{body}</p></div><ArrowRight className="r-level-arrow" aria-hidden="true"/></a>)}</div>
      </section>
      <section className="r-faq" id="faq"><div><p className="r-eyebrow">{t('QUESTIONS FRÉQUENTES','الأسئلة الشائعة','HÄUFIGE FRAGEN','FREQUENTLY ASKED QUESTIONS')}</p><h2>FAQ</h2><p>{t('Des réponses claires aux questions les plus courantes.','إجابات واضحة على الأسئلة الأكثر شيوعًا.','Klare Antworten auf häufige Fragen.','Clear answers to common questions.')}</p><button className="r-button r-button--outline" type="button" aria-expanded={allFaq} aria-controls="reference-faq-list" onClick={()=>setAllFaq(!allFaq)}>{allFaq?t('Réduire les questions','عرض أسئلة أقل','Weniger Fragen','Show fewer questions'):t('Voir toutes les questions','عرض جميع الأسئلة','Alle Fragen anzeigen','View all questions')}<ArrowRight/></button></div><div className="r-faq-list" id="reference-faq-list">{faq.slice(0,allFaq?faq.length:4).map(([question,answer])=><details key={question}><summary>{question}<ChevronDown aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <PublicSiteFooter locale={locale}/>
  </div>;
}
