'use client';

// Format tanggal konsisten server+client
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

// Format angka konsisten server+client -- tidak pakai toLocaleString
function fmtRp(n: number): string {
  if (!n || isNaN(n)) return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lw-root {
  min-height: 100vh;
  background: #0c0d0f;
  font-family: 'DM Sans', sans-serif;
  color: #e8e6e0;
  display: flex;
  flex-direction: column;
}

/* Nav */
.lw-nav {
  height: 56px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  flex-shrink: 0;
  position: sticky; top: 0; z-index: 100;
  background: #0c0d0f;
}

.nav-left { display: flex; align-items: center; gap: 32px; }

.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-sigil {
  width: 30px; height: 30px;
  border: 1px solid rgba(192,160,98,0.4);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 14px; color: #c0a062;
}
.nav-name {
  font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232,230,224,0.6);
}

.nav-divider {
  width: 1px; height: 18px;
  background: rgba(255,255,255,0.08);
}

.nav-module {
  font-size: 12px; letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c0a062;
}

.nav-right { display: flex; align-items: center; gap: 20px; }

.nav-user {
  display: flex; align-items: center; gap: 10px;
}

.user-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(192,160,98,0.15);
  border: 1px solid rgba(192,160,98,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500; color: #c0a062;
  letter-spacing: 0.05em;
}

.user-name {
  font-size: 12px; color: rgba(232,230,224,0.45);
}

.nav-logout {
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(232,230,224,0.25);
  background: none; border: none; cursor: pointer;
  font-family: inherit; transition: color 0.2s;
}
.nav-logout:hover { color: rgba(232,230,224,0.5); }

/* Layout */
.lw-layout { display: flex; flex: 1; min-height: 0; }

/* Sidebar */
.lw-sidebar {
  width: 220px; flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
  padding: 28px 0;
  display: flex; flex-direction: column; gap: 4px;
}

.sidebar-label {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(232,230,224,0.2);
  padding: 0 20px;
  margin-bottom: 8px; margin-top: 16px;
}
.sidebar-label:first-child { margin-top: 0; }

.sidebar-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 20px;
  font-size: 13px; color: rgba(232,230,224,0.4);
  cursor: pointer; transition: all 0.15s;
  border-left: 2px solid transparent;
  user-select: none;
}
.sidebar-item:hover { color: rgba(232,230,224,0.7); background: rgba(255,255,255,0.03); }
.sidebar-item.active {
  color: #c0a062;
  border-left-color: #c0a062;
  background: rgba(192,160,98,0.05);
}

.sidebar-count {
  margin-left: auto;
  font-size: 10px; font-family: 'DM Mono', monospace;
  background: rgba(192,160,98,0.12);
  color: rgba(192,160,98,0.7);
  padding: 2px 7px; border-radius: 10px;
}

/* Main content */
.lw-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

/* Toolbar */
.lw-toolbar {
  padding: 20px 32px 0;
  display: flex; align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-left {}

.page-eyebrow {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(192,160,98,0.6); margin-bottom: 6px;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 400;
  color: #e8e6e0;
}

.toolbar-right { display: flex; align-items: center; gap: 10px; }

.filter-group { display: flex; gap: 6px; }

.filter-btn {
  padding: 6px 14px;
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(232,230,224,0.35);
  background: transparent; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.filter-btn:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,230,224,0.6); }
.filter-btn.active {
  background: rgba(192,160,98,0.1);
  border-color: rgba(192,160,98,0.3);
  color: #c0a062;
}

.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute; left: 10px; top: 50%;
  transform: translateY(-50%);
  opacity: 0.3; pointer-events: none;
}
.search-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 2px;
  padding: 7px 12px 7px 32px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 300;
  color: #e8e6e0; outline: none; width: 200px;
  transition: border-color 0.2s, background 0.2s;
}
.search-input::placeholder { color: rgba(232,230,224,0.2); }
.search-input:focus { border-color: rgba(192,160,98,0.3); background: rgba(255,255,255,0.06); }

/* Stats bar */
.stats-bar {
  display: flex; gap: 1px;
  margin: 20px 32px 0;
  background: rgba(255,255,255,0.06);
  border-radius: 4px; overflow: hidden;
}

.stat-cell {
  flex: 1; padding: 14px 16px;
  background: rgba(255,255,255,0.02);
  transition: background 0.15s;
}

.stat-label {
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(232,230,224,0.25); margin-bottom: 6px;
}

.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 400;
  color: #e8e6e0; line-height: 1;
}

