import { NextResponse, type NextRequest } from 'next/server';


const CANDIDATE_PATHS = [
  '/dashboard',
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

function isEmployerPath(pathname: string) {
  return pathname.startsWith('/recruiter');
}

function isAdminProtectedPath(pathname: string) {
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

  // Routes candidat : nécessite une session candidat
  if (isCandidatePath(pathname)) {
    if (role !== 'candidate') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes recruteur : nécessite une session recruteur (rôle "Company")
  if (isEmployerPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'employer') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes admin : nécessite une session admin
  if (isAdminProtectedPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'admin') {
      return redirectTo(request, '/auth-phone');
    }
  }

  // Routes agent commercial : nécessite une session agent
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
    '/dashboard/:path*',
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
    '/recruiter/:path*',
    '/admin/:path*',
    '/agent/:path*',
  ],
};
