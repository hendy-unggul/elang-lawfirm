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
      password,
    });

    if (error) {
      setErrorMsg('Email atau kata sandi tidak valid.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setErrorMsg('Gagal memuat profil pengguna.');
      setLoading(false);
      return;
    }

    if (profile.organization === 'branch') router.push('/branch');
    else if (profile.organization === 'erlangga') router.push('/lawyer');
    else router.push('/');

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #0c0d0f;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          color: #e8e6e0;
        }

        /* Left panel — brand */
        .login-left {
          width: 52%;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -120px; left: -120px;
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(192,160,98,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -80px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(192,160,98,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-sigil {
          width: 40px; height: 40px;
          border: 1px solid rgba(192,160,98,0.5);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #c0a062;
          letter-spacing: 0;
        }

        .brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(232,230,224,0.75);
        }

        .brand-tagline {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(192,160,98,0.6);
          margin-top: 3px;
        }

        .login-headline {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 0;
        }

        .headline-eyebrow {
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c0a062;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .headline-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: #c0a062;
        }

        .headline-main {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 3.5vw, 52px);
          font-weight: 400;
          line-height: 1.15;
          color: #e8e6e0;
          margin-bottom: 28px;
        }

        .headline-main em {
          font-style: italic;
          color: #c0a062;
        }

        .headline-sub {
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: rgba(232,230,224,0.45);
          max-width: 380px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          font-size: 13px;
          font-weight: 300;
          color: rgba(232,230,224,0.5);
          line-height: 1.5;
        }

        .feature-dot {
          width: 6px; height: 6px;
          border: 1px solid rgba(192,160,98,0.5);
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }

        /* Right panel — form */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
        }

        .login-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .form-header {
          margin-bottom: 40px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 400;
          color: #e8e6e0;
          margin-bottom: 8px;
        }

        .form-subtitle {
          font-size: 13px;
          font-weight: 300;
          color: rgba(232,230,224,0.4);
        }

        .form-divider {
          width: 32px;
          height: 1px;
          background: #c0a062;
          margin: 16px 0 0;
          opacity: 0.6;
        }

        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(232,230,224,0.45);
          margin-bottom: 8px;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 2px;
          padding: 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #e8e6e0;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          -webkit-appearance: none;
        }

        .field-input::placeholder {
          color: rgba(232,230,224,0.2);
        }

        .field-input:focus {
          border-color: rgba(192,160,98,0.5);
          background: rgba(255,255,255,0.06);
        }

        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #161719 inset;
          -webkit-text-fill-color: #e8e6e0;
          caret-color: #e8e6e0;
        }

        .error-block {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(220,80,60,0.08);
          border: 1px solid rgba(220,80,60,0.2);
          border-radius: 2px;
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 300;
          color: #e88a7a;
          line-height: 1.5;
        }

        .error-icon {
          width: 16px; height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
          opacity: 0.7;
        }

        .submit-btn {
          width: 100%;
          background: #c0a062;
          border: none;
          border-radius: 2px;
          padding: 14px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0c0d0f;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s, transform 0.1s;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #d4b478;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(12,13,15,0.3);
          border-top-color: #0c0d0f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .form-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: rgba(232,230,224,0.25);
          text-align: center;
          line-height: 1.6;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* Left panel */}
        <div className="login-left">
          <div className="brand-mark">
            <div className="brand-sigil">E</div>
            <div>
              <div className="brand-name">Erlangga</div>
              <div className="brand-tagline">Syariah Contract Compliance</div>
            </div>
          </div>

          <div className="login-headline">
            <div className="headline-eyebrow">Syariah Contract Compliance</div>
            <h1 className="headline-main">
              Setiap akad,<br />
              diverifikasi sebelum<br />
              <em>ditandatangani</em>
            </h1>
            <p className="headline-sub">
              Platform AI yang memastikan setiap kontrak syariah
              tidak bertentangan dengan fatwa DSN-MUI dan regulasi OJK —
              sebelum akad dieksekusi.
            </p>
          </div>

          <div className="feature-list">
            {[
              'Verifikasi akad terhadap fatwa DSN-MUI & POJK',
              'Deteksi potensi sengketa sebelum kontrak ditandatangani',
              'Clearance hukum dengan anchor regulasi terverifikasi',
            ].map((f, i) => (
              <div className="feature-item" key={i}>
                <div className="feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="login-form-wrap">
            <div className="form-header">
              <h2 className="form-title">Masuk ke sistem</h2>
              <p className="form-subtitle">Gunakan kredensial yang diberikan administrator</p>
              <div className="form-divider" />
            </div>

            <form onSubmit={handleLogin}>
              {errorMsg && (
                <div className="error-block">
                  <svg className="error-icon" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="email">Alamat email</label>
                <input
                  className="field-input"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@bank.co.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Kata sandi</label>
                <input
                  className="field-input"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner" />Memverifikasi…</>
                ) : (
                  <>Masuk ke sistem</>
                )}
              </button>
            </form>

            <div className="form-footer">
              Sistem ini hanya dapat diakses oleh personel<br />
              yang telah mendapat otorisasi dari administrator.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
