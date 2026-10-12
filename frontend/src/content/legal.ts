import type { Language } from '@/lib/types';

/*
 * Les trois textes juridiques publics : politique de confidentialité, conditions
 * d'utilisation, mentions légales.
 *
 * Ils décrivent ce que fait réellement la plateforme (consentements recueillis
 * à la création du profil, visibilité révocable, export et suppression du
 * compte avec un délai de 30 jours, lecture des documents par Google Gemini,
 * code de vérification par WhatsApp, statistiques Google Analytics soumises à
 * consentement). Si l'un de ces comportements change, le texte doit changer
 * avec lui.
 *
 * Identité de l'éditeur (raison sociale, RC/ICE, adresse) : `lib/company.ts` —
 * elle s'ajoute aux mentions légales dès qu'elle y est renseignée.
 *
 * Le français est la version de référence ; les trois autres langues la
 * traduisent.
 */

export type LegalDocKey = 'privacy' | 'terms' | 'notice';

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  closing?: string[];
}

export interface LegalDoc {
  /** Titre de la page (et du `<h1>`). */
  title: string;
  intro: string[];
  sections: LegalSection[];
}

/** Date de la dernière révision de fond, au format ISO. */
export const LEGAL_UPDATED = '2026-10-11';

const fr: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Politique de confidentialité',
    intro: [
      'Cette politique explique quelles données personnelles AMUD Skills collecte, pourquoi, avec qui elles sont partagées et comment vous en gardez le contrôle. Elle s’applique au site amudskills.com et à l’application AMUD Skills, et s’appuie sur la loi marocaine n° 09-08 (CNDP) et sur le règlement européen sur la protection des données (RGPD).',
    ],
    sections: [
      {
        title: 'Qui est responsable de vos données ?',
        paragraphs: [
          'Le responsable du traitement est AMUD Skills ; son identité complète figure dans les mentions légales. Pour toute question sur vos données ou pour exercer vos droits, écrivez à contact@amudskills.com.',
        ],
      },
      {
        title: 'Les données que nous collectons',
        paragraphs: ['Selon l’usage que vous faites du service :'],
        items: [
          'Compte : votre numéro de téléphone, vérifié par un code reçu sur WhatsApp, ou votre compte Google (nom, adresse e-mail, photo).',
          'Dossier candidat : nom, prénom, date de naissance, ville, profession, spécialité, années d’expérience, formations, compétences, langues et niveaux, disponibilité, préférences de recherche.',
          'Documents : CV, diplômes, certificats de langue et, si vous choisissez de vous faire vérifier, une pièce d’identité.',
          'Enregistrements : vidéo de présentation, enregistrements audio du test de langue et des réclamations.',
          'Activité : candidatures, favoris, messages échangés avec des recruteurs, notifications, parrainage.',
          'Recruteurs et entreprises : nom, fonction, coordonnées professionnelles, informations sur l’entreprise et ses offres.',
          'Formulaires de contact et de devis : nom, adresse e-mail et message.',
          'Données techniques : appareil et session de connexion, journaux du serveur nécessaires à la sécurité.',
          'Statistiques de visite (Google Analytics) : seulement si vous les acceptez.',
        ],
      },
      {
        title: 'Pourquoi nous les utilisons',
        items: [
          'Créer et sécuriser votre compte (exécution du service et intérêt légitime de sécurité).',
          'Constituer votre dossier et le rendre visible des recruteurs : uniquement avec votre consentement, donné lors de la création du profil et que vous pouvez retirer à tout moment.',
          'Lire vos documents et transcrire vos enregistrements pour pré-remplir et évaluer votre dossier (exécution du service).',
          'Vous répondre lorsque vous nous écrivez (votre demande).',
          'Mesurer la fréquentation du site (votre consentement).',
        ],
        closing: ['Nous n’utilisons pas vos données pour de la publicité ciblée.'],
      },
      {
        title: 'Qui voit vos données',
        items: [
          'Les recruteurs autorisés : ils ne peuvent consulter votre dossier que tant que votre profil est visible. Depuis la page « Visibilité », vous pouvez le mettre en pause ou retirer votre consentement : il est alors masqué immédiatement.',
          'Des membres habilités de l’équipe AMUD Skills, dans la limite de leur mission.',
          'Nos prestataires techniques, listés ci-dessous.',
        ],
        closing: [
          'Lorsqu’un recruteur situé en Allemagne consulte votre dossier, vos données sont transférées hors du Maroc. C’est pourquoi ce partage repose sur votre consentement.',
        ],
      },
      {
        title: 'Nos prestataires',
        items: [
          'Hébergement : Oracle Cloud Infrastructure.',
          'Google : connexion avec Google si vous la choisissez ; statistiques Google Analytics si vous les acceptez ; polices de caractères chargées depuis les serveurs de Google, auxquels votre adresse IP est alors transmise ; lecture automatique des CV et des documents PDF par l’API Gemini, lorsque cette fonction est activée : le fichier est alors envoyé à Google pour en extraire les informations du profil.',
          'WhatsApp : envoi du code de vérification de votre numéro.',
        ],
        closing: ['Les enregistrements audio sont transcrits sur nos propres serveurs.'],
      },
      {
        title: 'Combien de temps nous les gardons',
        items: [
          'Tant que votre compte est actif.',
          'Si vous supprimez votre compte, il est désactivé et vous disposez de 30 jours pour changer d’avis. Passé ce délai, votre profil, vos documents, votre vidéo et vos enregistrements sont effacés définitivement ; vos candidatures passées ne sont conservées que sous forme anonyme.',
          'Les messages envoyés par les formulaires de contact et de devis sont conservés le temps de traiter votre demande.',
        ],
      },
      {
        title: 'Vos droits',
        paragraphs: [
          'Vous pouvez à tout moment accéder à vos données, les corriger, les exporter, les supprimer, retirer votre consentement ou vous opposer à un traitement.',
        ],
        items: [
          'Accès, export et suppression : depuis la page « Compte » de votre espace.',
          'Rectification : en modifiant votre profil.',
          'Retrait du consentement et pause de la visibilité : depuis la page « Visibilité ».',
          'Toute autre demande : contact@amudskills.com.',
        ],
        closing: [
          'Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP, cndp.ma) ou l’autorité de protection des données de votre pays de résidence dans l’Union européenne.',
        ],
      },
      {
        title: 'Cookies et stockage local',
        paragraphs: [
          'Le site utilise le stockage de votre navigateur pour son fonctionnement : session, langue, thème et votre choix sur les cookies. Google Analytics n’est activé que si vous cliquez sur « Autoriser les statistiques » ; vous pouvez changer d’avis à tout moment avec le bouton « Gérer les cookies ».',
        ],
      },
      {
        title: 'Sécurité',
        paragraphs: [
          'Les échanges sont chiffrés (HTTPS). Vos documents ne sont jamais accessibles par une adresse publique : ils ne se téléchargent que par des liens temporaires, réservés aux personnes autorisées.',
        ],
      },
      {
        title: 'Mises à jour',
        paragraphs: ['La date en haut de cette page indique la dernière version de cette politique.'],
      },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    intro: [
      'Ces conditions encadrent l’utilisation du site amudskills.com et de l’application AMUD Skills (le « Service »). En créant un compte, vous les acceptez.',
    ],
    sections: [
      {
        title: 'Le Service',
        paragraphs: [
          'AMUD Skills est une plateforme de mise en relation entre des candidats au Maroc et des employeurs, notamment en Allemagne. Les candidats y constituent un dossier (profil, formations, langues, documents, vidéo de présentation) que des recruteurs autorisés peuvent consulter. Le Service est gratuit pour les candidats.',
          'AMUD Skills n’est pas l’employeur des candidats. Elle ne garantit ni entretien, ni embauche, ni reconnaissance de diplôme, ni obtention d’un visa ou d’un titre de séjour.',
        ],
      },
      {
        title: 'Votre compte',
        paragraphs: [
          'Vous vous connectez avec un numéro de téléphone vérifié par un code, ou avec un compte Google. Vous êtes responsable de l’accès à votre téléphone et à votre compte : prévenez-nous si vous constatez une utilisation que vous ne reconnaissez pas. Les informations que vous fournissez doivent être exactes et à jour.',
        ],
      },
      {
        title: 'Votre dossier et sa visibilité',
        paragraphs: [
          'Votre dossier n’est visible des recruteurs qu’après votre acceptation de ces conditions et votre consentement au traitement de vos données. Vous pouvez le mettre en pause ou retirer votre consentement à tout moment depuis la page « Visibilité » : il est alors masqué immédiatement.',
          'Vous restez propriétaire de vos contenus. Vous nous autorisez seulement à les héberger, à les traiter et à les montrer aux recruteurs comme le décrit la politique de confidentialité.',
        ],
      },
      {
        title: 'Règles d’usage',
        paragraphs: ['Il est interdit de :'],
        items: [
          'fournir des informations ou des documents faux, falsifiés ou appartenant à une autre personne ;',
          'usurper l’identité d’autrui ;',
          'harceler, discriminer ou tromper d’autres utilisateurs ;',
          'utiliser le Service pour réclamer de l’argent à un candidat en échange d’une offre d’emploi ;',
          'extraire les données du Service en masse, en perturber le fonctionnement ou contourner ses mesures de sécurité.',
        ],
        closing: ['En cas de manquement, nous pouvons suspendre ou supprimer un compte.'],
      },
      {
        title: 'Recruteurs',
        paragraphs: [
          'Les recruteurs s’engagent à n’utiliser les dossiers que pour évaluer de vraies candidatures, à ne pas les partager en dehors du Service et à respecter la législation applicable en matière de recrutement et de protection des données.',
        ],
      },
      {
        title: 'Disponibilité et responsabilité',
        paragraphs: [
          'Nous faisons le nécessaire pour que le Service soit disponible, sans pouvoir garantir un accès ininterrompu. Les exigences affichées sur les fiches métiers (niveau d’allemand, diplôme, reconnaissance) sont indicatives et peuvent évoluer : vérifiez-les auprès de l’employeur ou des autorités concernées.',
          'Dans la limite permise par la loi, AMUD Skills n’est pas responsable des décisions des employeurs ni des informations publiées par les utilisateurs.',
        ],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          'Le site, la marque et le logo AMUD Skills et les contenus éditoriaux appartiennent à AMUD Skills ou à ses concédants. Toute reproduction sans autorisation est interdite.',
        ],
      },
      {
        title: 'Supprimer votre compte',
        paragraphs: [
          'Vous pouvez supprimer votre compte depuis la page « Compte ». Vous disposez de 30 jours pour annuler ; ensuite vos données sont effacées comme le décrit la politique de confidentialité.',
        ],
      },
      {
        title: 'Évolution des conditions et contact',
        paragraphs: [
          'Ces conditions peuvent évoluer : la date en haut de la page indique la dernière version. Pour toute question ou réclamation, écrivez à contact@amudskills.com ; nous cherchons d’abord une solution amiable.',
        ],
      },
    ],
  },
  notice: {
    title: 'Mentions légales',
    intro: ['Informations légales sur le site amudskills.com et son éditeur.'],
    sections: [
      {
        title: 'Hébergement',
        paragraphs: ['Le site est hébergé par Oracle Cloud Infrastructure (Oracle Corporation).'],
      },
      {
        title: 'Propriété intellectuelle',
        paragraphs: [
          'Le site, la marque et le logo AMUD Skills, les textes, les images et les vidéos sont protégés. Toute reproduction ou réutilisation sans l’accord écrit d’AMUD Skills est interdite.',
        ],
      },
      {
        title: 'Données personnelles et cookies',
        paragraphs: [
          'Le traitement de vos données personnelles et l’usage des cookies sont décrits dans la politique de confidentialité.',
        ],
      },
      {
        title: 'Liens externes',
        paragraphs: [
          'Le site renvoie vers des sites tiers (réseaux sociaux, autorités). AMUD Skills ne contrôle pas leur contenu et n’en est pas responsable.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: ['Pour toute question : contact@amudskills.com.'],
      },
    ],
  },
};

