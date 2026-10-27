'use client';

import { ArrowLeft, ArrowUpRight, CalendarDays, Target } from 'lucide-react';
import { translator, type Locale } from '@/components/landing/content';
import { SequentialLandingImage } from './LandingMotion';

import { SectorHero } from './SectorComponents';
import { StartupGoalsVisual, StartupSections } from './StartupSections';

const ASSETS = '/landing-assets/company';

export function StartupProfilePage({ locale }: { locale: Locale }) {
  const t = translator(locale);

  return <div className="startup-editorial" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
    <div>
      <SectorHero eyebrow={t('AMUD SKILLS · PROFIL DE LA STARTUP', 'AMUD SKILLS · ملف الشركة الناشئة', 'AMUD SKILLS · STARTUP-PROFIL', 'AMUD SKILLS · STARTUP PROFILE')} title={t('Une startup numérique, portée par une ambition claire.', 'شركة رقمية ناشئة برؤية وأهداف واضحة.', 'Ein Digital-Startup mit klarer Vision.', 'A digital startup with a clear ambition.')} intro={t('Découvrez notre histoire, notre équipe dirigeante et les objectifs qui guident AMUD Skills.', 'تعرّفوا على قصتنا وفريق القيادة والأهداف التي توجه AMUD Skills.', 'Erfahren Sie mehr über unsere Geschichte, unser Führungsteam und die Ziele von AMUD Skills.', 'Learn about our story, leadership team and the goals guiding AMUD Skills.')} image="startup" alt={t('Illustration de coopération entre talents et entreprises du Maroc et d’Allemagne','تصور توضيحي للتعاون بين المواهب والشركات في المغرب وألمانيا','Illustration der Zusammenarbeit zwischen Talenten und Unternehmen in Marokko und Deutschland','Illustration of cooperation between talent and businesses in Morocco and Germany')}><a className="sector-button" href="/notre-entreprise#demander-un-devis">{t('Parlons de votre projet','لنتحدث عن مشروعكم','Sprechen wir über Ihr Projekt','Let’s talk about your project')}<ArrowUpRight size={18}/></a><a className="sector-text-link" href="#startup-services">{t('Nos services','خدماتنا','Unsere Leistungen','Our services')}</a></SectorHero>

      <section className="company-startup-profile" id="profil-startup" aria-labelledby="startup-profile-title">
        <div className="company-startup-overview">
          <p className="company-eyebrow">{t('PROFIL DE LA STARTUP', 'نبذة عن الشركة الناشئة', 'STARTUP-PROFIL', 'STARTUP PROFILE')}</p>
          <h2 id="startup-profile-title">{t('AMUD Skills, une startup tournée vers le numérique et les compétences.', 'AMUD Skills شركة ناشئة تجمع بين الحلول الرقمية وتطوير المهارات.', 'AMUD Skills: ein Startup für digitale Lösungen und Kompetenzen.', 'AMUD Skills: a startup focused on digital solutions and skills.')}</h2>
          <p>{t('Fondée au Maroc, AMUD Skills conçoit des solutions numériques et relie les besoins des organisations aux compétences technologiques. Son activité associe développement d’applications, ingénierie numérique, apprentissage par le jeu et formation continue.', 'تأسست AMUD Skills في المغرب لتطوير حلول رقمية وربط احتياجات المؤسسات بالمهارات التقنية. تجمع أنشطتها بين تطوير التطبيقات والهندسة الرقمية والتعلّم بالألعاب والتكوين المستمر.', 'AMUD Skills wurde in Marokko gegründet und entwickelt digitale Lösungen, die den Bedarf von Organisationen mit technischen Kompetenzen verbinden. Das Angebot umfasst Apps, digitales Engineering, spielerisches Lernen und Weiterbildung.', 'Founded in Morocco, AMUD Skills builds digital solutions and connects organisations’ needs with technology skills. Its work spans app development, digital engineering, game-based learning and continuing education.')}</p>
        </div>
        <div className="company-startup-facts" aria-label={t('Informations sur la startup', 'معلومات عن الشركة الناشئة', 'Informationen zum Startup', 'Startup information')}>
          <article className="company-startup-founded"><span className="company-startup-fact-icon"><CalendarDays size={19}/></span><p>{t('Date de création', 'تاريخ التأسيس', 'Gründungsdatum', 'Founded')}</p><strong>{t('10 septembre 2026', '10 سبتمبر 2026', '10. September 2026', '10 September 2026')}</strong></article>
          <article className="company-founder-card"><a href="https://www.linkedin.com/in/yacineboulyali/" target="_blank" rel="noreferrer"><SequentialLandingImage src={`${ASSETS}/yacine-boulyali.png`} width={160} height={160} alt={t('Portrait de Yacine Boulyali', 'صورة ياسين بوليالي', 'Porträt von Yacine Boulyali', 'Portrait of Yacine Boulyali')}/><span><p>{t('CEO', 'المدير التنفيذي', 'CEO', 'CEO')}</p><strong>Yacine Boulyali</strong><small>LinkedIn <ArrowUpRight size={13}/></small></span></a></article>
          <article className="company-founder-card"><a href="https://www.linkedin.com/in/ayoub-boukyoud/" target="_blank" rel="noreferrer"><SequentialLandingImage src={`${ASSETS}/ayoub-boukyoud.jpg`} width={160} height={160} alt={t('Portrait d’Ayoub Boukyoud', 'صورة أيوب بوكيوض', 'Porträt von Ayoub Boukyoud', 'Portrait of Ayoub Boukyoud')}/><span><p>{t('CTO', 'المدير التقني', 'CTO', 'CTO')}</p><strong>Ayoub Boukyoud</strong><small>LinkedIn <ArrowUpRight size={13}/></small></span></a></article>
        </div>
        <div className="company-startup-goals">
          <div className="company-startup-goals-heading"><span className="company-startup-fact-icon"><Target size={19}/></span><div><p className="company-eyebrow">{t('NOTRE CAP', 'وجهتنا', 'UNSER ZIEL', 'OUR DIRECTION')}</p><h3>{t('Nos objectifs', 'أهدافنا', 'Unsere Ziele', 'Our goals')}</h3></div></div>
          <StartupGoalsVisual locale={locale}/>
          <div className="company-startup-goals-grid">
            <article><span>01</span><h4>{t('Accélérer la transformation numérique', 'تسريع التحول الرقمي', 'Die digitale Transformation voranbringen', 'Advance digital transformation')}</h4><p>{t('Créer des applications et installer des infrastructures numériques adaptées aux besoins des entreprises.', 'إنشاء تطبيقات وتركيب بنية تحتية رقمية تستجيب لاحتياجات الشركات.', 'Apps entwickeln und digitale Infrastrukturen passend zum Bedarf von Unternehmen einrichten.', 'Build applications and digital infrastructure that respond to organisations’ needs.')}</p></article>
            <article><span>02</span><h4>{t('Développer les compétences technologiques', 'تطوير المهارات التكنولوجية', 'Technologiekompetenzen entwickeln', 'Develop technology skills')}</h4><p>{t('Faciliter l’accès à la formation continue grâce à un réseau de formateurs spécialisés, notamment en cybersécurité.', 'تسهيل الوصول إلى التكوين المستمر عبر شبكة من المدربين المتخصصين، خصوصًا في الأمن السيبراني.', 'Weiterbildung durch ein Netzwerk spezialisierter Trainerinnen und Trainer zugänglich machen, insbesondere im Bereich Cybersicherheit.', 'Make continuing education accessible through a network of specialist trainers, including in cybersecurity.')}</p></article>
            <article><span>03</span><h4>{t('Rendre l’apprentissage plus engageant', 'جعل التعلّم أكثر تفاعلًا', 'Lernen ansprechender gestalten', 'Make learning more engaging')}</h4><p>{t('Concevoir des jeux sérieux et des expériences de gamification qui aident à apprendre, pratiquer et progresser.', 'تصميم ألعاب جادة وتجارب تحفيزية تساعد على التعلّم والتطبيق والتطور.', 'Serious Games und Gamification-Erlebnisse entwickeln, die Lernen, Üben und Fortschritt unterstützen.', 'Create serious games and gamified experiences that support learning, practice and progress.')}</p></article>
          </div>
        </div>
      </section>

      <StartupSections locale={locale}/>
      <div className="company-startup-page-actions">
        <a className="company-startup-back-link" href="/notre-entreprise"><ArrowLeft size={17}/>{t('Retour à nos services', 'العودة إلى خدماتنا', 'Zurück zu unseren Leistungen', 'Back to our services')}</a>
        <a className="sector-button" href="/notre-entreprise#demander-un-devis">{t('Demander un devis', 'طلب عرض سعر', 'Angebot anfragen', 'Request a quote')}<ArrowUpRight size={17}/></a>
      </div>
    </div>
  </div>;
}
