'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

const S = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.dp-root{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0}
.dp-nav{height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;background:#0c0d0f}
.nav-left{display:flex;align-items:center;gap:14px}
.nav-sigil{width:30px;height:30px;border:1px solid rgba(192,160,98,.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;color:#c0a062}
.nav-back{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.3);background:none;border:none;cursor:pointer;font-family:inherit;transition:color .2s;padding:0}
.nav-back:hover{color:rgba(232,230,224,.6)}
.nav-sep{color:rgba(255,255,255,.1)}
.nav-id{font-size:12px;color:rgba(232,230,224,.45);font-family:'DM Mono',monospace}
.nav-actions{display:flex;gap:8px}
.btn-download{padding:8px 18px;background:#c0a062;border:none;border-radius:2px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0c0d0f;cursor:pointer;font-weight:500;transition:background .15s;display:flex;align-items:center;gap:7px}
.btn-download:hover{background:#d4b478}
.btn-download:disabled{opacity:.4;cursor:not-allowed}
.btn-ghost{padding:8px 16px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:2px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.4);cursor:pointer;transition:all .15s}
.btn-ghost:hover{border-color:rgba(255,255,255,.2);color:rgba(232,230,224,.6)}
.dp-body{display:grid;grid-template-columns:260px 1fr;gap:1px;min-height:calc(100vh - 56px);background:rgba(255,255,255,.04)}
.dp-sidebar{background:#0e0f11;padding:24px 20px;overflow-y:auto}
.dp-content{background:#0c0d0f;padding:32px 40px 60px;overflow-y:auto}
.sidebar-section{margin-bottom:24px}
.sidebar-lbl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:12px}
.toc-item{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:2px;cursor:pointer;transition:background .12s;border:none;background:transparent;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
.toc-item:hover{background:rgba(255,255,255,.04)}
.toc-num{font-family:'DM Mono',monospace;font-size:10px;color:rgba(192,160,98,.4);flex-shrink:0;margin-top:2px;width:22px}
.toc-title{font-size:12px;color:rgba(232,230,224,.45);line-height:1.4}
.meta-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.meta-row:last-child{border-bottom:none}
.mk{font-size:11px;color:rgba(232,230,224,.25)}
.mv{font-size:11px;color:rgba(232,230,224,.55);text-align:right}
.pending-banner{background:rgba(192,160,98,.07);border:1px solid rgba(192,160,98,.2);border-radius:3px;padding:12px 14px;margin-bottom:20px}
.pb-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:6px}
.pb-item{font-size:12px;color:rgba(192,160,98,.6);display:flex;gap:7px;margin-bottom:4px;line-height:1.5}
.pb-item::before{content:'○';flex-shrink:0;font-size:10px;margin-top:2px}
.contract-header{text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08)}
.ct-bank{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:6px}
.ct-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:400;color:#e8e6e0;margin-bottom:6px;line-height:1.3}
.ct-number{font-family:'DM Mono',monospace;font-size:11px;color:rgba(232,230,224,.3)}
.draft-badge{display:inline-block;background:rgba(192,160,98,.1);border:1px solid rgba(192,160,98,.25);color:#c0a062;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:2px;margin-top:10px}
.preamble{font-size:13px;color:rgba(232,230,224,.55);line-height:1.8;margin-bottom:28px;font-style:italic;text-align:justify}
.parties-section{margin-bottom:28px}
.parties-title{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:14px}
.party-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-left:2px solid rgba(192,160,98,.3);border-radius:0 3px 3px 0;padding:12px 14px;margin-bottom:8px}
.party-role{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:5px}
.party-name{font-size:14px;font-weight:400;color:#e8e6e0;margin-bottom:3px}
.party-detail{font-size:12px;color:rgba(232,230,224,.4);line-height:1.6}
.divider{border:none;border-top:1px solid rgba(255,255,255,.06);margin:24px 0}
.article-section{margin-bottom:28px;scroll-margin-top:80px}
.article-num{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:4px}
.article-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:400;color:#e8e6e0;margin-bottom:12px}
.article-content{font-size:13px;color:rgba(232,230,224,.55);line-height:1.8;text-align:justify;margin-bottom:8px}
.sub-list{padding-left:20px;margin-top:8px}
.sub-list li{font-size:13px;color:rgba(232,230,224,.5);line-height:1.8;margin-bottom:6px;text-align:justify}
.special-section{background:rgba(192,160,98,.04);border:1px solid rgba(192,160,98,.15);border-radius:3px;padding:16px 18px;margin-bottom:16px}
.special-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:4px}
.special-title{font-size:13px;font-weight:500;color:#c0a062;margin-bottom:8px}
.special-content{font-size:13px;color:rgba(232,230,224,.5);line-height:1.8;text-align:justify}
.special-basis{font-size:11px;color:rgba(232,230,224,.25);font-style:italic;margin-top:6px}
.closing{font-size:13px;color:rgba(232,230,224,.5);line-height:1.8;text-align:justify;margin-bottom:28px;font-style:italic}
.sig-section{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:24px 20px;margin-bottom:20px}
.sig-intro{font-size:12px;color:rgba(232,230,224,.35);text-align:center;margin-bottom:24px;font-style:italic}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:20px}
.sig-block{text-align:center}
.sig-role{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,230,224,.3);margin-bottom:50px}
.sig-line{border-bottom:1px solid rgba(255,255,255,.15);margin-bottom:8px}
.sig-name{font-size:12px;color:rgba(232,230,224,.45)}
.notary-block{background:rgba(192,160,98,.04);border:1px solid rgba(192,160,98,.15);border-radius:3px;padding:16px;text-align:center;margin-top:16px}
.notary-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:40px}
.notary-line{border-top:1px solid rgba(255,255,255,.1);padding-top:8px;font-size:11px;color:rgba(232,230,224,.3)}
.regulations-footer{margin-top:16px;padding:12px 14px;background:rgba(255,255,255,.02);border-radius:3px;font-size:11px;color:rgba(232,230,224,.25);line-height:1.6}
.spinner{width:14px;height:14px;border:1.5px solid rgba(12,13,15,.3);border-top-color:#0c0d0f;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 56px);flex-direction:column;gap:14px}
.loading-spinner{width:28px;height:28px;border:1px solid rgba(192,160,98,.15);border-top-color:#c0a062;border-radius:50%;animation:spin .9s linear infinite}
.loading-txt{font-family:'Playfair Display',serif;font-size:15px;color:rgba(232,230,224,.3)}
@media(max-width:900px){.dp-body{grid-template-columns:1fr}.dp-sidebar{display:none}.dp-content{padding:20px 16px 40px}.dp-nav{padding:0 20px}}
`;

export default function DraftPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('contract_requests').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setReq(data); setLoading(false); });
  }, [id]);

  const openPreview = () => {
    window.open(`/api/download-draft?id=${id}`, '_blank');
  };

  const downloadPDF = () => {
    // Open print-optimized page — user can Save as PDF from browser
    const win = window.open(`/api/download-draft?id=${id}`, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 800);
      };
    }
  };

  if (loading) return (
    <><style suppressHydrationWarning>{S}</style>
    <div className="dp-root"><div className="loading"><div className="loading-spinner"/><div className="loading-txt">Memuat draft…</div></div></div></>
  );

  if (!req?.draft_contract) return (
    <><style suppressHydrationWarning>{S}</style>
    <div className="dp-root"><div className="loading"><div className="loading-txt">Draft belum tersedia</div></div></div></>
  );

  const draft = req.draft_contract;
  const articles = draft.articles || [];
  const specialClauses = draft.special_clauses || [];
  const pending = draft.metadata?.pending_items || [];
  const regulations = draft.metadata?.applicable_regulations || [];
  const reqNo = req.request_number || id.slice(0, 8).toUpperCase();

  return (
    <><style suppressHydrationWarning>{S}</style>
    <div className="dp-root">
      <nav className="dp-nav">
        <div className="nav-left">
          <div className="nav-sigil">E</div>
          <button className="nav-back" onClick={() => router.push(`/lawyer/${id}`)}>← Review</button>
          <span className="nav-sep">/</span>
          <span className="nav-id">Draft {reqNo}</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={openPreview}>Buka di tab baru</button>
          <button className="btn-download" onClick={downloadPDF} disabled={downloading}>
            {downloading ? <span className="spinner"/> : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v8M3.5 6.5L6.5 9.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            Download PDF
          </button>
        </div>
      </nav>

      <div className="dp-body">
        {/* Sidebar TOC */}
        <div className="dp-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-lbl">Daftar isi</div>
            <button className="toc-item" onClick={() => document.getElementById('parties')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="toc-num">—</span>
              <span className="toc-title">Para pihak</span>
            </button>
            {articles.map((art: any) => (
              <button key={art.number} className="toc-item" onClick={() => document.getElementById(`art-${art.number}`)?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="toc-num">{art.number}</span>
                <span className="toc-title">{art.title}</span>
              </button>
            ))}
            {specialClauses.length > 0 && (
              <button className="toc-item" onClick={() => document.getElementById('special-clauses')?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="toc-num">—</span>
                <span className="toc-title">Klausul khusus</span>
              </button>
            )}
            <button className="toc-item" onClick={() => document.getElementById('signatures')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="toc-num">—</span>
              <span className="toc-title">Tanda tangan</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-lbl">Metadata</div>
            {[
              ['No. Request', reqNo],
              ['Jenis akad', draft.contract_type || 'Murabahah'],
              ['Versi draft', draft.metadata?.draft_version || '1.0'],
              ['Pasal', `${articles.length} pasal`],
              ['Klausul khusus', `${specialClauses.length} klausul`],
            ].map(([k, v]) => (
              <div className="meta-row" key={k}><span className="mk">{k}</span><span className="mv">{v}</span></div>
            ))}
          </div>

          {pending.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-lbl">Belum lengkap</div>
              <div style={{ fontSize: 11, color: 'rgba(192,160,98,.55)', lineHeight: 1.6 }}>
                {pending.map((p: string, i: number) => (
                  <div key={i} style={{ marginBottom: 6, display: 'flex', gap: 6 }}>
                    <span style={{ color: 'rgba(192,160,98,.4)', flexShrink: 0 }}>○</span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="dp-content">

          {/* Pending banner */}
          {pending.length > 0 && (
            <div className="pending-banner">
              <div className="pb-lbl">Item yang perlu dilengkapi sebelum penandatanganan</div>
              {pending.map((p: string, i: number) => (
                <div key={i} className="pb-item">{p}</div>
              ))}
            </div>
          )}

          {/* Contract header */}
          <div className="contract-header">
            <div className="ct-bank">[Nama Bank Syariah]</div>
            <div className="ct-title">{draft.contract_title || 'Akad Pembiayaan Murabahah'}</div>
            <div className="ct-number">No: {reqNo} / {new Date().getFullYear()}</div>
            <div className="draft-badge">Draft — Perlu Review Notaris</div>
          </div>

          {/* Preamble */}
          {draft.preamble && (
            <div className="preamble">{draft.preamble}</div>
          )}

          <hr className="divider" />

          {/* Parties */}
          <div id="parties" className="parties-section">
            <div className="parties-title">Para pihak yang terlibat</div>

            {draft.parties?.bank && (
              <div className="party-card">
                <div className="party-role">Pihak Pertama — Bank</div>
                <div className="party-name">{draft.parties.bank.name || '[Nama Bank]'}</div>
                <div className="party-detail">
                  {draft.parties.bank.address || '[Alamat Bank]'}<br />
                  Diwakili: {draft.parties.bank.represented_by || '[Nama Direksi]'} · {draft.parties.bank.position || '[Jabatan]'}
                </div>
              </div>
            )}

            {draft.parties?.debtor && (
              <div className="party-card">
                <div className="party-role">Pihak Kedua — Nasabah</div>
                <div className="party-name">{draft.parties.debtor.name || req.customer_name}</div>
                <div className="party-detail">
                  NIK: {draft.parties.debtor.nik || req.customer_id_number || '[NIK]'}<br />
                  {draft.parties.debtor.address || '[Alamat Nasabah]'}
                </div>
              </div>
            )}

            {draft.parties?.guarantor?.name && (
              <div className="party-card">
                <div className="party-role">Pihak Ketiga — Penjamin</div>
                <div className="party-name">{draft.parties.guarantor.name}</div>
                <div className="party-detail">
                  NIK: {draft.parties.guarantor.nik || '[NIK Penjamin]'}<br />
                  Hubungan: {draft.parties.guarantor.relationship || '[Hubungan]'}
                </div>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Articles */}
          {articles.map((art: any) => (
            <div key={art.number} id={`art-${art.number}`} className="article-section">
              <div className="article-num">Pasal {art.number}</div>
              <div className="article-title">{art.title}</div>
              {art.content && <div className="article-content">{art.content}</div>}
              {(art.sub_articles || []).length > 0 && (
                <ol className="sub-list">
                  {art.sub_articles.map((sub: string, i: number) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}

          {/* Special clauses */}
          {specialClauses.length > 0 && (
            <div id="special-clauses">
              <div className="parties-title" style={{ marginBottom: 14 }}>Klausul Khusus Pengamanan</div>
              {specialClauses.map((sc: any, i: number) => (
                <div key={i} className="special-section">
                  <div className="special-lbl">Klausul {i + 1}</div>
                  <div className="special-title">{sc.title}</div>
                  <div className="special-content">{sc.content}</div>
                  {sc.basis && <div className="special-basis">Dasar: {sc.basis}</div>}
                </div>
              ))}
            </div>
          )}

          <hr className="divider" />

          {/* Closing */}
          {draft.closing && <div className="closing">{draft.closing}</div>}

          {/* Signatures */}
          <div id="signatures" className="sig-section">
            <div className="sig-intro">
              Demikian akad ini dibuat dan ditandatangani pada tanggal {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div className="sig-grid">
              <div className="sig-block">
                <div className="sig-role">Pihak Pertama<br />(Bank)</div>
                <div className="sig-line" />
                <div className="sig-name">{draft.parties?.bank?.represented_by || '[Nama Direksi]'}<br />{draft.parties?.bank?.position || '[Jabatan]'}</div>
              </div>
              <div className="sig-block">
                <div className="sig-role">Pihak Kedua<br />(Nasabah)</div>
                <div className="sig-line" />
                <div className="sig-name">{req.customer_name}<br />Nasabah/Debitur</div>
              </div>
            </div>

            {draft.parties?.guarantor?.name && (
              <div className="sig-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '50%', margin: '0 auto 20px' }}>
                <div className="sig-block">
                  <div className="sig-role">Pihak Ketiga<br />(Penjamin)</div>
                  <div className="sig-line" />
                  <div className="sig-name">{draft.parties.guarantor.name}<br />Penjamin</div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, marginTop: 8 }}>
              <div className="sig-grid" style={{ marginBottom: 0 }}>
                <div className="sig-block">
                  <div className="sig-role">Saksi 1</div>
                  <div className="sig-line" />
                  <div className="sig-name">[Nama Saksi 1]</div>
                </div>
                <div className="sig-block">
                  <div className="sig-role">Saksi 2</div>
                  <div className="sig-line" />
                  <div className="sig-name">[Nama Saksi 2]</div>
                </div>
              </div>
            </div>

            <div className="notary-block">
              <div className="notary-lbl">Dibuat di hadapan Notaris</div>
              <div className="notary-line">[Nama Notaris] · Notaris di [Kota] · SK No. [Nomor SK]</div>
            </div>
          </div>

          {/* Regulations footer */}
          {regulations.length > 0 && (
            <div className="regulations-footer">
              <strong style={{ color: 'rgba(232,230,224,.35)' }}>Regulasi yang dirujuk:</strong> {regulations.join(' · ')}
            </div>
          )}

          {draft.metadata?.notes_for_notary && (
            <div className="regulations-footer" style={{ marginTop: 8 }}>
              <strong style={{ color: 'rgba(232,230,224,.35)' }}>Catatan untuk notaris:</strong> {draft.metadata.notes_for_notary}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
