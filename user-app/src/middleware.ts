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
  return pathname.startsWith('/employer');
}

function isAdminProtectedPath(pathname: string) {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
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

  // Routes employeur : nécessite une session employeur
  if (isEmployerPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'employer') {
      return redirectTo(request, '/login-employeur');
    }
  }

  // Routes admin (hors /admin/login) : nécessite une session admin
  if (isAdminProtectedPath(pathname)) {
    if (role === 'candidate') {
      return redirectTo(request, '/dashboard');
    }
    if (role !== 'admin') {
      return redirectTo(request, '/admin/login');
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
    '/employer/:path*',
    '/admin/:path*',
  ],
};
