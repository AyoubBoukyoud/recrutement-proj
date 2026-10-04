import { translator, content, type Locale } from './content';
import { Heading, Button, Product } from './ui';
import { BookOpen, CalendarDays, GraduationCap, QrCode, Users, Wallet } from 'lucide-react';
export { MarketplaceLower } from './marketplace';
export { Closing } from './closing';
const icons = [Users, GraduationCap, CalendarDays, QrCode, Wallet, BookOpen];
export function CRMPage({ locale, homeHref = '/' }: { locale: Locale; homeHref?: string }) {
  const t = translator(locale),
    c = content(locale),
    home = homeHref;
  return (
    <>
      <section className="section crm-hero wrap">
        <a className="text-link" href={home}>
          ←{' '}
          {t(
            'Retour à AMUD Skills',
            'العودة إلى AMUD Skills',
            'Zurück zu AMUD Skills',
            'Back to AMUD Skills',
          )}
        </a>
        <div className="crm-hero-grid">
          <div>
            <div className="eyebrow">
              <span className="dot" />
              {c.centre}
            </div>
            <h1>
              {t(
                'Votre centre, connecté à l’avenir de vos apprenants.',
                'مركزكم متصل بمستقبل المتعلمين.',
                'Ihr Bildungszentrum. Verbunden mit der Zukunft Ihrer Lernenden.',
                'Your centre, connected to your learners’ future.',
              )}
            </h1>
            <p>
              {t(
                'Le CRM AMUD Skills rassemble la gestion administrative et le suivi pédagogique pour donner plus de place à la formation.',
                'يجمع CRM AMUD Skills الإدارة والمتابعة التربوية لمنح التكوين مساحة أكبر.',
                'Das AMUD Skills CRM verbindet Verwaltung und Lernbegleitung, damit mehr Raum für Bildung bleibt.',
                'The AMUD Skills CRM brings administration and learning support together, leaving more room for training.',
              )}
            </p>
            <Button href="#fonctionnalites">
              {t(
                'Explorer les fonctionnalités',
                'استكشاف الميزات',
                'Funktionen entdecken',
                'Explore the features',
              )}
            </Button>
          </div>
          <Product view="centre" locale={locale} />
        </div>
      </section>
      <section id="fonctionnalites" className="section mint-section">
        <div className="wrap">
          <Heading
            label={t(
              'LA GESTION AU QUOTIDIEN',
              'الإدارة اليومية',
              'VERWALTUNG IM ALLTAG',
              'DAY-TO-DAY MANAGEMENT',
            )}
            title={t(
              'Un espace pour les équipes. Un suivi pour chaque apprenant.',
              'فضاء للفرق. ومتابعة لكل متعلم.',
              'Ein Bereich für Ihr Team. Begleitung für jeden Lernenden.',
              'A shared space for teams. Support for every learner.',
            )}
            center
          />
          <div className="features-grid">
            {c.crmFeatures.map(([title, body], i) => {
              const Icon = icons[i];
              return (
                <article key={title}>
                  <div className="feature-icon">
                    <Icon />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section wrap crm-story">
        <img
          src="/landing-assets/training.webp"
          width="1440"
          height="804"
          loading="lazy"
          alt={t(
            'Visuel AMUD Skills présentant une salle de formation',
            'صورة تقديمية لـ AMUD Skills تعرض قاعة تكوين',
            'AMUD Skills Präsentationsmotiv eines Unterrichtsraums',
            'AMUD Skills illustration of a training room',
          )}
        />
        <div>
          <Heading
            label={t(
              'DE LA FORMATION AU PARCOURS PROFESSIONNEL',
              'من التكوين إلى المسار المهني',
              'VON DER BILDUNG ZUM BERUFLICHEN WEG',
              'FROM TRAINING TO A PROFESSIONAL FUTURE',
            )}
            title={t(
              'La formation rejoint les opportunités.',
              'التكوين يلتقي بالفرص.',
              'Bildung trifft auf Chancen.',
              'Training meets opportunity.',
            )}
            description={t(
              'Accompagnez vos apprenants dans leur progression et aidez-les à mieux présenter leurs compétences. Ils conservent leur propre parcours sur le marketplace.',
              'واكبوا تقدم المتعلمين وساعدوهم على إبراز مهاراتهم، مع احتفاظهم بمسارهم الخاص داخل المنصة.',
              'Begleiten Sie die Fortschritte Ihrer Lernenden und helfen Sie ihnen, ihre Fähigkeiten zu zeigen. Ihren eigenen Weg auf der Plattform gestalten sie weiterhin selbst.',
              'Support your learners’ progress and help them showcase their skills. They keep control of their own journey on the platform.',
            )}
          />
          <Button href={home + '#apercu'} secondary>
            {t(
              'Voir les espaces du marketplace',
              'عرض فضاءات المنصة',
              'Bereiche der Plattform ansehen',
              'Explore the platform’s areas',
            )}
          </Button>
        </div>
      </section>
    </>
  );
}
