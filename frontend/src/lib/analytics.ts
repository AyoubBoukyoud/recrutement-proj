export const ANALYTICS_CONSENT_KEY = 'amud-analytics-consent-v1';
export const ANALYTICS_CONSENT_EVENT = 'amud-analytics-consent-change';

const PRIVATE_PATHS = [
  '/dashboard', '/matching-preferences', '/documents', '/video', '/test-langue',
  '/reclamation', '/faq', '/profil', '/profile-creation', '/lecon-jour', '/taches',
  '/offres', '/quiz-metier', '/visibilite', '/salaire', '/parrainage',
  '/verification-identite', '/candidatures', '/favoris', '/notifications', '/compte',
  '/messages', '/recruiter', '/agent', '/admin', '/amud', '/auth-phone', '/auth-google',
  '/otp', '/splash', '/language', '/offline', '/dev', '/crm',
];

export function isPublicAnalyticsPage(pathname: string) {
  return !PRIVATE_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
