import { EditorialImage } from './visual-details';
import { AdaptiveImage } from './adaptive-image';
import { CareersSlider } from './photo-slider';
import {
  ArrowUpRight,
  HeartHandshake,
  Check,
  Stethoscope,
  Wrench,
  Truck,
  Code2,
  FileText,
} from 'lucide-react';
import { translator, content, type Locale } from './content';
import { Heading, Button } from './ui';
export function MarketplaceLower({ locale }: { locale: Locale }) {
  const t = translator(locale),
    c = content(locale);
  return (
    <>
      <section id="metiers" className="section careers-section">
        <div className="wrap">
          <div className="heading-row">
            <Heading
              label={t(
                'DES MÉTIERS, DES SAVOIR-FAIRE',
                'مهن ومهارات',
                'BERUFE UND FÄHIGKEITEN',
                'CAREERS AND SKILLS',
              )}
              title={t(
                'Votre métier. Votre prochaine étape.',
                'مهنتك. خطوتك القادمة.',
                'Ihr Beruf. Ihr nächster Schritt.',
                'Your profession. Your next step.',
              )}
            />
            <p className="heading-aside">
              {t(
                'Explorez les domaines et leurs exigences pour construire votre projet.',
                'استكشف المجالات ومتطلباتها لبناء مشروعك المهني.',
                'Entdecken Sie Berufsfelder und Anforderungen für Ihren Weg.',
                'Explore career areas and their requirements to plan your professional future.',
              )}
            </p>
          </div>
          <CareersSlider locale={locale} />
          <div className="career-links">
            {[
              [
                t(
                  'Soins & santé',
                  'التمريض والرعاية الصحية',
                  'Pflege & Gesundheit',
                  'Nursing and healthcare',
                ),
                'infirmier',
              ],
              [
                t(
                  'Mécanique industrielle',
                  'الميكانيك الصناعي',
                  'Industriemechanik',
                  'Industrial mechanics',
                ),
                'mecanicien-industriel',
              ],
              [
                t(
                  'Transport & logistique',
                  'النقل واللوجستيك',
                  'Transport & Logistik',
                  'Transport and logistics',
                ),
                'chauffeur-poids-lourd',
              ],
              [
                t(
                  'Informatique',
                  'المعلوميات',
                  'Informatik',
                  'Information technology',
                ),
                'developpeur',
              ],
            ].map(([title, slug], i) => {
              const Icon = [Stethoscope, Wrench, Truck, Code2][i];
              return (
                <a href={'/metiers/' + slug} key={slug}>
                  <Icon size={21} />
                  <span>{title}</span>
                  <ArrowUpRight size={17} />
                </a>
              );
            })}
          </div>
          <p className="section-note">
            {t(
              'Domaines présentés à titre d’orientation, sans promesse de poste disponible. Visuels illustratifs générés par IA.',
              'مجالات للتوجيه دون وعد بتوفر وظائف. صور توضيحية مولّدة بالذكاء الاصطناعي.',
              'Berufsfelder zur Orientierung, ohne Zusage verfügbarer Stellen. KI-generierte Symbolbilder.',
              'Career areas are shown for guidance, with no promise of available jobs. Illustrative AI-generated images.',
            )}
          </p>
        </div>
      </section>
      <section className="section wrap matching">
        <div>
          <Heading
            label={t(
              'LE MATCHING, EN TOUTE CLARTÉ',
              'مطابقة المهارات والاحتياجات بوضوح',
              'PASSENDE PROFILE FINDEN – TRANSPARENT',
              'MATCHING, EXPLAINED',
            )}
            title={t(
              'Le bon lien commence par les bons critères.',
              'التواصل المناسب يبدأ بالمعايير المناسبة.',
              'Der passende Kontakt beginnt mit den passenden Kriterien.',
              'The right connection starts with the right criteria.',
            )}
            description={t(
              'Votre métier, vos compétences, votre expérience et votre niveau de langue aident à rapprocher un profil d’un besoin. Ensuite, place à l’échange.',
              'تساعد المهنة والمهارات والخبرة ومستوى اللغة على تقريب الملف من احتياج الشركة. ثم يأتي الحوار.',
              'Beruf, Kompetenzen, Erfahrung und Sprache helfen, Profile mit Anforderungen zusammenzubringen. Danach zählt das Gespräch.',
              'Your profession, skills, experience and language level help connect your profile with an employer’s needs. Then the conversation begins.',
            )}
          />
          <p className="quiet-note">
            <HeartHandshake size={19} />
            {t(
              'Un point de départ pour échanger, jamais une promesse d’embauche.',
              'بداية للتواصل، وليست وعدًا بالتوظيف.',
              'Ein Ausgangspunkt für Gespräche, keine Einstellungszusage.',
              'A starting point for a conversation, never a promise of employment.',
            )}
          </p>
        </div>
        <div
          className="match-search-card"
          role="img"
          aria-label={t(
            'Aperçu des critères utilisés pour rechercher un profil.',
            'معاينة لمعايير البحث عن ملف مهني.',
            'Vorschau der Kriterien für die Profilsuche.',
            'Preview of criteria used to find a profile.',
          )}
        >
          <div className="match-search-tabs">
            <span className="is-active">
              {t('Emploi', 'عمل', 'Arbeit', 'Jobs')}
            </span>
            <span>{t('Formation', 'تكوين', 'Ausbildung', 'Training')}</span>
          </div>
          <div className="match-search-field">
            <span aria-hidden="true">⌕</span>
            {t(
              'Métier, ville, secteur…',
              'المهنة، المدينة، المجال…',
              'Beruf, Stadt, Bereich …',
              'Role, city, field…',
            )}
          </div>
          <div className="match-search-filters">
            {[
              t('Localisation', 'الموقع', 'Standort', 'Location'),
              t('Secteur', 'المجال', 'Bereich', 'Field'),
            ].map((x) => (
              <span key={x}>
                {x}<b aria-hidden="true">⌄</b>
              </span>
            ))}
          </div>
          <div className="match-search-filters match-search-filters-bottom">
            {[
              t('Type de contrat', 'نوع العقد', 'Vertragsart', 'Contract type'),
              t('Niveau de langue', 'مستوى اللغة', 'Sprachniveau', 'Language level'),
            ].map((x) => (
              <span key={x}>
                {x}<b aria-hidden="true">⌄</b>
              </span>
            ))}
          </div>
          <div className="match-search-foot">
            <Check size={15} />
            {t(
              'Des critères clairs pour un premier échange.',
              'معايير واضحة لبدء التواصل.',
              'Klare Kriterien für den ersten Austausch.',
              'Clear criteria for a first conversation.',
            )}
          </div>
        </div>
        <figure className="matching-person">
          <AdaptiveImage
            name="career-logistics"
            alt={t(
              'Jeune professionnel marocain dans un environnement de travail.',
              'شاب مهني مغربي في بيئة عمل.',
              'Junger marokkanischer Berufstätiger am Arbeitsplatz.',
              'Young Moroccan professional in a work setting.',
            )}
            sizes="(max-width: 639px) 90vw, (max-width: 1023px) 36vw, 24vw"
          />
          <figcaption>
            {t('Talents au Maroc', 'مواهب من المغرب', 'Talente aus Marokko', 'Talent in Morocco')}
          </figcaption>
        </figure>
      </section>
    </>
  );
}
