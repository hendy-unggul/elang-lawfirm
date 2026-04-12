'use client';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  return (
    <div>
      <nav className="bg-gray-800 text-white p-4 flex justify-between"><h1 className="text-xl">Erlangga & Associates</h1><button onClick={handleLogout} className="text-red-300">Logout</button></nav>
      <main>{children}</main>
    </div>
  );
}
