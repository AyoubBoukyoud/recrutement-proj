import {Check,FileText,Video,CalendarDays,Users,QrCode,Wallet,ArrowUpRight} from 'lucide-react';
import {translator,type Locale} from './content';

export function DemoWorkspace({view,locale}:{view:'employer'|'centre';locale:Locale}){
 const t=translator(locale);
 const demo=t('Exemple de fonctionnement · données fictives de démonstration','مثال لطريقة العمل · بيانات توضيحية غير حقيقية','Funktionsbeispiel · fiktive Demonstrationsdaten','Workflow example · fictional demonstration data');
 if(view==='employer')return <div className="demo-workspace">
  <div className="demo-label">{demo}</div>
  <div className="demo-toolbar"><span>{t('Recherche : soins et technique','البحث: الرعاية والمهن التقنية','Suche: Pflege und Technik','Search: healthcare and technical skills')}</span><span>{t('Maroc · Tous niveaux','المغرب · كل المستويات','Marokko · Alle Niveaus','Morocco · All levels')}</span></div>
  <div className="demo-profiles">{[
   [t('Profil soins infirmiers','ملف في التمريض','Pflegeprofil','Nursing profile'),t('Soins · Travail en équipe','الرعاية · العمل الجماعي','Pflege · Teamarbeit','Care · Teamwork'),t('Allemand en apprentissage','يتعلّم الألمانية','Lernt Deutsch','Learning German')],
   [t('Profil maintenance automobile','ملف في صيانة السيارات','Profil Fahrzeugwartung','Automotive maintenance profile'),t('Diagnostic · Maintenance','التشخيص · الصيانة','Diagnose · Wartung','Diagnostics · Maintenance'),t('Allemand B1 déclaré','ألمانية B1 حسب الملف','Deutsch B1 laut Profil','Self-reported German B1')]
  ].map(([title,skills,language],i)=><article className="demo-profile" key={title}><div className="demo-profile-heading"><span className="demo-avatar"><Users size={22}/></span><div><strong>{title}</strong><small>{skills}</small></div></div><span className="demo-chip">{language}</span><div className="demo-profile-docs"><span><FileText size={14}/>{t('CV partagé','سيرة ذاتية مشاركة','Lebenslauf geteilt','CV shared')}</span><span><Video size={14}/>{t('Présentation vidéo','فيديو تعريفي','Videovorstellung','Video introduction')}</span></div><div className="demo-profile-footer"><span>{i===0?t('À examiner','للمراجعة','Zu prüfen','To review'):t('À contacter','للتواصل','Zu kontaktieren','To contact')}</span><ArrowUpRight size={16}/></div></article>)}</div>
  <div className="demo-next"><CalendarDays size={20}/><div><strong>{t('Préparer un entretien','تحضير مقابلة','Gespräch vorbereiten','Prepare an interview')}</strong><p>{t('Choisir un créneau et préciser les sujets à aborder.','اختيار موعد وتحديد مواضيع الحوار.','Termin wählen und Gesprächsthemen festlegen.','Choose a time and agree on topics to discuss.')}</p></div></div>
 </div>;
 return <div className="demo-workspace"><div className="demo-label">{demo}</div><div className="demo-modules">{[
  [Users,t('Inscriptions','التسجيلات','Anmeldungen','Enrolments'),t('Dossier à vérifier','ملف ينتظر المراجعة','Unterlagen prüfen','Application to review')],
  [QrCode,t('Présences QR','الحضور برمز QR','QR-Anwesenheit','QR attendance'),t('Feuille de présence prête','سجل الحضور جاهز','Anwesenheitsliste bereit','Attendance sheet ready')],
  [Wallet,t('Paiements','المدفوعات','Zahlungen','Payments'),t('Règlement à rapprocher','دفعة تحتاج إلى مطابقة','Zahlung abgleichen','Payment to reconcile')]
 ].map(([Icon,label,status])=>{const Symbol=Icon as typeof Users;return <div key={label as string}><Symbol size={23}/><strong>{label as string}</strong><span>{status as string}</span></div>;})}</div>
 <div className="demo-schedule"><h4><CalendarDays size={19}/>{t('Planning & suivi pédagogique','الجدول والمتابعة التربوية','Planung & Lernbegleitung','Schedule and learner support')}</h4>{[
  [t('Allemand · Groupe débutant','الألمانية · مجموعة المبتدئين','Deutsch · Anfängergruppe','German · Beginner group'),t('Communication au travail','التواصل في العمل','Kommunikation am Arbeitsplatz','Workplace communication'),t('Cours planifié','درس مبرمج','Kurs geplant','Class scheduled')],
  [t('Atelier de préparation professionnelle','ورشة التحضير المهني','Workshop Berufsvorbereitung','Career preparation workshop'),t('CV et présentation orale','السيرة والتقديم الشفهي','Lebenslauf und Selbstvorstellung','CV and spoken introduction'),t('Documents à préparer','وثائق للتحضير','Unterlagen vorbereiten','Prepare documents')]
 ].map(([title,body,status])=><div className="demo-course" key={title}><span className="demo-course-marker"/><div><strong>{title}</strong><small>{body}</small></div><span className="demo-chip">{status}</span></div>)}</div>
 <div className="demo-next"><Check size={20}/><div><strong>{t('Du centre au profil professionnel','من المركز إلى الملف المهني','Vom Bildungszentrum zum beruflichen Profil','From training centre to professional profile')}</strong><p>{t('Retrouver les documents partagés et accompagner la progression.','الوصول إلى الوثائق المشاركة ومواكبة التقدّم.','Geteilte Unterlagen finden und Fortschritte begleiten.','Find shared documents and support progress.')}</p></div></div></div>;
}
