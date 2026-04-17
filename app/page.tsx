'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.lp{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center}
.lp-sigil{width:56px;height:56px;border:1px solid rgba(192,160,98,.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:24px;color:#c0a062;margin:0 auto 24px}
.lp-label{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:16px}
.lp-title{font-family:'Playfair Display',serif;font-size:clamp(32px,5vw,52px);font-weight:400;line-height:1.15;margin-bottom:20px;max-width:640px}
.lp-title em{font-style:italic;color:#c0a062}
.lp-desc{font-size:15px;font-weight:300;line-height:1.7;color:rgba(232,230,224,.45);max-width:480px;margin:0 auto 40px}
.lp-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 32px;background:#c0a062;border:none;border-radius:2px;font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0c0d0f;font-weight:500;cursor:pointer;transition:background .15s;text-decoration:none}
.lp-btn:hover{background:#d4b478}
.lp-features{display:flex;gap:32px;margin-top:56px;flex-wrap:wrap;justify-content:center}
.lp-feat{text-align:left;max-width:180px}
.lf-dot{width:6px;height:6px;border-radius:50%;background:rgba(192,160,98,.4);margin-bottom:10px}
.lf-title{font-size:13px;font-weight:500;color:rgba(232,230,224,.7);margin-bottom:4px}
.lf-desc{font-size:12px;font-weight:300;color:rgba(232,230,224,.3);line-height:1.5}
.lp-footer{margin-top:60px;font-size:11px;color:rgba(232,230,224,.15);letter-spacing:.08em}
`;

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Jika sudah ada session aktif, redirect ke dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('user_profiles').select('organization').eq('id', session.user.id).single()
        .then(({ data: profile }) => {
          if (profile?.organization === 'branch') router.replace('/branch');
          else if (profile?.organization === 'erlangga') router.replace('/lawyer');
        });
    });
  }, []);

  return (
    <>
      <style>{S}</style>
      <div className="lp">
        <div className="lp-sigil">E</div>
        <div className="lp-label">Erlangga Legal Intelligence</div>
        <h1 className="lp-title">
          Kecerdasan hukum untuk setiap <em>keputusan</em> pembiayaan syariah
        </h1>
        <p className="lp-desc">
          Platform AI yang menganalisa jaminan kredit, memverifikasi kepatuhan OJK & DSN-MUI,
          dan menyiapkan draft kontrak — bukan sekadar mengecek dokumen, tapi mencari solusi.
        </p>
        <a className="lp-btn" href="/login">Masuk ke sistem</a>

        <div className="lp-features">
          {[
            { title: 'Analisa korelasi data', desc: 'AI membaca hubungan antar data yang tidak terlihat' },
            { title: 'Compliance OJK & DSN', desc: 'Setiap pasal regulasi dijadikan anchor analisa' },
            { title: 'Draft kontrak otomatis', desc: 'Klausul pengamanan langsung tersedia' },
          ].map((f, i) => (
            <div className="lp-feat" key={i}>
              <div className="lf-dot" />
              <div className="lf-title">{f.title}</div>
              <div className="lf-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="lp-footer">
          Sistem ini hanya dapat diakses oleh personel yang telah mendapat otorisasi
        </div>
      </div>
    </>
  );
}
