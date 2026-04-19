'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams, useRouter } from 'next/navigation';
import { NotificationBell, StatusToastContainer } from '@/lib/notification-system';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.st-root { min-height: 100vh; background: #f5f3ef; font-family: 'DM Sans', sans-serif; color: #1a1a1a; }

.st-nav {
  background: #0c0d0f; border-bottom: 1px solid rgba(192,160,98,0.2);
  padding: 0 40px; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
}
.nav-brand { display: flex; align-items: center; gap: 12px; }
.nav-sigil { width: 30px; height: 30px; border: 1px solid rgba(192,160,98,0.45); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 14px; color: #c0a062; }
.nav-name { font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(232,230,224,0.7); }
.nav-back { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(232,230,224,0.35); background: none; border: none; cursor: pointer; font-family: inherit; transition: color 0.2s; }
.nav-back:hover { color: rgba(232,230,224,0.65); }

.st-body { max-width: 820px; margin: 0 auto; padding: 48px 40px 80px; }

/* Pipeline progress bar */
.pipeline-bar {
  display: flex; align-items: center; margin-bottom: 40px;
  background: white; border: 1px solid rgba(26,26,26,0.08);
  border-radius: 4px; overflow: hidden;
}
.pipe-step {
  flex: 1; padding: 12px 10px; text-align: center;
  border-right: 1px solid rgba(26,26,26,0.06);
  position: relative;
}
.pipe-step:last-child { border-right: none; }
.pipe-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(26,26,26,0.35); }
.pipe-step.done .pipe-label { color: #1a6e30; }
.pipe-step.active .pipe-label { color: #8a6e3a; font-weight: 500; }
.pipe-step.error .pipe-label { color: #a03020; }
.pipe-indicator {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(26,26,26,0.15); margin: 0 auto 5px;
}
.pipe-step.done .pipe-indicator { background: #1a6e30; }
.pipe-step.active .pipe-indicator { background: #c0a062; animation: pulse 1.2s ease-in-out infinite; }
.pipe-step.error .pipe-indicator { background: #a03020; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }

/* Page header */
.page-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(26,26,26,0.1); display: flex; align-items: flex-end; justify-content: space-between; }
.page-eyebrow { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c0a062; margin-bottom: 8px; }
.page-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 400; color: #1a1a1a; line-height: 1.2; margin-bottom: 5px; }
.req-no { font-size: 11px; color: rgba(26,26,26,0.3); letter-spacing: 0.06em; }

/* Status badge */
.status-badge { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 2px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
.sb-pending   { background: rgba(192,160,98,0.1); color: #8a6e3a; border: 1px solid rgba(192,160,98,0.25); }
.sb-check     { background: rgba(26,26,26,0.05); color: rgba(26,26,26,0.5); border: 1px solid rgba(26,26,26,0.1); }
.sb-analysis  { background: rgba(192,160,98,0.08); color: #8a6e3a; border: 1px solid rgba(192,160,98,0.2); }
.sb-review    { background: rgba(26,100,200,0.06); color: #185FA5; border: 1px solid rgba(26,100,200,0.15); }
.sb-approved  { background: rgba(40,160,80,0.07); color: #1a6e30; border: 1px solid rgba(40,160,80,0.18); }
.sb-rejected  { background: rgba(220,80,60,0.07); color: #a03020; border: 1px solid rgba(220,80,60,0.18); }
.sb-incomplete{ background: rgba(220,80,60,0.06); color: #a03020; border: 1px solid rgba(220,80,60,0.15); }
.sb-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

/* Info grid */
.info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: rgba(26,26,26,0.08); border-radius: 4px; overflow: hidden; margin-bottom: 20px; border: 1px solid rgba(26,26,26,0.08); }
.info-cell { background: white; padding: 16px 18px; }
.info-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(26,26,26,0.35); margin-bottom: 5px; }
.info-value { font-size: 14px; font-weight: 400; color: #1a1a1a; }
.info-value.serif { font-family: 'Playfair Display', serif; }

/* Content card */
.content-card { background: white; border: 1px solid rgba(26,26,26,0.08); border-radius: 4px; margin-bottom: 16px; overflow: hidden; }
.card-head { padding: 16px 20px; border-bottom: 1px solid rgba(26,26,26,0.07); display: flex; align-items: center; justify-content: space-between; }
.card-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 400; color: #1a1a1a; display: flex; align-items: center; gap: 10px; }
.card-icon { width: 26px; height: 26px; background: rgba(192,160,98,0.08); border: 1px solid rgba(192,160,98,0.2); border-radius: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-body { padding: 20px; }

/* Processing */
.processing-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
.proc-spinner { width: 32px; height: 32px; border: 1.5px solid rgba(192,160,98,0.2); border-top-color: #c0a062; border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.proc-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 400; color: #1a1a1a; margin-bottom: 6px; }
.proc-desc { font-size: 13px; font-weight: 300; color: rgba(26,26,26,0.45); line-height: 1.6; max-width: 400px; }
.proc-stage-label { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #c0a062; margin-bottom: 12px; }

/* Intelligence findings */
.correlation-list { display: flex; flex-direction: column; gap: 10px; }
.correlation-item { border-radius: 3px; border-left: 3px solid; padding: 12px 14px; }
.corr-kritis   { background: rgba(220,80,60,0.04); border-color: rgba(220,80,60,0.5); }
.corr-penting  { background: rgba(192,160,98,0.05); border-color: rgba(192,160,98,0.5); }
.corr-informatif { background: rgba(26,26,26,0.03); border-color: rgba(26,26,26,0.15); }
.corr-badge { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; padding: 2px 7px; border-radius: 2px; margin-bottom: 6px; display: inline-block; }
.corr-kritis   .corr-badge { background: rgba(220,80,60,0.1); color: #a03020; }
.corr-penting  .corr-badge { background: rgba(192,160,98,0.12); color: #8a6e3a; }
.corr-informatif .corr-badge { background: rgba(26,26,26,0.06); color: rgba(26,26,26,0.45); }
.corr-fields { font-size: 10px; color: rgba(26,26,26,0.35); margin-bottom: 5px; letter-spacing: 0.04em; }
.corr-finding { font-size: 13px; color: rgba(26,26,26,0.7); line-height: 1.55; margin-bottom: 6px; }
.corr-basis { font-size: 11px; color: rgba(26,26,26,0.35); font-style: italic; }

/* Questions for branch */
.questions-list { display: flex; flex-direction: column; gap: 10px; }
.question-item { background: #faf9f7; border: 1px solid rgba(26,26,26,0.08); border-radius: 3px; padding: 14px 16px; }
.q-priority { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; margin-bottom: 5px; }
.q-kritis .q-priority { color: #a03020; }
.q-penting .q-priority { color: #8a6e3a; }
.q-konfirmasi .q-priority { color: rgba(26,26,26,0.4); }
.q-text { font-size: 13px; font-weight: 400; color: #1a1a1a; margin-bottom: 4px; line-height: 1.5; }
.q-why { font-size: 11px; color: rgba(26,26,26,0.4); line-height: 1.4; }

/* Docs to request */
.docs-list { display: flex; flex-direction: column; gap: 8px; }
.doc-item { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; background: #faf9f7; border: 1px solid rgba(26,26,26,0.07); border-radius: 3px; }
.doc-urgency { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; font-weight: 500; flex-shrink: 0; margin-top: 1px; white-space: nowrap; }
.urg-wajib_sebelum_analisa { background: rgba(220,80,60,0.08); color: #a03020; }
.urg-wajib_sebelum_akad { background: rgba(192,160,98,0.1); color: #8a6e3a; }
.urg-wajib_sebelum_pencairan { background: rgba(26,26,26,0.06); color: rgba(26,26,26,0.5); }
.urg-pendukung { background: rgba(26,26,26,0.04); color: rgba(26,26,26,0.35); }
.doc-content { flex: 1; }
.doc-name { font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 2px; }
.doc-reason { font-size: 11px; color: rgba(26,26,26,0.45); line-height: 1.4; }
.doc-from { font-size: 10px; color: rgba(26,26,26,0.3); margin-top: 3px; }

/* Risk hero */
.risk-hero { border-radius: 4px; padding: 20px 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
.rh-rendah { background: rgba(40,160,80,0.06); border: 1px solid rgba(40,160,80,0.18); }
.rh-sedang  { background: rgba(192,160,98,0.08); border: 1px solid rgba(192,160,98,0.25); }
.rh-tinggi  { background: rgba(220,80,60,0.06); border: 1px solid rgba(220,80,60,0.18); }
.rh-eyebrow { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px; }
.rh-rendah .rh-eyebrow { color: #1a6e30; } .rh-sedang .rh-eyebrow { color: #8a6e3a; } .rh-tinggi .rh-eyebrow { color: #a03020; }
.rh-level { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; margin-bottom: 4px; }
.rh-rendah .rh-level { color: #1a4a28; } .rh-sedang .rh-level { color: #5a4020; } .rh-tinggi .rh-level { color: #7a2018; }
.rh-summary { font-size: 12px; font-weight: 300; line-height: 1.55; }
.rh-rendah .rh-summary { color: rgba(26,74,40,0.7); } .rh-sedang .rh-summary { color: rgba(90,64,32,0.7); } .rh-tinggi .rh-summary { color: rgba(122,32,24,0.7); }
.rh-score { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; flex-shrink: 0; }
.rh-rendah .rh-score { background: rgba(40,160,80,0.1); border: 1.5px solid rgba(40,160,80,0.25); }
.rh-sedang .rh-score  { background: rgba(192,160,98,0.12); border: 1.5px solid rgba(192,160,98,0.3); }
.rh-tinggi .rh-score  { background: rgba(220,80,60,0.1); border: 1.5px solid rgba(220,80,60,0.25); }
.rh-score-num { font-family: 'Playfair Display', serif; font-size: 18px; line-height: 1; }
.rh-rendah .rh-score-num { color: #1a6e30; } .rh-sedang .rh-score-num { color: #8a6e3a; } .rh-tinggi .rh-score-num { color: #a03020; }
.rh-score-lbl { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; color: rgba(26,26,26,0.3); }

/* Issues */
.issues-list { display: flex; flex-direction: column; gap: 10px; }
.issue-item { border-left: 3px solid; border-radius: 0 3px 3px 0; padding: 12px 14px; }
.issue-tinggi { background: rgba(220,80,60,0.04); border-color: rgba(220,80,60,0.45); }
.issue-sedang { background: rgba(192,160,98,0.05); border-color: rgba(192,160,98,0.45); }
.issue-rendah { background: rgba(26,26,26,0.03); border-color: rgba(26,26,26,0.15); }
.issue-badge { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; padding: 2px 7px; border-radius: 2px; margin-bottom: 5px; display: inline-block; }
.issue-tinggi .issue-badge { background: rgba(220,80,60,0.1); color: #a03020; }
.issue-sedang .issue-badge { background: rgba(192,160,98,0.12); color: #8a6e3a; }
.issue-rendah .issue-badge { background: rgba(26,26,26,0.06); color: rgba(26,26,26,0.4); }
.issue-text { font-size: 13px; color: rgba(26,26,26,0.7); line-height: 1.55; margin-bottom: 6px; }
.issue-solution { font-size: 12px; color: rgba(26,26,26,0.45); padding: 7px 10px; background: rgba(26,26,26,0.03); border-radius: 2px; border-left: 2px solid rgba(192,160,98,0.25); line-height: 1.5; }
.issue-sol-lbl { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(192,160,98,0.6); margin-bottom: 3px; }

/* Clauses */
.clause-item { background: #faf9f7; border-left: 2px solid rgba(192,160,98,0.4); padding: 12px 14px; border-radius: 0 2px 2px 0; margin-bottom: 8px; display: flex; gap: 10px; align-items: flex-start; }
.clause-num { font-size: 10px; color: rgba(192,160,98,0.5); flex-shrink: 0; margin-top: 2px; width: 18px; font-weight: 500; }
.clause-text { font-size: 12px; color: rgba(26,26,26,0.6); line-height: 1.7; font-style: italic; flex: 1; }
.copy-btn { background: none; border: none; cursor: pointer; color: rgba(26,26,26,0.25); padding: 0; flex-shrink: 0; transition: color 0.15s; }
.copy-btn:hover { color: #c0a062; }

/* Compliance row */
.compliance-row { padding: 10px 14px; border-radius: 3px; background: #faf9f7; border: 1px solid rgba(26,26,26,0.07); margin-bottom: 8px; }
.comp-org { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(192,160,98,0.6); margin-bottom: 4px; }
.comp-status { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.comp-pill { font-size: 10px; padding: 2px 8px; border-radius: 2px; font-weight: 500; }
.pill-compliant { background: rgba(40,160,80,0.08); color: #1a6e30; }
.pill-non_compliant { background: rgba(220,80,60,0.08); color: #a03020; }
.pill-needs_clarification { background: rgba(192,160,98,0.1); color: #8a6e3a; }
.comp-findings { font-size: 12px; color: rgba(26,26,26,0.5); line-height: 1.6; }

/* Incomplete / info-requested state */
.alert-incomplete {
  background: rgba(220,80,60,0.05); border: 1px solid rgba(220,80,60,0.2);
  border-radius: 4px; padding: 20px 22px; margin-bottom: 20px;
}
.alert-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #7a2018; margin-bottom: 6px; }
.alert-desc { font-size: 13px; color: rgba(122,32,24,0.7); line-height: 1.6; margin-bottom: 0; }
.readiness-bar-wrap { margin: 16px 0 0; }
.readiness-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(26,26,26,0.35); margin-bottom: 6px; display: flex; justify-content: space-between; }
.readiness-bar { height: 4px; background: rgba(26,26,26,0.08); border-radius: 2px; overflow: hidden; }
.readiness-fill { height: 100%; border-radius: 2px; background: #c0a062; transition: width 0.5s ease; }

@media (max-width: 640px) {
  .st-body { padding: 24px 16px 60px; }
  .info-grid { grid-template-columns: 1fr 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .pipeline-bar { display: none; }
}
`;

// ── Stage pipeline config ────────────────────────────────────
const PIPELINE_STAGES = [
  { key: 'data_incomplete',    label: 'Data', short: 'Data' },
  { key: 'data_intelligence',  label: 'Korelasi', short: 'Korelasi' },
  { key: 'compliance_check',   label: 'Compliance', short: 'OJK/DSN' },
  { key: 'under_analysis',     label: 'Analisa', short: 'Risiko' },
  { key: 'under_review',       label: 'Review', short: 'Lawyer' },
  { key: 'approved',           label: 'Selesai', short: 'Selesai' },
];

const STAGE_ORDER = ['data_intelligence', 'compliance_check', 'under_analysis', 'under_review', 'approved', 'draft_ready'];

function getStageState(status: string, stageKey: string) {
  if (status === 'data_incomplete' && stageKey === 'data_incomplete') return 'error';
  if (status === 'info_requested' && stageKey === 'under_review') return 'active';
  const currentIdx = STAGE_ORDER.indexOf(status);
  const stageIdx = STAGE_ORDER.indexOf(stageKey);
  if (stageIdx < 0) {
    if (stageKey === 'data_incomplete') return currentIdx >= 0 ? 'done' : 'active';
    return 'pending';
  }
  if (stageIdx < currentIdx) return 'done';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  data_incomplete:   { label: 'Data tidak lengkap', cls: 'sb-incomplete' },
  data_intelligence: { label: 'Verifikasi kesesuaian akad', cls: 'sb-check' },
  compliance_check:  { label: 'Cek regulasi', cls: 'sb-check' },
  under_analysis:    { label: 'Analisa AI berjalan', cls: 'sb-analysis' },
  analysis_failed:   { label: 'Analisa gagal', cls: 'sb-incomplete' },
  under_review:      { label: 'Menunggu review lawyer', cls: 'sb-review' },
  info_requested:    { label: 'Info tambahan diperlukan', cls: 'sb-pending' },
  approved:          { label: 'Disetujui', cls: 'sb-approved' },
  rejected:          { label: 'Ditolak', cls: 'sb-rejected' },
  draft_ready:       { label: 'Draft kontrak siap', cls: 'sb-approved' },
};

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [req, setReq] = useState<any>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [answerSent, setAnswerSent] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const submitAnswers = async () => {
    const infoReqs: any[] = req?.info_requests || [];
    const latest = infoReqs[infoReqs.length - 1];
    if (!latest) return;
    const qs: string[] = latest.questions || [];
    if (!answers.some(a => a.trim())) { showToast('Isi minimal satu jawaban'); return; }
    setSubmittingAnswers(true);
    try {
      const res = await fetch('/api/answer-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id, answers, questions: qs }),
      });
      if (res.ok) {
        setAnswerSent(true);
        setReq((r: any) => ({ ...r, status: 'under_review' }));
        showToast('Jawaban terkirim ke lawyer');
      } else { showToast('Gagal mengirim. Coba lagi.'); }
    } catch { showToast('Error. Coba lagi.'); }
    setSubmittingAnswers(false);
  };

  useEffect(() => {
    if (!id) return;
    let interval: any;

    const load = async () => {
      const { data } = await supabase
        .from('contract_requests').select('*').eq('id', id).single();
      if (data) {
        setReq(data);
        const done = ['under_review', 'info_requested', 'approved', 'rejected', 'draft_ready', 'data_incomplete', 'analysis_failed'];
        if (done.includes(data.status)) clearInterval(interval);
      }
    };

    load();
    interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const copyClause = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!req) return (
    <>
      <style>{STYLES}</style>
      <div className="st-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: '1.5px solid rgba(192,160,98,0.3)', borderTopColor: '#c0a062', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 13, color: 'rgba(26,26,26,0.35)', fontFamily: 'sans-serif' }}>Memuat…</div>
        </div>
      </div>
    </>
  );

  const status = req.status;
  const v = req.collateral_validation_result || {};
  const intel = req.data_intelligence_result || {};
  const rl = (v.risk_level || '').toLowerCase();
  const rhClass = rl === 'tinggi' || rl === 'high' ? 'rh-tinggi' : rl === 'sedang' || rl === 'medium' ? 'rh-sedang' : 'rh-rendah';
  const statusInfo = STATUS_MAP[status] || { label: status, cls: 'sb-check' };

  const isProcessing = ['data_intelligence', 'compliance_check', 'under_analysis'].includes(status);
  const isIncomplete = status === 'data_incomplete';
  const hasAnalysis = !!v.risk_level;

  const jaminanLabel: Record<string, string> = { tanah_shm: 'Tanah SHM', tanah_shgb: 'Tanah SHGB', bangunan: 'Bangunan', kendaraan_roda4: 'Kendaraan' };
  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const PROC_MESSAGES: Record<string, { stage: string; title: string; desc: string }> = {
    data_intelligence: { stage: 'Stage 1b', title: 'Membaca korelasi data', desc: 'AI sedang menarik hubungan antar data — identitas, kepemilikan, jaminan, dan konteks tersembunyi.' },
    compliance_check:  { stage: 'Stage 2', title: 'Memeriksa kepatuhan regulasi', desc: 'Memverifikasi setiap ketentuan OJK, fatwa DSN-MUI, dan regulasi jaminan yang berlaku.' },
    under_analysis:    { stage: 'Stage 3', title: 'Menganalisa risiko hukum', desc: 'AI menyusun penilaian risiko, solusi per isu, klausul pengamanan, dan dokumen yang diperlukan.' },
  };

  // Intelligence findings
  const correlations: any[] = intel.correlations_found || [];
  const critCorr = correlations.filter((c: any) => c.severity === 'kritis');
  const questions: any[] = intel.questions_for_branch || [];
  const docsToRequest: any[] = intel.documents_to_request || [];
  const inferences: any[] = intel.inferences || [];

  // Analysis findings
  const issues: any[] = v.issues || [];
  const clauses: string[] = v.suggested_clauses || [];
  const docsRequired: any[] = v.documents_required || [];
  const compliance = v.compliance || {};

  return (
    <>
      <style>{STYLES}</style>
      <div className="st-root">
        <nav className="st-nav">
          <div className="nav-brand">
            <div className="nav-sigil">E</div>
            <span className="nav-name">Erlangga SCC</span>
          </div>
          <button className="nav-back" onClick={() => router.push('/branch')}>← Permintaan baru</button>
        </nav>

        <div className="st-body">
          {/* Pipeline progress */}
          <div className="pipeline-bar">
            {PIPELINE_STAGES.map((s) => {
              const state = getStageState(status, s.key);
              return (
                <div key={s.key} className={`pipe-step ${state}`}>
                  <div className="pipe-indicator" />
                  <div className="pipe-label">{s.short}</div>
                </div>
              );
            })}
          </div>

          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Status Permintaan</div>
              <div className="page-title">{req.customer_name}</div>
              <div className="req-no">{req.request_number || id?.slice(0, 8).toUpperCase()}</div>
            </div>
            <div className={`status-badge ${statusInfo.cls}`}>
              <div className="sb-dot" />
              {statusInfo.label}
            </div>
          </div>

          {/* Info grid */}
          <div className="info-grid">
            <div className="info-cell">
              <div className="info-label">Nilai pembiayaan</div>
              <div className="info-value serif">{formatRp(req.financing_amount)}</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Tenor · Margin</div>
              <div className="info-value">{req.tenor_months} bln · {req.margin_percent}%</div>
            </div>
            <div className="info-cell">
              <div className="info-label">Jaminan</div>
              <div className="info-value">{jaminanLabel[req.collateral?.type] || req.collateral?.type}</div>
            </div>
          </div>

          {/* ── DATA INCOMPLETE ── */}
          {isIncomplete && (
            <>
              {intel.empty_fields?.length > 0 && (
                <div className="alert-incomplete">
                  <div className="alert-title">Field wajib belum diisi</div>
                  <div className="alert-desc">
                    Permintaan tidak dapat diproses karena field berikut kosong: <strong>{intel.empty_fields.join(', ')}</strong>. Hubungi petugas untuk melengkapi.
                  </div>
                </div>
              )}

              {(intel.readiness_score !== undefined) && (
                <div className="alert-incomplete">
                  <div className="alert-title">Data belum siap untuk analisa</div>
                  <div className="alert-desc">AI mendeteksi inkonsistensi atau informasi yang kurang untuk memastikan analisa hukum yang akurat.</div>
                  <div className="readiness-bar-wrap">
                    <div className="readiness-label">
                      <span>Kesiapan data</span>
                      <span>{intel.readiness_score}/100</span>
                    </div>
                    <div className="readiness-bar">
                      <div className="readiness-fill" style={{ width: `${intel.readiness_score}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {critCorr.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">
                      <div className="card-icon">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M6.5 1L1 11h11L6.5 1z" stroke="#8a6e3a" strokeWidth="1.1" strokeLinejoin="round"/>
                          <path d="M6.5 5v3M6.5 9.5v.5" stroke="#8a6e3a" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      Inkonsistensi yang ditemukan AI
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(26,26,26,0.35)' }}>{critCorr.length} kritis</span>
                  </div>
                  <div className="card-body">
                    <div className="correlation-list">
                      {critCorr.map((c: any, i: number) => (
                        <div key={i} className="correlation-item corr-kritis">
                          <div className="corr-badge">Kritis</div>
                          {c.fields_involved?.length > 0 && (
                            <div className="corr-fields">{c.fields_involved.join(' × ')}</div>
                          )}
                          <div className="corr-finding">{c.finding}</div>
                          {c.legal_basis && <div className="corr-basis">{c.legal_basis}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {questions.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">
                      <div className="card-icon">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="5.5" stroke="#8a6e3a" strokeWidth="1.1"/>
                          <path d="M6.5 4.5c0-1 1.5-1 1.5 0 0 .8-.8 1-1.5 1.5V7" stroke="#8a6e3a" strokeWidth="1.1" strokeLinecap="round"/>
                          <circle cx="6.5" cy="9" r=".5" fill="#8a6e3a"/>
                        </svg>
                      </div>
                      Pertanyaan klarifikasi untuk cabang
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="questions-list">
                      {questions.map((q: any, i: number) => {
                        const pCls = q.priority === 'kritis' ? 'q-kritis' : q.priority === 'penting' ? 'q-penting' : 'q-konfirmasi';
                        return (
                          <div key={i} className={`question-item ${pCls}`}>
                            <div className="q-priority">{q.priority}</div>
                            <div className="q-text">{q.question}</div>
                            {q.why_needed && <div className="q-why">{q.why_needed}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── FORM JAWABAN LAWYER — muncul saat status info_requested ── */}
              {req.status === 'info_requested' && !answerSent && (() => {
                const infoReqs: any[] = req.info_requests || [];
                const latest = infoReqs[infoReqs.length - 1];
                const qs: string[] = latest?.questions || [];
                if (qs.length === 0) return null;
                // Init answers array jika belum
                if (answers.length !== qs.length) {
                  setAnswers(Array(qs.length).fill(''));
                }
                return (
                  <div className="content-card" style={{ border: '1px solid rgba(192,160,98,.3)', background: 'rgba(192,160,98,.04)' }}>
                    <div className="card-head">
                      <div className="card-title" style={{ color: '#c0a062' }}>
                        Jawab pertanyaan lawyer
                      </div>
                    </div>
                    <div className="card-body">
                      <div style={{ fontSize: 12, color: 'rgba(232,230,224,.35)', marginBottom: 16, lineHeight: 1.6 }}>
                        Lawyer membutuhkan informasi tambahan sebelum dapat melanjutkan analisa. Jawab pertanyaan di bawah seakurat mungkin.
                      </div>
                      {qs.map((q: string, i: number) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(232,230,224,.7)', marginBottom: 6, display: 'flex', gap: 8 }}>
                            <span style={{ color: '#c0a062', flexShrink: 0 }}>{i + 1}.</span>
                            {q}
                          </div>
                          <textarea
                            value={answers[i] || ''}
                            onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                            placeholder="Jawaban Anda…"
                            rows={3}
                            style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 3, padding: '9px 11px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 300, color: '#e8e6e0', resize: 'vertical', outline: 'none', lineHeight: 1.6, minHeight: 72 }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={submitAnswers}
                        disabled={submittingAnswers}
                        style={{ width: '100%', padding: '12px', background: '#c0a062', border: 'none', borderRadius: 3, fontFamily: 'DM Sans, sans-serif', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#0c0d0f', fontWeight: 500, cursor: submittingAnswers ? 'not-allowed' : 'pointer', opacity: submittingAnswers ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {submittingAnswers
                          ? <><span style={{ width: 12, height: 12, border: '1.5px solid rgba(12,13,15,.3)', borderTopColor: '#0c0d0f', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Mengirim…</>
                          : 'Kirim jawaban ke lawyer'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {answerSent && (
                <div style={{ background: 'rgba(106,191,128,.07)', border: '1px solid rgba(106,191,128,.2)', borderRadius: 3, padding: '14px 16px', fontSize: 13, color: '#6abf80', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5l4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Jawaban terkirim. Lawyer sedang meninjau kembali.
                </div>
              )}

              {docsToRequest.filter((d: any) => d.urgency === 'wajib_sebelum_analisa').length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">Dokumen yang harus dilengkapi</div>
                  </div>
                  <div className="card-body">
                    <div className="docs-list">
                      {docsToRequest.filter((d: any) => d.urgency === 'wajib_sebelum_analisa').map((doc: any, i: number) => (
                        <div key={i} className="doc-item">
                          <span className={`doc-urgency urg-${doc.urgency}`}>Wajib</span>
                          <div className="doc-content">
                            <div className="doc-name">{doc.document}</div>
                            <div className="doc-reason">{doc.reason}</div>
                            {doc.from_whom && <div className="doc-from">Dari: {doc.from_whom}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PROCESSING ── */}
          {isProcessing && (
            <div className="content-card">
              <div className="card-body">
                <div className="processing-state">
                  <div className="proc-stage-label">{PROC_MESSAGES[status]?.stage}</div>
                  <div className="proc-spinner" />
                  <div className="proc-title">{PROC_MESSAGES[status]?.title}</div>
                  <div className="proc-desc">{PROC_MESSAGES[status]?.desc}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTELLIGENCE SUMMARY (setelah data siap, sebelum/sesudah analisa) ── */}
          {!isIncomplete && !isProcessing && correlations.length > 0 && (
            <div className="content-card">
              <div className="card-head">
                <div className="card-title">
                  <div className="card-icon">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="3" cy="3" r="1.5" stroke="#8a6e3a" strokeWidth="1"/>
                      <circle cx="10" cy="3" r="1.5" stroke="#8a6e3a" strokeWidth="1"/>
                      <circle cx="3" cy="10" r="1.5" stroke="#8a6e3a" strokeWidth="1"/>
                      <circle cx="10" cy="10" r="1.5" stroke="#8a6e3a" strokeWidth="1"/>
                      <path d="M4.5 3h4M3 4.5v4M10 4.5v4M4.5 10h4" stroke="#8a6e3a" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  Temuan korelasi data
                </div>
                <span style={{ fontSize: 11, color: 'rgba(26,26,26,0.35)' }}>
                  {critCorr.length} kritis · {correlations.filter((c: any) => c.severity === 'penting').length} penting
                </span>
              </div>
              <div className="card-body">
                <div className="correlation-list">
                  {correlations.slice(0, 5).map((c: any, i: number) => {
                    const cls = c.severity === 'kritis' ? 'corr-kritis' : c.severity === 'penting' ? 'corr-penting' : 'corr-informatif';
                    return (
                      <div key={i} className={`correlation-item ${cls}`}>
                        <div className="corr-badge">{c.severity}</div>
                        {c.fields_involved?.length > 0 && <div className="corr-fields">{c.fields_involved.join(' × ')}</div>}
                        <div className="corr-finding">{c.finding}</div>
                        {c.legal_basis && <div className="corr-basis">{c.legal_basis}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── FULL ANALYSIS ── */}
          {hasAnalysis && (
            <>
              {/* Risk hero */}
              <div className={`risk-hero ${rhClass}`}>
                <div>
                  <div className="rh-eyebrow">Tingkat risiko hukum</div>
                  <div className="rh-level">{v.risk_level}</div>
                  <div className="rh-summary">{v.summary}</div>
                </div>
                <div className="rh-score">
                  <div className="rh-score-num">{v.risk_score ?? '—'}</div>
                  <div className="rh-score-lbl">Skor</div>
                </div>
              </div>

              {/* Compliance */}
              {(compliance.ojk_status || compliance.dsn_mui_status) && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">Kepatuhan regulasi</div>
                  </div>
                  <div className="card-body">
                    {compliance.ojk_status && (
                      <div className="compliance-row">
                        <div className="comp-org">OJK</div>
                        <div className="comp-status">
                          <span className={`comp-pill pill-${compliance.ojk_status}`}>{compliance.ojk_status.replace('_', ' ')}</span>
                        </div>
                        {compliance.ojk_findings?.length > 0 && (
                          <div className="comp-findings">{compliance.ojk_findings.join(' · ')}</div>
                        )}
                      </div>
                    )}
                    {compliance.dsn_mui_status && (
                      <div className="compliance-row">
                        <div className="comp-org">DSN-MUI</div>
                        <div className="comp-status">
                          <span className={`comp-pill pill-${compliance.dsn_mui_status}`}>{compliance.dsn_mui_status.replace('_', ' ')}</span>
                        </div>
                        {compliance.dsn_mui_findings?.length > 0 && (
                          <div className="comp-findings">{compliance.dsn_mui_findings.join(' · ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {v.recommendation && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">Rekomendasi AI</div>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.75, color: 'rgba(26,26,26,0.7)', whiteSpace: 'pre-wrap' }}>
                      {v.recommendation}
                    </div>
                  </div>
                </div>
              )}

              {/* Issues */}
              {issues.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">Temuan risiko ({issues.length})</div>
                  </div>
                  <div className="card-body">
                    <div className="issues-list">
                      {issues.map((iss: any, i: number) => {
                        const lvl = (iss.level || 'rendah').toLowerCase();
                        const cls = lvl === 'tinggi' || lvl === 'high' ? 'issue-tinggi' : lvl === 'sedang' || lvl === 'medium' ? 'issue-sedang' : 'issue-rendah';
                        const lbl = lvl === 'tinggi' || lvl === 'high' ? 'Risiko tinggi' : lvl === 'sedang' || lvl === 'medium' ? 'Perhatian' : 'Catatan';
                        return (
                          <div key={i} className={`issue-item ${cls}`}>
                            <div className="issue-badge">{lbl}</div>
                            <div className="issue-text">{typeof iss === 'string' ? iss : iss.text || iss.message || ''}</div>
                            {iss.solution && (
                              <div className="issue-solution">
                                <div className="issue-sol-lbl">Solusi</div>
                                {iss.solution}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Clauses */}
              {clauses.length > 0 && (
                <div className="content-card">
                  <div className="card-head">
                    <div className="card-title">Klausul pengamanan yang disarankan</div>
                  </div>
                  <div className="card-body">
                    {clauses.map((cl: string, i: number) => (
                      <div key={i} className="clause-item">
                        <span className="clause-num">{String(i + 1).padStart(2, '0')}</span>
                        <div className="clause-text">{cl}</div>
                        <button className="copy-btn" onClick={() => copyClause(cl, i)}>
                          {copied === i
                            ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#1a6e30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="1" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/><path d="M2 4v7a1.5 1.5 0 001.5 1.5H8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── APPROVED / REJECTED ── */}
          {(status === 'approved' || status === 'rejected') && (
            <div className={`content-card`} style={{ border: `1px solid ${status === 'approved' ? 'rgba(40,160,80,0.2)' : 'rgba(220,80,60,0.2)'}` }}>
              <div className="card-body" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: status === 'approved' ? '#1a6e30' : '#a03020', marginBottom: 6, fontWeight: 500 }}>
                  {status === 'approved' ? 'Permintaan disetujui oleh lawyer' : 'Permintaan ditolak oleh lawyer'}
                </div>
                {req.lawyer_note && (
                  <div style={{ fontSize: 12, color: 'rgba(26,26,26,0.5)', marginTop: 8, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{req.lawyer_note}"
                  </div>
                )}
              </div>
            </div>
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
        <div style={{ fontSize: 13, color: 'rgba(26,26,26,0.3)', fontFamily: 'sans-serif' }}>Memuat…</div>
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
