'use client';
import {
  ArrowUpRight,
  Briefcase,
  Check,
  GraduationCap,
  Smartphone,
} from 'lucide-react';
import { translator, AUTH, RECRUIT, type Locale } from './content';
import { AdaptiveImage } from './adaptive-image';

export function ProductHero({ locale, crmHref = '/crm-centre-formation' }: { locale: Locale; crmHref?: string }) {
  const t = translator(locale),
    crm = crmHref;
  return (
    <section className="editorial-hero" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <AdaptiveImage
          name="hero-journey"
          alt=""
          priority
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 92vw, 68vw"
        />
      </div>
      <div className="hero-copy">
        <div className="hero-kicker">
          <span />
          <span />
          <span />
          <span />
          {t(
            'DU PROFIL À L’OPPORTUNITÉ',
            'من الملف إلى الفرصة',
            'VOM PROFIL ZUR CHANCE',
            'FROM PROFILE TO OPPORTUNITY',
          )}
        </div>
        <h1 id="hero-title">
          <span>
            {t(
              'Votre parcours au Maroc.',
              'مسارك في المغرب.',
              'Ihr Weg in Marokko.',
              'Your journey in Morocco.',
            )}
          </span>
          <strong>
            {t(
              'Des opportunités en Allemagne.',
              'فرص في ألمانيا.',
              'Chancen in Deutschland.',
              'Opportunities in Germany.',
            )}
          </strong>
        </h1>
        <p>
          {t(
            'AMUD Skills relie les étudiants et chercheurs d’emploi au Maroc aux employeurs en Allemagne, dans un espace clair où chacun peut présenter son parcours et ses compétences.',
            'تربط AMUD Skills الطلبة والباحثين عن عمل في المغرب بالمشغّلين في ألمانيا، عبر فضاء واضح لعرض المسار والمهارات.',
            'AMUD Skills verbindet Studierende und Arbeitssuchende in Marokko mit Arbeitgebern in Deutschland – in einem klaren Bereich, in dem sie ihren Werdegang und ihre Kompetenzen präsentieren können.',
            'AMUD Skills connects students and job seekers in Morocco with employers in Germany through a clear space for presenting their experience and skills.',
          )}
        </p>
        <div className="actions">
          <a className="btn" href={AUTH}>
            {t(
              'Construire mon profil',
              'إنشاء ملفي المهني',
              'Mein Profil erstellen',
              'Build my profile',
            )}
            <ArrowUpRight size={18} />
          </a>
          <a className="btn secondary" href={RECRUIT}>
            {t(
              'Rechercher des talents',
              'البحث عن مواهب',
              'Talente suchen',
              'Find talent',
            )}
          </a>
        </div>
        <p className="hero-note">
          <Check size={17} />
          {t(
            'Avec ou sans allemand, votre parcours peut commencer.',
            'سواء كنت تتحدث الألمانية أم لا، يمكنك بدء مسارك.',
            'Mit oder ohne Deutsch: Ihr Weg kann beginnen.',
            'With or without German, your journey can begin.',
          )}
        </p>
      </div>
      <div className="wrap platform-audiences">
        <a href="#comment-ca-marche">
          <Smartphone />
          <span>
            <strong>
              {t(
                'Pour les talents',
                'للباحثين عن عمل',
                'Für Talente',
                'For talent',
              )}
            </strong>
            <small>
              {t(
                'Un profil, vos documents, votre voix.',
                'ملفك ووثائقك وصوتك.',
                'Profil, Unterlagen und Stimme.',
                'Your profile, documents and voice.',
              )}
            </small>
          </span>
          <ArrowUpRight />
        </a>
        <a href="#entreprises">
          <Briefcase />
          <span>
            <strong>
              {t(
                'Pour les employeurs',
                'للمشغّلين',
                'Für Arbeitgeber',
                'For employers',
              )}
            </strong>
            <small>
              {t(
                'Des compétences à découvrir au Maroc.',
                'مهارات تستحق الاكتشاف في المغرب.',
                'Kompetenzen aus Marokko entdecken.',
                'Discover skills in Morocco.',
              )}
            </small>
          </span>
          <ArrowUpRight />
        </a>
        <a href={crm}>
          <GraduationCap />
          <span>
            <strong>
              {t(
                'Pour les centres',
                'لمراكز التكوين',
                'Für Bildungszentren',
                'For training centres',
              )}
            </strong>
            <small>
              {t(
                'La gestion et le suivi, réunis.',
                'الإدارة والمتابعة في مكان واحد.',
                'Verwaltung und Begleitung an einem Ort.',
                'Management and learner support together.',
              )}
            </small>
          </span>
          <ArrowUpRight />
        </a>
      </div>
    </section>
  );
}

export { RealAppScreens } from './real-app-screens';
