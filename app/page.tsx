'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('organization').eq('id', user.id).single();
        if (profile?.organization === 'branch') router.push('/branch');
        else if (profile?.organization === 'erlangga') router.push('/lawyer');
        else router.push('/login');
      } else router.push('/login');
    };
    checkRole();
  }, [router]);
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}
