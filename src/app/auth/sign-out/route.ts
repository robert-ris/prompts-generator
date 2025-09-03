import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config';

export async function POST() {
  const reqCookies = await cookies();
  const res = NextResponse.json({ success: true });

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

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extra hardening: remove any residual Supabase cookies on the response
  try {
    const all = reqCookies.getAll();
    all.forEach(c => {
      if (c.name.startsWith('sb-') || c.name.includes('supabase')) {
        res.cookies.set(c.name, '', { maxAge: 0, path: '/' });
      }
    });
  } catch {}

  return res;
}
