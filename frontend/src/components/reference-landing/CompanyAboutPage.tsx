'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight, Check, Code2, Gamepad2, GraduationCap, Network, ShieldCheck, Smartphone, Wrench } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { submitContactMessage } from '@/lib/contactMessages';
import { translator, type Locale } from '@/components/landing/content';

const ASSETS = '/landing-assets/company';
const inputClass = 'w-full rounded-xl border border-[#eaded5] bg-white px-4 py-3 text-sm text-[#191b20] placeholder:text-[#777786] focus:border-[#ba303e] focus:outline-none focus:ring-2 focus:ring-[#ba303e]/15';

export function CompanyAboutPage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const services = [
    { Icon: Smartphone, image: 'apps.webp', title: t('Applications Android & iOS', 'تطبيقات Android وiOS', 'Android- und iOS-Apps', 'Android & iOS apps'), body: t('Nous concevons et développons des applications mobiles adaptées à vos utilisateurs et à vos objectifs.', 'نصمّم ونطوّر تطبيقات الهاتف بما يناسب المستخدمين وأهداف المشروع.', 'Wir konzipieren und entwickeln mobile Apps, die zu Ihren Nutzenden und Zielen passen.', 'We design and build mobile apps around your users and goals.'), alt: t('Téléphones et espace de conception d’application mobile', 'هواتف وواجهة تصميم تطبيق للهاتف', 'Smartphones und Arbeitsplatz für App-Entwicklung', 'Phones and a mobile app design workspace') },
    { Icon: Wrench, image: 'engineering.webp', title: t('Ingénierie & infrastructures numériques', 'الهندسة والبنية التحتية الرقمية', 'Technische Entwicklung & digitale Infrastruktur', 'Engineering & digital infrastructure'), body: t('Des solutions techniques et l’installation de réseaux numériques pour les entreprises.', 'حلول تقنية وتركيب شبكات رقمية للشركات.', 'Technische Lösungen und Installation digitaler Netzwerke für Unternehmen.', 'Technical solutions and digital network installation for businesses.'), alt: t('Maquette technique et équipements d’ingénierie numérique', 'نموذج تقني وتجهيزات للهندسة الرقمية', 'Technisches Modell und digitale Engineering-Ausrüstung', 'Technical model and digital engineering equipment') },
    { Icon: Gamepad2, image: 'games.webp', title: t('Jeux éducatifs & gamification', 'الألعاب التعليمية وGamification', 'Lernspiele & Gamification', 'Educational games & gamification'), body: t('Des jeux sérieux et des expériences interactives pour apprendre, s’exercer et progresser.', 'ألعاب جادة وتجارب تفاعلية للتعلّم والتدرب والتقدم.', 'Serious Games und interaktive Erlebnisse zum Lernen, Üben und Weiterkommen.', 'Serious games and interactive experiences for learning, practice and progress.'), alt: t('Parcours d’apprentissage interactif sous forme de jeu', 'مسار تعلّم تفاعلي بأسلوب الألعاب', 'Interaktiver Lernpfad in Spielform', 'Interactive learning path presented as a game') },
    { Icon: GraduationCap, image: 'training.webp', title: t('Formation continue', 'التكوين المستمر', 'Kontinuierliche Weiterbildung', 'Continuing education'), body: t('Nous mettons les entreprises en relation avec notre réseau de formateurs spécialisés en technologies, dont la cybersécurité.', 'نربط الشركات بشبكة مدرّبين متخصصين في التكنولوجيا، ومن ضمنها الأمن السيبراني.', 'Wir verbinden Unternehmen mit unserem Netzwerk spezialisierter Technologie-Trainer, unter anderem für Cybersicherheit.', 'We connect companies with specialist technology trainers, including in cybersecurity.'), alt: t('Formateur et participants lors d’une formation en cybersécurité', 'مدرّب ومشاركون في دورة للأمن السيبراني', 'Trainer und Teilnehmende in einer Cybersicherheitsschulung', 'Trainer and learners in a cybersecurity course') },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setError('');
    const localizedRequest = t('Demande de devis', 'طلب عرض سعر', 'Angebotsanfrage', 'Quote request');
    const serviceLabel = service || t('À préciser', 'يُحدّد لاحقًا', 'Noch offen', 'To be discussed');
    try {
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: `${localizedRequest} — ${serviceLabel}\n\n${message.trim()}`,
      });
      setStatus('success');
      setName(''); setEmail(''); setService(''); setMessage('');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof ApiError && cause.status === 422
        ? t('Vérifiez les informations saisies et réessayez.', 'تحقق من المعلومات المدخلة ثم حاول مجددًا.', 'Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.', 'Check your details and try again.')
        : t('Votre demande n’a pas pu être envoyée. Réessayez dans un instant.', 'تعذّر إرسال طلبك. حاول مجددًا بعد قليل.', 'Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es gleich noch einmal.', 'Your request could not be sent. Please try again shortly.'));
    }
  };

  return <div className="company-page" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
    <div id="main-content">
      <section className="company-hero" aria-labelledby="company-title">
        <div className="company-hero-copy">
          <p className="company-eyebrow">{t('AMUD SKILLS · EXPERTISES NUMÉRIQUES', 'AMUD SKILLS · خبرات رقمية', 'AMUD SKILLS · DIGITALE EXPERTISE', 'AMUD SKILLS · DIGITAL EXPERTISE')}</p>
          <h1 id="company-title">{t('La technologie au service de', 'التكنولوجيا في خدمة', 'Technologie im Dienst von', 'Technology in service of')}{' '}<span>{t('vos projets.', 'مشاريعكم.', 'Ihren Projekten.', 'your projects.')}</span></h1>
          <p className="company-lead">{t('Applications mobiles, ingénierie, infrastructures numériques, jeux éducatifs et formation continue : nous donnons forme à vos idées.', 'تطبيقات الهاتف والهندسة والبنية التحتية الرقمية والألعاب التعليمية والتكوين المستمر: نحوّل أفكاركم إلى حلول.', 'Mobile Apps, technische Entwicklung, digitale Infrastruktur, Lernspiele und Weiterbildung: Wir machen aus Ideen konkrete Lösungen.', 'Mobile apps, engineering, digital infrastructure, educational games and continuing education: we turn ideas into practical solutions.')}</p>
          <a className="company-button" href="#expertises">{t('Découvrir nos services', 'اكتشفوا خدماتنا', 'Unsere Leistungen entdecken', 'Explore our services')}<ArrowDown size={17}/></a>
          <p className="company-proof"><Check size={16}/>{t('Un partenaire pour vos projets et les compétences de vos équipes.', 'شريك لمشاريعكم وتطوير مهارات فرقكم.', 'Ein Partner für Ihre Projekte und die Kompetenzen Ihrer Teams.', 'A partner for your projects and your teams’ skills.')}</p>
        </div>
        <figure className="company-hero-art"><Image src={`${ASSETS}/hero.webp`} width={1185} height={755} alt={t('Maquette 3D réunissant applications, cybersécurité, ingénierie, jeu éducatif et formation', 'مجسم ثلاثي الأبعاد يجمع التطبيقات والأمن السيبراني والهندسة والألعاب التعليمية والتكوين', '3D-Miniaturlandschaft mit Apps, Cybersicherheit, Technik, Lernspielen und Weiterbildung', '3D miniature landscape showing apps, cybersecurity, engineering, educational games and training')} priority unoptimized/><figcaption>{t('Des idées connectées aux solutions.', 'أفكار مترابطة تتحول إلى حلول.', 'Vernetzte Ideen werden zu Lösungen.', 'Connected ideas, turned into solutions.')}</figcaption></figure>
      </section>

      <section id="expertises" className="company-services" aria-labelledby="services-title">
        <div className="company-section-heading"><p className="company-eyebrow">{t('NOS EXPERTISES', 'خبراتنا', 'UNSERE EXPERTISE', 'OUR EXPERTISE')}</p><h2 id="services-title">{t('Quatre expertises, un même objectif.', 'أربع خبرات، وهدف واحد.', 'Vier Kompetenzen, ein gemeinsames Ziel.', 'Four areas of expertise, one shared goal.')}</h2><p>{t('Des solutions pensées pour les besoins réels des entreprises.', 'حلول مصممة لتلبية احتياجات الشركات الفعلية.', 'Lösungen für die konkreten Bedürfnisse von Unternehmen.', 'Solutions shaped around real business needs.')}</p></div>
        <div className="company-service-grid">{services.map(({ Icon, image, title, body, alt }, index) => <article className={`company-service company-service--${index + 1}`} key={title}><div className="company-service-art"><Image src={`${ASSETS}/${image}`} width={index === 2 ? 880 : index === 3 ? 950 : 790} height={index === 2 ? 520 : index === 3 ? 410 : 390} alt={alt} loading="lazy" unoptimized/></div><div className="company-service-copy"><span className="company-service-icon"><Icon size={20}/></span><span className="company-service-number">0{index + 1}</span><h3>{title}</h3><p>{body}</p>{index === 1 && <span className="company-service-note"><Network size={15}/>{t('Réseaux pour les entreprises', 'شبكات مخصصة للشركات', 'Netzwerke für Unternehmen', 'Networks for businesses')}</span>}{index === 3 && <span className="company-service-note"><ShieldCheck size={15}/>{t('Cybersécurité et technologies', 'الأمن السيبراني والتكنولوجيا', 'Cybersicherheit und Technologie', 'Cybersecurity and technology')}</span>}</div></article>)}</div>
      </section>

      <section className="company-training" aria-labelledby="training-title"><div className="company-training-image"><Image src={`${ASSETS}/training.webp`} width={950} height={410} alt={services[3].alt} loading="lazy" unoptimized/></div><div className="company-training-copy"><p className="company-eyebrow">{t('FORMATION CONTINUE', 'التكوين المستمر', 'KONTINUIERLICHE WEITERBILDUNG', 'CONTINUING EDUCATION')}</p><h2 id="training-title">{t('La bonne formation, avec le bon expert.', 'التكوين المناسب مع الخبير المناسب.', 'Die passende Weiterbildung mit den richtigen Fachleuten.', 'The right training with the right expert.')}</h2><p>{t('Nous réunissons les besoins des entreprises et les compétences de notre réseau de formateurs en différents domaines technologiques.', 'نجمع بين احتياجات الشركات وخبرات شبكة المدرّبين لدينا في مجالات تقنية متعددة.', 'Wir bringen den Bedarf von Unternehmen und die Kompetenzen unseres Netzwerks aus Technologie-Trainerinnen und -Trainern zusammen.', 'We connect business needs with the expertise of our network of trainers across technology fields.')}</p><div className="company-training-tags"><span><ShieldCheck size={15}/>{t('Cybersécurité', 'الأمن السيبراني', 'Cybersicherheit', 'Cybersecurity')}</span><span><Code2 size={15}/>{t('Technologies', 'التكنولوجيا', 'Technologie', 'Technology')}</span><span><Network size={15}/>{t('Réseau de formateurs', 'شبكة المدرّبين', 'Trainer-Netzwerk', 'Trainer network')}</span></div></div></section>

      <section className="company-process" aria-labelledby="process-title"><div className="company-section-heading"><p className="company-eyebrow">{t('NOTRE APPROCHE', 'منهجيتنا', 'UNSER ANSATZ', 'HOW WE WORK')}</p><h2 id="process-title">{t('De votre besoin à la bonne solution.', 'من احتياجكم إلى الحل المناسب.', 'Vom Bedarf zur passenden Lösung.', 'From your needs to the right solution.')}</h2></div><div className="company-process-grid">{[
        [t('Écouter', 'الاستماع', 'Zuhören', 'Listen'), t('Nous précisons votre besoin, votre contexte et vos objectifs.', 'نحدّد احتياجكم وسياق العمل والأهداف.', 'Wir klären Ihren Bedarf, Kontext und Ihre Ziele.', 'We clarify your needs, context and goals.')],
        [t('Concevoir', 'التصميم', 'Konzipieren', 'Design'), t('Nous identifions l’approche technique, ludique ou pédagogique adaptée.', 'نختار النهج التقني أو التعليمي المناسب.', 'Wir finden den passenden technischen oder didaktischen Ansatz.', 'We shape the right technical or learning approach.')],
        [t('Réaliser', 'التنفيذ', 'Umsetzen', 'Deliver'), t('Nous développons, installons ou organisons la formation avec vous.', 'نطوّر الحل أو نركّبه أو ننظّم التكوين معكم.', 'Wir entwickeln, installieren oder organisieren die Weiterbildung gemeinsam mit Ihnen.', 'We build, install or coordinate training with you.')],
      ].map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

      <section id="demander-un-devis" className="company-quote"><div className="company-quote-intro"><p className="company-eyebrow">{t('PARLONS DE VOTRE PROJET', 'لنتحدث عن مشروعكم', 'LASSEN SIE UNS ÜBER IHR PROJEKT SPRECHEN', 'LET’S TALK ABOUT YOUR PROJECT')}</p><h2>{t('Vous avez un projet ?', 'هل لديكم مشروع؟', 'Sie haben ein Projekt?', 'Have a project in mind?')}</h2><p>{t('Décrivez-nous votre besoin. Nous reviendrons vers vous pour en discuter.', 'أخبرونا عن احتياجكم، وسنتواصل معكم لمناقشته.', 'Beschreiben Sie Ihren Bedarf. Wir melden uns, um die nächsten Schritte zu besprechen.', 'Tell us what you need. We’ll get back to discuss the next steps.')}</p></div><form className="company-quote-form" onSubmit={handleSubmit}>
        {status === 'success' ? <div className="company-form-success" role="status"><Check size={22}/><h3>{t('Merci pour votre demande.', 'شكرًا على طلبكم.', 'Vielen Dank für Ihre Anfrage.', 'Thank you for your request.')}</h3><p>{t('Votre demande de devis a bien été transmise.', 'تم إرسال طلب عرض السعر بنجاح.', 'Ihre Angebotsanfrage wurde übermittelt.', 'Your quote request has been sent.')}</p></div> : <>
          <div className="company-form-row"><label>{t('Votre nom', 'الاسم', 'Ihr Name', 'Your name')}<input className={inputClass} name="name" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} placeholder={t('Nom et prénom', 'الاسم الكامل', 'Vor- und Nachname', 'Full name')}/></label><label>{t('Votre e-mail', 'البريد الإلكتروني', 'Ihre E-Mail', 'Your email')}<input className={inputClass} type="email" name="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="nom@entreprise.com"/></label></div>
          <label>{t('Service concerné', 'الخدمة المطلوبة', 'Gewünschte Leistung', 'Service of interest')}<select className={inputClass} required value={service} onChange={event => setService(event.target.value)}><option value="">{t('Choisissez un service', 'اختاروا خدمة', 'Leistung auswählen', 'Select a service')}</option>{services.map(item => <option key={item.title} value={item.title}>{item.title}</option>)}</select></label>
          <label>{t('Votre besoin', 'تفاصيل الطلب', 'Ihr Anliegen', 'Your requirements')}<textarea className={inputClass} name="message" required rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder={t('Quelques mots sur votre projet…', 'اكتبوا نبذة عن مشروعكم…', 'Ein paar Worte zu Ihrem Projekt …', 'A few words about your project…')}/></label>
          {status === 'error' && <p className="company-form-error" role="alert">{error}</p>}
          <button className="company-button" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? t('Envoi…', 'جارٍ الإرسال…', 'Wird gesendet …', 'Sending…') : t('Demander un devis', 'طلب عرض سعر', 'Angebot anfragen', 'Request a quote')}<ArrowUpRight size={17}/></button>
        </>}
      </form></section>
    </div>
  </div>;
}
