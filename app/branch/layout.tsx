'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [branchName, setBranchName] = useState('');
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('branches(name)').eq('id', user.id).single();
        if (profile?.branches) setBranchName(profile.branches.name);
      }
    };
    getProfile();
  }, []);
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  return (
    <div>
      <nav className="bg-white shadow p-4 flex justify-between"><h1 className="text-xl font-bold">Portal Cabang BSI - {branchName}</h1><button onClick={handleLogout} className="text-red-600">Logout</button></nav>
      <main>{children}</main>
    </div>
  );
}
