import { COMPANY } from '@/lib/company';

/**
 * Données structurées `Organization` : ce que les moteurs de recherche et les
 * outils de vérification lisent pour identifier l'entreprise. Les champs non
 * renseignés dans `lib/company.ts` sont omis, jamais devinés.
 */
export function OrganizationJsonLd() {
  const { name, url, logo, email, social, legalName, registration, city, countryCode, foundingDate, founders } = COMPANY;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    email,
    description:
      'Plateforme qui relie les étudiants et chercheurs d’emploi au Maroc aux employeurs en Allemagne, avec sites web, applications, jeux éducatifs et formation continue pour les entreprises.',
    sameAs: Object.values(social),
    areaServed: [
      { '@type': 'Country', name: 'Morocco' },
      { '@type': 'Country', name: 'Germany' },
    ],
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email }],
    ...(legalName && { legalName }),
    ...(registration && { identifier: registration }),
    ...(foundingDate && { foundingDate }),
    ...((city || countryCode) && {
      address: {
        '@type': 'PostalAddress',
        ...(city && { addressLocality: city }),
        ...(countryCode && { addressCountry: countryCode }),
      },
    }),
    ...(founders.length > 0 && {
      founder: founders.map(({ name: founderName, role, linkedin }) => ({
        '@type': 'Person',
        name: founderName,
        jobTitle: role,
        ...(linkedin && { sameAs: linkedin }),
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      // `<` échappé : une valeur ne peut pas fermer la balise <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
