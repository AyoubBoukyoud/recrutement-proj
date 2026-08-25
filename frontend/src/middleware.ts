import { NextResponse, type NextRequest } from 'next/server';

/*
 * Les chemins de l'espace candidat. Cette liste et le `matcher` en bas
 * doivent rester identiques : le `matcher` décide où le middleware
 * s'exécute, la liste décide ce qu'il protège, et un chemin présent dans
 * l'une mais pas dans l'autre est une page ouverte sans que rien ne le
 * signale.
 */
const CANDIDATE_PATHS = [
  '/dashboard',
  '/matching-preferences',
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
  '/candidatures',
  '/favoris',
  '/notifications',
  '/compte',
];

/**
 * Duplicate Stitch-template pages, superseded by a functional rewrite. The
 * page component's own `redirect()` only produces a client-side RSC hint
 * here (this route group's layout is a client component), not a real HTTP
 * redirect — middleware is what actually sends the 307, and it can do so
 * before the auth gate below even runs.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/simulateur-salaire': '/salaire',
  '/cours-allemand': '/lecon-jour',
};

/**
 * Les portails `/amud` sont des prototypes localStorage. Ils restent dans le
 * dépôt comme références de design, mais une URL de production ne doit pas
 * donner l'impression que leurs données sont réelles.
 */
function realDestinationForAmud(pathname: string): string | null {
  if (pathname === '/amud' || pathname.startsWith('/amud/centre')) return '/accueil-public';
  if (pathname.startsWith('/amud/admin')) return '/admin/apercu';
  if (pathname.startsWith('/amud/entreprise') || pathname === '/amud/employer') return '/recruiter';
  if (pathname.startsWith('/amud/commercial')) return '/agent';
  return null;
}

function isCandidatePath(pathname: string) {
  return CANDIDATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isRecruiterPath(pathname: string) {
  return pathname.startsWith('/recruiter');
}

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin');
}

function isAgentPath(pathname: string) {
  return pathname.startsWith('/agent');
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

  const amudDestination = realDestinationForAmud(pathname);
  if (amudDestination) return redirectTo(request, amudDestination);

  if (pathname in LEGACY_REDIRECTS) {
    return redirectTo(request, LEGACY_REDIRECTS[pathname]);
  }

  // Routes candidat : nécessite une session candidat.
  if (isCandidatePath(pathname)) {
    if (role !== 'candidate') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes recruteur : nécessite une session recruteur (rôle "employer").
  if (isRecruiterPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'employer') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes admin : nécessite une session admin.
  if (isAdminPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'admin') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes agent commercial : nécessite une session agent.
  if (isAgentPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'agent') {
      return redirectTo(request, '/auth-phone');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/simulateur-salaire/:path*',
    '/cours-allemand/:path*',
    '/dashboard/:path*',
    '/matching-preferences/:path*',
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
    '/candidatures/:path*',
    '/favoris/:path*',
    '/notifications/:path*',
    '/compte/:path*',
    '/recruiter/:path*',
    '/admin/:path*',
    '/agent/:path*',
    '/amud/:path*',
  ],
};
