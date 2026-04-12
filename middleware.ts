import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
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
