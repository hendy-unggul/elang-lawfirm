'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.rv-root {
  min-height: 100vh;
  background: #0c0d0f;
  font-family: 'DM Sans', sans-serif;
  color: #e8e6e0;
}

/* Nav */
.rv-nav {
  height: 56px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px; position: sticky; top: 0; z-index: 100;
  background: #0c0d0f;
}

.nav-left { display: flex; align-items: center; gap: 16px; }
.nav-back {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(232,230,224,0.3);
  background: none; border: none; cursor: pointer;
  font-family: inherit; transition: color 0.2s; padding: 0;
}
.nav-back:hover { color: rgba(232,230,224,0.6); }
.nav-sep { font-size: 14px; color: rgba(255,255,255,0.1); }
.nav-current { font-size: 13px; color: rgba(232,230,224,0.5); }
.nav-sigil {
  width: 30px; height: 30px;
  border: 1px solid rgba(192,160,98,0.4);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 14px; color: #c0a062;
}

/* Body layout */
.rv-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1px;
  min-height: calc(100vh - 56px);
  background: rgba(255,255,255,0.04);
}

/* Left — analysis */
.rv-left {
  background: #0c0d0f;
  padding: 36px 40px 60px;
  overflow-y: auto;
}

/* Right — sidebar actions */
.rv-right {
  background: #0e0f11;
  padding: 28px 24px;
  display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto;
}

/* Case header */
.case-header { margin-bottom: 32px; }

.case-eyebrow {
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(192,160,98,0.5); margin-bottom: 10px;
  display: flex; align-items: center; gap: 10px;
}
.case-eyebrow::before {
  content: ''; display: block; width: 20px; height: 1px; background: rgba(192,160,98,0.4);
}

.case-name {
  font-family: 'Playfair Display', serif;
  font-size: 28px; font-weight: 400;
  color: #e8e6e0; margin-bottom: 8px; line-height: 1.2;
}

.case-meta {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}

.meta-item {
  font-size: 12px; color: rgba(232,230,224,0.3);
  display: flex; align-items: center; gap: 6px;
}
.meta-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.15); }

/* Risk hero */
.risk-hero {
  border-radius: 3px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex; align-items: center;
  justify-content: space-between;
}
.rh-high { background: rgba(232,112,90,0.07); border: 1px solid rgba(232,112,90,0.2); }
.rh-medium { background: rgba(192,160,98,0.07); border: 1px solid rgba(192,160,98,0.2); }
.rh-low { background: rgba(106,191,128,0.06); border: 1px solid rgba(106,191,128,0.15); }

.rh-left {}
.rh-eyebrow {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 4px;
}
.rh-high .rh-eyebrow { color: rgba(232,112,90,0.6); }
.rh-medium .rh-eyebrow { color: rgba(192,160,98,0.6); }
.rh-low .rh-eyebrow { color: rgba(106,191,128,0.6); }

