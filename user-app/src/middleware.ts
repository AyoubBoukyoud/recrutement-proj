import { NextResponse, type NextRequest } from 'next/server';


/*
 * Les chemins de l'espace candidat. Cette liste et le `matcher` en bas doivent
 * rester identiques : le `matcher` décide où le middleware s'exécute, la liste
 * décide ce qu'il protège, et un chemin présent dans l'une mais pas dans
 * l'autre est une page ouverte sans que rien ne le signale — c'est ce qui
 * était arrivé à /cours-allemand, /matching-preferences et
 * /simulateur-salaire, atteignables sans session alors qu'elles ne sont liées
 * que depuis le tableau de bord.
 */
const CANDIDATE_PATHS = [
  '/dashboard',
  '/cours-allemand',
  '/matching-preferences',
  '/simulateur-salaire',
  '/documents',
  '/video',
  '/test-langue',
  '/reclamation',
  '/faq',
  '/profil',
  '/profile-creation',
  '/lecon-jour',
  '/offres',
  '/quiz-metier',
  '/visibilite',
  '/salaire',
  '/parrainage',
  '/verification-identite',
];

function isCandidatePath(pathname: string) {
  return CANDIDATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, targetPathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = targetPathname;
  url.search = '';
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('as_role')?.value;

  // Cette application ne sert que les candidats : les espaces recruteur,
  // administrateur et agent vivent dans web-admin. Un rôle non candidat n'a
  // donc rien à protéger ici — il est renvoyé vers la console ops dès la
  // connexion, par `destinationForRole`.
  if (isCandidatePath(pathname) && role !== 'candidate') {
    return redirectTo(request, '/auth-phone');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cours-allemand/:path*',
    '/matching-preferences/:path*',
    '/simulateur-salaire/:path*',
    '/documents/:path*',
    '/video/:path*',
    '/test-langue/:path*',
    '/reclamation/:path*',
    '/faq/:path*',
    '/profil/:path*',
    '/profile-creation/:path*',
    '/lecon-jour/:path*',
    '/offres/:path*',
    '/quiz-metier/:path*',
    '/visibilite/:path*',
    '/salaire/:path*',
    '/parrainage/:path*',
    '/verification-identite/:path*',
  ],
};
