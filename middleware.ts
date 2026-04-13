import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({
              request: { headers: req.headers },
            });
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const url = req.nextUrl.pathname;

  if (!session && url !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

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
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
