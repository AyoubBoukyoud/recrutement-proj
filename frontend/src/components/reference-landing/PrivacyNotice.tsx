'use client';

import { useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { Locale } from '@/components/landing/content';
import './privacy-notice.css';
import './privacy-notice-compact.css';

type Copy = {
  label: string; euTitle: string; euBody: string; maTitle: string; maBody: string;
  euLink: string; maLink: string; decline: string; done: string;
  close: string; declined: string; browse: string;
};
const copy: Record<Locale, Copy> = {
  fr: { label: 'DONNÉES & CONFIDENTIALITÉ', euTitle: 'Union européenne', euBody: 'Cette notice informe sur les données; elle ne recueille pas votre consentement. Les choix liés au compte se font séparément.', maTitle: 'Maroc', maBody: 'La loi marocaine 09-08 encadre les données personnelles. Consultez la CNDP; cette note ne remplace pas la politique complète.', euLink: 'RGPD · article 7', maLink: 'Loi 09-08 · CNDP', decline: 'Ne pas confirmer', done: 'J’ai compris', close: 'Fermer', declined: 'Vous pouvez consulter les pages publiques. La création de profil ou le partage de documents peut demander des informations et choix séparés.', browse: 'Continuer la visite' },
  ar: { label: 'البيانات والخصوصية', euTitle: 'الاتحاد الأوروبي', euBody: 'يوضح هذا الإشعار معلومات البيانات ولا يطلب موافقتك. تُعرض خيارات الحساب ومعالجة البيانات بشكل منفصل.', maTitle: 'المغرب', maBody: 'يؤطر القانون المغربي 09-08 حماية البيانات الشخصية. راجع معلومات CNDP؛ فهذا الإشعار لا يغني عن سياسة الخصوصية الكاملة.', euLink: 'اللائحة الأوروبية · المادة 7', maLink: 'القانون 09-08 · CNDP', decline: 'عدم التأكيد', done: 'فهمت', close: 'إغلاق', declined: 'يمكنك تصفح الصفحات العامة. قد يتطلب إنشاء ملف أو مشاركة وثائق عرض معلومات وخيارات منفصلة.', browse: 'متابعة تصفح الموقع' },
  de: { label: 'DATEN & DATENSCHUTZ', euTitle: 'Europäische Union', euBody: 'Dieser Hinweis informiert über Daten; er fragt nicht nach Einwilligung. Entscheidungen zum Konto erfolgen getrennt.', maTitle: 'Marokko', maBody: 'Das marokkanische Gesetz 09-08 regelt personenbezogene Daten. Die CNDP informiert darüber; dieser Hinweis ersetzt keine vollständige Datenschutzerklärung.', euLink: 'DSGVO · Artikel 7', maLink: 'Gesetz 09-08 · CNDP', decline: 'Nicht bestätigen', done: 'Verstanden', close: 'Schließen', declined: 'Sie können die öffentlichen Seiten ansehen. Für ein Profil oder geteilte Unterlagen können gesonderte Informationen und Entscheidungen erforderlich sein.', browse: 'Weiter surfen' },
  en: { label: 'DATA & PRIVACY', euTitle: 'European Union', euBody: 'This notice explains data use; it does not ask for consent. Choices related to an account are handled separately.', maTitle: 'Morocco', maBody: 'Moroccan Law 09-08 governs personal data. See the CNDP guidance; this notice does not replace the full privacy policy.', euLink: 'GDPR · Article 7', maLink: 'Law 09-08 · CNDP', decline: 'Do not confirm', done: 'Understood', close: 'Close', declined: 'You can browse public pages. Creating a profile or sharing documents may require separate information and choices.', browse: 'Continue browsing' },
};

const NOTICE_EVENT = 'amud-privacy-notice-change';
const NOTICE_KEY = 'amud-privacy-notice-v1';
const subscribeNotice = (notify: () => void) => {
  window.addEventListener(NOTICE_EVENT, notify);
  return () => window.removeEventListener(NOTICE_EVENT, notify);
};
/*
 * La notice informe, elle ne recueille pas de consentement : une fois lue, rien
 * ne justifie de la rouvrir à chaque visite. Elle était gardée en
 * sessionStorage et réapparaissait dans chaque nouvel onglet, par-dessus le
 * premier écran mobile. On la retient désormais durablement (localStorage), en
 * relisant l'ancienne clé de session pour ne pas la reposer à qui l'a déjà vue.
 */
const readNoticeVisibility = () => {
  try { return !localStorage.getItem(NOTICE_KEY) && !sessionStorage.getItem(NOTICE_KEY); }
  catch { return true; }
};
// Rendu serveur : masquée. Elle n'apparaît qu'après hydratation, ce qui évite
// aussi de la faire clignoter pour un visiteur qui l'a déjà fermée.
const hiddenOnServer = () => false;

export function PrivacyNotice({ locale }: { locale: Locale }) {
  const visible = useSyncExternalStore(subscribeNotice, readNoticeVisibility, hiddenOnServer);
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const [declined, setDeclined] = useState(false);
  const text = copy[locale];
  if (!visible || dismissedLocally) return null;
  const finish = (choice: 'acknowledged' | 'declined') => {
    try { localStorage.setItem(NOTICE_KEY, choice); }
    catch { /* Local state still closes the notice if storage is disabled. */ }
    setDismissedLocally(true);
    window.dispatchEvent(new Event(NOTICE_EVENT));
  };
  const title = declined
    ? locale === 'ar' ? 'يمكنك متابعة التصفح' : locale === 'de' ? 'Sie können weiter surfen' : locale === 'en' ? 'You can keep browsing' : 'Vous pouvez continuer'
    : text.euTitle;
  // Une seule étape : UE, puis Maroc repliable — mêmes textes qu'avant, un clic
  // pour refermer au lieu de deux.
  return <section className="amud-privacy-notice" aria-live="polite" aria-labelledby="amud-privacy-title" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
    <div className="amud-privacy-top"><p>{text.label}</p><button type="button" className="amud-privacy-close" aria-label={text.close} onClick={() => finish(declined ? 'declined' : 'acknowledged')}><X size={18}/></button></div>
    <h2 id="amud-privacy-title">{title}</h2>
    <p className="amud-privacy-body">{declined ? text.declined : text.euBody}</p>
    {!declined && <details className="amud-privacy-more"><summary>{text.maTitle}</summary><p>{text.maBody}</p></details>}
    {!declined && <div className="amud-privacy-links"><a href="https://eur-lex.europa.eu/eli/reg/2016/679/art_7/oj" target="_blank" rel="noreferrer">{text.euLink}<ArrowUpRight size={13}/></a><a href="https://www.cndp.ma/conformite-des-sites-web/" target="_blank" rel="noreferrer">{text.maLink}<ArrowUpRight size={13}/></a></div>}
    <div className="amud-privacy-actions">{declined ? <button className="amud-privacy-primary" type="button" onClick={() => finish('declined')}>{text.browse}</button> : <><button className="amud-privacy-primary" type="button" onClick={() => finish('acknowledged')}>{text.done}</button><button className="amud-privacy-secondary" type="button" onClick={() => setDeclined(true)}>{text.decline}</button></>}</div>
  </section>;
}
