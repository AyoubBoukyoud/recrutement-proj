import { EditorialImage } from './visual-details';
import { AdaptiveImage } from './adaptive-image';
import { CareersSlider } from './photo-slider';
import { AnimatedFrame } from './motion';
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
import { translator, content, RECRUIT, type Locale } from './content';
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
      <section id="entreprises" className="section b2b">
        <div className="wrap">
          <div className="b2b-grid">
            <div>
              <Heading
                label={t(
                  'POUR LES ENTREPRISES EN ALLEMAGNE',
                  'للشركات في ألمانيا',
                  'FÜR ARBEITGEBER IN DEUTSCHLAND',
                  'FOR COMPANIES IN GERMANY',
                )}
                title={t(
                  'Ouvrez votre recrutement à de nouveaux talents.',
                  'وسّعوا بحثكم ليشمل مواهب جديدة.',
                  'Öffnen Sie Ihre Personalsuche für neue Talente.',
                  'Open your recruitment to new talent.',
                )}
                description={t(
                  'Le Maroc regorge de compétences à découvrir. Accédez à des profils structurés et construisez votre sélection selon vos besoins.',
                  'المغرب يضم مهارات تستحق الاكتشاف. اطّلعوا على ملفات منظمة وابنوا اختياراتكم وفق احتياجاتكم.',
                  'Marokko bietet Kompetenzen, die es zu entdecken gilt. Nutzen Sie strukturierte Profile und treffen Sie Ihre Auswahl nach Ihrem Bedarf.',
                  'Morocco has skills worth discovering. Explore structured profiles and build your shortlist around your needs.',
                )}
              />
              <div className="actions">
                <Button href={RECRUIT}>{c.recruit}</Button>
                <a className="text-link" href="/employeurs">
                  {t(
                    'Découvrir l’espace entreprise',
                    'اكتشاف فضاء الشركات',
                    'Arbeitgeberbereich entdecken',
                    'Explore the employer area',
                  )}
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
            <AnimatedFrame className="b2b-motion">
              <div className="b2b-photo">
                <img
                  src="/landing-assets/team.jpg"
                  alt={t(
                    'Équipe réunie autour d’un projet, photographie d’illustration',
                    'فريق مجتمع حول مشروع، صورة توضيحية',
                    'Team bei der Zusammenarbeit, Symbolfoto',
                    'A team working together on a project, illustrative photograph',
                  )}
                  width="1000"
                  height="1500"
                  loading="lazy"
                />
                <span>
                  {t(
                    'Des compétences. Des personnes. Des perspectives.',
                    'مهارات. أشخاص. آفاق.',
                    'Kompetenzen. Menschen. Perspektiven.',
                    'Skills. People. Possibilities.',
                  )}
                </span>
              </div>
            </AnimatedFrame>
            <aside
              className="b2b-aside"
              aria-label={t(
                'Repères pour les entreprises',
                'نقاط أساسية للشركات',
                'Orientierung für Unternehmen',
                'Information for companies',
              )}
            >
              <p className="b2b-aside-label">
                {t(
                  'VOTRE ESPACE ENTREPRISE',
                  'فضاء الشركات',
                  'IHR UNTERNEHMENSBEREICH',
                  'YOUR EMPLOYER SPACE',
                )}
              </p>
              <ul>
                {[
                  t(
                    'Des profils lisibles et structurés',
                    'ملفات واضحة ومنظّمة',
                    'Übersichtliche, strukturierte Profile',
                    'Clear, structured profiles',
                  ),
                  t(
                    'Une recherche selon vos critères',
                    'بحث وفق معاييركم',
                    'Suche nach Ihren Kriterien',
                    'Search using your criteria',
                  ),
                  t(
                    'La mise en relation au cœur du parcours',
                    'التواصل في صميم المسار',
                    'Kontaktaufnahme im Mittelpunkt',
                    'Connecting people at every step',
                  ),
                ].map((item) => (
                  <li key={item}>
                    <Check size={18} />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          <div className="b2b-steps">
            {[
              [
                t(
                  'Définissez votre besoin',
                  'حدّدوا احتياجاتكم',
                  'Bedarf definieren',
                  'Define your needs',
                ),
                t(
                  'Métier, expérience, langue et disponibilité.',
                  'المهنة والخبرة واللغة والتوفر.',
                  'Beruf, Erfahrung, Sprache und Verfügbarkeit.',
                  'Profession, experience, language and availability.',
                ),
              ],
              [
                t(
                  'Explorez les profils',
                  'استكشفوا الملفات',
                  'Profile entdecken',
                  'Explore profiles',
                ),
                t(
                  'Identifiez les compétences pertinentes.',
                  'حدّدوا المهارات المناسبة.',
                  'Relevante Kompetenzen erkennen.',
                  'Identify relevant skills.',
                ),
              ],
              [
                t(
                  'Examinez les parcours',
                  'راجعوا المسارات',
                  'Werdegänge prüfen',
                  'Review experience',
                ),
                t(
                  'Consultez les informations et documents partagés.',
                  'اطّلعوا على المعلومات والوثائق التي شاركها المرشحون.',
                  'Geteilte Informationen und Dokumente prüfen.',
                  'Read the information and documents candidates have shared.',
                ),
              ],
              [
                t(
                  'Engagez l’échange',
                  'ابدؤوا الحوار',
                  'Gespräch beginnen',
                  'Start a conversation',
                ),
                t(
                  'Prenez contact avec les talents retenus.',
                  'تواصلوا مع المواهب المختارة.',
                  'Kontakt zu ausgewählten Talenten aufnehmen.',
                  'Contact your shortlisted candidates.',
                ),
              ],
            ].map(([title, body], i) => (
              <div key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap">
        <Heading
          label={t(
            'APRÈS LA MISE EN RELATION',
            'بعد التواصل',
            'NACH DER KONTAKTAUFNAHME',
            'AFTER YOU CONNECT',
          )}
          title={t(
            'La rencontre est un début. La suite se construit ensemble.',
            'التواصل هو البداية. والخطوات التالية تبنونها معًا.',
            'Der Kontakt ist der Anfang. Den weiteren Weg gestalten Sie gemeinsam.',
            'Connecting is the beginning. Build the next steps together.',
          )}
          center
        />
        <div className="three-grid journey">
          {[
            [
              t(
                'Échanger & se comprendre',
                'الحوار والتفاهم',
                'Austausch & Verständnis',
                'Talk and understand each other',
              ),
              t(
                'Clarifiez les attentes, les compétences et les conditions du poste.',
                'وضّحوا التوقعات والمهارات وشروط المنصب.',
                'Erwartungen, Kompetenzen und Stellenbedingungen klären.',
                'Clarify expectations, skills and job conditions.',
              ),
            ],
            [
              t(
                'Préciser le parcours',
                'توضيح المسار',
                'Den Weg konkretisieren',
                'Define the way forward',
              ),
              t(
                'Identifiez les éventuels besoins en langue, formation ou reconnaissance.',
                'حدّدوا الاحتياجات المحتملة في اللغة أو التكوين أو الاعتراف بالمؤهلات.',
                'Ermitteln Sie, ob Sprachförderung, Weiterbildung oder die Anerkennung von Qualifikationen erforderlich sind.',
                'Identify any language, training or qualification recognition needs.',
              ),
            ],
            [
              t(
                'Préparer les prochaines étapes',
                'تحضير الخطوات التالية',
                'Nächste Schritte vorbereiten',
                'Prepare the next steps',
              ),
              t(
                'Avancez selon votre situation et les démarches qui s’appliquent.',
                'تقدّموا وفق وضعكم والإجراءات التي تنطبق عليه.',
                'Entsprechend Ihrer Situation und den erforderlichen Verfahren vorgehen.',
                'Move forward according to your circumstances and the procedures that apply.',
              ),
            ],
          ].map(([title, body], i) => (
            <article key={title}>
              <EditorialImage
                name={['conversation', 'pathway', 'next-steps'][i]}
              />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