.rh-level {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-weight: 400; margin-bottom: 4px;
}
.rh-high .rh-level { color: #e8705a; }
.rh-medium .rh-level { color: #c0a062; }
.rh-low .rh-level { color: #6abf80; }

.rh-summary { font-size: 12px; font-weight: 300; line-height: 1.5; }
.rh-high .rh-summary { color: rgba(232,112,90,0.6); }
.rh-medium .rh-summary { color: rgba(192,160,98,0.55); }
.rh-low .rh-summary { color: rgba(106,191,128,0.55); }

.rh-score {
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; flex-shrink: 0;
}
.rh-high .rh-score { background: rgba(232,112,90,0.1); border: 1px solid rgba(232,112,90,0.25); }
.rh-medium .rh-score { background: rgba(192,160,98,0.1); border: 1px solid rgba(192,160,98,0.25); }
.rh-low .rh-score { background: rgba(106,191,128,0.08); border: 1px solid rgba(106,191,128,0.2); }

.rh-score-num { font-family: 'Playfair Display', serif; font-size: 18px; line-height: 1; }
.rh-high .rh-score-num { color: #e8705a; }
.rh-medium .rh-score-num { color: #c0a062; }
.rh-low .rh-score-num { color: #6abf80; }
.rh-score-lbl { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; color: rgba(232,230,224,0.2); }

/* Section */
.rv-section { margin-bottom: 24px; }

.section-label {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(232,230,224,0.2);
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 10px;
}
.section-label::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(255,255,255,0.05);
}

/* Recommendation */
.rec-block {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 3px;
  padding: 18px 20px;
}
.rec-text {
  font-size: 13px; font-weight: 300; line-height: 1.8;
  color: rgba(232,230,224,0.6); white-space: pre-wrap;
}

/* Issues */
.issues-list { display: flex; flex-direction: column; gap: 10px; }

.issue-card {
  border-radius: 3px;
  border-left: 3px solid;
  padding: 14px 16px;
  display: flex; gap: 14px;
}
.issue-high { background: rgba(232,112,90,0.05); border-color: rgba(232,112,90,0.4); }
.issue-medium { background: rgba(192,160,98,0.05); border-color: rgba(192,160,98,0.4); }
.issue-low { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); }

.issue-body { flex: 1; }
.issue-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }

.issue-badge {
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 2px; font-weight: 500;
}
.issue-high .issue-badge { background: rgba(232,112,90,0.12); color: #e8705a; }
.issue-medium .issue-badge { background: rgba(192,160,98,0.12); color: #c0a062; }
.issue-low .issue-badge { background: rgba(255,255,255,0.06); color: rgba(232,230,224,0.35); }

.issue-category {
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(232,230,224,0.2);
}

.issue-text {
  font-size: 13px; font-weight: 300;
  line-height: 1.6; color: rgba(232,230,224,0.55);
  margin-bottom: 8px;
}

.issue-solution {
  font-size: 12px; font-weight: 300;
  line-height: 1.55; color: rgba(232,230,224,0.35);
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 2px;
  border-left: 2px solid rgba(192,160,98,0.2);
}
.issue-solution-label {
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(192,160,98,0.4); margin-bottom: 4px;
}

/* Clauses */
.clauses-list { display: flex; flex-direction: column; gap: 10px; }

.clause-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-left: 2px solid rgba(192,160,98,0.25);
  border-radius: 0 3px 3px 0;
  padding: 14px 16px;
  display: flex; gap: 12px; align-items: flex-start;
}

.clause-num {
  font-family: 'DM Mono', monospace;
  font-size: 10px; color: rgba(192,160,98,0.3);
  margin-top: 2px; flex-shrink: 0; width: 20px;
}

.clause-text {
  font-size: 12px; font-weight: 300;
  line-height: 1.7; color: rgba(232,230,224,0.45);
  font-style: italic; flex: 1;
}

.copy-clause-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(232,230,224,0.2); padding: 2px; flex-shrink: 0;
  transition: color 0.15s;
}
.copy-clause-btn:hover { color: rgba(192,160,98,0.6); }

/* Docs required */
.docs-list { display: flex; flex-direction: column; gap: 8px; }

.doc-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 3px;
}

.doc-priority {
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 2px; flex-shrink: 0; margin-top: 1px;
}
.doc-wajib { background: rgba(232,112,90,0.1); color: #e8705a; }
.doc-pendukung { background: rgba(192,160,98,0.1); color: #c0a062; }
.doc-kondisional { background: rgba(255,255,255,0.06); color: rgba(232,230,224,0.35); }

.doc-content { flex: 1; }
.doc-name { font-size: 13px; font-weight: 400; color: rgba(232,230,224,0.7); margin-bottom: 2px; }
.doc-reason { font-size: 11px; font-weight: 300; color: rgba(232,230,224,0.3); line-height: 1.4; }

/* Compliance */
.compliance-grid { display: flex; flex-direction: column; gap: 10px; }

.compliance-item {
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.04);
}
.compliance-org {
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(192,160,98,0.4); margin-bottom: 5px;
}
.compliance-text {
  font-size: 12px; font-weight: 300;
  line-height: 1.6; color: rgba(232,230,224,0.4);
}

/* Data summary sidebar */
.sidebar-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}

.sidebar-card-head {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(232,230,224,0.25);
}

.sidebar-card-body { padding: 4px 0; }

.data-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.data-row:last-child { border-bottom: none; }

.data-key {
  font-size: 11px; color: rgba(232,230,224,0.25); font-weight: 300;
  flex-shrink: 0; margin-right: 12px;
}
.data-val {
  font-size: 12px; color: rgba(232,230,224,0.6);
  text-align: right; font-weight: 400;
}
.data-val.mono { font-family: 'DM Mono', monospace; font-size: 11px; }

/* Action buttons */
.action-section {
  display: flex; flex-direction: column; gap: 8px;
}

.action-label {
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(232,230,224,0.2); margin-bottom: 4px;
}

.action-approve {
  width: 100%; padding: 13px;
  background: rgba(106,191,128,0.1);
  border: 1px solid rgba(106,191,128,0.3);
  border-radius: 3px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #6abf80; cursor: pointer; font-weight: 500;
  transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.action-approve:hover:not(:disabled) { background: rgba(106,191,128,0.15); border-color: rgba(106,191,128,0.45); }
.action-approve:disabled { opacity: 0.35; cursor: not-allowed; }

.action-reject {
  width: 100%; padding: 13px;
  background: rgba(232,112,90,0.06);
  border: 1px solid rgba(232,112,90,0.2);
  border-radius: 3px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(232,112,90,0.7); cursor: pointer; font-weight: 500;
  transition: all 0.15s;
}
.action-reject:hover:not(:disabled) { background: rgba(232,112,90,0.1); border-color: rgba(232,112,90,0.35); }
.action-reject:disabled { opacity: 0.35; cursor: not-allowed; }

.action-note {
  width: 100%; padding: 11px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(232,230,224,0.3); cursor: pointer;
  transition: all 0.15s;
}
.action-note:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,230,224,0.5); }

/* Note textarea */
.note-area {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 3px;
  padding: 10px 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 300; color: #e8e6e0;
  resize: none; width: 100%; min-height: 88px;
  outline: none; transition: border-color 0.2s; line-height: 1.6;
}
.note-area::placeholder { color: rgba(232,230,224,0.2); }
.note-area:focus { border-color: rgba(192,160,98,0.3); }

/* Decision badge */
.decision-banner {
  border-radius: 3px;
  padding: 14px 16px;
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 400;
}
.decision-approved { background: rgba(106,191,128,0.08); border: 1px solid rgba(106,191,128,0.2); color: #6abf80; }
.decision-rejected { background: rgba(232,112,90,0.08); border: 1px solid rgba(232,112,90,0.2); color: #e8705a; }

/* Toast */
.toast {
  position: fixed; bottom: 28px; right: 28px;
  background: #1e2023;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 12px 18px;
  font-size: 13px; color: rgba(232,230,224,0.7);
  z-index: 200;
  animation: toastIn 0.2s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Loading */
.rv-loading {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 56px);
  flex-direction: column; gap: 16px;
}
.rv-spinner {
  width: 32px; height: 32px;
  border: 1px solid rgba(192,160,98,0.15);
  border-top-color: #c0a062;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.rv-loading-text {
  font-family: 'Playfair Display', serif;
  font-size: 16px; font-weight: 400;
  color: rgba(232,230,224,0.3);
}

@media (max-width: 900px) {
  .rv-body { grid-template-columns: 1fr; }
  .rv-right { border-top: 1px solid rgba(255,255,255,0.06); }
  .rv-left { padding: 24px 20px 40px; }
  .rv-right { padding: 20px; }
  .rv-nav { padding: 0 20px; }
}
`;

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [showNoteArea, setShowNoteArea] = useState(false);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('contract_requests').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setRequest(data); setLoading(false); });
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const doAction = async (newStatus: 'approved' | 'rejected') => {
    if (!id) return;
    setActing(true);
    const { error } = await supabase
      .from('contract_requests')
      .update({
        status: newStatus,
        lawyer_note: note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      setRequest((r: any) => ({ ...r, status: newStatus, lawyer_note: note }));
      showToast(newStatus === 'approved' ? 'Permintaan disetujui' : 'Permintaan ditolak');
    }
    setActing(false);
  };

  const copyClause = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="rv-root">
        <div className="rv-loading">
          <div className="rv-spinner" />
          <div className="rv-loading-text">Memuat data…</div>
        </div>
      </div>
    </>
  );

  if (!request) return (
    <>
      <style>{STYLES}</style>
      <div className="rv-root">
        <div className="rv-loading">
          <div className="rv-loading-text">Data tidak ditemukan</div>
        </div>
      </div>
    </>
  );

  const v = request.collateral_validation_result || {};
  const rl = (v.risk_level || '').toLowerCase();
  const rhClass = rl === 'tinggi' || rl === 'high' ? 'rh-high'
    : rl === 'sedang' || rl === 'medium' ? 'rh-medium' : 'rh-low';
  const rlLabel = v.risk_level || '—';
  const score = v.risk_score ?? (rl === 'tinggi' || rl === 'high' ? 72 : rl === 'sedang' || rl === 'medium' ? 45 : 18);

  const issues: any[] = v.issues || [];
  const clauses: string[] = v.suggested_clauses || [];
  const docsRequired: any[] = v.documents_required || [];
  const compliance = v.compliance_notes || {};

  const jaminanLabel: Record<string, string> = {
    tanah_shm: 'Tanah SHM', tanah_shgb: 'Tanah SHGB',
    bangunan: 'Bangunan', kendaraan_roda4: 'Kendaraan Roda 4',
  };

  const ownershipLabel: Record<string, string> = {
    hak_milik_pribadi: 'Hak milik pribadi',
    harta_bersama: 'Harta bersama',
    warisan_belum_dibagi: 'Warisan belum dibagi',
    kuasa: 'Atas kuasa',
  };

  const isDecided = ['approved', 'rejected'].includes(request.status);

  return (
    <>
      <style>{STYLES}</style>
      <div className="rv-root">
        {/* Nav */}
        <nav className="rv-nav">
          <div className="nav-left">
            <div className="nav-sigil">E</div>
            <button className="nav-back" onClick={() => router.push('/lawyer')}>
              ← Kembali
            </button>
            <span className="nav-sep">/</span>
            <span className="nav-current">
              {request.request_number || id?.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </nav>

        <div className="rv-body">
          {/* LEFT — Analysis */}
          <div className="rv-left">
            {/* Case header */}
            <div className="case-header">
              <div className="case-eyebrow">Analisa Hukum</div>
              <h1 className="case-name">{request.customer_name}</h1>
              <div className="case-meta">
                <span className="meta-item">
                  {jaminanLabel[request.collateral?.type] || request.collateral?.type}
                </span>
                <span className="meta-dot" />
                <span className="meta-item">
                  Rp {Number(request.financing_amount).toLocaleString('id-ID')}
                </span>
                <span className="meta-dot" />
                <span className="meta-item">{request.tenor_months} bulan</span>
                <span className="meta-dot" />
                <span className="meta-item">{request.margin_percent}% margin</span>
              </div>
            </div>

            {/* Risk hero */}
            {v.risk_level && (
              <div className={`risk-hero ${rhClass}`}>
                <div className="rh-left">
                  <div className="rh-eyebrow">Tingkat risiko hukum</div>
                  <div className="rh-level">{rlLabel}</div>
                  <div className="rh-summary">{v.summary || '—'}</div>
                </div>
                <div className="rh-score">
                  <div className="rh-score-num">{score}</div>
                  <div className="rh-score-lbl">Skor</div>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {v.recommendation && (
              <div className="rv-section">
                <div className="section-label">Rekomendasi AI</div>
                <div className="rec-block">
                  <div className="rec-text">{v.recommendation}</div>
                </div>
              </div>
            )}

            {/* Issues */}
            {issues.length > 0 && (
              <div className="rv-section">
                <div className="section-label">Temuan & risiko ({issues.length})</div>
                <div className="issues-list">
                  {issues.map((iss: any, i: number) => {
                    const lvl = (iss.level || 'low').toLowerCase();
                    const cls = lvl === 'high' || lvl === 'tinggi' ? 'issue-high'
                      : lvl === 'medium' || lvl === 'sedang' ? 'issue-medium' : 'issue-low';
                    const lbl = lvl === 'high' || lvl === 'tinggi' ? 'Risiko tinggi'
                      : lvl === 'medium' || lvl === 'sedang' ? 'Perhatian' : 'Catatan';
                    return (
                      <div key={i} className={`issue-card ${cls}`}>
                        <div className="issue-body">
                          <div className="issue-top">
                            <span className="issue-badge">{lbl}</span>
                            {iss.category && <span className="issue-category">{iss.category}</span>}
                          </div>
                          <div className="issue-text">
                            {typeof iss === 'string' ? iss : iss.text || iss.message || ''}
                          </div>
                          {iss.solution && (
                            <div className="issue-solution">
                              <div className="issue-solution-label">Jalur solusi</div>
                              {iss.solution}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clauses */}
            {clauses.length > 0 && (
              <div className="rv-section">
                <div className="section-label">Klausul kontrak yang disarankan</div>
                <div className="clauses-list">
                  {clauses.map((cl: string, i: number) => (
                    <div key={i} className="clause-card">
                      <span className="clause-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="clause-text">{cl}</div>
                      <button className="copy-clause-btn" onClick={() => copyClause(cl, i)}
                        title="Salin klausul">
                        {copiedIdx === i ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l3.5 3.5L12 3" stroke="#6abf80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="4" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                            <path d="M2 4v8a1.5 1.5 0 001.5 1.5H9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Docs required */}
            {docsRequired.length > 0 && (
              <div className="rv-section">
                <div className="section-label">Dokumen yang diperlukan</div>
                <div className="docs-list">
                  {docsRequired.map((doc: any, i: number) => {
                    const p = (doc.priority || '').toLowerCase();
                    const pCls = p === 'wajib' ? 'doc-wajib' : p === 'pendukung' ? 'doc-pendukung' : 'doc-kondisional';
                    return (
                      <div key={i} className="doc-item">
                        <span className={`doc-priority ${pCls}`}>{doc.priority || 'Dokumen'}</span>
                        <div className="doc-content">
                          <div className="doc-name">{doc.name}</div>
                          {doc.reason && <div className="doc-reason">{doc.reason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compliance */}
            {(compliance.ojk || compliance.dsn_mui || compliance.civil_law) && (
              <div className="rv-section">
                <div className="section-label">Catatan kepatuhan regulasi</div>
                <div className="compliance-grid">
                  {compliance.ojk && (
                    <div className="compliance-item">
                      <div className="compliance-org">OJK</div>
                      <div className="compliance-text">{compliance.ojk}</div>
                    </div>
                  )}
                  {compliance.dsn_mui && (
                    <div className="compliance-item">
                      <div className="compliance-org">DSN-MUI</div>
                      <div className="compliance-text">{compliance.dsn_mui}</div>
                    </div>
                  )}
                  {compliance.civil_law && (
                    <div className="compliance-item">
                      <div className="compliance-org">Hukum Perdata / Agraria</div>
                      <div className="compliance-text">{compliance.civil_law}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!v.recommendation && !v.risk_level && (
              <div style={{ color: 'rgba(232,230,224,0.2)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
                Analisa AI belum tersedia — masih diproses atau gagal.
              </div>
            )}
          </div>

          {/* RIGHT — Sidebar */}
          <div className="rv-right">
            {/* Data summary */}
            <div className="sidebar-card">
              <div className="sidebar-card-head">Data pembiayaan</div>
              <div className="sidebar-card-body">
                {[
                  ['Nasabah', request.customer_name],
                  ['NIK', request.customer_id_number || '—'],
                  ['Nilai', `Rp ${Number(request.financing_amount).toLocaleString('id-ID')}`],
                  ['Tenor', `${request.tenor_months} bulan`],
                  ['Margin', `${request.margin_percent}%`],
                  ['Akad', request.contract_type || 'Murabahah'],
                ].map(([k, v]) => (
                  <div className="data-row" key={k}>
                    <span className="data-key">{k}</span>
                    <span className="data-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-head">Data jaminan</div>
              <div className="sidebar-card-body">
                {[
                  ['Jenis', jaminanLabel[request.collateral?.type] || '—'],
                  ['Atas nama', request.collateral?.details?.owner_name || '—'],
                  ['Status', ownershipLabel[request.collateral?.details?.ownership_status] || '—'],
                  ['Sertifikat', request.collateral?.details?.certificate_number || '—'],
                  ['Alamat', request.collateral?.details?.address || '—'],
                  ['Luas', request.collateral?.details?.area_m2 ? `${request.collateral.details.area_m2} m²` : '—'],
                ].filter(([, v]) => v !== '—' || ['Jenis', 'Atas nama', 'Status'].includes(String([0]))).map(([k, v]) => (
                  <div className="data-row" key={k}>
                    <span className="data-key">{k}</span>
                    <span className="data-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision */}
            <div>
              <div className="action-label">Keputusan lawyer</div>

              {isDecided ? (
                <div className={`decision-banner ${request.status === 'approved' ? 'decision-approved' : 'decision-rejected'}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    {request.status === 'approved'
                      ? <path d="M2 8l4.5 4.5L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    }
                  </svg>
                  {request.status === 'approved' ? 'Disetujui oleh lawyer' : 'Ditolak oleh lawyer'}
                </div>
              ) : (
                <div className="action-section">
                  {showNoteArea && (
                    <textarea className="note-area"
                      placeholder="Catatan untuk kantor cabang atau notaris…"
                      value={note}
                      onChange={e => setNote(e.target.value)} />
                  )}
                  <button className="action-approve" onClick={() => doAction('approved')} disabled={acting}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Setujui permintaan
                  </button>
                  <button className="action-reject" onClick={() => doAction('rejected')} disabled={acting}>
                    Tolak permintaan
                  </button>
                  <button className="action-note" onClick={() => setShowNoteArea(s => !s)}>
                    {showNoteArea ? 'Sembunyikan catatan' : '+ Tambah catatan'}
                  </button>
                </div>
              )}

              {request.lawyer_note && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(232,230,224,0.2)', marginBottom: 6 }}>Catatan</div>
                  <div style={{ fontSize: 12, fontWeight: 300, color: 'rgba(232,230,224,0.4)', lineHeight: 1.6 }}>{request.lawyer_note}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0c0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(232,230,224,0.2)', fontFamily: 'sans-serif' }}>Memuat…</div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