const en: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Privacy policy',
    intro: [
      'This policy explains which personal data AMUD Skills collects, why, who it is shared with and how you stay in control of it. It applies to the amudskills.com website and the AMUD Skills app, and is based on Moroccan law no. 09-08 (CNDP) and the European data protection regulation (GDPR).',
    ],
    sections: [
      {
        title: 'Who is responsible for your data?',
        paragraphs: [
          'The data controller is AMUD Skills; its full details are in the legal notice. For any question about your data, or to exercise your rights, write to contact@amudskills.com.',
        ],
      },
      {
        title: 'The data we collect',
        paragraphs: ['Depending on how you use the service:'],
        items: [
          'Account: your phone number, verified by a code received on WhatsApp, or your Google account (name, email address, photo).',
          'Candidate file: first and last name, date of birth, city, profession, specialisation, years of experience, education, skills, languages and levels, availability, search preferences.',
          'Documents: CV, diplomas, language certificates and, if you choose to be verified, an identity document.',
          'Recordings: introduction video, audio recordings of the language test and of complaints.',
          'Activity: applications, favourites, messages exchanged with recruiters, notifications, referrals.',
          'Recruiters and companies: name, job title, business contact details, information about the company and its offers.',
          'Contact and quote forms: name, email address and message.',
          'Technical data: device and sign-in session, server logs needed for security.',
          'Visit statistics (Google Analytics): only if you accept them.',
        ],
      },
      {
        title: 'Why we use it',
        items: [
          'To create and secure your account (performance of the service and our legitimate interest in security).',
          'To build your file and make it visible to recruiters: only with your consent, given when you create your profile and which you can withdraw at any time.',
          'To read your documents and transcribe your recordings in order to pre-fill and assess your file (performance of the service).',
          'To reply when you write to us (your request).',
          'To measure traffic on the site (your consent).',
        ],
        closing: ['We do not use your data for targeted advertising.'],
      },
      {
        title: 'Who sees your data',
        items: [
          'Authorised recruiters: they can only view your file while your profile is visible. From the “Visibility” page you can pause it or withdraw your consent, and it is hidden immediately.',
          'Authorised members of the AMUD Skills team, within the limits of their role.',
          'Our technical providers, listed below.',
        ],
        closing: [
          'When a recruiter located in Germany views your file, your data is transferred outside Morocco. This is why that sharing relies on your consent.',
        ],
      },
      {
        title: 'Our providers',
        items: [
          'Hosting: Oracle Cloud Infrastructure.',
          'Google: sign-in with Google if you choose it; Google Analytics statistics if you accept them; fonts loaded from Google’s servers, which then receive your IP address; automatic reading of CVs and PDF documents by the Gemini API, when this feature is enabled: the file is then sent to Google so the profile information can be extracted.',
          'WhatsApp: sending the code that verifies your number.',
        ],
        closing: ['Audio recordings are transcribed on our own servers.'],
      },
      {
        title: 'How long we keep it',
        items: [
          'As long as your account is active.',
          'If you delete your account, it is deactivated and you have 30 days to change your mind. After that, your profile, documents, video and recordings are permanently erased; your past applications are kept only in anonymous form.',
          'Messages sent through the contact and quote forms are kept for as long as it takes to handle your request.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          'You can at any time access your data, correct it, export it, delete it, withdraw your consent or object to processing.',
        ],
        items: [
          'Access, export and deletion: from the “Account” page of your space.',
          'Correction: by editing your profile.',
          'Withdrawing consent and pausing visibility: from the “Visibility” page.',
          'Any other request: contact@amudskills.com.',
        ],
        closing: [
          'If you believe your rights are not being respected, you can contact the Moroccan data protection authority (CNDP, cndp.ma) or the data protection authority of your country of residence in the European Union.',
        ],
      },
      {
        title: 'Cookies and local storage',
        paragraphs: [
          'The site uses your browser’s storage to work: session, language, theme and your cookie choice. Google Analytics is only enabled if you click “Allow analytics”; you can change your mind at any time with the “Cookie settings” button.',
        ],
      },
      {
        title: 'Security',
        paragraphs: [
          'Traffic is encrypted (HTTPS). Your documents are never available at a public address: they can only be downloaded through temporary links reserved for authorised people.',
        ],
      },
      {
        title: 'Updates',
        paragraphs: ['The date at the top of this page shows the latest version of this policy.'],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    intro: [
      'These terms govern the use of the amudskills.com website and the AMUD Skills app (the “Service”). By creating an account, you accept them.',
    ],
    sections: [
      {
        title: 'The Service',
        paragraphs: [
          'AMUD Skills is a matching platform between candidates in Morocco and employers, notably in Germany. Candidates build a file there (profile, education, languages, documents, introduction video) that authorised recruiters can view. The Service is free for candidates.',
          'AMUD Skills is not the candidates’ employer. It does not guarantee an interview, a job, recognition of a diploma, or a visa or residence permit.',
        ],
      },
      {
        title: 'Your account',
        paragraphs: [
          'You sign in with a phone number verified by a code, or with a Google account. You are responsible for access to your phone and your account: tell us if you see use you do not recognise. The information you provide must be accurate and up to date.',
        ],
      },
      {
        title: 'Your file and its visibility',
        paragraphs: [
          'Your file is only visible to recruiters once you have accepted these terms and consented to the processing of your data. You can pause it or withdraw your consent at any time from the “Visibility” page, and it is hidden immediately.',
          'You remain the owner of your content. You only authorise us to host it, process it and show it to recruiters as described in the privacy policy.',
        ],
      },
      {
        title: 'Rules of use',
        paragraphs: ['You must not:'],
        items: [
          'provide false or forged information or documents, or documents belonging to someone else;',
          'impersonate another person;',
          'harass, discriminate against or deceive other users;',
          'use the Service to ask a candidate for money in exchange for a job offer;',
          'extract the Service’s data in bulk, disrupt its operation or bypass its security measures.',
        ],
        closing: ['If these rules are broken, we may suspend or delete an account.'],
      },
      {
        title: 'Recruiters',
        paragraphs: [
          'Recruiters agree to use files only to assess genuine applications, not to share them outside the Service, and to comply with the recruitment and data protection laws that apply to them.',
        ],
      },
      {
        title: 'Availability and liability',
        paragraphs: [
          'We do what is needed to keep the Service available, but cannot guarantee uninterrupted access. The requirements shown on trade pages (German level, diploma, recognition) are indicative and may change: check them with the employer or the authorities concerned.',
          'To the extent permitted by law, AMUD Skills is not responsible for employers’ decisions or for information published by users.',
        ],
      },
      {
        title: 'Intellectual property',
        paragraphs: [
          'The site, the AMUD Skills brand and logo and the editorial content belong to AMUD Skills or its licensors. Reproduction without permission is prohibited.',
        ],
      },
      {
        title: 'Deleting your account',
        paragraphs: [
          'You can delete your account from the “Account” page. You have 30 days to cancel; after that your data is erased as described in the privacy policy.',
        ],
      },
      {
        title: 'Changes to these terms, and contact',
        paragraphs: [
          'These terms may change: the date at the top of the page shows the latest version. For any question or complaint, write to contact@amudskills.com; we first look for an amicable solution.',
        ],
      },
    ],
  },
  notice: {
    title: 'Legal notice',
    intro: ['Legal information about the amudskills.com website and its publisher.'],
    sections: [
      {
        title: 'Hosting',
        paragraphs: ['The site is hosted by Oracle Cloud Infrastructure (Oracle Corporation).'],
      },
      {
        title: 'Intellectual property',
        paragraphs: [
          'The site, the AMUD Skills brand and logo, and the texts, images and videos are protected. Any reproduction or reuse without AMUD Skills’ written consent is prohibited.',
        ],
      },
      {
        title: 'Personal data and cookies',
        paragraphs: ['How your personal data is processed and how cookies are used is described in the privacy policy.'],
      },
      {
        title: 'External links',
        paragraphs: [
          'The site links to third-party sites (social networks, authorities). AMUD Skills does not control their content and is not responsible for it.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: ['For any question: contact@amudskills.com.'],
      },
    ],
  },
};

const de: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Datenschutzerklärung',
    intro: [
      'Diese Erklärung beschreibt, welche personenbezogenen Daten AMUD Skills erhebt, warum, an wen sie weitergegeben werden und wie Sie die Kontrolle behalten. Sie gilt für die Website amudskills.com und die App AMUD Skills und stützt sich auf das marokkanische Gesetz Nr. 09-08 (CNDP) sowie die europäische Datenschutz-Grundverordnung (DSGVO).',
    ],
    sections: [
      {
        title: 'Wer ist für Ihre Daten verantwortlich?',
        paragraphs: [
          'Verantwortlich ist AMUD Skills; die vollständigen Angaben stehen im Impressum. Bei Fragen zu Ihren Daten oder zur Ausübung Ihrer Rechte schreiben Sie an contact@amudskills.com.',
        ],
      },
      {
        title: 'Welche Daten wir erheben',
        paragraphs: ['Je nachdem, wie Sie den Dienst nutzen:'],
        items: [
          'Konto: Ihre Telefonnummer, bestätigt durch einen Code per WhatsApp, oder Ihr Google-Konto (Name, E-Mail-Adresse, Foto).',
          'Bewerberprofil: Vor- und Nachname, Geburtsdatum, Stadt, Beruf, Spezialisierung, Berufserfahrung, Ausbildung, Kompetenzen, Sprachen und Niveaus, Verfügbarkeit, Suchpräferenzen.',
          'Dokumente: Lebenslauf, Zeugnisse, Sprachzertifikate und, wenn Sie sich verifizieren lassen, ein Ausweisdokument.',
          'Aufnahmen: Vorstellungsvideo, Audioaufnahmen des Sprachtests und von Beschwerden.',
          'Aktivität: Bewerbungen, Favoriten, Nachrichten mit Recruitern, Benachrichtigungen, Empfehlungen.',
          'Recruiter und Unternehmen: Name, Funktion, berufliche Kontaktdaten, Angaben zum Unternehmen und zu seinen Angeboten.',
          'Kontakt- und Angebotsformulare: Name, E-Mail-Adresse und Nachricht.',
          'Technische Daten: Gerät und Anmeldesitzung, Server-Protokolle, die für die Sicherheit nötig sind.',
          'Besuchsstatistik (Google Analytics): nur, wenn Sie zustimmen.',
        ],
      },
      {
        title: 'Wofür wir sie verwenden',
        items: [
          'Ihr Konto anlegen und schützen (Vertragserfüllung und berechtigtes Interesse an Sicherheit).',
          'Ihr Profil aufbauen und für Recruiter sichtbar machen: nur mit Ihrer Einwilligung, die Sie bei der Profilerstellung erteilen und jederzeit widerrufen können.',
          'Ihre Dokumente lesen und Ihre Aufnahmen transkribieren, um Ihr Profil vorauszufüllen und zu bewerten (Vertragserfüllung).',
          'Ihnen antworten, wenn Sie uns schreiben (Ihre Anfrage).',
          'Die Nutzung der Website messen (Ihre Einwilligung).',
        ],
        closing: ['Wir verwenden Ihre Daten nicht für zielgerichtete Werbung.'],
      },
      {
        title: 'Wer Ihre Daten sieht',
        items: [
          'Zugelassene Recruiter: Sie können Ihr Profil nur einsehen, solange es sichtbar ist. Auf der Seite „Sichtbarkeit“ können Sie es pausieren oder Ihre Einwilligung widerrufen; es wird dann sofort ausgeblendet.',
          'Befugte Mitglieder des Teams von AMUD Skills im Rahmen ihrer Aufgabe.',
          'Unsere technischen Dienstleister, die unten aufgeführt sind.',
        ],
        closing: [
          'Wenn ein Recruiter in Deutschland Ihr Profil einsieht, werden Ihre Daten aus Marokko übermittelt. Deshalb beruht diese Weitergabe auf Ihrer Einwilligung.',
        ],
      },
      {
        title: 'Unsere Dienstleister',
        items: [
          'Hosting: Oracle Cloud Infrastructure.',
          'Google: Anmeldung mit Google, wenn Sie sie wählen; Statistik mit Google Analytics, wenn Sie zustimmen; Schriftarten, die von Google-Servern geladen werden und denen dabei Ihre IP-Adresse übermittelt wird; automatisches Auslesen von Lebensläufen und PDF-Dokumenten über die Gemini-API, wenn diese Funktion aktiviert ist: Die Datei wird dann an Google gesendet, um die Profilangaben zu extrahieren.',
          'WhatsApp: Versand des Codes zur Bestätigung Ihrer Nummer.',
        ],
        closing: ['Audioaufnahmen werden auf unseren eigenen Servern transkribiert.'],
      },
      {
        title: 'Wie lange wir sie speichern',
        items: [
          'Solange Ihr Konto aktiv ist.',
          'Wenn Sie Ihr Konto löschen, wird es deaktiviert und Sie haben 30 Tage Zeit, es sich anders zu überlegen. Danach werden Ihr Profil, Ihre Dokumente, Ihr Video und Ihre Aufnahmen endgültig gelöscht; frühere Bewerbungen bleiben nur in anonymer Form erhalten.',
          'Nachrichten aus den Kontakt- und Angebotsformularen werden so lange gespeichert, wie die Bearbeitung Ihrer Anfrage dauert.',
        ],
      },
      {
        title: 'Ihre Rechte',
        paragraphs: [
          'Sie können jederzeit Auskunft über Ihre Daten verlangen, sie berichtigen, exportieren, löschen, Ihre Einwilligung widerrufen oder einer Verarbeitung widersprechen.',
        ],
        items: [
          'Auskunft, Export und Löschung: über die Seite „Konto“ in Ihrem Bereich.',
          'Berichtigung: durch Bearbeiten Ihres Profils.',
          'Widerruf der Einwilligung und Pausieren der Sichtbarkeit: über die Seite „Sichtbarkeit“.',
          'Alle anderen Anliegen: contact@amudskills.com.',
        ],
        closing: [
          'Wenn Sie der Ansicht sind, dass Ihre Rechte nicht gewahrt werden, können Sie sich an die marokkanische Datenschutzbehörde (CNDP, cndp.ma) oder an die Datenschutzaufsichtsbehörde Ihres Wohnsitzlandes in der Europäischen Union wenden.',
        ],
      },
      {
        title: 'Cookies und lokaler Speicher',
        paragraphs: [
          'Die Website nutzt den Speicher Ihres Browsers, um zu funktionieren: Sitzung, Sprache, Design und Ihre Cookie-Auswahl. Google Analytics wird nur aktiviert, wenn Sie auf „Statistik erlauben“ klicken; Ihre Entscheidung können Sie jederzeit über die Schaltfläche „Cookie-Einstellungen“ ändern.',
        ],
      },
      {
        title: 'Sicherheit',
        paragraphs: [
          'Die Übertragung ist verschlüsselt (HTTPS). Ihre Dokumente sind nie über eine öffentliche Adresse erreichbar: Sie lassen sich nur über befristete Links abrufen, die berechtigten Personen vorbehalten sind.',
        ],
      },
      {
        title: 'Änderungen',
        paragraphs: ['Das Datum am Seitenanfang zeigt die aktuelle Fassung dieser Erklärung.'],
      },
    ],
  },
  terms: {
    title: 'Nutzungsbedingungen',
    intro: [
      'Diese Bedingungen regeln die Nutzung der Website amudskills.com und der App AMUD Skills (der „Dienst“). Mit der Erstellung eines Kontos akzeptieren Sie sie.',
    ],
    sections: [
      {
        title: 'Der Dienst',
        paragraphs: [
          'AMUD Skills ist eine Vermittlungsplattform zwischen Bewerberinnen und Bewerbern in Marokko und Arbeitgebern, insbesondere in Deutschland. Bewerber legen dort ein Profil an (Profil, Ausbildung, Sprachen, Dokumente, Vorstellungsvideo), das zugelassene Recruiter einsehen können. Der Dienst ist für Bewerber kostenlos.',
          'AMUD Skills ist nicht der Arbeitgeber der Bewerber. Wir garantieren weder ein Vorstellungsgespräch noch eine Einstellung, die Anerkennung eines Abschlusses oder ein Visum bzw. einen Aufenthaltstitel.',
        ],
      },
      {
        title: 'Ihr Konto',
        paragraphs: [
          'Sie melden sich mit einer per Code bestätigten Telefonnummer oder mit einem Google-Konto an. Sie sind für den Zugang zu Ihrem Telefon und Ihrem Konto verantwortlich: Informieren Sie uns, wenn Sie eine Nutzung bemerken, die Sie nicht kennen. Ihre Angaben müssen richtig und aktuell sein.',
        ],
      },
      {
        title: 'Ihr Profil und seine Sichtbarkeit',
        paragraphs: [
          'Ihr Profil ist für Recruiter erst sichtbar, nachdem Sie diese Bedingungen akzeptiert und in die Verarbeitung Ihrer Daten eingewilligt haben. Sie können es jederzeit über die Seite „Sichtbarkeit“ pausieren oder Ihre Einwilligung widerrufen; es wird dann sofort ausgeblendet.',
          'Ihre Inhalte bleiben Ihr Eigentum. Sie erlauben uns lediglich, sie zu speichern, zu verarbeiten und Recruitern zu zeigen, wie es die Datenschutzerklärung beschreibt.',
        ],
      },
      {
        title: 'Nutzungsregeln',
        paragraphs: ['Es ist untersagt,'],
        items: [
          'falsche oder gefälschte Angaben oder Dokumente oder Dokumente einer anderen Person zu übermitteln;',
          'sich als eine andere Person auszugeben;',
          'andere Nutzer zu belästigen, zu diskriminieren oder zu täuschen;',
          'den Dienst zu nutzen, um von Bewerbern Geld für ein Stellenangebot zu verlangen;',
          'Daten des Dienstes massenhaft auszulesen, seinen Betrieb zu stören oder seine Sicherheitsmaßnahmen zu umgehen.',
        ],
        closing: ['Bei Verstößen können wir ein Konto sperren oder löschen.'],
      },
      {
        title: 'Recruiter',
        paragraphs: [
          'Recruiter verpflichten sich, Profile nur zur Prüfung echter Bewerbungen zu nutzen, sie nicht außerhalb des Dienstes weiterzugeben und die für sie geltenden Vorschriften zu Personalgewinnung und Datenschutz einzuhalten.',
        ],
      },
      {
        title: 'Verfügbarkeit und Haftung',
        paragraphs: [
          'Wir tun, was nötig ist, damit der Dienst verfügbar ist, können aber keinen unterbrechungsfreien Zugang garantieren. Die auf den Berufsseiten angezeigten Anforderungen (Deutschniveau, Abschluss, Anerkennung) sind Richtwerte und können sich ändern: Prüfen Sie sie beim Arbeitgeber oder bei den zuständigen Behörden.',
          'Soweit gesetzlich zulässig, haftet AMUD Skills nicht für Entscheidungen von Arbeitgebern oder für Angaben, die Nutzer veröffentlichen.',
        ],
      },
      {
        title: 'Geistiges Eigentum',
        paragraphs: [
          'Die Website, die Marke und das Logo AMUD Skills sowie die redaktionellen Inhalte gehören AMUD Skills oder seinen Lizenzgebern. Jede Vervielfältigung ohne Erlaubnis ist untersagt.',
        ],
      },
      {
        title: 'Konto löschen',
        paragraphs: [
          'Sie können Ihr Konto über die Seite „Konto“ löschen. Sie haben 30 Tage Zeit, die Löschung abzubrechen; danach werden Ihre Daten gelöscht, wie es die Datenschutzerklärung beschreibt.',
        ],
      },
      {
        title: 'Änderungen dieser Bedingungen und Kontakt',
        paragraphs: [
          'Diese Bedingungen können sich ändern: Das Datum am Seitenanfang zeigt die aktuelle Fassung. Bei Fragen oder Beschwerden schreiben Sie an contact@amudskills.com; wir suchen zuerst eine einvernehmliche Lösung.',
        ],
      },
    ],
  },
  notice: {
    title: 'Impressum',
    intro: ['Rechtliche Angaben zur Website amudskills.com und ihrem Herausgeber.'],
    sections: [
      {
        title: 'Hosting',
        paragraphs: ['Die Website wird von Oracle Cloud Infrastructure (Oracle Corporation) gehostet.'],
      },
      {
        title: 'Geistiges Eigentum',
        paragraphs: [
          'Die Website, die Marke und das Logo AMUD Skills sowie Texte, Bilder und Videos sind geschützt. Jede Vervielfältigung oder Wiederverwendung ohne schriftliche Zustimmung von AMUD Skills ist untersagt.',
        ],
      },
      {
        title: 'Personenbezogene Daten und Cookies',
        paragraphs: ['Die Verarbeitung Ihrer personenbezogenen Daten und die Verwendung von Cookies sind in der Datenschutzerklärung beschrieben.'],
      },
      {
        title: 'Externe Links',
        paragraphs: [
          'Die Website verweist auf Seiten Dritter (soziale Netzwerke, Behörden). AMUD Skills hat keinen Einfluss auf deren Inhalt und übernimmt dafür keine Verantwortung.',
        ],
      },
      {
        title: 'Kontakt',
        paragraphs: ['Bei Fragen: contact@amudskills.com.'],
      },
    ],
  },
};