.stat-value.gold { color: #c0a062; }
.stat-value.danger { color: #e8705a; }
.stat-value.success { color: #6abf80; }

/* Table */
.table-wrap { flex: 1; padding: 20px 32px 40px; overflow-y: auto; }

.req-table { width: 100%; border-collapse: collapse; }

.req-table thead tr {
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.req-table th {
  padding: 10px 16px;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(232,230,224,0.25); font-weight: 400;
  text-align: left; white-space: nowrap;
}

.req-table th:first-child { padding-left: 0; }

.req-table tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer; transition: background 0.12s;
}
.req-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.req-table tbody tr:last-child { border-bottom: none; }

.req-table td {
  padding: 14px 16px;
  font-size: 13px; font-weight: 300;
  color: rgba(232,230,224,0.65);
  vertical-align: middle;
}
.req-table td:first-child { padding-left: 0; }

.td-req-no {
  font-family: 'DM Mono', monospace;
  font-size: 11px; color: rgba(192,160,98,0.6);
  letter-spacing: 0.06em;
}

.td-name {
  font-weight: 400; color: #e8e6e0;
  font-size: 14px;
}

.td-sub {
  font-size: 11px; color: rgba(232,230,224,0.3);
  margin-top: 2px;
}

.risk-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 2px;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  font-weight: 500; white-space: nowrap;
}

.chip-high { background: rgba(232,112,90,0.1); color: #e8705a; border: 1px solid rgba(232,112,90,0.2); }
.chip-medium { background: rgba(192,160,98,0.1); color: #c0a062; border: 1px solid rgba(192,160,98,0.2); }
.chip-low { background: rgba(106,191,128,0.08); color: #6abf80; border: 1px solid rgba(106,191,128,0.18); }
.chip-pending { background: rgba(255,255,255,0.05); color: rgba(232,230,224,0.35); border: 1px solid rgba(255,255,255,0.08); }

.status-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; letter-spacing: 0.08em;
  color: rgba(232,230,224,0.4);
}

.status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.status-chip.review { color: rgba(192,160,98,0.7); }
.status-chip.approved { color: #6abf80; }
.status-chip.rejected { color: #e8705a; }
.status-chip.pending { color: rgba(232,230,224,0.3); }

.amount-cell {
  font-family: 'DM Mono', monospace;
  font-size: 12px; color: rgba(232,230,224,0.5);
  letter-spacing: 0.04em;
}

.date-cell {
  font-size: 11px; color: rgba(232,230,224,0.3);
  white-space: nowrap;
}

.action-cell {
  text-align: right;
}

.review-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(192,160,98,0.25);
  border-radius: 2px;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(192,160,98,0.6);
  cursor: pointer; transition: all 0.15s;
}
.review-btn:hover {
  background: rgba(192,160,98,0.08);
  border-color: rgba(192,160,98,0.4);
  color: #c0a062;
}

/* Empty */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 40px; gap: 12px;
  color: rgba(232,230,224,0.2);
}
.empty-icon { opacity: 0.15; margin-bottom: 8px; }
.empty-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400; }
.empty-sub { font-size: 13px; font-weight: 300; }

/* Loading */
.loading-rows { display: flex; flex-direction: column; gap: 1px; padding-top: 8px; }
.loading-row {
  height: 52px;
  background: rgba(255,255,255,0.02);
  border-radius: 2px;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@media (max-width: 900px) {
  .lw-sidebar { display: none; }
  .lw-toolbar { padding: 16px 20px 0; }
  .stats-bar { margin: 16px 20px 0; }
  .table-wrap { padding: 16px 20px 40px; }
  .lw-nav { padding: 0 20px; }
}
`;

type FilterType = 'all' | 'under_review' | 'approved' | 'rejected' | 'collateral_validation';

export default function LawyerDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('');
  // Inject CSS client-side only
  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-page-style', 'true');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const email = user.email || '';
      setUserEmail(email);
      setUserInitials(email.slice(0, 2).toUpperCase());
    });
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('contract_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_requests' },
        () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('contract_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.request_number?.toLowerCase().includes(q) ||
      r.collateral?.details?.owner_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: requests.length,
    under_review: requests.filter(r => r.status === 'under_review').length,
    collateral_validation: requests.filter(r => r.status === 'collateral_validation').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const totalValue = requests.reduce((s, r) => s + (r.financing_amount || 0), 0);
  const highRisk = requests.filter(r => {
    const rl = (r.collateral_validation_result?.risk_level || '').toLowerCase();
    return rl === 'tinggi' || rl === 'high';
  }).length;

  const riskChip = (r: any) => {
    const rl = (r.collateral_validation_result?.risk_level || '').toLowerCase();
    if (rl === 'tinggi' || rl === 'high') return <span className="risk-chip chip-high">Tinggi</span>;
    if (rl === 'sedang' || rl === 'medium') return <span className="risk-chip chip-medium">Sedang</span>;
    if (rl === 'rendah' || rl === 'low') return <span className="risk-chip chip-low">Rendah</span>;
    return <span className="risk-chip chip-pending">Menunggu</span>;
  };

  const statusChip = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      under_review: { label: 'Dalam review', cls: 'review' },
      approved: { label: 'Disetujui', cls: 'approved' },
      rejected: { label: 'Ditolak', cls: 'rejected' },
      collateral_validation: { label: 'Analisa AI', cls: 'pending' },
    };
    const s = map[status] || { label: status, cls: 'pending' };
    return <span className={`status-chip ${s.cls}`}><span className="status-dot" />{s.label}</span>;
  };

  const jaminanLabel: Record<string, string> = {
    tanah_shm: 'Tanah SHM',
    tanah_shgb: 'Tanah SHGB',
    bangunan: 'Bangunan',
    kendaraan_roda4: 'Kendaraan',
  };

  const formatRp = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}Jt`;
    return `${(n / 1_000).toFixed(0)}Rb`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '--';
    return fmtDate(iso);
  };

  return (
    <>      <div className="lw-root">
        {/* Nav */}
        <nav className="lw-nav">
          <div className="nav-left">
            <div className="nav-brand">
              <div className="nav-sigil">E</div>
              <span className="nav-name">Syarikat Islam - DSN</span>
            </div>
            <div className="nav-divider" />
            <span className="nav-module">Syariah Contract Compliance</span>
          </div>
          <div className="nav-right">
            <div className="nav-user">
              <div className="user-avatar">{userInitials}</div>
              <span className="user-name">{userEmail}</span>
            </div>
            <button className="nav-logout" onClick={() => { supabase.auth.signOut(); router.push('/login'); }}>
              Keluar
            </button>
          </div>
        </nav>

        <div className="lw-layout">
          {/* Sidebar */}
          <aside className="lw-sidebar">
            <div className="sidebar-label">Antrian</div>
            {([
              ['all', 'Semua permintaan'],
              ['collateral_validation', 'Analisa AI'],
              ['under_review', 'Perlu review'],
            ] as [FilterType, string][]).map(([f, label]) => (
              <div key={f} className={`sidebar-item ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                {label}
                {counts[f] > 0 && <span className="sidebar-count">{counts[f]}</span>}
              </div>
            ))}

            <div className="sidebar-label">Keputusan</div>
            {([
              ['approved', 'Disetujui'],
              ['rejected', 'Ditolak'],
            ] as [FilterType, string][]).map(([f, label]) => (
              <div key={f} className={`sidebar-item ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}>
                {label}
                {counts[f] > 0 && <span className="sidebar-count">{counts[f]}</span>}
              </div>
            ))}
          </aside>

          {/* Main */}
          <main className="lw-main">
            {/* Toolbar */}
            <div className="lw-toolbar">
              <div className="toolbar-left">
                <div className="page-eyebrow">Syariah Contract Compliance -- Review Panel</div>
                <h1 className="page-title">
                  {filter === 'all' ? 'Semua Permintaan' :
                   filter === 'under_review' ? 'Perlu Review' :
                   filter === 'collateral_validation' ? 'Analisa AI Berjalan' :
                   filter === 'approved' ? 'Disetujui' : 'Ditolak'}
                </h1>
              </div>
              <div className="toolbar-right">
                <div className="search-wrap">
                  <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <input className="search-input" placeholder="Cari nasabah, no. request..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-bar">
              <div className="stat-cell">
                <div className="stat-label">Total permintaan</div>
                <div className="stat-value gold">{counts.all}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Perlu review</div>
                <div className="stat-value">{counts.under_review}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Risiko tinggi</div>
                <div className="stat-value danger">{highRisk}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Disetujui</div>
                <div className="stat-value success">{counts.approved}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Total nilai</div>
                <div className="stat-value">Rp {formatRp(totalValue)}</div>
              </div>
            </div>

            {/* Table */}
            <div className="table-wrap">
              {loading ? (
                <div className="loading-rows">
                  {[...Array(6)].map((_, i) => <div key={i} className="loading-row" style={{ animationDelay: `${i * 0.1}s` }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="8" y="6" width="24" height="30" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M14 14h12M14 20h12M14 26h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <div className="empty-title">Tidak ada permintaan</div>
                  <div className="empty-sub">
                    {search ? 'Tidak ada hasil untuk pencarian ini' : 'Belum ada permintaan masuk'}
                  </div>
                </div>
              ) : (
                <table className="req-table">
                  <thead>
                    <tr>
                      <th>No. Request</th>
                      <th>Nasabah</th>
                      <th>Jaminan</th>
                      <th>Nilai</th>
                      <th>Risiko AI</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} onClick={() => router.push(`/lawyer/${r.id}`)}>
                        <td>
                          <div className="td-req-no">{r.request_number || r.id.slice(0, 8).toUpperCase()}</div>
                        </td>
                        <td>
                          <div className="td-name">{r.customer_name}</div>
                          <div className="td-sub">{r.customer_id_number || '--'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: 'rgba(232,230,224,0.55)' }}>
                            {jaminanLabel[r.collateral?.type] || r.collateral?.type || '--'}
                          </div>
                          <div className="td-sub">{r.collateral?.details?.owner_name || '--'}</div>
                        </td>
                        <td>
                          <div className="amount-cell">
                            Rp {fmtRp(Number(r.financing_amount))}
                          </div>
                          <div className="td-sub">{r.tenor_months} bln . {r.margin_percent}%</div>
                        </td>
                        <td>{riskChip(r)}</td>
                        <td>{statusChip(r.status)}</td>
                        <td><span className="date-cell">{formatDate(r.created_at)}</span></td>
                        <td className="action-cell">
                          <button className="review-btn"
                            onClick={e => { e.stopPropagation(); router.push(`/lawyer/${r.id}`); }}>
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
