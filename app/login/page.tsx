'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error) {
      console.error('Login error:', error);
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }
    
    console.log('Login success:', data);
    console.log('User ID:', data.user.id);
    
    // Coba fetch profile
    console.log('Fetching profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', data.user.id)
      .single();
    
    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);
    
    if (profileError) {
      console.error('Profile error detail:', profileError);
      setErrorMsg(`Gagal mendapatkan role: ${profileError.message}`);
      setLoading(false);
      return;
    }
    
    console.log('Organization:', profile?.organization);
    
    if (profile?.organization === 'branch') {
      console.log('Redirect to /branch');
      router.push('/branch');
    } else if (profile?.organization === 'erlangga') {
      console.log('Redirect to /lawyer');
      router.push('/lawyer');
    } else {
      console.log('Redirect to /');
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Erlangga AI Agent</h1>
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-2 border rounded mb-3"
          id="email"
          name="email"
          autoComplete="email"
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-2 border rounded mb-4"
          id="password"
          name="password"
          autoComplete="current-password"
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