const ar: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'سياسة الخصوصية',
    intro: [
      'توضّح هذه السياسة المعطيات الشخصية التي تجمعها AMUD Skills، ولماذا تجمعها، ومع من تتم مشاركتها، وكيف تحتفظ بالتحكم فيها. وهي تسري على موقع amudskills.com وتطبيق AMUD Skills، وتستند إلى القانون المغربي رقم 09-08 (اللجنة الوطنية CNDP) واللائحة الأوروبية العامة لحماية البيانات (RGPD).',
    ],
    sections: [
      {
        title: 'من المسؤول عن معطياتك؟',
        paragraphs: [
          'المسؤول عن المعالجة هو AMUD Skills، وتجد هويته الكاملة في الإشعار القانوني. لأي سؤال حول معطياتك أو لممارسة حقوقك، راسلنا على contact@amudskills.com.',
        ],
      },
      {
        title: 'المعطيات التي نجمعها',
        paragraphs: ['بحسب طريقة استعمالك للخدمة:'],
        items: [
          'الحساب: رقم هاتفك الذي يتم التحقق منه برمز يصلك عبر واتساب، أو حسابك في Google (الاسم والبريد الإلكتروني والصورة).',
          'ملف المترشح: الاسم الشخصي والعائلي وتاريخ الميلاد والمدينة والمهنة والتخصص وسنوات الخبرة والتكوينات والمهارات واللغات ومستوياتها والتوفر وتفضيلات البحث.',
          'الوثائق: السيرة الذاتية والشهادات وشهادات اللغة، ووثيقة هوية إذا اخترت التحقق من هويتك.',
          'التسجيلات: فيديو التقديم، والتسجيلات الصوتية لاختبار اللغة وللشكايات.',
          'النشاط: الترشيحات والمفضلة والرسائل المتبادلة مع المشغّلين والإشعارات والتوصية بالأصدقاء.',
          'المشغّلون والشركات: الاسم والمهمة ومعطيات الاتصال المهنية ومعلومات الشركة وعروضها.',
          'نماذج الاتصال وطلب عرض السعر: الاسم والبريد الإلكتروني والرسالة.',
          'المعطيات التقنية: الجهاز وجلسة الدخول وسجلات الخادم اللازمة للأمان.',
          'إحصاءات الزيارة (Google Analytics): فقط إذا وافقت عليها.',
        ],
      },
      {
        title: 'لماذا نستعملها',
        items: [
          'لإنشاء حسابك وتأمينه (تنفيذ الخدمة والمصلحة المشروعة في الأمان).',
          'لتكوين ملفك وجعله مرئيًا للمشغّلين: بموافقتك فقط، التي تمنحها عند إنشاء الملف ويمكنك سحبها في أي وقت.',
          'لقراءة وثائقك وتفريغ تسجيلاتك الصوتية من أجل ملء ملفك مسبقًا وتقييمه (تنفيذ الخدمة).',
          'للرد عليك عندما تراسلنا (طلبك).',
          'لقياس عدد زيارات الموقع (موافقتك).',
        ],
        closing: ['لا نستعمل معطياتك في الإعلانات الموجّهة.'],
      },
      {
        title: 'من يطّلع على معطياتك',
        items: [
          'المشغّلون المرخّص لهم: لا يمكنهم الاطلاع على ملفك إلا ما دام مرئيًا. من صفحة «الظهور» يمكنك إيقافه مؤقتًا أو سحب موافقتك، فيُخفى فورًا.',
          'أعضاء مخوّلون من فريق AMUD Skills، في حدود مهامهم.',
          'مزوّدونا التقنيون المذكورون أدناه.',
        ],
        closing: [
          'عندما يطّلع مشغّل موجود في ألمانيا على ملفك، تُنقل معطياتك خارج المغرب. ولهذا تستند هذه المشاركة إلى موافقتك.',
        ],
      },
      {
        title: 'مزوّدو الخدمات',
        items: [
          'الاستضافة: Oracle Cloud Infrastructure.',
          'Google: تسجيل الدخول عبر Google إذا اخترته؛ وإحصاءات Google Analytics إذا وافقت عليها؛ والخطوط التي تُحمَّل من خوادم Google فيتلقى عنوان IP الخاص بك؛ والقراءة الآلية للسير الذاتية ووثائق PDF عبر واجهة Gemini عند تفعيل هذه الميزة: يُرسَل الملف حينها إلى Google لاستخراج معلومات الملف.',
          'واتساب: إرسال رمز التحقق من رقمك.',
        ],
        closing: ['تُفرَّغ التسجيلات الصوتية على خوادمنا الخاصة.'],
      },
      {
        title: 'مدة الاحتفاظ بالمعطيات',
        items: [
          'ما دام حسابك نشطًا.',
          'إذا حذفت حسابك فإنه يُعطَّل ولديك 30 يومًا للتراجع. بعد ذلك تُمحى ملفاتك ووثائقك وفيديوك وتسجيلاتك نهائيًا، ولا تُحفظ ترشيحاتك السابقة إلا بشكل مجهول الهوية.',
          'تُحفظ الرسائل المرسلة عبر نموذجي الاتصال وطلب عرض السعر طوال المدة اللازمة لمعالجة طلبك.',
        ],
      },
      {
        title: 'حقوقك',
        paragraphs: [
          'يمكنك في أي وقت الاطلاع على معطياتك وتصحيحها وتصديرها وحذفها وسحب موافقتك أو الاعتراض على معالجة ما.',
        ],
        items: [
          'الاطلاع والتصدير والحذف: من صفحة «الحساب» في فضائك.',
          'التصحيح: بتعديل ملفك.',
          'سحب الموافقة وإيقاف الظهور مؤقتًا: من صفحة «الظهور».',
          'أي طلب آخر: contact@amudskills.com.',
        ],
        closing: [
          'إذا رأيت أن حقوقك غير محترمة، يمكنك اللجوء إلى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP، cndp.ma) أو إلى سلطة حماية المعطيات في بلد إقامتك داخل الاتحاد الأوروبي.',
        ],
      },
      {
        title: 'ملفات تعريف الارتباط والتخزين المحلي',
        paragraphs: [
          'يستعمل الموقع تخزين متصفحك ليعمل: الجلسة واللغة والمظهر واختيارك بخصوص ملفات الارتباط. لا يتم تفعيل Google Analytics إلا إذا نقرت على «السماح بالإحصاءات»، ويمكنك تغيير رأيك في أي وقت بزر «إدارة ملفات الارتباط».',
        ],
      },
      {
        title: 'الأمان',
        paragraphs: [
          'التبادلات مشفّرة (HTTPS). لا تتاح وثائقك أبدًا على عنوان عمومي: لا يمكن تنزيلها إلا عبر روابط مؤقتة مخصصة للأشخاص المرخّص لهم.',
        ],
      },
      {
        title: 'التحديثات',
        paragraphs: ['يشير التاريخ أعلى هذه الصفحة إلى آخر نسخة من هذه السياسة.'],
      },
    ],
  },
  terms: {
    title: 'شروط الاستخدام',
    intro: [
      'تنظّم هذه الشروط استعمال موقع amudskills.com وتطبيق AMUD Skills («الخدمة»). بإنشاء حساب فإنك توافق عليها.',
    ],
    sections: [
      {
        title: 'الخدمة',
        paragraphs: [
          'AMUD Skills منصة للربط بين مترشحين في المغرب ومشغّلين، خاصة في ألمانيا. يكوّن المترشحون فيها ملفًا (الملف الشخصي والتكوينات واللغات والوثائق وفيديو التقديم) يمكن للمشغّلين المرخّص لهم الاطلاع عليه. الخدمة مجانية للمترشحين.',
          'AMUD Skills ليست مشغّلة للمترشحين، ولا تضمن مقابلة ولا توظيفًا ولا الاعتراف بشهادة ولا الحصول على تأشيرة أو بطاقة إقامة.',
        ],
      },
      {
        title: 'حسابك',
        paragraphs: [
          'تسجّل الدخول برقم هاتف يتم التحقق منه برمز، أو بحساب Google. أنت مسؤول عن الوصول إلى هاتفك وحسابك: أخبرنا إن لاحظت استعمالًا لا تعرفه. ويجب أن تكون المعلومات التي تقدمها صحيحة ومحيّنة.',
        ],
      },
      {
        title: 'ملفك وظهوره',
        paragraphs: [
          'لا يصبح ملفك مرئيًا للمشغّلين إلا بعد قبولك هذه الشروط وموافقتك على معالجة معطياتك. يمكنك إيقافه مؤقتًا أو سحب موافقتك في أي وقت من صفحة «الظهور»، فيُخفى فورًا.',
          'تبقى مالكًا لمحتوياتك. وأنت لا تأذن لنا إلا باستضافتها ومعالجتها وعرضها على المشغّلين كما تصفه سياسة الخصوصية.',
        ],
      },
      {
        title: 'قواعد الاستعمال',
        paragraphs: ['يُمنع:'],
        items: [
          'تقديم معلومات أو وثائق كاذبة أو مزوّرة أو تعود لشخص آخر؛',
          'انتحال هوية الغير؛',
          'مضايقة مستعملين آخرين أو التمييز ضدهم أو خداعهم؛',
          'استعمال الخدمة لمطالبة مترشح بمال مقابل عرض شغل؛',
          'استخراج معطيات الخدمة بشكل مكثف أو تعطيل سيرها أو تجاوز إجراءاتها الأمنية.',
        ],
        closing: ['في حال المخالفة، يجوز لنا تعليق الحساب أو حذفه.'],
      },
      {
        title: 'المشغّلون',
        paragraphs: [
          'يلتزم المشغّلون باستعمال الملفات فقط لتقييم ترشيحات حقيقية، وبعدم مشاركتها خارج الخدمة، واحترام القوانين المعمول بها في التوظيف وحماية المعطيات.',
        ],
      },
      {
        title: 'التوفر والمسؤولية',
        paragraphs: [
          'نبذل ما يلزم لتبقى الخدمة متاحة، دون أن نضمن وصولًا دون انقطاع. والمتطلبات المعروضة في صفحات المهن (مستوى الألمانية والشهادة والاعتراف) إرشادية وقابلة للتغيير: تحقق منها لدى المشغّل أو السلطات المعنية.',
          'في حدود ما يسمح به القانون، لا تتحمل AMUD Skills مسؤولية قرارات المشغّلين ولا المعلومات التي ينشرها المستعملون.',
        ],
      },
      {
        title: 'الملكية الفكرية',
        paragraphs: [
          'الموقع وعلامة AMUD Skills وشعارها والمحتويات التحريرية ملك لـ AMUD Skills أو لمانحي ترخيصها. ويُمنع أي نسخ دون إذن.',
        ],
      },
      {
        title: 'حذف حسابك',
        paragraphs: [
          'يمكنك حذف حسابك من صفحة «الحساب». لديك 30 يومًا للتراجع، وبعدها تُمحى معطياتك كما تصفه سياسة الخصوصية.',
        ],
      },
      {
        title: 'تعديل الشروط والتواصل',
        paragraphs: [
          'قد تتغير هذه الشروط: ويشير التاريخ أعلى الصفحة إلى آخر نسخة. لأي سؤال أو شكاية، راسلنا على contact@amudskills.com؛ ونبحث أولًا عن حل ودّي.',
        ],
      },
    ],
  },
  notice: {
    title: 'الإشعار القانوني',
    intro: ['معلومات قانونية حول موقع amudskills.com وناشره.'],
    sections: [
      {
        title: 'الاستضافة',
        paragraphs: ['يُستضاف الموقع لدى Oracle Cloud Infrastructure (Oracle Corporation).'],
      },
      {
        title: 'الملكية الفكرية',
        paragraphs: [
          'الموقع وعلامة AMUD Skills وشعارها والنصوص والصور والفيديوهات محمية. ويُمنع أي نسخ أو إعادة استعمال دون موافقة كتابية من AMUD Skills.',
        ],
      },
      {
        title: 'المعطيات الشخصية وملفات الارتباط',
        paragraphs: ['تُوصف معالجة معطياتك الشخصية واستعمال ملفات الارتباط في سياسة الخصوصية.'],
      },
      {
        title: 'الروابط الخارجية',
        paragraphs: [
          'يحيل الموقع إلى مواقع أطراف ثالثة (شبكات اجتماعية وسلطات). ولا تتحكم AMUD Skills في محتواها ولا تتحمل مسؤوليته.',
        ],
      },
      {
        title: 'التواصل',
        paragraphs: ['لأي سؤال: contact@amudskills.com.'],
      },
    ],
  },
};

export const LEGAL: Record<Language, Record<LegalDocKey, LegalDoc>> = { fr, en, de, ar };

/** Adresse de chaque texte, pour les liens croisés, le sitemap et le pied de page. */
export const LEGAL_PATHS: Record<LegalDocKey, string> = {
  privacy: '/politique-de-confidentialite',
  terms: '/conditions-utilisation',
  notice: '/mentions-legales',
};
