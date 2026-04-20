'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';

const S = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.rv{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0}
.rv-nav{height:56px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;padding:0 40px;position:sticky;top:0;z-index:100;background:#0c0d0f}
.nav-left{display:flex;align-items:center;gap:14px}
.nav-sigil{width:30px;height:30px;border:1px solid rgba(192,160,98,0.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;color:#c0a062}
.nav-back{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,0.3);background:none;border:none;cursor:pointer;font-family:inherit;transition:color .2s;padding:0}
.nav-back:hover{color:rgba(232,230,224,.6)}
.nav-sep{color:rgba(255,255,255,.1);font-size:14px}
.nav-id{font-size:12px;color:rgba(232,230,224,.45);font-family:'DM Mono',monospace}
.nav-status{font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:2px}
.ns-review{background:rgba(26,100,200,.08);color:#378ADD;border:1px solid rgba(26,100,200,.2)}
.ns-approved{background:rgba(106,191,128,.08);color:#6abf80;border:1px solid rgba(106,191,128,.18)}
.ns-rejected{background:rgba(232,112,90,.08);color:#e8705a;border:1px solid rgba(232,112,90,.18)}
.ns-pending{background:rgba(192,160,98,.08);color:#c0a062;border:1px solid rgba(192,160,98,.2)}
.rv-body{display:grid;grid-template-columns:1fr 320px;gap:1px;min-height:calc(100vh - 56px);background:rgba(255,255,255,.04)}
.rv-left{background:#0c0d0f;padding:32px 36px 60px;overflow-y:auto}
.rv-right{background:#0e0f11;padding:24px 20px;display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.case-eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:10px}
.case-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:400;color:#e8e6e0;margin-bottom:8px;line-height:1.2}
.case-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:28px}
.meta-item{font-size:12px;color:rgba(232,230,224,.3)}
.meta-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.15)}
.tab-bar{display:flex;gap:2px;background:rgba(255,255,255,.03);border-radius:3px;padding:3px;margin-bottom:20px}
.tab-btn{flex:1;padding:8px 10px;border-radius:2px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:none;background:transparent;color:rgba(232,230,224,.35);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.tab-btn.active{background:rgba(255,255,255,.06);color:#e8e6e0}
.tab-badge{font-size:9px;background:rgba(232,112,90,.2);color:#e8705a;padding:1px 5px;border-radius:8px;margin-left:4px}
.tab-badge.ok{background:rgba(192,160,98,.15);color:#c0a062}
.sec-lbl{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:10px;display:flex;align-items:center;gap:10px}
.sec-lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}
.rv-sec{margin-bottom:22px}
.intel-item{border-radius:3px;border-left:2px solid;padding:12px 14px;margin-bottom:7px}
.ic-k{background:rgba(232,112,90,.05);border-color:rgba(232,112,90,.45)}
.ic-p{background:rgba(192,160,98,.05);border-color:rgba(192,160,98,.4)}
.ic-i{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.1)}
.intel-sev{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;padding:2px 7px;border-radius:2px;margin-bottom:6px;display:inline-block}
.ic-k .intel-sev{background:rgba(232,112,90,.12);color:#e8705a}
.ic-p .intel-sev{background:rgba(192,160,98,.12);color:#c0a062}
.ic-i .intel-sev{background:rgba(255,255,255,.06);color:rgba(232,230,224,.35)}
.intel-fields{font-size:10px;color:rgba(232,230,224,.25);margin-bottom:5px}
.intel-finding{font-size:13px;color:rgba(232,230,224,.6);line-height:1.55;margin-bottom:5px}
.intel-basis{font-size:11px;color:rgba(232,230,224,.25);font-style:italic}
.intel-clarif{margin-top:7px;padding:7px 10px;background:rgba(192,160,98,.05);border-radius:2px}
.intel-clarif-lbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:3px}
.intel-clarif-txt{font-size:12px;color:rgba(192,160,98,.55);line-height:1.5}
.infer-item{padding:10px 12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;margin-bottom:6px}
.infer-basis{font-size:10px;color:rgba(232,230,224,.25);margin-bottom:4px}
.infer-text{font-size:13px;color:rgba(232,230,224,.55);line-height:1.5;margin-bottom:4px}
.infer-action{font-size:11px;color:rgba(192,160,98,.5);display:flex;gap:5px}
.risk-hero{border-radius:3px;padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
.rh-h{background:rgba(232,112,90,.07);border:1px solid rgba(232,112,90,.2)}
.rh-m{background:rgba(192,160,98,.07);border:1px solid rgba(192,160,98,.2)}
.rh-l{background:rgba(106,191,128,.06);border:1px solid rgba(106,191,128,.15)}
.rh-ey{font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:4px}
.rh-h .rh-ey{color:rgba(232,112,90,.6)}.rh-m .rh-ey{color:rgba(192,160,98,.6)}.rh-l .rh-ey{color:rgba(106,191,128,.6)}
.rh-lv{font-family:'Playfair Display',serif;font-size:19px;margin-bottom:4px}
.rh-h .rh-lv{color:#e8705a}.rh-m .rh-lv{color:#c0a062}.rh-l .rh-lv{color:#6abf80}
.rh-sm{font-size:12px;font-weight:300;line-height:1.5}
.rh-h .rh-sm{color:rgba(232,112,90,.6)}.rh-m .rh-sm{color:rgba(192,160,98,.55)}.rh-l .rh-sm{color:rgba(106,191,128,.55)}
.rh-sc{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
.rh-h .rh-sc{background:rgba(232,112,90,.1);border:1px solid rgba(232,112,90,.25)}
.rh-m .rh-sc{background:rgba(192,160,98,.1);border:1px solid rgba(192,160,98,.25)}
.rh-l .rh-sc{background:rgba(106,191,128,.08);border:1px solid rgba(106,191,128,.2)}
.rh-sc-n{font-family:'Playfair Display',serif;font-size:17px;line-height:1}
.rh-h .rh-sc-n{color:#e8705a}.rh-m .rh-sc-n{color:#c0a062}.rh-l .rh-sc-n{color:#6abf80}
.rh-sc-l{font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-top:2px;color:rgba(232,230,224,.2)}
.rec-block{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:16px 18px}
.rec-text{font-size:13px;font-weight:300;line-height:1.8;color:rgba(232,230,224,.6);white-space:pre-wrap}
.issue-card{border-left:2px solid;border-radius:0 3px 3px 0;padding:12px 14px;margin-bottom:7px}
.ish{background:rgba(232,112,90,.05);border-color:rgba(232,112,90,.4)}
.ism{background:rgba(192,160,98,.05);border-color:rgba(192,160,98,.4)}
.isl{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.1)}
.issue-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.issue-badge{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;padding:2px 7px;border-radius:2px}
.ish .issue-badge{background:rgba(232,112,90,.12);color:#e8705a}
.ism .issue-badge{background:rgba(192,160,98,.12);color:#c0a062}
.isl .issue-badge{background:rgba(255,255,255,.06);color:rgba(232,230,224,.35)}
.issue-cat{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(232,230,224,.2)}
.issue-txt{font-size:13px;font-weight:300;line-height:1.6;color:rgba(232,230,224,.55);margin-bottom:6px}
.issue-sol{font-size:12px;font-weight:300;line-height:1.55;color:rgba(232,230,224,.35);padding:7px 10px;background:rgba(255,255,255,.03);border-radius:2px;border-left:2px solid rgba(192,160,98,.2)}
.issue-sol-lbl{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:3px}
.issue-reg{font-size:10px;color:rgba(232,230,224,.2);margin-top:4px;font-style:italic}
.clause-item{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-left:2px solid rgba(192,160,98,.25);border-radius:0 3px 3px 0;padding:11px 13px;margin-bottom:7px;display:flex;gap:10px;align-items:flex-start}
.clause-n{font-family:'DM Mono',monospace;font-size:10px;color:rgba(192,160,98,.3);flex-shrink:0;width:20px;margin-top:2px}
.clause-t{font-size:12px;font-weight:300;line-height:1.7;color:rgba(232,230,224,.45);font-style:italic;flex:1}
.copy-btn{background:none;border:none;cursor:pointer;color:rgba(232,230,224,.2);padding:0;flex-shrink:0;transition:color .15s}
.copy-btn:hover{color:rgba(192,160,98,.6)}
.comp-row{padding:10px 14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);border-radius:3px;margin-bottom:6px}
.comp-org{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:5px}
.comp-pill{font-size:10px;padding:2px 8px;border-radius:2px;font-weight:500;display:inline-block;margin-bottom:4px}
.cp-compliant{background:rgba(106,191,128,.08);color:#6abf80}
.cp-non_compliant{background:rgba(232,112,90,.1);color:#e8705a}
.cp-needs_clarification{background:rgba(192,160,98,.1);color:#c0a062}
.comp-findings{font-size:12px;font-weight:300;color:rgba(232,230,224,.4);line-height:1.6}
.ftv-block{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.ftv-label{font-size:11px;color:rgba(232,230,224,.3)}.ftv-value{font-family:'Playfair Display',serif;font-size:22px;color:#c0a062}
.ftv-basis{font-size:11px;color:rgba(232,230,224,.25);margin-top:3px;line-height:1.4}
.doc-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;margin-bottom:6px}
.doc-prio{font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:2px;flex-shrink:0;margin-top:1px;white-space:nowrap;font-weight:500}
.dp-w{background:rgba(232,112,90,.1);color:#e8705a}.dp-p{background:rgba(192,160,98,.1);color:#c0a062}.dp-k{background:rgba(255,255,255,.06);color:rgba(232,230,224,.35)}
.doc-name{font-size:13px;font-weight:400;color:rgba(232,230,224,.7);margin-bottom:2px}
.doc-reason{font-size:11px;font-weight:300;color:rgba(232,230,224,.3);line-height:1.4}
.doc-dl{font-size:10px;color:rgba(192,160,98,.4);margin-top:3px}
.info-hist-item{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;padding:10px 12px;margin-bottom:6px}
.ih-date{font-size:10px;color:rgba(232,230,224,.2);margin-bottom:6px}
.ih-q{font-size:12px;color:rgba(232,230,224,.5);margin-bottom:3px;padding-left:8px;border-left:1px solid rgba(255,255,255,.08);line-height:1.5}
.ih-a{font-size:12px;color:rgba(192,160,98,.6);margin-top:4px;padding-left:8px;border-left:1px solid rgba(192,160,98,.2);line-height:1.5}
.sidebar-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:3px;overflow:hidden}
.sc-head{padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.05);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(232,230,224,.25)}
.sc-body{padding:3px 0}
.data-row{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 13px;border-bottom:1px solid rgba(255,255,255,.03)}
.data-row:last-child{border-bottom:none}
.dk{font-size:11px;color:rgba(232,230,224,.25);font-weight:300;flex-shrink:0;margin-right:8px}
.dv{font-size:11px;color:rgba(232,230,224,.6);text-align:right;word-break:break-word}
.action-lbl{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:8px}
.btn-approve{width:100%;padding:11px;background:rgba(106,191,128,.1);border:1px solid rgba(106,191,128,.3);border-radius:3px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6abf80;cursor:pointer;font-weight:500;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:6px}
.btn-approve:hover:not(:disabled){background:rgba(106,191,128,.15)}
.btn-approve:disabled{opacity:.35;cursor:not-allowed}
.btn-draft{width:100%;padding:11px;background:rgba(192,160,98,.08);border:1px solid rgba(192,160,98,.25);border-radius:3px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#c0a062;cursor:pointer;font-weight:500;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:6px}
.btn-draft:hover:not(:disabled){background:rgba(192,160,98,.13)}
.btn-draft:disabled{opacity:.35;cursor:not-allowed}
.btn-ghost{width:100%;padding:9px;background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:3px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.3);cursor:pointer;transition:all .15s;margin-bottom:6px}
.btn-ghost:hover{border-color:rgba(255,255,255,.15);color:rgba(232,230,224,.5)}
.btn-reject{width:100%;padding:9px;background:rgba(232,112,90,.06);border:1px solid rgba(232,112,90,.18);border-radius:3px;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,112,90,.7);cursor:pointer;transition:all .15s}
.btn-reject:hover:not(:disabled){background:rgba(232,112,90,.1)}
.btn-reject:disabled{opacity:.35;cursor:not-allowed}
.note-area{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:8px 10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:#e8e6e0;resize:none;width:100%;min-height:76px;outline:none;transition:border-color .2s;line-height:1.6;margin-bottom:6px}
.note-area::placeholder{color:rgba(232,230,224,.2)}
.note-area:focus{border-color:rgba(192,160,98,.3)}
.question-input{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:8px 10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:300;color:#e8e6e0;resize:none;width:100%;min-height:68px;outline:none;transition:border-color .2s;line-height:1.6}
.question-input::placeholder{color:rgba(232,230,224,.2)}
.question-input:focus{border-color:rgba(192,160,98,.3)}
.q-wrap{position:relative;margin-bottom:6px}
.remove-q{position:absolute;top:6px;right:6px;background:none;border:none;cursor:pointer;color:rgba(232,230,224,.2);font-size:11px;transition:color .15s}
.remove-q:hover{color:#e8705a}
.add-q-btn{width:100%;padding:7px;background:transparent;border:1px dashed rgba(255,255,255,.1);border-radius:3px;font-size:11px;color:rgba(232,230,224,.25);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;margin-bottom:6px}
.add-q-btn:hover{border-color:rgba(255,255,255,.2);color:rgba(232,230,224,.45)}
.decision-banner{border-radius:3px;padding:11px 13px;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:400;margin-bottom:6px}
.db-a{background:rgba(106,191,128,.08);border:1px solid rgba(106,191,128,.2);color:#6abf80}
.db-r{background:rgba(232,112,90,.08);border:1px solid rgba(232,112,90,.2);color:#e8705a}
.draft-banner{background:rgba(192,160,98,.07);border:1px solid rgba(192,160,98,.25);border-radius:3px;padding:12px 14px;margin-bottom:6px}
.db-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:4px}
.db-title{font-family:'Playfair Display',serif;font-size:14px;color:#c0a062;margin-bottom:3px}
.db-desc{font-size:11px;color:rgba(192,160,98,.45);line-height:1.5}
.spinner{width:12px;height:12px;border:1.5px solid rgba(232,230,224,.2);border-top-color:currentColor;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:22px;right:22px;background:#1e2023;border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:9px 15px;font-size:12px;color:rgba(232,230,224,.7);z-index:200;animation:ti .2s ease}
@keyframes ti{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.rv-loading{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 56px);flex-direction:column;gap:14px}
.rv-spinner{width:28px;height:28px;border:1px solid rgba(192,160,98,.15);border-top-color:#c0a062;border-radius:50%;animation:spin .9s linear infinite}
.rv-loading-txt{font-family:'Playfair Display',serif;font-size:15px;color:rgba(232,230,224,.3)}
.empty-tab{color:rgba(232,230,224,.2);font-size:13px;padding:40px 0;text-align:center}
@media(max-width:900px){.rv-body{grid-template-columns:1fr}.rv-left{padding:20px 16px 40px}.rv-right{padding:16px}.rv-nav{padding:0 20px}}
`;

export default function ReviewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'intel' | 'analysis' | 'docs'>('intel');
  const [acting, setActing] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [note, setNote] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [copied, setCopied] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase.from('contract_requests').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setReq(data);
          if (data.collateral_validation_result?.risk_level) setTab('analysis');
          else if (data.data_intelligence_result?.correlations_found?.length) setTab('intel');
        }
        setLoading(false);
      });
  }, [id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const doAction = async (newStatus: 'approved' | 'rejected') => {
    setActing(true);
    const { error } = await supabase.from('contract_requests').update({
      status: newStatus, lawyer_note: note || null, reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (!error) { setReq((r: any) => ({ ...r, status: newStatus, lawyer_note: note })); showToast(newStatus === 'approved' ? 'Disetujui' : 'Ditolak'); }
    setActing(false);
  };

  const doDraft = async () => {
    setDrafting(true);
    const res = await fetch('/api/generate-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: id }) });
    if (res.ok) { setReq((r: any) => ({ ...r, status: 'draft_ready' })); showToast('Draft kontrak sedang digenerate…'); }
    else showToast('Gagal generate draft. Coba lagi.');
    setDrafting(false);
  };

  const sendInfo = async () => {
    const qs = questions.filter(q => q.trim());
    if (!qs.length) return;
    setActing(true);
    const res = await fetch('/api/request-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: id, questions: qs }) });
    if (res.ok) { setReq((r: any) => ({ ...r, status: 'info_requested' })); setShowInfoForm(false); setQuestions(['']); showToast('Info diminta ke cabang'); }
    setActing(false);
  };

  const copyClause = (text: string, i: number) => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 2000); };

  if (loading) return (
    <><style>{S}</style>
    <div className="rv"><div className="rv-loading"><div className="rv-spinner" /><div className="rv-loading-txt">Memuat…</div></div></div></>
  );

  if (!req) return (
    <><style>{S}</style>
    <div className="rv"><div className="rv-loading"><div className="rv-loading-txt">Tidak ditemukan</div></div></div></>
  );

  const intel = req.data_intelligence_result || {};
  const v = req.collateral_validation_result || {};
  const status = req.status;
  const isDecided = ['approved', 'rejected'].includes(status);
  const isDraft = status === 'draft_ready';

  const corrs: any[] = intel.correlations_found || [];
  const critCorrs = corrs.filter((c: any) => c.severity === 'kritis');
  const infers: any[] = intel.inferences || [];
  const docsToReq: any[] = intel.documents_to_request || [];
  const infoHist: any[] = req.info_requests || [];

  const rl = (v.risk_level || '').toLowerCase();
  const rhCls = rl === 'tinggi' || rl === 'high' ? 'rh-h' : rl === 'sedang' || rl === 'medium' ? 'rh-m' : 'rh-l';
  const issues: any[] = v.issues || [];
  const clauses: string[] = v.suggested_clauses || [];
  const docsReq: any[] = v.documents_required || [];
  const compliance = v.compliance || {};
  const ftv = v.ftv_assessment || {};

  const jlbl: Record<string, string> = { tanah_shm: 'Tanah SHM', tanah_shgb: 'Tanah SHGB', bangunan: 'Bangunan', kendaraan_roda4: 'Kendaraan Roda 4' };
  const olbl: Record<string, string> = { hak_milik_pribadi: 'Hak milik', harta_bersama: 'Harta bersama', warisan_belum_dibagi: 'Warisan', kuasa: 'Atas kuasa' };

  const nsCls: Record<string, string> = { under_review: 'ns-review', info_requested: 'ns-pending', approved: 'ns-approved', rejected: 'ns-rejected', draft_ready: 'ns-approved' };
  const nsLbl: Record<string, string> = { under_review: 'Review', info_requested: 'Info diminta', approved: 'Disetujui', rejected: 'Ditolak', draft_ready: 'Draft siap' };

  return (
    <><style>{S}</style>
    <div className="rv">
      <nav className="rv-nav">
        <div className="nav-left">
          <div className="nav-sigil">E</div>
          <button className="nav-back" onClick={() => router.push('/lawyer')}>← Kembali</button>
          <span className="nav-sep">/</span>
          <span className="nav-id">{req.request_number || id?.slice(0, 8).toUpperCase()}</span>
        </div>
        <span className={`nav-status ${nsCls[status] || 'ns-pending'}`}>{nsLbl[status] || status}</span>
      </nav>

      <div className="rv-body">
        <div className="rv-left">
          <div className="case-eyebrow">Analisa Hukum</div>
          <div className="case-name">{req.customer_name}</div>
          <div className="case-meta">
            <span className="meta-item">{jlbl[req.collateral?.type] || req.collateral?.type}</span>
            <span className="meta-dot" />
            <span className="meta-item">Rp {Number(req.financing_amount).toLocaleString('id-ID')}</span>
            <span className="meta-dot" />
            <span className="meta-item">{req.tenor_months} bln · {req.margin_percent}%</span>
          </div>

          <div className="tab-bar">
            <button className={`tab-btn ${tab === 'intel' ? 'active' : ''}`} onClick={() => setTab('intel')}>
              Korelasi data {critCorrs.length > 0 && <span className="tab-badge">{critCorrs.length}</span>}
            </button>
            <button className={`tab-btn ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>
              Analisa hukum {issues.length > 0 && <span className="tab-badge ok">{issues.length}</span>}
            </button>
            <button className={`tab-btn ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')}>
              Dokumen {(docsReq.length + docsToReq.length) > 0 && <span className="tab-badge ok">{docsReq.length + docsToReq.length}</span>}
            </button>
          </div>

          {/* ── TAB INTEL ── */}
          {tab === 'intel' && (
            <>
              {corrs.length === 0 && infers.length === 0
                ? <div className="empty-tab">Data intelligence belum tersedia</div>
                : <>
                  {corrs.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Korelasi antar data ({corrs.length})</div>
                      {corrs.map((c: any, i: number) => {
                        const cls = c.severity === 'kritis' ? 'ic-k' : c.severity === 'penting' ? 'ic-p' : 'ic-i';
                        return (
                          <div key={i} className={`intel-item ${cls}`}>
                            <div className="intel-sev">{c.severity}</div>
                            {c.fields_involved?.length > 0 && <div className="intel-fields">{c.fields_involved.join(' × ')}</div>}
                            <div className="intel-finding">{c.finding}</div>
                            {c.legal_basis && <div className="intel-basis">{c.legal_basis}</div>}
                            {c.clarification_needed && (
                              <div className="intel-clarif">
                                <div className="intel-clarif-lbl">Klarifikasi dibutuhkan</div>
                                <div className="intel-clarif-txt">{c.clarification_needed}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {infers.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Inferensi ({infers.length})</div>
                      {infers.map((inf: any, i: number) => (
                        <div key={i} className="infer-item">
                          <div className="infer-basis">{inf.basis}</div>
                          <div className="infer-text">{inf.inference}</div>
                          <div className="infer-action"><span style={{ color: 'rgba(192,160,98,.4)' }}>→</span>{inf.action_required}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {infoHist.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Riwayat permintaan info</div>
                      {infoHist.map((ih: any, i: number) => (
                        <div key={i} className="info-hist-item">
                          <div className="ih-date">
                            {new Date(ih.asked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}<span style={{ color: ih.status === 'answered' ? '#6abf80' : '#c0a062' }}>{ih.status === 'answered' ? 'Dijawab' : 'Menunggu'}</span>
                          </div>
                          {(ih.questions || []).map((q: string, j: number) => (
                            <div key={j}><div className="ih-q">{q}</div>{ih.answers?.[j] && <div className="ih-a">↳ {ih.answers[j]}</div>}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              }
            </>
          )}

          {/* ── TAB ANALYSIS ── */}
          {tab === 'analysis' && (
            <>
              {!v.risk_level
                ? <div className="empty-tab">Analisa hukum belum tersedia</div>
                : <>
                  <div className={`risk-hero ${rhCls}`}>
                    <div>
                      <div className="rh-ey">Tingkat risiko hukum</div>
                      <div className="rh-lv">{v.risk_level}</div>
                      <div className="rh-sm">{v.summary}</div>
                    </div>
                    <div className="rh-sc"><div className="rh-sc-n">{v.risk_score ?? '—'}</div><div className="rh-sc-l">Skor</div></div>
                  </div>

                  {ftv.recommended_max_ftv && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Penilaian FTV</div>
                      <div className="ftv-block">
                        <div><div className="ftv-label">FTV maksimum yang direkomendasikan</div><div className="ftv-basis">{ftv.basis}</div></div>
                        <div className="ftv-value">{ftv.recommended_max_ftv}%</div>
                      </div>
                    </div>
                  )}

                  {(compliance.ojk_status || compliance.dsn_mui_status) && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Kepatuhan regulasi</div>
                      {compliance.ojk_status && (
                        <div className="comp-row">
                          <div className="comp-org">OJK</div>
                          <span className={`comp-pill cp-${compliance.ojk_status}`}>{compliance.ojk_status.replace(/_/g, ' ')}</span>
                          {compliance.ojk_findings?.length > 0 && <div className="comp-findings">{compliance.ojk_findings.join(' · ')}</div>}
                        </div>
                      )}
                      {compliance.dsn_mui_status && (
                        <div className="comp-row">
                          <div className="comp-org">DSN-MUI</div>
                          <span className={`comp-pill cp-${compliance.dsn_mui_status}`}>{compliance.dsn_mui_status.replace(/_/g, ' ')}</span>
                          {compliance.dsn_mui_findings?.length > 0 && <div className="comp-findings">{compliance.dsn_mui_findings.join(' · ')}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {v.recommendation && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Rekomendasi AI</div>
                      <div className="rec-block"><div className="rec-text">{v.recommendation}</div></div>
                    </div>
                  )}

                  {issues.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Temuan & risiko ({issues.length})</div>
                      {issues.map((iss: any, i: number) => {
                        const lvl = (iss.level || 'rendah').toLowerCase();
                        const cls = lvl === 'tinggi' || lvl === 'high' ? 'ish' : lvl === 'sedang' || lvl === 'medium' ? 'ism' : 'isl';
                        const lbl = lvl === 'tinggi' || lvl === 'high' ? 'Risiko tinggi' : lvl === 'sedang' || lvl === 'medium' ? 'Perhatian' : 'Catatan';
                        return (
                          <div key={i} className={`issue-card ${cls}`}>
                            <div className="issue-top"><span className="issue-badge">{lbl}</span>{iss.category && <span className="issue-cat">{iss.category}</span>}</div>
                            <div className="issue-txt">{typeof iss === 'string' ? iss : iss.text || ''}</div>
                            {iss.solution && <div className="issue-sol"><div className="issue-sol-lbl">Solusi</div>{iss.solution}</div>}
                            {iss.regulation_basis && <div className="issue-reg">{iss.regulation_basis}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {clauses.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Klausul kontrak yang disarankan</div>
                      {clauses.map((cl: string, i: number) => (
                        <div key={i} className="clause-item">
                          <span className="clause-n">{String(i + 1).padStart(2, '0')}</span>
                          <div className="clause-t">{cl}</div>
                          <button className="copy-btn" onClick={() => copyClause(cl, i)}>
                            {copied === i
                              ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#6abf80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="1" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/><path d="M2 4v7a1.5 1.5 0 001.5 1.5H8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              }
            </>
          )}

          {/* ── TAB DOCS ── */}
          {tab === 'docs' && (
            <>
              {docsReq.length === 0 && docsToReq.length === 0
                ? <div className="empty-tab">Tidak ada dokumen yang dicatat</div>
                : <>
                  {docsReq.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Dari analisa hukum</div>
                      {docsReq.map((doc: any, i: number) => {
                        const p = (doc.priority || '').toLowerCase();
                        const pCls = p === 'wajib' ? 'dp-w' : p === 'pendukung' ? 'dp-p' : 'dp-k';
                        return (
                          <div key={i} className="doc-item">
                            <span className={`doc-prio ${pCls}`}>{doc.priority}</span>
                            <div><div className="doc-name">{doc.name}</div>{doc.reason && <div className="doc-reason">{doc.reason}</div>}{doc.deadline && <div className="doc-dl">{doc.deadline.replace(/_/g, ' ')}</div>}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {docsToReq.length > 0 && (
                    <div className="rv-sec">
                      <div className="sec-lbl">Dari data intelligence</div>
                      {docsToReq.map((doc: any, i: number) => (
                        <div key={i} className="doc-item">
                          <span className="doc-prio dp-w">{doc.urgency?.replace(/_/g, ' ') || 'perlu'}</span>
                          <div><div className="doc-name">{doc.document}</div>{doc.reason && <div className="doc-reason">{doc.reason}</div>}{doc.from_whom && <div className="doc-dl">Dari: {doc.from_whom}</div>}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              }
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="rv-right">
          <div className="sidebar-card">
            <div className="sc-head">Pembiayaan</div>
            <div className="sc-body">
              {[['Nasabah', req.customer_name], ['NIK', req.customer_id_number || '—'], ['Nilai', `Rp ${Number(req.financing_amount).toLocaleString('id-ID')}`], ['Tenor', `${req.tenor_months} bln`], ['Margin', `${req.margin_percent}%`], ['Akad', req.contract_type || 'Murabahah']].map(([k, val]) => (
                <div className="data-row" key={k}><span className="dk">{k}</span><span className="dv">{val}</span></div>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sc-head">Jaminan</div>
            <div className="sc-body">
              {[['Jenis', jlbl[req.collateral?.type] || '—'], ['Nama', req.collateral?.details?.owner_name || '—'], ['Status', olbl[req.collateral?.details?.ownership_status] || '—'], ['No.', req.collateral?.details?.certificate_number || '—']].map(([k, val]) => (
                <div className="data-row" key={k}><span className="dk">{k}</span><span className="dv">{val}</span></div>
              ))}
            </div>
          </div>

          {isDraft && (
            <div className="draft-banner">
              <div className="db-lbl">Draft tersedia</div>
              <div className="db-title">Draft kontrak siap</div>
              <div className="db-desc">Download atau kirim ke notaris</div>
            </div>
          )}

          <div>
            <div className="action-lbl">Keputusan</div>
            {isDecided ? (
              <div className={`decision-banner ${req.status === 'approved' ? 'db-a' : 'db-r'}`}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  {req.status === 'approved' ? <path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> : <path d="M3 3l7 7M10 3L3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
                </svg>
                {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
              </div>
            ) : (
              <>
                {showNote && <textarea className="note-area" placeholder="Catatan…" value={note} onChange={e => setNote(e.target.value)} />}

                <button className="btn-approve" onClick={() => doAction('approved')} disabled={acting}>
                  {acting ? <span className="spinner" /> : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  Setujui
                </button>

                {v.risk_level && (
                  <button className="btn-draft" onClick={doDraft} disabled={drafting || isDraft}>
                    {drafting ? <span className="spinner" /> : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 4.5h5M4 6.5h5M4 8.5h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>}
                    {isDraft ? 'Draft siap' : 'Generate draft kontrak'}
                  </button>
                )}

                <button className="btn-ghost" onClick={() => setShowInfoForm(s => !s)}>
                  {showInfoForm ? 'Batal' : '+ Minta info ke cabang'}
                </button>

                {showInfoForm && (
                  <div style={{ marginBottom: 6 }}>
                    {questions.map((q, i) => (
                      <div key={i} className="q-wrap">
                        {questions.length > 1 && <button className="remove-q" onClick={() => setQuestions(qs => qs.filter((_, j) => j !== i))}>✕</button>}
                        <textarea className="question-input" placeholder={`Pertanyaan ${i + 1}…`} value={q} onChange={e => setQuestions(qs => qs.map((x, j) => j === i ? e.target.value : x))} />
                      </div>
                    ))}
                    <button className="add-q-btn" onClick={() => setQuestions(qs => [...qs, ''])}>+ Tambah pertanyaan</button>
                    <button className="btn-approve" onClick={sendInfo} disabled={acting} style={{ marginBottom: 0 }}>
                      {acting ? <span className="spinner" /> : null} Kirim ke cabang
                    </button>
                  </div>
                )}

                <button className="btn-ghost" onClick={() => setShowNote(s => !s)}>
                  {showNote ? 'Sembunyikan catatan' : '+ Catatan'}
                </button>
                <button className="btn-reject" onClick={() => doAction('rejected')} disabled={acting}>Tolak permintaan</button>
              </>
            )}

            {req.lawyer_note && (
              <div style={{ marginTop: 8, padding: '8px 11px', background: 'rgba(255,255,255,.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(232,230,224,.2)', marginBottom: 5 }}>Catatan</div>
                <div style={{ fontSize: 12, fontWeight: 300, color: 'rgba(232,230,224,.4)', lineHeight: 1.6 }}>{req.lawyer_note}</div>
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
