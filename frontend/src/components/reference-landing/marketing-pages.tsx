import './reference-pages.css';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, ClipboardList, FileText, GraduationCap,
  Languages, MapPin, Search, Video,
} from 'lucide-react';
import Image from 'next/image';
import { RECRUIT, translator, type Locale } from '@/components/landing/content';

const ASSETS = '/landing-assets/marketing';

function MarketingImage({
  name, width, height, alt, priority = false,
}: { name: string; width: number; height: number; alt: string; priority?: boolean }) {
  const path = (size: 'desktop' | 'tablet' | 'mobile') => `${ASSETS}/${name}-${size}.webp`;
  return <picture className="marketing-picture">
    <source media="(min-width: 1024px)" srcSet={path('desktop')} type="image/webp"/>
    <source media="(min-width: 640px)" srcSet={path('tablet')} type="image/webp"/>
    <Image src={path('mobile')} width={width} height={height} alt={alt} priority={priority} loading={priority ? undefined : 'lazy'} decoding="async" unoptimized/>
  </picture>;
}

export function EmployersPage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const benefits = [
    [FileText, t('Des profils documentés', 'ملفات مهنية موثقة', 'Dokumentierte Profile', 'Documented profiles'), t('CV, parcours, compétences et diplômes rassemblés au même endroit.', 'السيرة والمسار والمهارات والشهادات في ملف واحد.', 'Lebenslauf, Werdegang, Kompetenzen und Abschlüsse an einem Ort.', 'CV, experience, skills and certificates together.')],
    [MapPin, t('Une recherche mieux ciblée', 'بحث أكثر دقة', 'Gezielter suchen', 'More focused search'), t('La localisation peut être proposée automatiquement, avec l’accord de la personne.', 'اقتراح الموقع تلقائيًا بعد موافقة المرشح.', 'Der Standort kann mit Zustimmung automatisch vorgeschlagen werden.', 'Location can be suggested automatically, with the candidate’s consent.')],
    [Languages, t('La langue en contexte', 'اللغة ضمن الصورة الكاملة', 'Sprache im Kontext', 'Language in context'), t('Repères de niveau et présentation vidéo en allemand pour mieux comprendre le profil.', 'مستوى اللغة وفيديو تعريفي بالألمانية لفهم الملف بشكل أفضل.', 'Sprachniveau und Vorstellungsvideo auf Deutsch geben ein klareres Bild.', 'Language level and a German introduction video add context to each profile.')],
  ] as const;
  const fields = [
    [FileText, t('CV et documents', 'السيرة والوثائق', 'Lebenslauf und Unterlagen', 'CV and documents')],
    [ClipboardList, t('Expériences', 'الخبرات', 'Erfahrungen', 'Experience')],
    [GraduationCap, t('Diplômes', 'الشهادات', 'Abschlüsse', 'Certificates')],
    [Video, t('Vidéo en allemand', 'فيديو بالألمانية', 'Video auf Deutsch', 'German introduction video')],
  ] as const;
  const profiles = [
    { image: 'candidate-woman.webp', alt: t('Portrait illustratif généré d’une candidate marocaine', 'صورة توضيحية مولّدة لمرشحة مغربية', 'Generiertes Beispielporträt einer marokkanischen Kandidatin', 'Generated illustrative portrait of a Moroccan candidate') },
    { image: 'candidate-man.webp', alt: t('Portrait illustratif généré d’un candidat marocain', 'صورة توضيحية مولّدة لمرشح مغربي', 'Generiertes Beispielporträt eines marokkanischen Kandidaten', 'Generated illustrative portrait of a Moroccan candidate') },
  ];

  return <div className="industry-page employers-page">
    <section className="section industry-hero">
      <div className="wrap industry-hero-grid">
        <div className="industry-hero-copy">
          <p className="eyebrow">{t('POUR LES ENTREPRISES', 'للشركات في ألمانيا', 'FÜR UNTERNEHMEN', 'FOR EMPLOYERS')}</p>
          <h1>{t('Trouvez les talents', 'اكتشفوا المواهب', 'Finden Sie Talente', 'Find the talent')} <span>{t('qui feront la différence.', 'التي تصنع الفرق.', 'die den Unterschied machen.', 'that make a difference.')}</span></h1>
          <p>{t('Découvrez des profils de talents au Maroc et explorez leur parcours, leurs compétences et leur présentation en allemand dans un espace clair.', 'اكتشفوا ملفات المواهب في المغرب واطّلعوا على مسارهم ومهاراتهم وتقديمهم لأنفسهم بالألمانية في مساحة واضحة.', 'Entdecken Sie Profile aus Marokko mit Werdegang, Kompetenzen und Vorstellung auf Deutsch an einem übersichtlichen Ort.', 'Discover talent profiles from Morocco, with experience, skills and German video introductions in one clear space.')}</p>
          <div className="actions"><a className="btn" href={RECRUIT}>{t('Explorer les profils', 'استكشفوا الملفات', 'Profile entdecken', 'Explore profiles')}<ArrowUpRight size={18}/></a><a className="text-link" href="#recherche">{t('Voir l’aperçu', 'شاهدوا المعاينة', 'Vorschau ansehen', 'See the preview')}<ArrowRight size={18}/></a></div>
          <p className="industry-note"><Check size={16}/>{t('CV, expériences, diplômes et vidéo : les éléments utiles réunis.', 'السيرة والخبرات والشهادات والفيديو في مكان واحد.', 'Lebenslauf, Erfahrung, Abschlüsse und Video zusammen an einem Ort.', 'CV, experience, certificates and video in one place.')}</p>
        </div>
        <figure className="industry-hero-art">
          <MarketingImage name="employer-hero" width={1600} height={566} alt={t('Un recruteur en Allemagne consulte un profil de talent venu du Maroc.', 'مشغّل في ألمانيا يطّلع على ملف موهبة من المغرب.', 'Ein Arbeitgeber in Deutschland sieht sich ein Talentprofil aus Marokko an.', 'An employer in Germany reviews a talent profile from Morocco.')} priority/>
          <figcaption><span className="country-dot"/> {t('Maroc ↔ Allemagne', 'المغرب ↔ ألمانيا', 'Marokko ↔ Deutschland', 'Morocco ↔ Germany')}</figcaption>
        </figure>
      </div>
    </section>

    <section className="industry-benefits" aria-label={t('Avantages pour les entreprises', 'مزايا للشركات', 'Vorteile für Unternehmen', 'Benefits for employers')}>
      <div className="wrap industry-benefit-grid">{benefits.map(([Icon, title, body]) => <article key={title}><span className="industry-icon"><Icon size={22}/></span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div>
    </section>

    <section id="recherche" className="section wrap industry-discovery">
      <div className="industry-section-heading"><p className="eyebrow">{t('DES PROFILS À DÉCOUVRIR', 'ملفات تستحق الاكتشاف', 'PROFILE ZU ENTDECKEN', 'PROFILES TO DISCOVER')}</p><h2>{t('Une vision plus complète, dès la recherche.', 'صورة أوضح منذ بداية البحث.', 'Schon bei der Suche den Überblick behalten.', 'See more from the very first search.')}</h2><p>{t('Des critères de recherche utiles, puis un profil structuré pour préparer une mise en relation pertinente.', 'معايير بحث عملية وملف منظم يهيئ لتواصل مناسب.', 'Sinnvolle Suchkriterien und ein strukturiertes Profil für passende Kontakte.', 'Useful search criteria, followed by a structured profile for a relevant introduction.')}</p></div>
      <div className="search-preview" aria-label={t('Aperçu illustratif de la recherche de talents', 'معاينة توضيحية للبحث عن المواهب', 'Illustrative Vorschau der Talentsuche', 'Illustrative talent search preview')}>
        <div className="search-preview-top"><div><span className="eyebrow">{t('APERÇU DE LA PLATEFORME', 'معاينة المنصة', 'PLATTFORM-VORSCHAU', 'PLATFORM PREVIEW')}</span><h3>{t('Rechercher des talents', 'البحث عن المواهب', 'Talente suchen', 'Search for talent')}</h3></div><span className="demo-badge">{t('DÉMONSTRATION', 'عرض توضيحي', 'DEMO', 'DEMO')}</span></div>
        <div className="search-filters" aria-label={t('Filtres de recherche illustratifs', 'فلاتر بحث توضيحية', 'Beispielfilter', 'Illustrative search filters')}>
          <span><Search size={16}/>{t('Métier ou compétence', 'مهنة أو مهارة', 'Beruf oder Kompetenz', 'Role or skill')}</span>
          <span><MapPin size={16}/>{t('Localisation · avec accord', 'الموقع · بعد الموافقة', 'Standort · mit Zustimmung', 'Location · with consent')}</span>
          <span><Languages size={16}/>{t('Niveau d’allemand', 'مستوى الألمانية', 'Deutschkenntnisse', 'German level')}</span>
          <a className="btn small" href={RECRUIT}>{t('Accéder à la recherche', 'الانتقال إلى البحث', 'Zur Suche', 'Open the search')}<ArrowUpRight size={16}/></a>
        </div>
        <div className="candidate-grid">{profiles.map((profile, index) => <article className="candidate-preview" key={profile.image}>
          <MarketingImage name={profile.image.replace('.webp', '')} width={800} height={1000} alt={profile.alt}/>
          <div className="candidate-copy"><span className="demo-badge">{t('PROFIL DE DÉMONSTRATION', 'ملف توضيحي', 'BEISPIELPROFIL', 'SAMPLE PROFILE')}</span><h3>{t('Profil anonymisé', 'ملف مجهول الهوية', 'Anonymisiertes Profil', 'Anonymised profile')}</h3><p>{t(index === 0 ? 'Parcours et compétences présentés dans un format lisible.' : 'Informations du profil regroupées pour faciliter la consultation.', index === 0 ? 'المسار والمهارات معروضة بصيغة واضحة.' : 'معلومات الملف مرتبة لتسهيل الاطلاع.', index === 0 ? 'Werdegang und Kompetenzen übersichtlich dargestellt.' : 'Profilinformationen übersichtlich zusammengefasst.', index === 0 ? 'Experience and skills shown in a clear format.' : 'Profile information grouped for easier review.')}</p><div className="candidate-tags">{fields.map(([FieldIcon, label]) => <span key={label}><FieldIcon size={14}/>{label}</span>)}</div><small>{t('Portrait et contenu de profil illustratifs, sans données de candidats réels.', 'الصورة ومحتوى الملف توضيحيان وليسا بيانات مرشحين حقيقيين.', 'Porträt und Profildaten sind illustrativ, keine echten Bewerberdaten.', 'Portrait and profile content are illustrative, not real candidate data.')}</small></div>
        </article>)}</div>
      </div>
    </section>

    <section className="section industry-match">
      <div className="wrap"><div className="industry-section-heading"><p className="eyebrow">{t('UNE RECHERCHE MIEUX GUIDÉE', 'بحث مدعوم بإرشاد أوضح', 'BESSER GEFÜHRTE SUCHE', 'A BETTER-GUIDED SEARCH')}</p><h2>{t('Les bons critères, au bon endroit.', 'المعايير المناسبة في المكان المناسب.', 'Die passenden Kriterien am richtigen Ort.', 'The right criteria, in the right place.')}</h2><p>{t('Une recherche assistée pour rapprocher les besoins de votre entreprise des informations disponibles dans les profils.', 'بحث مساعد يربط احتياجات شركتكم بالمعلومات المتاحة في الملفات.', 'Eine unterstützte Suche bringt Ihren Bedarf mit den verfügbaren Profilangaben zusammen.', 'Assisted search connects your needs with the information available in profiles.')}</p></div>
        <div className="matching-features">{benefits.map(([Icon, title, body]) => <article key={title}><span className="industry-icon"><Icon size={24}/></span><h3>{title}</h3><p>{body}</p></article>)}</div>
        <a className="btn" href={RECRUIT}>{t('Découvrir l’espace recruteur', 'اكتشفوا فضاء المشغّلين', 'Arbeitgeberbereich entdecken', 'Explore the employer space')}<ArrowUpRight size={18}/></a>
      </div>
    </section>
  </div>;
}

export function TrainingCentrePage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const modules = [
    ['learners', t('Apprenants', 'المتعلمون', 'Lernende', 'Learners'), t('Profils et suivi du parcours.', 'الملفات ومتابعة المسار.', 'Profile und Lernfortschritt.', 'Profiles and learning progress.'), t('Illustration 3D d’un profil apprenant avec un dossier.', 'رسم ثلاثي الأبعاد لملف متعلم ووثائقه.', '3D-Illustration eines Lernendenprofils mit Unterlagen.', '3D illustration of a learner profile and documents.')],
    ['teachers', t('Enseignants', 'الأساتذة', 'Lehrkräfte', 'Teachers'), t('Équipe, groupes et accompagnement.', 'الفريق والمجموعات والمتابعة.', 'Team, Gruppen und Betreuung.', 'Team, groups and support.'), t('Illustration 3D d’un enseignant devant un tableau.', 'رسم ثلاثي الأبعاد لأستاذ أمام سبورة.', '3D-Illustration einer Lehrkraft an der Tafel.', '3D illustration of a teacher at a board.')],
    ['courses', t('Formations', 'التكوينات', 'Kurse', 'Courses'), t('Programmes de langue et contenus.', 'برامج اللغة والمحتوى.', 'Sprachprogramme und Inhalte.', 'Language programmes and content.'), t('Illustration 3D d’un livre de cours d’allemand.', 'رسم ثلاثي الأبعاد لكتاب لتعلم الألمانية.', '3D-Illustration eines Deutschlehrbuchs.', '3D illustration of a German course book.')],
    ['planning', t('Planning', 'الجدولة', 'Planung', 'Schedule'), t('Cours et organisation du temps.', 'الدروس وتنظيم الوقت.', 'Kurse und Zeitplanung.', 'Courses and scheduling.'), t('Illustration 3D d’un calendrier de formation.', 'رسم ثلاثي الأبعاد لجدول التكوين.', '3D-Illustration eines Kurskalenders.', '3D illustration of a training calendar.')],
    ['attendance', t('Présences', 'الحضور', 'Anwesenheit', 'Attendance'), t('Suivi clair des séances.', 'متابعة واضحة للحصص.', 'Übersichtliche Erfassung.', 'Clear session tracking.'), t('Illustration 3D d’une liste de présence validée.', 'رسم ثلاثي الأبعاد للائحة حضور مؤكدة.', '3D-Illustration einer bestätigten Anwesenheitsliste.', '3D illustration of a checked attendance list.')],
    ['payments', t('Paiements', 'المدفوعات', 'Zahlungen', 'Payments'), t('Paiements des apprenants et rémunérations.', 'مدفوعات المتعلمين ومستحقات الأساتذة.', 'Lernendenzahlungen und Vergütungen.', 'Learner payments and teacher remuneration.'), t('Illustration 3D d’un paiement sécurisé.', 'رسم ثلاثي الأبعاد لعملية دفع آمنة.', '3D-Illustration einer sicheren Zahlung.', '3D illustration of a secure payment.')],
  ] as const;

  return <div className="industry-page centre-page">
    <section className="section industry-hero centre-hero">
      <div className="wrap industry-hero-grid">
        <div className="industry-hero-copy"><p className="eyebrow">{t('POUR LES CENTRES DE FORMATION', 'لمراكز التكوين', 'FÜR BILDUNGSZENTREN', 'FOR TRAINING CENTRES')}</p><h1>{t('Pilotez vos formations', 'أديروا تكويناتكم', 'Behalten Sie Ihre Kurse im Blick', 'Manage your training')} <span>{t('en toute clarté.', 'بكل وضوح.', 'mit Klarheit.', 'with clarity.')}</span></h1><p>{t('Une solution connectée pour organiser les cours d’allemand, coordonner l’équipe pédagogique et accompagner les apprenants.', 'منصة مترابطة لتنظيم دروس الألمانية وتنسيق فريق التدريس ومواكبة المتعلمين.', 'Eine vernetzte Lösung für Deutschkurse, Lehrkräfte und die Begleitung der Lernenden.', 'A connected solution to organise German courses, coordinate teachers and support learners.')}</p><div className="actions"><a className="btn" href="#gestion-centre">{t('Découvrir la gestion du centre', 'اكتشفوا إدارة المركز', 'Zentrumsverwaltung entdecken', 'Explore centre management')}<ArrowUpRight size={18}/></a><a className="text-link" href="#espace-apprenant">{t('Voir le lien avec les apprenants', 'شاهدوا كيف نتصل بالمتعلمين', 'Lernendenbereich ansehen', 'See the learner connection')}<ArrowRight size={18}/></a></div><p className="industry-note"><Check size={16}/>{t('Enseignants, apprenants, cours et suivi réunis.', 'الأساتذة والمتعلمون والدروس والمتابعة في مكان واحد.', 'Lehrkräfte, Lernende, Kurse und Fortschritt an einem Ort.', 'Teachers, learners, courses and progress in one place.')}</p></div>
        <figure className="industry-hero-art"><MarketingImage name="training-classroom" width={1600} height={694} alt={t('Une enseignante accompagne des apprenants adultes dans une classe de langue au Maroc.', 'أستاذة تواكب متعلمين بالغين في حصة لغة بالمغرب.', 'Eine Lehrerin begleitet erwachsene Lernende in einem Sprachkurs in Marokko.', 'A teacher supports adult learners in a language class in Morocco.')} priority/><figcaption><span className="country-dot"/>{t('Apprendre · organiser · accompagner', 'تعلّم · تنظيم · مواكبة', 'Lernen · organisieren · begleiten', 'Learn · organise · support')}</figcaption></figure>
      </div>
    </section>

    <section id="gestion-centre" className="section wrap centre-product-section"><div className="industry-section-heading"><p className="eyebrow">{t('LE CRM DU CENTRE', 'نظام إدارة مركز التكوين', 'DAS CRM FÜR IHR ZENTRUM', 'THE CENTRE CRM')}</p><h2>{t('Le planning au cœur de votre organisation.', 'الجدولة في قلب تنظيمكم.', 'Der Stundenplan als Herzstück Ihrer Organisation.', 'A clear schedule at the heart of your centre.')}</h2><p>{t('Un aperçu de la manière dont les cours, les groupes, les enseignants et le suivi peuvent se retrouver dans un même espace.', 'معاينة لكيفية جمع الدروس والمجموعات والأساتذة والمتابعة في مساحة واحدة.', 'Eine Vorschau darauf, wie Kurse, Gruppen, Lehrkräfte und Betreuung an einem Ort zusammenkommen.', 'A preview of courses, groups, teachers and learner support brought together.')}</p></div>
      <figure className="centre-planning-visual"><MarketingImage name="centre-planning" width={1536} height={1024} alt={t('Aperçu AMUD Skills du planning hebdomadaire et de la liste des cours sur ordinateur.', 'معاينة من AMUD Skills لجدول أسبوعي وقائمة الدروس على الحاسوب.', 'AMUD-Skills-Vorschau eines Wochenplans mit Kursliste am Computer.', 'AMUD Skills preview of a weekly schedule and course list on a laptop.')} priority/><figcaption>{t('Interface illustrative — les cours et participants affichés sont fictifs.', 'واجهة توضيحية — الدروس والمشاركون الظاهرون أمثلة افتراضية.', 'Illustrative Oberfläche — Kurse und Teilnehmende sind Beispiele.', 'Illustrative interface — courses and participants shown are examples.')}</figcaption></figure>
    </section>

    <section id="espace-apprenant" className="section learner-connection"><div className="wrap learner-connection-grid"><div><p className="eyebrow">{t('DU CENTRE À L’APPRENANT', 'من المركز إلى المتعلم', 'VOM ZENTRUM ZU DEN LERNENDEN', 'FROM CENTRE TO LEARNER')}</p><h2>{t('Un même parcours, au centre et sur mobile.', 'مسار واحد في المركز وعلى الهاتف.', 'Ein gemeinsamer Lernweg, im Zentrum und mobil.', 'One learning journey, at the centre and on mobile.')}</h2><p>{t('Les apprenants retrouvent leurs cours, leur planning et les informations utiles sur mobile. Le centre garde une vue organisée de son activité.', 'يجد المتعلمون دروسهم وجدولهم ومعلوماتهم على الهاتف، فيما يحتفظ المركز برؤية منظمة لعمله.', 'Lernende sehen Kurse, Planung und wichtige Informationen mobil. Das Zentrum behält den Überblick.', 'Learners can see courses, schedules and useful details on mobile while the centre keeps an organised view.')}</p><div className="learner-benefits">{[t('Cours et ressources', 'الدروس والموارد', 'Kurse und Materialien', 'Courses and resources'), t('Planning personnel', 'الجدول الشخصي', 'Persönlicher Plan', 'Personal schedule'), t('Présences et suivi', 'الحضور والمتابعة', 'Anwesenheit und Fortschritt', 'Attendance and progress')].map(item=><span key={item}><Check size={16}/>{item}</span>)}</div></div><figure className="learner-phone-wrap"><MarketingImage name="centre-app-phone" width={1024} height={1536} alt={t('Téléphone présentant une application de formation avec microphone, planning, présence et progression en allemand.', 'هاتف يعرض تطبيق تكوين يضم الميكروفون والجدول والحضور والتقدم باللغة الألمانية.', 'Smartphone mit Lern-App für Mikrofon, Stundenplan, Anwesenheit und Lernfortschritt auf Deutsch.', 'Phone showing a learning app with microphone practice, schedule, attendance and German-language progress.')}/><span className="learner-app-brand" aria-hidden="true"><Image src="/landing-assets/amud-logo-brand.svg" width={52} height={52} alt="" unoptimized/></span></figure></div></section>

    <section className="section wrap centre-modules-section"><div className="industry-section-heading"><p className="eyebrow">{t('VOTRE CENTRE, MIEUX CONNECTÉ', 'مركزكم أكثر ترابطًا', 'IHR ZENTRUM BESSER VERNETZT', 'YOUR CENTRE, BETTER CONNECTED')}</p><h2>{t('Tout le suivi, sans disperser l’équipe.', 'كل المتابعة دون تشتيت الفريق.', 'Alles im Blick, ohne das Team zu zerstreuen.', 'One clear view for the whole team.')}</h2></div><div className="centre-module-grid">{modules.map(([slug,title,body,alt])=><article key={slug}><span className="centre-module-image"><MarketingImage name={`module-${slug}`} width={360} height={360} alt={alt}/></span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="section centre-faq-section"><div className="wrap centre-faq-grid"><figure className="centre-faq-visual"><MarketingImage name="centre-faq" width={1254} height={1254} alt={t('Une apprenante et une enseignante consultent ensemble les informations de formation sur un téléphone.', 'متعلّمة وأستاذة تراجعان معًا معلومات التكوين على الهاتف.', 'Eine Lernende und eine Lehrkraft sehen sich gemeinsam Kursinformationen auf einem Smartphone an.', 'A learner and teacher review training information together on a phone.')}/></figure><div className="centre-faq-copy"><p className="eyebrow">{t('QUESTIONS FRÉQUENTES', 'أسئلة شائعة', 'HÄUFIGE FRAGEN', 'FREQUENTLY ASKED QUESTIONS')}</p><h2>{t('Vous avez des questions sur le CRM ?', 'لديكم أسئلة حول نظام إدارة المركز؟', 'Fragen zum CRM?', 'Questions about the centre CRM?')}</h2><p>{t('Voici des réponses simples sur l’organisation du centre et l’espace des apprenants.', 'إجابات واضحة حول تنظيم المركز ومساحة المتعلمين.', 'Klare Antworten zur Organisation des Zentrums und zum Lernendenbereich.', 'Clear answers about centre operations and the learner space.')}</p><div className="centre-faq-list">{[
        [t('Que peut gérer l’équipe du centre ?', 'ما الذي يستطيع فريق المركز إدارته؟', 'Was kann das Zentrumsteam verwalten?', 'What can the centre team manage?'), t('Les apprenants, enseignants, formations, présences, paiements et plannings peuvent être réunis dans un même espace.', 'يمكن جمع إدارة المتعلمين والأساتذة والتكوينات والحضور والمدفوعات والجداول في مساحة واحدة.', 'Lernende, Lehrkräfte, Kurse, Anwesenheit, Zahlungen und Planung lassen sich an einem Ort verwalten.', 'Learners, teachers, courses, attendance, payments and schedules can be managed in one place.')],
        [t('Les apprenants ont-ils un espace mobile ?', 'هل يتوفر للمتعلمين فضاء على الهاتف؟', 'Gibt es einen mobilen Bereich für Lernende?', 'Do learners get a mobile space?'), t('Oui. Ils peuvent consulter leurs cours, leur planning, leurs présences et leur progression sur téléphone.', 'نعم، يمكنهم الاطلاع على الدروس والجدول والحضور والتقدم عبر الهاتف.', 'Ja. Sie können Kurse, Planung, Anwesenheit und Fortschritt mobil einsehen.', 'Yes. They can review courses, schedules, attendance and progress on mobile.')],
        [t('Le planning affiché correspond-il à des données réelles ?', 'هل الجدول المعروض يحتوي بيانات حقيقية؟', 'Zeigt der Stundenplan echte Daten?', 'Does the displayed schedule contain real data?'), t('Non. Les captures et exemples de cette page sont illustratifs ; les données réelles dépendent du compte du centre.', 'لا. المعاينات والأمثلة في هذه الصفحة توضيحية، أما البيانات الفعلية فتعتمد على حساب المركز.', 'Nein. Ansichten und Beispiele auf dieser Seite sind illustrativ; Echtdaten hängen vom Zentrumskonto ab.', 'No. Screens and examples here are illustrative; real data depends on the centre account.')],
        [t('Comment découvrir le CRM ?', 'كيف يمكن اكتشاف نظام إدارة المركز؟', 'Wie kann ich das CRM kennenlernen?', 'How can I explore the CRM?'), t('Utilisez le bouton de découverte en haut de page pour accéder à l’espace CRM du centre.', 'استخدموا زر اكتشاف النظام أعلى الصفحة للانتقال إلى فضاء إدارة المركز.', 'Über die Schaltfläche oben gelangen Sie zum CRM-Bereich des Zentrums.', 'Use the discovery button at the top of the page to open the centre CRM space.')],
      ].map(([question,answer])=><details key={question}><summary>{question}<ChevronDown size={17} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></div></div></section>
  </div>;
}

