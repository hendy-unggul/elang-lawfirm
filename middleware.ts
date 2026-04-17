import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({ request: { headers: req.headers } });
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const url = req.nextUrl.pathname;

  // ── Halaman publik yang tidak perlu auth ──────────────────
  const publicPaths = ['/', '/login'];
  const isPublic = publicPaths.includes(url);

  // ── Tidak login → redirect ke /login (kecuali sudah di halaman publik) ──
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── Sudah login tapi coba akses /login → redirect ke dashboard ──
  if (session && url === '/login') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', session.user.id)
      .single();

    if (profile?.organization === 'branch') {
      return NextResponse.redirect(new URL('/branch', req.url));
    } else if (profile?.organization === 'erlangga') {
      return NextResponse.redirect(new URL('/lawyer', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ── Sudah login tapi akses / (root) → redirect ke dashboard ──
  // Hanya jika ada session aktif — bukan redirect paksa
  if (session && url === '/') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', session.user.id)
      .single();

    if (profile?.organization === 'branch') {
      return NextResponse.redirect(new URL('/branch', req.url));
    } else if (profile?.organization === 'erlangga') {
      return NextResponse.redirect(new URL('/lawyer', req.url));
    }
  }

  // ── Proteksi route per role ────────────────────────────────
  if (session && url.startsWith('/branch')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', session.user.id)
      .single();

    if (profile?.organization !== 'branch') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (session && (url.startsWith('/lawyer') || url.startsWith('/admin'))) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', session.user.id)
      .single();

    if (profile?.organization !== 'erlangga') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
