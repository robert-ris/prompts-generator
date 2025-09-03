import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config';

export async function POST() {
  const reqCookies = await cookies();
  const res = NextResponse.json({ success: true });

  try {
    const supabase = createServerClient(
      appConfig.supabaseUrl!,
      appConfig.supabaseAnonKey!,
      {
        cookies: {
          getAll() {
            return reqCookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear all Supabase-related cookies with multiple approaches
    const allCookies = reqCookies.getAll();
    const cookieNamesToClear = [
      // Supabase auth cookies
      'sb-access-token',
      'sb-refresh-token',
      // Any cookie starting with 'sb-'
      ...allCookies
        .filter(cookie => cookie.name.startsWith('sb-'))
        .map(cookie => cookie.name),
      // Any cookie containing 'supabase'
      ...allCookies
        .filter(cookie => cookie.name.includes('supabase'))
        .map(cookie => cookie.name),
      // Any cookie containing 'auth'
      ...allCookies
        .filter(cookie => cookie.name.includes('auth'))
        .map(cookie => cookie.name),
    ];

    // Remove duplicates
    const uniqueCookieNames = [...new Set(cookieNamesToClear)];

    // Clear each cookie with multiple approaches
    uniqueCookieNames.forEach(cookieName => {
      // Approach 1: Set empty value with immediate expiration
      res.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
      });

      // Approach 2: Set empty value with domain-specific options
      res.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        domain: undefined,
      });
    });

    // Set cache control headers to prevent caching
    res.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate, private'
    );
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');

    console.log('Server-side sign out completed successfully');
    return res;
  } catch (error) {
    console.error('Unexpected error in sign-out route:', error);
    return NextResponse.json(
      { error: 'Internal server error during sign out' },
      { status: 500 }
    );
  }
}
