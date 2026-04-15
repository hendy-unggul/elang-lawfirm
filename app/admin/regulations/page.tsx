'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.rk-root{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0}
.rk-nav{height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;background:#0c0d0f}
.nav-brand{display:flex;align-items:center;gap:12px}
.nav-sigil{width:30px;height:30px;border:1px solid rgba(192,160,98,.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;color:#c0a062}
.nav-title{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,230,224,.6)}
.nav-back{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.3);background:none;border:none;cursor:pointer;font-family:inherit;transition:color .2s}
.nav-back:hover{color:rgba(232,230,224,.6)}
.rk-body{max-width:1100px;margin:0 auto;padding:36px 40px 80px}
.page-header{margin-bottom:32px;display:flex;align-items:flex-end;justify-content:space-between}
.page-ey{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:6px}
.page-title{font-family:'Playfair Display',serif;font-size:22px;color:#e8e6e0}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:28px}
.stat-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:14px 16px}
.stat-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,230,224,.25);margin-bottom:6px}
.stat-val{font-family:'Playfair Display',serif;font-size:22px;color:#e8e6e0}
.stat-val.gold{color:#c0a062}
.action-bar{display:flex;gap:8px;margin-bottom:24px}
.btn-primary{padding:9px 18px;background:#c0a062;border:none;border-radius:2px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0c0d0f;cursor:pointer;font-weight:500;transition:background .15s;display:flex;align-items:center;gap:7px}
.btn-primary:hover{background:#d4b478}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.btn-ghost{padding:9px 16px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:2px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.4);cursor:pointer;transition:all .15s}
.btn-ghost:hover{border-color:rgba(255,255,255,.2);color:rgba(232,230,224,.6)}
.section-lbl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:12px;display:flex;align-items:center;gap:10px}
.section-lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}
.reg-table{width:100%;border-collapse:collapse}
.reg-table th{padding:8px 14px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(232,230,224,.2);font-weight:400;text-align:left;border-bottom:1px solid rgba(255,255,255,.06)}
.reg-table td{padding:12px 14px;font-size:12px;color:rgba(232,230,224,.55);border-bottom:1px solid rgba(255,255,255,.04)}
.reg-table tr:last-child td{border-bottom:none}
.reg-table tr:hover td{background:rgba(255,255,255,.02)}
.reg-code{font-family:'DM Mono',monospace;font-size:10px;color:rgba(192,160,98,.6)}
.reg-title{font-weight:400;color:rgba(232,230,224,.7)}
.type-badge{font-size:9px;padding:2px 7px;border-radius:2px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.tb-uu{background:rgba(106,191,128,.08);color:#6abf80}
.tb-ojk{background:rgba(26,100,200,.08);color:#378ADD}
.tb-dsn{background:rgba(192,160,98,.1);color:#c0a062}
.tb-pp{background:rgba(255,255,255,.06);color:rgba(232,230,224,.4)}
.tb-lain{background:rgba(255,255,255,.04);color:rgba(232,230,224,.3)}
.status-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:5px}
.sd-aktif{background:#6abf80}
.sd-dicabut{background:#e8705a}
.sd-direvisi{background:#c0a062}
.article-count{font-family:'DM Mono',monospace;font-size:11px;color:rgba(192,160,98,.5)}
.embed-status{font-size:10px;padding:2px 7px;border-radius:2px}
.es-done{background:rgba(106,191,128,.08);color:#6abf80}
.es-pending{background:rgba(192,160,98,.08);color:#c0a062}
.domain-pills{display:flex;gap:4px;flex-wrap:wrap}
.domain-pill{font-size:9px;background:rgba(255,255,255,.04);color:rgba(232,230,224,.3);padding:1px 6px;border-radius:2px}
.add-form{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:4px;padding:20px;margin-bottom:20px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.field-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,230,224,.3);margin-bottom:5px}
.field-input,.field-select,.field-textarea{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:2px;padding:8px 10px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:#e8e6e0;outline:none;width:100%;transition:border-color .2s}
.field-input::placeholder,.field-textarea::placeholder{color:rgba(232,230,224,.2)}
.field-input:focus,.field-select:focus,.field-textarea:focus{border-color:rgba(192,160,98,.3)}
.field-select{cursor:pointer;appearance:none}
.field-textarea{resize:vertical;min-height:80px;line-height:1.6}
.toast{position:fixed;bottom:22px;right:22px;background:#1e2023;border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:10px 16px;font-size:12px;color:rgba(232,230,224,.7);z-index:200;animation:ti .2s ease}
@keyframes ti{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.spinner{width:13px;height:13px;border:1.5px solid rgba(12,13,15,.3);border-top-color:#0c0d0f;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading{display:flex;align-items:center;justify-content:center;padding:60px;color:rgba(232,230,224,.2);font-size:13px}
`;

export default function RegulationKnowledgePage() {
  const router = useRouter();
  const [regulations, setRegulations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    code: '', title: '', short_title: '', type: 'peraturan_ojk',
    issuer: '', number: '', year: '', effective_date: '',
    summary: '', source_url: '', domain: '', collateral_types: '', akad_types: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: regs }, { data: articles }, { data: embedded }] = await Promise.all([
      supabase.from('regulations').select('*').order('type').order('year', { ascending: false }),
      supabase.from('regulation_articles').select('regulation_id, id, embedding', { count: 'exact' }),
      supabase.from('regulation_articles').select('regulation_id, id', { count: 'exact' }).not('embedding', 'is', null),
    ]);

    setRegulations(regs || []);

    const articlesByReg: Record<string, number> = {};
    const embeddedByReg: Record<string, number> = {};
    (articles || []).forEach((a: any) => { articlesByReg[a.regulation_id] = (articlesByReg[a.regulation_id] || 0) + 1; });
    (embedded || []).forEach((a: any) => { embeddedByReg[a.regulation_id] = (embeddedByReg[a.regulation_id] || 0) + 1; });

    setStats({
      total_regs: regs?.length || 0,
      active_regs: regs?.filter((r: any) => r.status === 'aktif').length || 0,
      total_articles: articles?.length || 0,
      embedded_articles: embedded?.length || 0,
      articlesByReg, embeddedByReg,
    });
    setLoading(false);
  };

  const runEmbed = async () => {
    setEmbedding(true);
    showToast('Embedding berjalan… bisa memakan beberapa menit');
    try {
      const res = await fetch('/api/admin/embed-regulations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_KEY || 'dev'}` },
      });
      const data = await res.json();
      showToast(data.message || 'Selesai');
      await loadData();
    } catch { showToast('Error saat embedding'); }
    setEmbedding(false);
  };

  const saveRegulation = async () => {
    if (!form.code || !form.title || !form.issuer) { showToast('Kode, judul, dan penerbit wajib diisi'); return; }
    const payload = {
      code: form.code.toUpperCase(),
      title: form.title,
      short_title: form.short_title || null,
      type: form.type,
      issuer: form.issuer,
      number: form.number || null,
      year: form.year ? parseInt(form.year) : null,
      effective_date: form.effective_date || null,
      summary: form.summary || null,
      source_url: form.source_url || null,
      domain: form.domain ? form.domain.split(',').map(s => s.trim()) : [],
      collateral_types: form.collateral_types ? form.collateral_types.split(',').map(s => s.trim()) : [],
      akad_types: form.akad_types ? form.akad_types.split(',').map(s => s.trim()) : [],
      status: 'aktif',
    };
    const { error } = await supabase.from('regulations').insert(payload);
    if (error) { showToast('Error: ' + error.message); return; }
    showToast('Regulasi berhasil ditambahkan');
    setShowForm(false);
    setForm({ code: '', title: '', short_title: '', type: 'peraturan_ojk', issuer: '', number: '', year: '', effective_date: '', summary: '', source_url: '', domain: '', collateral_types: '', akad_types: '' });
    await loadData();
  };

  const typeBadge = (type: string) => {
    const map: Record<string, [string, string]> = {
      undang_undang: ['UU', 'tb-uu'],
      peraturan_ojk: ['POJK', 'tb-ojk'],
      fatwa_dsn: ['Fatwa DSN', 'tb-dsn'],
      peraturan_pp: ['PP', 'tb-pp'],
      kitab_hukum: ['Kitab', 'tb-lain'],
    };
    const [label, cls] = map[type] || [type, 'tb-lain'];
    return <span className={`type-badge ${cls}`}>{label}</span>;
  };

  return (
    <><style>{S}</style>
    <div className="rk-root">
      <nav className="rk-nav">
        <div className="nav-brand">
          <div className="nav-sigil">E</div>
          <span className="nav-title">Regulatory Knowledge Base</span>
        </div>
        <button className="nav-back" onClick={() => router.push('/lawyer')}>← Dashboard</button>
      </nav>

      <div className="rk-body">
        <div className="page-header">
          <div>
            <div className="page-ey">Manajemen Knowledge Base</div>
            <div className="page-title">Regulasi & Undang-Undang</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">Total regulasi</div>
            <div className="stat-val gold">{stats.total_regs || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">Aktif</div>
            <div className="stat-val">{stats.active_regs || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">Total pasal</div>
            <div className="stat-val">{stats.total_articles || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">Sudah di-embed</div>
            <div className="stat-val" style={{ color: stats.embedded_articles === stats.total_articles && stats.total_articles > 0 ? '#6abf80' : '#c0a062' }}>
              {stats.embedded_articles || 0}/{stats.total_articles || 0}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-bar">
          <button className="btn-primary" onClick={runEmbed} disabled={embedding}>
            {embedding ? <span className="spinner" /> : null}
            {embedding ? 'Embedding…' : 'Run embedding semua pasal'}
          </button>
          <button className="btn-ghost" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Batal' : '+ Tambah regulasi baru'}
          </button>
          <button className="btn-ghost" onClick={loadData}>Refresh</button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="add-form">
            <div className="section-lbl" style={{ marginBottom: 16 }}>Tambah regulasi baru</div>
            <div className="form-grid">
              <div>
                <div className="field-lbl">Kode unik *</div>
                <input className="field-input" placeholder="contoh: POJK_15_2024" value={form.code} onChange={e => set('code', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Jenis *</div>
                <select className="field-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="undang_undang">Undang-Undang</option>
                  <option value="peraturan_ojk">POJK</option>
                  <option value="fatwa_dsn">Fatwa DSN-MUI</option>
                  <option value="peraturan_pp">Peraturan Pemerintah</option>
                  <option value="peraturan_bi">Peraturan BI</option>
                  <option value="surat_edaran">Surat Edaran</option>
                  <option value="kitab_hukum">Kitab Hukum</option>
                </select>
              </div>
              <div>
                <div className="field-lbl">Judul lengkap *</div>
                <input className="field-input" placeholder="Judul resmi regulasi" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Judul singkat</div>
                <input className="field-input" placeholder="contoh: POJK Kualitas Aset" value={form.short_title} onChange={e => set('short_title', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Penerbit *</div>
                <input className="field-input" placeholder="OJK / DSN-MUI / DPR RI" value={form.issuer} onChange={e => set('issuer', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Nomor</div>
                <input className="field-input" placeholder="contoh: 40/POJK.03/2019" value={form.number} onChange={e => set('number', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Tahun</div>
                <input className="field-input" type="number" placeholder="2024" value={form.year} onChange={e => set('year', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Tanggal berlaku</div>
                <input className="field-input" type="date" value={form.effective_date} onChange={e => set('effective_date', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Domain (pisah koma)</div>
                <input className="field-input" placeholder="jaminan,tanah,apht" value={form.domain} onChange={e => set('domain', e.target.value)} />
              </div>
              <div>
                <div className="field-lbl">Jenis jaminan (pisah koma)</div>
                <input className="field-input" placeholder="tanah_shm,bangunan,semua" value={form.collateral_types} onChange={e => set('collateral_types', e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="field-lbl">Ringkasan</div>
              <textarea className="field-textarea" placeholder="Deskripsi singkat tentang isi dan tujuan regulasi…" value={form.summary} onChange={e => set('summary', e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div className="field-lbl">URL sumber</div>
              <input className="field-input" placeholder="https://ojk.go.id/..." value={form.source_url} onChange={e => set('source_url', e.target.value)} />
            </div>
            <button className="btn-primary" onClick={saveRegulation}>Simpan regulasi</button>
          </div>
        )}

        {/* Table */}
        <div className="section-lbl" style={{ marginBottom: 14 }}>
          Daftar regulasi ({regulations.length})
        </div>

        {loading ? (
          <div className="loading">Memuat…</div>
        ) : (
          <table className="reg-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Judul</th>
                <th>Jenis</th>
                <th>Tahun</th>
                <th>Status</th>
                <th>Pasal</th>
                <th>Embedding</th>
                <th>Domain</th>
              </tr>
            </thead>
            <tbody>
              {regulations.map(reg => {
                const artCount = stats.articlesByReg?.[reg.id] || 0;
                const embCount = stats.embeddedByReg?.[reg.id] || 0;
                const allEmbedded = artCount > 0 && embCount === artCount;
                return (
                  <tr key={reg.id}>
                    <td><span className="reg-code">{reg.code}</span></td>
                    <td>
                      <div className="reg-title">{reg.short_title || reg.title}</div>
                      {reg.number && <div style={{ fontSize: 10, color: 'rgba(232,230,224,.25)', marginTop: 2 }}>No. {reg.number}</div>}
                    </td>
                    <td>{typeBadge(reg.type)}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: 11 }}>{reg.year || '—'}</td>
                    <td>
                      <span className={`status-dot sd-${reg.status}`}/>
                      <span style={{ fontSize: 11 }}>{reg.status}</span>
                    </td>
                    <td><span className="article-count">{artCount}</span></td>
                    <td>
                      <span className={`embed-status ${allEmbedded ? 'es-done' : 'es-pending'}`}>
                        {artCount === 0 ? 'kosong' : allEmbedded ? `${embCount}/${artCount} ✓` : `${embCount}/${artCount}`}
                      </span>
                    </td>
                    <td>
                      <div className="domain-pills">
                        {(reg.domain || []).slice(0, 3).map((d: string) => (
                          <span key={d} className="domain-pill">{d}</span>
                        ))}
                        {(reg.domain || []).length > 3 && <span className="domain-pill">+{reg.domain.length - 3}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    {toast && <div className="toast">{toast}</div>}
    </>
  );
}
