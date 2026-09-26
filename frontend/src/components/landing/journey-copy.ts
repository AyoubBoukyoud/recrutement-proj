import {translator,type Locale} from './content';

// Shared wording: desktop, tablet and mobile use the same translated content.
export function journeyCopy(locale:Locale){
  const t=translator(locale);
  return {
    heroEyebrow: t("DU PROFIL À L’OPPORTUNITÉ","من الملف إلى الفرصة","VOM PROFIL ZUR CHANCE","FROM PROFILE TO OPPORTUNITY"),
    heroTitle: t('Un profil vivant','ملف مهني حي','Ein lebendiges Profil','A living profile'),
    heroAccent: t('pour aller plus loin.','للوصول إلى أبعد.','für den nächsten Schritt.','to go further.'),
    heroBody: t("AMUD Skills donne aux étudiants et chercheurs d’emploi une voie claire vers les employeurs en Allemagne.","تمنح AMUD Skills الطلاب والباحثين عن عمل مسارًا واضحًا نحو المشغّلين في ألمانيا.","AMUD Skills eröffnet Studierenden und Arbeitssuchenden einen klaren Weg zu Arbeitgebern in Deutschland.","AMUD Skills gives students and job seekers a clear path to employers in Germany."),
    create: t('Construire mon profil','بناء ملفي','Profil erstellen','Build my profile'),
    recruit: t('Rechercher des talents','البحث عن مواهب','Talente finden','Find talent'),
    heroNote: t('Avec ou sans allemand, votre parcours peut commencer.','مع الألمانية أو بدونها، يمكن لمسارك أن يبدأ.','Mit oder ohne Deutsch kann Ihr Weg beginnen.','With or without German, your journey can begin.'),
    borderEyebrow: t('DES TALENTS AUX OPPORTUNITÉS','من المواهب إلى الفرص','VON TALENTEN ZU CHANCEN','FROM TALENT TO OPPORTUNITY'),
    borderTitle: t("Les compétences n’ont pas de frontières.","المهارات لا تعرف الحدود.","Kompetenzen kennen keine Grenzen.","Skills know no borders."),
    borderBody: t("Nous rapprochons les talents du Maroc des entreprises en Allemagne, pour construire des parcours professionnels durables.","نقرّب المواهب في المغرب من الشركات في ألمانيا لبناء مسارات مهنية مستدامة.","Wir bringen Talente aus Marokko mit Unternehmen in Deutschland zusammen.","We connect talent in Morocco with companies in Germany."),
    stepEyebrow: t('UN PARCOURS SIMPLE ET CLAIR','مسار بسيط وواضح','EIN KLARER WEG','A SIMPLE, CLEAR JOURNEY'),
    stepTitle: t('Votre profil, en quatre étapes.','ملفك في أربع خطوات.','Ihr Profil in vier Schritten.','Your profile in four steps.'),
    stepBody: t('Un profil complet vous rapproche des bonnes opportunités.','ملف متكامل يقربك من الفرص المناسبة.','Ein vollständiges Profil bringt Sie passenden Chancen näher.','A complete profile brings you closer to the right opportunities.'),
    careerEyebrow: t('DES SECTEURS QUI RECRUTENT','قطاعات توظف','BRANCHEN MIT BEDARF','SECTORS HIRING'),
    careerTitle: t('Votre métier. Votre prochaine étape.','مهنتك. خطوتك القادمة.','Ihr Beruf. Ihr nächster Schritt.','Your profession. Your next step.'),
    careerBody: t('Découvrez des secteurs qui recrutent en Allemagne et trouvez votre voie.','اكتشف القطاعات التي توظف في ألمانيا.','Entdecken Sie Branchen mit Bedarf.','Explore sectors hiring in Germany.'),
    futureTitle: t('Et si la suite commençait ici ?','ماذا لو بدأت الخطوة القادمة هنا؟','Was, wenn es hier weitergeht?','What if your next step started here?'),
    futureBody: t("Créez votre profil dès aujourd’hui et faites le premier pas vers votre avenir en Allemagne.","أنشئ ملفك اليوم وخذ الخطوة الأولى نحو مستقبلك في ألمانيا.","Erstellen Sie heute Ihr Profil und machen Sie den ersten Schritt.","Create your profile today and take the first step toward your future in Germany."),
    steps: [
    ['station-profile.svg',t('Présentez-vous','عرّف بنفسك','Stellen Sie sich vor','Introduce yourself'),t('Votre métier, votre parcours et vos ambitions.','مهنتك ومسارك وطموحاتك.','Beruf, Werdegang und Ziele.','Your profession, experience and ambitions.')],
    ['station-skills.svg',t('Vos compétences','مهاراتك','Ihre Kompetenzen','Your skills'),t('Expériences, CV, diplômes et savoir-faire.','خبراتك وسيرتك وشهاداتك.','Erfahrung, Lebenslauf und Abschlüsse.','Experience, CV, qualifications and skills.')],
    ['station-video.svg',t('Votre vidéo','فيديو التعريف','Ihr Video','Your video'),t('Exprimez votre personnalité et votre motivation.','أظهر شخصيتك ودوافعك.','Zeigen Sie Persönlichkeit und Motivation.','Show your personality and motivation.')],
    ['station-chat.svg',t('La rencontre','التواصل','Das Gespräch','The conversation'),t('Entrez en contact avec les employeurs pertinents.','تواصل مع المشغلين المناسبين.','Kommen Sie mit passenden Arbeitgebern ins Gespräch.','Connect with relevant employers.')],
  ],
    careers: [
    ['career-health.webp',t('Soins & santé','الصحة والرعاية','Pflege & Gesundheit','Care & health')],
    ['career-industry.webp',t('Industrie','الصناعة','Industrie','Industry')],
    ['career-logistics.webp',t('Logistique','اللوجستيك','Logistik','Logistics')],
    ['career-it.webp',t('Informatique','المعلوميات','IT','Technology')],
  ],
  };
}
