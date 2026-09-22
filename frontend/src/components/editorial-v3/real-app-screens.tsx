import { Check, FileText, Languages, Play, UserRound } from 'lucide-react';
import { translator, type Locale } from './content';

export function RealAppScreens({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const cards = [
    [
      t(
        'Un profil qui avance',
        'ملف يتطور معك',
        'Ein Profil, das wächst',
        'A profile that grows',
      ),
      t(
        'Métier, CV, vidéo et langue : votre parcours prend forme.',
        'المهنة والسيرة والفيديو واللغة: مسارك يتكامل.',
        'Beruf, Lebenslauf, Video und Sprache: Ihr Profil wächst.',
        'Profession, CV, video and language: your journey takes shape.',
      ),
      UserRound,
    ],
    [
      t(
        'Vos documents au même endroit',
        'وثائقك في مكان واحد',
        'Ihre Unterlagen an einem Ort',
        'Your documents in one place',
      ),
      t(
        'Ajoutez votre CV, vos diplômes et vos certificats.',
        'أضف سيرتك الذاتية ودبلوماتك وشهاداتك.',
        'Lebenslauf, Abschlüsse und Zertifikate hinzufügen.',
        'Add your CV, qualifications and certificates.',
      ),
      FileText,
    ],
    [
      t(
        'Votre savoir-faire, visible',
        'مهاراتك أمام المشغّلين',
        'Ihr Können sichtbar machen',
        'Your skills, visible',
      ),
      t(
        'Présentez votre expérience, vos langues et votre motivation.',
        'أبرز خبرتك ولغاتك ودوافعك.',
        'Erfahrung, Sprachen und Motivation zeigen.',
        'Show your experience, languages and motivation.',
      ),
      Languages,
    ],
  ] as const;
  return (
    <div className="real-app-gallery">
      {cards.map(([title, body, Icon], index) => (
        <article key={title}>
          <div className="gallery-phone">
            <span className="phone-island" />
            <div className="phone-screen">
              <div className="phone-top">
                <strong>AMUD Skills</strong>
                <span>•••</span>
              </div>
              <div className="phone-profile">
                <span>
                  <Icon />
                </span>
                <div>
                  <b>{title}</b>
                  <small>
                    {index === 0
                      ? '65%'
                      : index === 1
                        ? 'CV · Diplôme'
                        : 'A1 · A2 · B1'}
                  </small>
                </div>
              </div>
              {[0, 1, 2].map((row) => (
                <div className="phone-row" key={row}>
                  <Check />
                  <span />
                  <i />
                </div>
              ))}
              {index === 2 && (
                <button type="button" tabIndex={-1}>
                  <Play />{' '}
                  {t(
                    'Voir la présentation',
                    'عرض الفيديو',
                    'Video ansehen',
                    'Watch introduction',
                  )}
                </button>
              )}
            </div>
            <span className="phone-home-bar" />
          </div>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  );
}
