'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.st-root {
  min-height: 100vh;
  background: #f5f3ef;
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
}

.st-nav {
  background: #0c0d0f;
  border-bottom: 1px solid rgba(192,160,98,0.2);
  padding: 0 40px;
  height: 56px;
  display: flex; align-items: center;
  justify-content: space-between;
}

.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-sigil {
  width: 30px; height: 30px;
  border: 1px solid rgba(192,160,98,0.45);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 14px; color: #c0a062;
}
.nav-name {
  font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232,230,224,0.7);
}
.nav-back {
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(232,230,224,0.35); background: none; border: none;
  cursor: pointer; font-family: inherit; transition: color 0.2s;
}
.nav-back:hover { color: rgba(232,230,224,0.65); }

.st-body {
  max-width: 820px;
  margin: 0 auto;
  padding: 48px 40px 80px;
}

/* Status header */
.status-header {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 40px;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(26,26,26,0.1);
}

.status-eyebrow {
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: #c0a062; margin-bottom: 8px;
}

.status-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px; font-weight: 400;
  color: #1a1a1a; line-height: 1.25;
  margin-bottom: 6px;
}

.req-number {
  font-size: 12px; color: rgba(26,26,26,0.35);
  letter-spacing: 0.06em;
}

/* Status badge */
.status-badge-wrap { text-align: right; }

.status-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  border-radius: 2px;
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  font-weight: 500;
}

