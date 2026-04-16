'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.ar{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0}
.ar-nav{height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;background:#0c0d0f}
.nav-left{display:flex;align-items:center;gap:16px}
.nav-sigil{width:30px;height:30px;border:1px solid rgba(192,160,98,.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;color:#c0a062}
.nav-title{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,230,224,.6)}
.ar-body{display:grid;grid-template-columns:240px 1fr;gap:1px;min-height:calc(100vh - 56px);background:rgba(255,255,255,.04)}
.ar-sidebar{background:#0e0f11;padding:20px 0;overflow-y:auto}
.sidebar-section{margin-bottom:20px}
.sidebar-lbl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(232,230,224,.2);padding:0 16px;margin-bottom:8px}
.sidebar-item{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;font-size:12px;color:rgba(232,230,224,.45);cursor:pointer;transition:all .12s;border-left:2px solid transparent}
.sidebar-item:hover{color:rgba(232,230,224,.7);background:rgba(255,255,255,.03)}
.sidebar-item.on{color:#c0a062;border-left-color:#c0a062;background:rgba(192,160,98,.05)}
.sidebar-count{font-size:10px;font-family:'DM Mono',monospace;background:rgba(255,255,255,.06);color:rgba(232,230,224,.3);padding:1px 6px;border-radius:8px}
.ar-main{background:#0c0d0f;padding:28px 36px;overflow-y:auto}
.page-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:8px}
.page-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:400;color:#e8e6e0;margin-bottom:24px}
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.search-input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:13px;color:#e8e6e0;outline:none;width:260px;transition:border-color .2s}
.search-input::placeholder{color:rgba(232,230,224,.2)}
.search-input:focus{border-color:rgba(192,160,98,.3)}
.btn-primary{padding:8px 16px;background:#c0a062;border:none;border-radius:3px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#0c0d0f;cursor:pointer;font-weight:500;transition:background .15s}
.btn-primary:hover{background:#d4b478}
.reg-table{width:100%;border-collapse:collapse}
.reg-table thead tr{border-bottom:1px solid rgba(255,255,255,.06)}
.reg-table th{padding:8px 12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,230,224,.25);font-weight:400;text-align:left}
.reg-table tbody tr{border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s}
.reg-table tbody tr:hover{background:rgba(255,255,255,.03)}
.reg-table td{padding:12px;font-size:12px;color:rgba(232,230,224,.6);vertical-align:middle}
.code-cell{font-family:'DM Mono',monospace;font-size:11px;color:rgba(192,160,98,.7)}
.type-badge{font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:2px;font-weight:500}
.tb-uu{background:rgba(26,26,26,.3);color:rgba(232,230,224,.6)}
.tb-fatwa{background:rgba(192,160,98,.12);color:#c0a062}
.tb-pojk{background:rgba(26,100,200,.1);color:#378ADD}
.tb-pp{background:rgba(26,26,26,.2);color:rgba(232,230,224,.4)}
.tb-khi{background:rgba(40,160,80,.08);color:#6abf80}
.tb-other{background:rgba(255,255,255,.05);color:rgba(232,230,224,.3)}
.status-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:6px}
.sd-active{background:#6abf80}.sd-amended{background:#c0a062}.sd-revoked{background:#e8705a}
.hier-badge{font-size:10px;font-family:'DM Mono',monospace;color:rgba(232,230,224,.3)}
.title-cell{font-size:13px;color:rgba(232,230,224,.7);max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.empty{color:rgba(232,230,224,.2);font-size:13px;padding:40px;text-align:center}
.stats-row{display:flex;gap:12px;margin-bottom:24px}
.stat-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:12px 16px;flex:1}
.stat-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(232,230,224,.25);margin-bottom:5px}
.stat-val{font-family:'Playfair Display',serif;font-size:20px;color:#e8e6e0}
.stat-val.gold{color:#c0a062}
.loading-spinner{width:20px;height:20px;border:1.5px solid rgba(192,160,98,.15);border-top-color:#c0a062;border-radius:50%;animation:spin .8s linear infinite;margin:40px auto;display:block}
@keyframes spin{to{transform:rotate(360deg)}}
`;

type ViewMode = 'regulations' | 'articles' | 'scenarios';
type RegType = 'all' | 'uu' | 'fatwa_dsn' | 'pojk' | 'pp' | 'khi';

export default function AdminRegulationsPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('regulations');
  const [typeFilter, setTypeFilter] = useState<RegType>('all');
  const [search, setSearch] = useState('');
  const [regulations, setRegulations] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [counts, setCounts] = useState({ regulations: 0, articles: 0, scenarios: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [view, typeFilter]);

  const loadData = async () => {
    setLoading(true);

    if (view === 'regulations') {
      let q = supabase.from('regulations').select('*', { count: 'exact' }).order('hierarchy_level').order('code');
      if (typeFilter !== 'all') q = q.eq('type', typeFilter);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data, count } = await q;
      setRegulations(data || []);
      setCounts(c => ({ ...c, regulations: count || 0 }));
    }

    if (view === 'articles') {
      const { data, count } = await supabase
        .from('regulation_articles')
        .select('*, regulations!inner(code, type, hierarchy_level)', { count: 'exact' })
        .order('regulations(hierarchy_level)')
        .limit(50);
      setArticles(data || []);
      setCounts(c => ({ ...c, articles: count || 0 }));
    }

    if (view === 'scenarios') {
      const { data, count } = await supabase
        .from('legal_scenarios')
        .select('*', { count: 'exact' })
        .order('risk_level');
      setScenarios(data || []);
      setCounts(c => ({ ...c, scenarios: count || 0 }));
    }

    setLoading(false);
  };

  const typeBadgeCls: Record<string, string> = {
    uu: 'tb-uu', fatwa_dsn: 'tb-fatwa', pojk: 'tb-pojk',
    pp: 'tb-pp', khi: 'tb-khi',
  };

  const typeLabels: Record<string, string> = {
    uu: 'UU', fatwa_dsn: 'Fatwa DSN', pojk: 'POJK',
    se_ojk: 'SE OJK', pbi: 'PBI', pp: 'PP', khi: 'KHI',
  };

  const hierNames: Record<number, string> = { 1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5' };

  return (
    <><style>{S}</style>
    <div className="ar">
      <nav className="ar-nav">
        <div className="nav-left">
          <div className="nav-sigil">E</div>
          <span className="nav-title">Library Regulasi Hukum</span>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,230,224,.35)', fontSize: 11, fontFamily: 'DM Sans', letterSpacing: '.1em', textTransform: 'uppercase' }}
          onClick={() => router.push('/lawyer')}>← Kembali</button>
      </nav>

      <div className="ar-body">
        {/* Sidebar */}
        <div className="ar-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-lbl">Tampilan</div>
            <div className={`sidebar-item ${view === 'regulations' ? 'on' : ''}`} onClick={() => setView('regulations')}>
              Regulasi <span className="sidebar-count">{counts.regulations}</span>
            </div>
            <div className={`sidebar-item ${view === 'articles' ? 'on' : ''}`} onClick={() => setView('articles')}>
              Pasal & Ayat <span className="sidebar-count">{counts.articles}</span>
            </div>
            <div className={`sidebar-item ${view === 'scenarios' ? 'on' : ''}`} onClick={() => setView('scenarios')}>
              Skenario Hukum <span className="sidebar-count">{counts.scenarios}</span>
            </div>
          </div>

          {view === 'regulations' && (
            <div className="sidebar-section">
              <div className="sidebar-lbl">Filter jenis</div>
              {(['all', 'uu', 'fatwa_dsn', 'pojk', 'pp', 'khi'] as RegType[]).map(t => (
                <div key={t} className={`sidebar-item ${typeFilter === t ? 'on' : ''}`} onClick={() => setTypeFilter(t)}>
                  {t === 'all' ? 'Semua' : typeLabels[t] || t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="ar-main">
          <div className="page-eyebrow">
            {view === 'regulations' ? 'Daftar Regulasi' : view === 'articles' ? 'Pasal & Ayat' : 'Skenario Hukum'}
          </div>
          <div className="page-title">
            {view === 'regulations' ? 'Library Regulasi Hukum Syariah'
              : view === 'articles' ? 'Basis Pengetahuan Pasal'
              : 'Skenario & Jalur Solusi'}
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card"><div className="stat-lbl">Regulasi aktif</div><div className="stat-val gold">{counts.regulations}</div></div>
            <div className="stat-card"><div className="stat-lbl">Pasal terindeks</div><div className="stat-val">{counts.articles}</div></div>
            <div className="stat-card"><div className="stat-lbl">Skenario hukum</div><div className="stat-val">{counts.scenarios}</div></div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <input className="search-input" placeholder={`Cari ${view}…`} value={search}
              onChange={e => { setSearch(e.target.value); }}
              onKeyDown={e => e.key === 'Enter' && loadData()} />
            <button className="btn-primary" onClick={loadData}>Cari</button>
          </div>

          {loading ? <div className="loading-spinner" /> : (
            <>
              {/* REGULATIONS TABLE */}
              {view === 'regulations' && (
                <table className="reg-table">
                  <thead>
                    <tr>
                      <th>Kode</th><th>Jenis</th><th>Hierarki</th>
                      <th>Judul</th><th>Otoritas</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regulations.length === 0 ? (
                      <tr><td colSpan={6} className="empty">Tidak ada data</td></tr>
                    ) : regulations.map(r => (
                      <tr key={r.id}>
                        <td><span className="code-cell">{r.code}</span></td>
                        <td><span className={`type-badge ${typeBadgeCls[r.type] || 'tb-other'}`}>{typeLabels[r.type] || r.type}</span></td>
                        <td><span className="hier-badge">{hierNames[r.hierarchy_level] || r.hierarchy_level}</span></td>
                        <td><div className="title-cell" title={r.full_title || r.title}>{r.title}</div></td>
                        <td style={{ fontSize: 11, color: 'rgba(232,230,224,.35)' }}>{r.authority}</td>
                        <td>
                          <span className={`status-dot sd-${r.status}`} />
                          <span style={{ fontSize: 11, color: 'rgba(232,230,224,.35)' }}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ARTICLES TABLE */}
              {view === 'articles' && (
                <table className="reg-table">
                  <thead>
                    <tr><th>Regulasi</th><th>Pasal</th><th>Isi singkat</th><th>Topik</th></tr>
                  </thead>
                  <tbody>
                    {articles.length === 0 ? (
                      <tr><td colSpan={4} className="empty">Tidak ada data</td></tr>
                    ) : articles.map(a => (
                      <tr key={a.id}>
                        <td><span className="code-cell">{a.regulations?.code}</span></td>
                        <td style={{ fontSize: 12, color: '#c0a062', fontWeight: 500 }}>{a.article_number}</td>
                        <td>
                          <div style={{ fontSize: 12, color: 'rgba(232,230,224,.55)', maxWidth: 360, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {a.content_plain || a.content}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(a.topics || []).slice(0, 3).map((t: string) => (
                              <span key={t} style={{ fontSize: 9, background: 'rgba(255,255,255,.06)', color: 'rgba(232,230,224,.35)', padding: '2px 6px', borderRadius: 8 }}>{t}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SCENARIOS TABLE */}
              {view === 'scenarios' && (
                <table className="reg-table">
                  <thead>
                    <tr><th>Kode</th><th>Judul skenario</th><th>Risiko</th><th>Klausul wajib</th></tr>
                  </thead>
                  <tbody>
                    {scenarios.length === 0 ? (
                      <tr><td colSpan={4} className="empty">Tidak ada data</td></tr>
                    ) : scenarios.map(s => (
                      <tr key={s.id}>
                        <td><span className="code-cell">{s.scenario_code}</span></td>
                        <td>
                          <div style={{ fontSize: 13, color: 'rgba(232,230,224,.7)', marginBottom: 3 }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: 'rgba(232,230,224,.3)' }}>{s.description?.slice(0, 80)}…</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, fontWeight: 500,
                            background: s.risk_level === 'tinggi' ? 'rgba(232,112,90,.12)' : s.risk_level === 'sedang' ? 'rgba(192,160,98,.12)' : 'rgba(106,191,128,.08)',
                            color: s.risk_level === 'tinggi' ? '#e8705a' : s.risk_level === 'sedang' ? '#c0a062' : '#6abf80'
                          }}>{s.risk_level}</span>
                        </td>
                        <td style={{ fontSize: 11, color: 'rgba(232,230,224,.3)' }}>
                          {(s.mandatory_clauses || []).length} klausul
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
