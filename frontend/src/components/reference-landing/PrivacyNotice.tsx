'use client';

import { useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { Locale } from '@/components/landing/content';
import './privacy-notice.css';
import './privacy-notice-compact.css';

type Copy = {
  label: string; euTitle: string; euBody: string; maTitle: string; maBody: string;
  euLink: string; maLink: string; continue: string; decline: string; done: string;
  close: string; declined: string; browse: string;
};
const copy: Record<Locale, Copy> = {
  fr: { label: 'DONNÉES & CONFIDENTIALITÉ', euTitle: 'Union européenne', euBody: 'Cette notice informe sur les données; elle ne recueille pas votre consentement. Les choix liés au compte se font séparément.', maTitle: 'Maroc', maBody: 'La loi marocaine 09-08 encadre les données personnelles. Consultez la CNDP; cette note ne remplace pas la politique complète.', euLink: 'RGPD · article 7', maLink: 'Loi 09-08 · CNDP', continue: 'Continuer', decline: 'Ne pas confirmer', done: 'J’ai compris', close: 'Fermer', declined: 'Vous pouvez consulter les pages publiques. La création de profil ou le partage de documents peut demander des informations et choix séparés.', browse: 'Continuer la visite' },
  ar: { label: 'البيانات والخصوصية', euTitle: 'الاتحاد الأوروبي', euBody: 'يوضح هذا الإشعار معلومات البيانات ولا يطلب موافقتك. تُعرض خيارات الحساب ومعالجة البيانات بشكل منفصل.', maTitle: 'المغرب', maBody: 'يؤطر القانون المغربي 09-08 حماية البيانات الشخصية. راجع معلومات CNDP؛ فهذا الإشعار لا يغني عن سياسة الخصوصية الكاملة.', euLink: 'اللائحة الأوروبية · المادة 7', maLink: 'القانون 09-08 · CNDP', continue: 'متابعة', decline: 'عدم التأكيد', done: 'فهمت', close: 'إغلاق', declined: 'يمكنك تصفح الصفحات العامة. قد يتطلب إنشاء ملف أو مشاركة وثائق عرض معلومات وخيارات منفصلة.', browse: 'متابعة تصفح الموقع' },
  de: { label: 'DATEN & DATENSCHUTZ', euTitle: 'Europäische Union', euBody: 'Dieser Hinweis informiert über Daten; er fragt nicht nach Einwilligung. Entscheidungen zum Konto erfolgen getrennt.', maTitle: 'Marokko', maBody: 'Das marokkanische Gesetz 09-08 regelt personenbezogene Daten. Die CNDP informiert darüber; dieser Hinweis ersetzt keine vollständige Datenschutzerklärung.', euLink: 'DSGVO · Artikel 7', maLink: 'Gesetz 09-08 · CNDP', continue: 'Weiter', decline: 'Nicht bestätigen', done: 'Verstanden', close: 'Schließen', declined: 'Sie können die öffentlichen Seiten ansehen. Für ein Profil oder geteilte Unterlagen können gesonderte Informationen und Entscheidungen erforderlich sein.', browse: 'Weiter surfen' },
  en: { label: 'DATA & PRIVACY', euTitle: 'European Union', euBody: 'This notice explains data use; it does not ask for consent. Choices related to an account are handled separately.', maTitle: 'Morocco', maBody: 'Moroccan Law 09-08 governs personal data. See the CNDP guidance; this notice does not replace the full privacy policy.', euLink: 'GDPR · Article 7', maLink: 'Law 09-08 · CNDP', continue: 'Continue', decline: 'Do not confirm', done: 'Understood', close: 'Close', declined: 'You can browse public pages. Creating a profile or sharing documents may require separate information and choices.', browse: 'Continue browsing' },
};

const NOTICE_EVENT = 'amud-privacy-notice-change';
const subscribeNotice = (notify: () => void) => {
  window.addEventListener(NOTICE_EVENT, notify);
  return () => window.removeEventListener(NOTICE_EVENT, notify);
};
const readNoticeVisibility = () => {
  try { return !sessionStorage.getItem('amud-privacy-notice-v1'); }
  catch { return true; }
};

export function PrivacyNotice({ locale }: { locale: Locale }) {
  const visible = useSyncExternalStore(subscribeNotice, readNoticeVisibility, () => true);
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const [stage, setStage] = useState<'eu' | 'ma' | 'declined'>('eu');
  const text = copy[locale];
  if (!visible || dismissedLocally) return null;
  const finish = (choice: 'acknowledged' | 'declined') => {
    try { sessionStorage.setItem('amud-privacy-notice-v1', choice); }
    catch { /* Local state still closes the notice if storage is disabled. */ }
    setDismissedLocally(true);
    window.dispatchEvent(new Event(NOTICE_EVENT));
  };
  const refused = stage === 'declined';
  const title = refused
    ? locale === 'ar' ? 'يمكنك متابعة التصفح' : locale === 'de' ? 'Sie können weiter surfen' : locale === 'en' ? 'You can keep browsing' : 'Vous pouvez continuer'
    : stage === 'eu' ? text.euTitle : text.maTitle;
  const body = refused ? text.declined : stage === 'eu' ? text.euBody : text.maBody;
  return <section className="amud-privacy-notice" aria-live="polite" aria-labelledby="amud-privacy-title" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
    <div className="amud-privacy-top"><p>{text.label} {!refused && <span>{stage === 'eu' ? '1 / 2' : '2 / 2'}</span>}</p><button type="button" className="amud-privacy-close" aria-label={text.close} onClick={() => refused ? finish('declined') : setStage('declined')}><X size={18}/></button></div>
    <h2 id="amud-privacy-title">{title}</h2><p className="amud-privacy-body">{body}</p>
    {!refused && <div className="amud-privacy-links">{stage === 'eu' && <a href="https://eur-lex.europa.eu/eli/reg/2016/679/art_7/oj" target="_blank" rel="noreferrer">{text.euLink}<ArrowUpRight size={13}/></a>}<a href="https://www.cndp.ma/conformite-des-sites-web/" target="_blank" rel="noreferrer">{text.maLink}<ArrowUpRight size={13}/></a></div>}
    <div className="amud-privacy-actions">{refused ? <button className="amud-privacy-primary" type="button" onClick={() => finish('declined')}>{text.browse}</button> : <><button className="amud-privacy-primary" type="button" onClick={() => stage === 'eu' ? setStage('ma') : finish('acknowledged')}>{stage === 'eu' ? text.continue : text.done}</button><button className="amud-privacy-secondary" type="button" onClick={() => setStage('declined')}>{text.decline}</button></>}</div>
  </section>;
}