.badge-pending { background: rgba(192,160,98,0.1); color: #8a6e3a; border: 1px solid rgba(192,160,98,0.25); }
.badge-approved { background: rgba(40,160,80,0.07); color: #1a6e30; border: 1px solid rgba(40,160,80,0.2); }
.badge-review { background: rgba(26,26,26,0.06); color: rgba(26,26,26,0.6); border: 1px solid rgba(26,26,26,0.12); }
.badge-rejected { background: rgba(220,80,60,0.06); color: #a03020; border: 1px solid rgba(220,80,60,0.18); }

.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Info grid */
.info-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 1px; background: rgba(26,26,26,0.08);
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 4px; overflow: hidden;
  margin-bottom: 24px;
}

.info-cell {
  background: white;
  padding: 18px 20px;
}

.info-label {
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(26,26,26,0.35); margin-bottom: 6px;
}

.info-value {
  font-size: 15px; font-weight: 400; color: #1a1a1a;
}

.info-value.accent { color: #1a1a1a; font-family: 'Playfair Display', serif; }

/* Risk indicator hero */
.risk-hero {
  border-radius: 4px;
  padding: 24px 28px;
  margin-bottom: 20px;
  display: flex; align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.risk-low { background: rgba(40,160,80,0.06); border: 1px solid rgba(40,160,80,0.18); }
.risk-medium { background: rgba(192,160,98,0.08); border: 1px solid rgba(192,160,98,0.25); }
.risk-high { background: rgba(220,80,60,0.06); border: 1px solid rgba(220,80,60,0.18); }

.risk-left { flex: 1; }

.risk-eyebrow {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 6px;
}

.risk-low .risk-eyebrow { color: #1a6e30; }
.risk-medium .risk-eyebrow { color: #8a6e3a; }
.risk-high .risk-eyebrow { color: #a03020; }

.risk-level {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 400;
  margin-bottom: 6px;
}

.risk-low .risk-level { color: #1a4a28; }
.risk-medium .risk-level { color: #5a4020; }
.risk-high .risk-level { color: #7a2018; }

.risk-desc {
  font-size: 13px; font-weight: 300;
  line-height: 1.6;
}

.risk-low .risk-desc { color: rgba(26,74,40,0.7); }
.risk-medium .risk-desc { color: rgba(90,64,32,0.7); }
.risk-high .risk-desc { color: rgba(122,32,24,0.7); }

.risk-score {
  width: 72px; height: 72px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
  flex-shrink: 0;
}

.risk-low .risk-score { background: rgba(40,160,80,0.1); border: 1.5px solid rgba(40,160,80,0.25); }
.risk-medium .risk-score { background: rgba(192,160,98,0.12); border: 1.5px solid rgba(192,160,98,0.3); }
.risk-high .risk-score { background: rgba(220,80,60,0.1); border: 1.5px solid rgba(220,80,60,0.25); }

.risk-score-num {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 600;
  line-height: 1;
}

.risk-low .risk-score-num { color: #1a6e30; }
.risk-medium .risk-score-num { color: #8a6e3a; }
.risk-high .risk-score-num { color: #a03020; }

.risk-score-label {
  font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
  margin-top: 3px;
}

.risk-low .risk-score-label { color: rgba(26,110,48,0.6); }
.risk-medium .risk-score-label { color: rgba(138,110,58,0.6); }
.risk-high .risk-score-label { color: rgba(160,48,32,0.6); }

/* Content cards */
.content-card {
  background: white;
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.card-head {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(26,26,26,0.07);
  display: flex; align-items: center; gap: 12px;
}

.card-icon {
  width: 28px; height: 28px;
  background: rgba(192,160,98,0.08);
  border: 1px solid rgba(192,160,98,0.2);
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 15px; font-weight: 400;
  color: #1a1a1a;
}

.card-body { padding: 20px 24px; }

/* Recommendation */
.rec-text {
  font-size: 14px; font-weight: 300;
  line-height: 1.75; color: rgba(26,26,26,0.75);
  white-space: pre-wrap;
}

/* Issues list */
.issues-list { display: flex; flex-direction: column; gap: 12px; }

.issue-item {
  display: flex; gap: 14px;
  padding: 14px 16px;
  border-radius: 2px;
  border: 1px solid;
}

.issue-high { background: rgba(220,80,60,0.04); border-color: rgba(220,80,60,0.15); }
.issue-medium { background: rgba(192,160,98,0.05); border-color: rgba(192,160,98,0.2); }
.issue-low { background: rgba(26,26,26,0.03); border-color: rgba(26,26,26,0.08); }

.issue-marker {
  width: 4px; border-radius: 2px; flex-shrink: 0; align-self: stretch;
}

.issue-high .issue-marker { background: rgba(220,80,60,0.5); }
.issue-medium .issue-marker { background: rgba(192,160,98,0.6); }
.issue-low .issue-marker { background: rgba(26,26,26,0.2); }

.issue-content { flex: 1; }

.issue-label {
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  margin-bottom: 4px;
}

.issue-high .issue-label { color: #a03020; }
.issue-medium .issue-label { color: #8a6e3a; }
.issue-low .issue-label { color: rgba(26,26,26,0.4); }

.issue-text {
  font-size: 13px; font-weight: 300;
  line-height: 1.55; color: rgba(26,26,26,0.7);
}

/* Clause preview */
.clause-preview {
  background: #faf9f7;
  border: 1px solid rgba(26,26,26,0.08);
  border-left: 3px solid rgba(192,160,98,0.5);
  border-radius: 0 2px 2px 0;
  padding: 16px 20px;
  font-size: 13px; font-weight: 300;
  line-height: 1.7; color: rgba(26,26,26,0.65);
  white-space: pre-wrap;
}

/* Processing state */
.processing-wrap {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.processing-spinner {
  width: 36px; height: 36px;
  border: 1.5px solid rgba(192,160,98,0.2);
  border-top-color: #c0a062;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

.processing-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 400;
  color: #1a1a1a; margin-bottom: 8px;
}

.processing-desc {
  font-size: 13px; font-weight: 300;
  color: rgba(26,26,26,0.45); line-height: 1.6;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-state {
  text-align: center; padding: 60px 20px;
  color: rgba(26,26,26,0.35); font-size: 14px;
}

@media (max-width: 640px) {
  .st-body { padding: 24px 20px 60px; }
  .info-grid { grid-template-columns: 1fr 1fr; }
  .status-header { flex-direction: column; gap: 12px; }
  .risk-hero { flex-direction: column; }
}
`;

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [request, setRequest] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!id) return;
    let interval: any;

    const fetch = async () => {
      const { data } = await supabase
        .from('contract_requests').select('*').eq('id', id).single();
      if (data) {
        setRequest(data);
        if (data.collateral_validation_result) {
          setPolling(false);
          clearInterval(interval);
        }
      }
    };

    fetch();
    interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (!request) return (
    <div className="processing-wrap">
      <div className="processing-spinner" />
      <div className="processing-title">Memuat data…</div>
    </div>
  );

  const v = request.collateral_validation_result || {};
  const riskLevel = (v.risk_level || '').toLowerCase();
  const riskClass = riskLevel === 'tinggi' || riskLevel === 'high' ? 'risk-high'
    : riskLevel === 'sedang' || riskLevel === 'medium' ? 'risk-medium' : 'risk-low';
  const riskScore = riskLevel === 'tinggi' || riskLevel === 'high' ? '72'
    : riskLevel === 'sedang' || riskLevel === 'medium' ? '45' : '18';
  const riskLabel = v.risk_level || 'Menunggu';

  const statusMap: Record<string, string> = {
    collateral_validation: 'Menunggu analisa',
    under_review: 'Dalam review',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  };

  const badgeClass = {
    collateral_validation: 'badge-pending',
    under_review: 'badge-review',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }[request.status] || 'badge-pending';

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const issues: { level: string; text: string }[] = v.issues || [];
  const clauses: string[] = v.suggested_clauses || [];

  return (
    <>
      <style>{STYLES}</style>
      <div className="st-root">
        <nav className="st-nav">
          <div className="nav-brand">
            <div className="nav-sigil">E</div>
            <span className="nav-name">Erlangga Legal</span>
          </div>
          <button className="nav-back" onClick={() => router.push('/branch')}>
            ← Permintaan baru
          </button>
        </nav>

        <div className="st-body">
          {/* Header */}
          <div className="status-header">
            <div>
              <div className="status-eyebrow">Hasil Analisa</div>
              <h1 className="status-title">{request.customer_name}</h1>
              <div className="req-number">No. {request.request_number || id?.slice(0, 8).toUpperCase()}</div>
            </div>
            <div className="status-badge-wrap">
              <div className={`status-badge ${badgeClass}`}>
                <div className="badge-dot" />
                {statusMap[request.status] || request.status}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="info-grid">
            <div className="info-cell">
              <div className="info-label">Nilai pembiayaan</div>
              <div className="info-value accent">{formatRp(request.financing_amount)}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Tenor</div>
              <div className="info-value">{request.tenor_months} bulan</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Jenis jaminan</div>
              <div className="info-value">
                {({ tanah_shm: 'Tanah SHM', tanah_shgb: 'Tanah SHGB', bangunan: 'Bangunan', kendaraan_roda4: 'Kendaraan' } as any)[request.collateral?.type] || request.collateral?.type}
              </div>
            </div>
          </div>

          {/* Processing or results */}
          {polling && !v.recommendation ? (
            <div className="content-card">
              <div className="processing-wrap">
                <div className="processing-spinner" />
                <div className="processing-title">AI sedang menganalisa jaminan</div>
                <div className="processing-desc">
                  Memeriksa kelengkapan dokumen, menilai risiko hukum,<br />
                  dan menyiapkan rekomendasi. Biasanya selesai dalam 1–2 menit.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Risk hero */}
              {v.risk_level && (
                <div className={`risk-hero ${riskClass}`}>
                  <div className="risk-left">
                    <div className="risk-eyebrow">Tingkat risiko hukum</div>
                    <div className="risk-level">{riskLabel}</div>
                    <div className="risk-desc">
                      {riskClass === 'risk-high'
                        ? 'Ditemukan isu hukum signifikan yang memerlukan penanganan sebelum akad dapat ditandatangani.'
                        : riskClass === 'risk-medium'
                        ? 'Terdapat beberapa catatan yang perlu diselesaikan. Proses dapat dilanjutkan dengan klausul pengamanan.'
                        : 'Jaminan dalam kondisi baik. Proses dapat dilanjutkan ke tahap penandatanganan akad.'}
                    </div>
                  </div>
                  <div className="risk-score">
                    <div className="risk-score-num">{riskScore}</div>
                    <div className="risk-score-label">Skor</div>
                  </div>
                </div>
              )}

              {/* Rekomendasi */}
              {v.recommendation && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v3M7 10v3M1 7h3M10 7h3" stroke="#8a6e3a" strokeWidth="1.2" strokeLinecap="round"/>
                        <circle cx="7" cy="7" r="2.5" stroke="#8a6e3a" strokeWidth="1.2"/>
                      </svg>
                    </div>
                    <span className="card-title">Rekomendasi AI</span>
                  </div>
                  <div className="card-body">
                    <div className="rec-text">{v.recommendation}</div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {issues.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1L1 12h12L7 1z" stroke="#8a6e3a" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M7 5.5v3M7 10v.5" stroke="#8a6e3a" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="card-title">Temuan & Risiko Hukum</span>
                  </div>
                  <div className="card-body">
                    <div className="issues-list">
                      {issues.map((iss: any, i: number) => {
                        const lvl = (iss.level || 'low').toLowerCase();
                        const cls = lvl === 'high' || lvl === 'tinggi' ? 'issue-high'
                          : lvl === 'medium' || lvl === 'sedang' ? 'issue-medium' : 'issue-low';
                        const lbl = lvl === 'high' || lvl === 'tinggi' ? 'Risiko tinggi'
                          : lvl === 'medium' || lvl === 'sedang' ? 'Perhatian' : 'Catatan';
                        return (
                          <div key={i} className={`issue-item ${cls}`}>
                            <div className="issue-marker" />
                            <div className="issue-content">
                              <div className="issue-label">{lbl}</div>
                              <div className="issue-text">{typeof iss === 'string' ? iss : iss.text || iss.message || JSON.stringify(iss)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested clauses */}
              {clauses.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#8a6e3a" strokeWidth="1.2"/>
                        <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="#8a6e3a" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="card-title">Klausul Pengamanan yang Disarankan</span>
                  </div>
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {clauses.map((cl: string, i: number) => (
                      <div key={i} className="clause-preview">{cl}</div>
                    ))}
                  </div>
                </div>
              )}

              {!v.recommendation && !v.risk_level && (
                <div className="empty-state">Data analisa belum tersedia.</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', fontFamily: 'sans-serif', color: 'rgba(26,26,26,0.4)' }}>Memuat…</div>
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
