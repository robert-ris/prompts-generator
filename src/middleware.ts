import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Validate that Supabase configuration is available
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    console.error('Supabase configuration is missing in middleware');
    return res;
  }

  const supabase = createServerClient(
    appConfig.supabaseUrl,
    appConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            if (options) {
              res.cookies.set(name, value, options);
            }
          });
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/builder',
    '/library',
    '/community',
  ];

  // Define auth routes (redirect if already authenticated)
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password'];

  const { pathname } = req.nextUrl;

  // Check if user is trying to access protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if user is trying to access auth routes
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth/login', req.url);
    // Preserve full path (including potential query string) for post-login redirect
    const fullPath = req.nextUrl.pathname + (req.nextUrl.search || '');
    redirectUrl.searchParams.set('redirectTo', fullPath);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth route with session, redirect to dashboard or specified redirect
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo');
    const redirectUrl = new URL(redirectTo || '/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
