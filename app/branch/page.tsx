'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  AKAD_LIST, AKAD_BY_CODE, CATEGORY_LABELS,
  getAkadByCategory, type AkadDefinition
} from '@/lib/akad-system';
import { NotificationBell, StatusToastContainer } from '@/lib/notification-system';

// ── STYLES ──────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.bp{min-height:100vh;background:#0c0d0f;font-family:'DM Sans',sans-serif;color:#e8e6e0}
.bp-nav{height:56px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 36px;position:sticky;top:0;z-index:100;background:#0c0d0f}
.nav-left{display:flex;align-items:center;gap:14px}
.nav-sigil{width:30px;height:30px;border:1px solid rgba(192,160,98,.4);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;color:#c0a062}
.nav-title{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,230,224,.4)}
.nav-right{display:flex;align-items:center;gap:10px}
.nav-user{font-size:12px;color:rgba(232,230,224,.3)}
.btn-logout{background:none;border:none;cursor:pointer;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(232,230,224,.2);font-family:'DM Sans',sans-serif;transition:color .15s}
.btn-logout:hover{color:rgba(232,230,224,.5)}
.bp-body{max-width:760px;margin:0 auto;padding:36px 20px 80px}
.page-eyebrow{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:8px}
.page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:400;color:#e8e6e0;margin-bottom:28px}
.section{margin-bottom:28px}
.section-lbl{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(232,230,224,.2);margin-bottom:12px;display:flex;align-items:center;gap:10px}
.section-lbl::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.05)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;color:rgba(232,230,224,.4);margin-bottom:6px;font-weight:400}
.field label span{color:rgba(232,112,90,.6);margin-left:3px}
.inp{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:#e8e6e0;outline:none;transition:border-color .2s;-webkit-appearance:none}
.inp::placeholder{color:rgba(232,230,224,.2)}
.inp:focus{border-color:rgba(192,160,98,.35)}
.inp-error{border-color:rgba(232,112,90,.4)!important}
.sel{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:#e8e6e0;outline:none;cursor:pointer;transition:border-color .2s;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(232,230,224,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
.sel:focus{border-color:rgba(192,160,98,.35)}
.sel option{background:#1a1b1e;color:#e8e6e0}
.sel optgroup{background:#14151a;color:rgba(192,160,98,.7);font-size:10px;letter-spacing:.1em}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.err-msg{font-size:11px;color:rgba(232,112,90,.7);margin-top:4px}

/* Akad card */
.akad-card{background:rgba(192,160,98,.05);border:1px solid rgba(192,160,98,.2);border-radius:3px;padding:14px 16px;margin-bottom:14px}
.akad-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px}
.akad-name{font-size:14px;font-weight:500;color:#c0a062}
.akad-arabic{font-size:13px;color:rgba(192,160,98,.4);direction:rtl}
.akad-fatwa{font-size:10px;color:rgba(192,160,98,.4);margin-bottom:6px;font-family:'DM Mono',monospace}
.akad-desc{font-size:12px;color:rgba(232,230,224,.45);line-height:1.6;margin-bottom:8px}
.akad-uses{display:flex;flex-wrap:wrap;gap:5px}
.akad-use{font-size:10px;background:rgba(255,255,255,.05);color:rgba(232,230,224,.3);padding:2px 8px;border-radius:2px}
.akad-warning{background:rgba(192,160,98,.07);border-left:2px solid rgba(192,160,98,.3);padding:8px 12px;margin-top:8px;font-size:11px;color:rgba(192,160,98,.6);line-height:1.6}
.akad-warning-lbl{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(192,160,98,.4);margin-bottom:3px}

/* Conditional field highlight */
.field-highlight{background:rgba(192,160,98,.04);border:1px solid rgba(192,160,98,.15);border-radius:3px;padding:12px 14px;margin-bottom:14px}
.fh-lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(192,160,98,.5);margin-bottom:8px}

/* Checkbox */
.check-row{display:flex;align-items:center;gap:10px;padding:10px 0;cursor:pointer}
.check-box{width:18px;height:18px;border:1px solid rgba(255,255,255,.15);border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.check-box.checked{background:rgba(192,160,98,.2);border-color:rgba(192,160,98,.4)}
.check-lbl{font-size:13px;font-weight:300;color:rgba(232,230,224,.6)}

/* Submit */
.submit-area{margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.submit-note{font-size:12px;color:rgba(232,230,224,.25);line-height:1.6;margin-bottom:16px}
.btn-submit{width:100%;padding:14px;background:#c0a062;border:none;border-radius:3px;font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#0c0d0f;cursor:pointer;font-weight:500;transition:background .15s;display:flex;align-items:center;justify-content:center;gap:9px}
.btn-submit:hover:not(:disabled){background:#d4b478}
.btn-submit:disabled{opacity:.35;cursor:not-allowed}
.spinner{width:13px;height:13px;border:1.5px solid rgba(12,13,15,.3);border-top-color:#0c0d0f;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:24px;right:24px;background:#1e2023;border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:10px 16px;font-size:13px;color:rgba(232,230,224,.7);z-index:200;animation:toastIn .2s ease}
@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(max-width:640px){.grid2,.grid3{grid-template-columns:1fr}.bp-body{padding:24px 16px 60px}.bp-nav{padding:0 16px}}
`;

// ── TYPES ────────────────────────────────────────────────────
interface FormData {
  customer_name: string;
  customer_id_number: string;
  contract_type: string;
  financing_amount: string;
  rate_value: string;
  tenor_months: string;
  collateral_type: string;
  owner_name: string;
  ownership_status: string;
  certificate_number: string;
  address: string;
  area_m2: string;
  vehicle_year: string;
  vehicle_plate: string;
  stnk_active: boolean;
  spouse_consent: boolean;
  heirs_involved: boolean;
  heirs_certificate: boolean;
  goods_description: string;
  project_description: string;
  notes: string;
}

const INITIAL: FormData = {
  customer_name: '', customer_id_number: '', contract_type: 'murabahah',
  financing_amount: '', rate_value: '', tenor_months: '',
  collateral_type: 'tanah_shm', owner_name: '', ownership_status: 'hak_milik_pribadi',
  certificate_number: '', address: '', area_m2: '', vehicle_year: '', vehicle_plate: '',
  stnk_active: true, spouse_consent: false, heirs_involved: false, heirs_certificate: false,
  goods_description: '', project_description: '', notes: '',
};

const COLLATERAL_LABELS: Record<string, string> = {
  tanah_shm: 'Tanah — Sertifikat Hak Milik (SHM)',
  tanah_shgb: 'Tanah — Sertifikat Hak Guna Bangunan (SHGB)',
  bangunan: 'Bangunan / Rumah / Ruko',
  kendaraan_roda4: 'Kendaraan Roda Empat',
};

const OWNERSHIP_LABELS: Record<string, string> = {
  hak_milik_pribadi: 'Hak milik pribadi',
  harta_bersama: 'Harta bersama (dalam perkawinan)',
  warisan_belum_dibagi: 'Harta warisan belum dibagi',
  kuasa: 'Atas kuasa dari pemilik',
};

export default function BranchPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState<any>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  const akad = AKAD_BY_CODE[form.contract_type] as AkadDefinition | undefined;
  const akadByCategory = getAkadByCategory();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      supabase.from('user_profiles').select('branch_id,full_name').eq('id', user.id).single()
        .then(({ data }) => { if (data?.branch_id) setBranchId(data.branch_id); });
    });
  }, []);

  const set = (k: keyof FormData, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  // Reset rate field saat akad berubah
  const setAkad = (code: string) => {
    setForm(f => ({ ...f, contract_type: code, rate_value: '' }));
    setErrors({});
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = 'Nama nasabah wajib diisi';
    if (!form.customer_id_number.trim()) e.customer_id_number = 'NIK wajib diisi';
    if (form.customer_id_number.length > 0 && form.customer_id_number.length !== 16) e.customer_id_number = 'NIK harus 16 digit';
    if (!form.financing_amount || Number(form.financing_amount) <= 0) e.financing_amount = 'Nilai pembiayaan wajib diisi';
    if (!form.rate_value || Number(form.rate_value) <= 0) e.rate_value = `${akad?.rate_label || 'Rate'} wajib diisi`;
    if (!form.tenor_months || Number(form.tenor_months) <= 0) e.tenor_months = 'Tenor wajib diisi';
    if (!form.owner_name.trim()) e.owner_name = 'Nama pemilik jaminan wajib diisi';
    if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(form.collateral_type)) {
      if (!form.certificate_number.trim()) e.certificate_number = 'Nomor sertifikat wajib diisi';
      if (!form.address.trim()) e.address = 'Alamat jaminan wajib diisi';
    }
    if (form.collateral_type === 'kendaraan_roda4') {
      if (!form.certificate_number.trim()) e.certificate_number = 'Nomor BPKB/Polisi wajib diisi';
      if (!form.vehicle_year.trim()) e.vehicle_year = 'Tahun kendaraan wajib diisi';
    }
    if (form.ownership_status === 'harta_bersama' && !form.spouse_consent) {
      e.spouse_consent = 'Persetujuan pasangan wajib ada untuk harta bersama (UU No.1/1974 Ps.36)';
    }
    if (akad?.requires_goods_desc && !form.goods_description.trim()) {
      e.goods_description = 'Deskripsi barang wajib untuk akad ' + akad.name;
    }
    if (akad?.requires_project_desc && !form.project_description.trim()) {
      e.project_description = 'Deskripsi proyek/usaha wajib untuk akad ' + akad.name;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { showToast('Lengkapi field yang masih kosong'); return; }
    setSubmitting(true);

    const collateralDetails: Record<string, any> = {
      owner_name: form.owner_name,
      ownership_status: form.ownership_status,
      certificate_number: form.certificate_number,
      address: form.address,
      area_m2: form.area_m2,
      notes: form.notes,
    };

    if (form.collateral_type === 'kendaraan_roda4') {
      collateralDetails.vehicle_year = form.vehicle_year;
      collateralDetails.vehicle_plate = form.vehicle_plate;
      collateralDetails.stnk_active = form.stnk_active;
    }
    if (form.ownership_status === 'harta_bersama') {
      collateralDetails.spouse_consent = form.spouse_consent;
    }
    if (form.ownership_status === 'warisan_belum_dibagi') {
      collateralDetails.heirs_involved = form.heirs_involved;
      collateralDetails.heirs_certificate = form.heirs_certificate;
    }

    // Simpan rate dengan key yang sesuai akad
    const rateKey = akad?.requires_margin ? 'margin_percent'
      : akad?.requires_profit_share ? 'profit_share_percent'
      : akad?.requires_rental_rate ? 'rental_rate'
      : 'rate_percent';

    const payload: Record<string, any> = {
      branch_id: branchId,
      contract_type: form.contract_type,
      customer_name: form.customer_name.trim(),
      customer_id_number: form.customer_id_number.trim(),
      financing_amount: Number(form.financing_amount),
      [rateKey]: Number(form.rate_value),
      margin_percent: Number(form.rate_value), // backward compat
      tenor_months: Number(form.tenor_months),
      collateral: { type: form.collateral_type, details: collateralDetails },
      status: 'collateral_validation',
    };

    if (form.goods_description) payload.goods_description = form.goods_description;
    if (form.project_description) payload.project_description = form.project_description;

    const { data, error } = await supabase.from('contract_requests').insert(payload).select('id').single();

    if (error || !data) {
      showToast('Gagal menyimpan. Coba lagi.');
      console.error(error);
      setSubmitting(false);
      return;
    }

    // Trigger pipeline
    try {
      await fetch('/api/data-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: data.id }),
      });
    } catch { /* pipeline akan retry */ }

    showToast('Pengajuan terkirim, AI sedang menganalisa…');
    setTimeout(() => router.push(`/branch/status?id=${data.id}`), 1200);
  };

  const isLand = ['tanah_shm', 'tanah_shgb', 'bangunan'].includes(form.collateral_type);
  const isVehicle = form.collateral_type === 'kendaraan_roda4';

  return (
    <>
      <style>{S}</style>
      <div className="bp">
        <nav className="bp-nav">
          <div className="nav-left">
            <div className="nav-sigil">E</div>
            <span className="nav-title">Pengajuan Pembiayaan</span>
          </div>
          <div className="nav-right">
            <NotificationBell branchId={branchId} />
            <span className="nav-user">{user?.email}</span>
            <button className="btn-logout" onClick={() => supabase.auth.signOut().then(() => router.replace('/login'))}>Keluar</button>
          </div>
        </nav>

        <div className="bp-body">
          <div className="page-eyebrow">Kantor Cabang</div>
          <div className="page-title">Form Pengajuan Pembiayaan Syariah</div>

          {/* ── BAGIAN 1: JENIS AKAD ── */}
          <div className="section">
            <div className="section-lbl">Jenis akad pembiayaan</div>

            <div className="field">
              <label>Pilih akad <span>*</span></label>
              <select className="sel" value={form.contract_type} onChange={e => setAkad(e.target.value)}>
                {Object.entries(akadByCategory).map(([cat, list]) => (
                  <optgroup key={cat} label={`── ${CATEGORY_LABELS[cat] || cat}`}>
                    {list.map(a => (
                      <option key={a.code} value={a.code}>{a.name} — {a.arabic}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Info card akad yang dipilih */}
            {akad && (
              <div className="akad-card">
                <div className="akad-top">
                  <div className="akad-name">{akad.name}</div>
                  <div className="akad-arabic">{akad.arabic}</div>
                </div>
                <div className="akad-fatwa">{akad.fatwa_dsn.join(' · ')}</div>
                <div className="akad-desc">{akad.description}</div>
                <div className="akad-uses">
                  {akad.use_cases.map((u, i) => <span key={i} className="akad-use">{u}</span>)}
                </div>
                {akad.warnings.length > 0 && (
                  <div className="akad-warning">
                    <div className="akad-warning-lbl">Perhatian</div>
                    {akad.warnings.map((w, i) => <div key={i}>· {w}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── BAGIAN 2: DATA NASABAH ── */}
          <div className="section">
            <div className="section-lbl">Data nasabah</div>
            <div className="grid2">
              <div className="field">
                <label>Nama lengkap nasabah <span>*</span></label>
                <input className={`inp ${errors.customer_name ? 'inp-error' : ''}`}
                  value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                  placeholder="Nama sesuai KTP" />
                {errors.customer_name && <div className="err-msg">{errors.customer_name}</div>}
              </div>
              <div className="field">
                <label>NIK (16 digit) <span>*</span></label>
                <input className={`inp ${errors.customer_id_number ? 'inp-error' : ''}`}
                  value={form.customer_id_number} onChange={e => set('customer_id_number', e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="3271012501850001" maxLength={16} />
                {errors.customer_id_number && <div className="err-msg">{errors.customer_id_number}</div>}
              </div>
            </div>
          </div>

          {/* ── BAGIAN 3: STRUKTUR PEMBIAYAAN — dinamis penuh per akad ── */}
          <div className="section">
            <div className="section-lbl">Struktur pembiayaan</div>

            {/* Nilai pembiayaan + tenor — selalu ada */}
            <div className="grid2">
              <div className="field">
                <label>{akad?.amount_label || 'Nilai pembiayaan'} <span>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(232,230,224,.3)', pointerEvents: 'none' }}>Rp</span>
                  <input className={`inp ${errors.financing_amount ? 'inp-error' : ''}`}
                    type="number" value={form.financing_amount}
                    onChange={e => set('financing_amount', e.target.value)}
                    placeholder="500000000"
                    style={{ paddingLeft: 32 }} />
                </div>
                {form.financing_amount && (
                  <div style={{ fontSize: 11, color: 'rgba(192,160,98,.5)', marginTop: 4 }}>
                    Rp {Number(form.financing_amount).toLocaleString('id-ID')}
                  </div>
                )}
                {errors.financing_amount && <div className="err-msg">{errors.financing_amount}</div>}
              </div>
              <div className="field">
                <label>Tenor <span>*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={`inp ${errors.tenor_months ? 'inp-error' : ''}`}
                    type="number" value={form.tenor_months}
                    onChange={e => set('tenor_months', e.target.value)}
                    placeholder="60" style={{ flex: 1 }} />
                  <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, fontSize: 12, color: 'rgba(232,230,224,.3)', whiteSpace: 'nowrap' }}>bulan</span>
                </div>
                {errors.tenor_months && <div className="err-msg">{errors.tenor_months}</div>}
              </div>
            </div>

            {/* Rate field — label + satuan + helper berubah per akad */}
            <div className="field-highlight">
              <div className="fh-lbl">
                {akad?.category === 'bagi_hasil' ? 'Nisbah bagi hasil'
                  : akad?.category === 'sewa' ? 'Ujrah (biaya sewa)'
                  : akad?.category === 'pinjaman' ? 'Biaya administrasi'
                  : akad?.category === 'jasa' ? 'Fee / ujrah'
                  : 'Margin keuntungan'}
                {' '}— {akad?.name}
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>{akad?.rate_label || 'Rate'} <span>*</span></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Prefix Rp untuk Ijarah/IMBT yang satuannya rupiah */}
                  {akad?.requires_rental_rate && !akad?.requires_profit_share && (
                    <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, fontSize: 12, color: 'rgba(232,230,224,.3)', whiteSpace: 'nowrap' }}>Rp</span>
                  )}
                  <input className={`inp ${errors.rate_value ? 'inp-error' : ''}`}
                    type="number" step="0.01" value={form.rate_value}
                    onChange={e => set('rate_value', e.target.value)}
                    placeholder={akad?.rate_placeholder || '0'}
                    style={{ flex: 1 }} />
                  {/* Suffix % untuk akad berbasis persentase */}
                  {!akad?.requires_rental_rate && (
                    <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, fontSize: 12, color: 'rgba(232,230,224,.3)' }}>%</span>
                  )}
                  {/* Suffix /bulan untuk Ijarah */}
                  {akad?.requires_rental_rate && !akad?.requires_profit_share && (
                    <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, fontSize: 12, color: 'rgba(232,230,224,.3)', whiteSpace: 'nowrap' }}>/bln</span>
                  )}
                </div>
                {errors.rate_value && <div className="err-msg">{errors.rate_value}</div>}

                {/* Helper text kontekstual per akad */}
                <div style={{ fontSize: 11, color: 'rgba(232,230,224,.25)', marginTop: 6, lineHeight: 1.6 }}>
                  {form.contract_type === 'murabahah' && 'Margin flat atas harga pokok. Harga jual = pokok + (pokok × margin%).'}
                  {form.contract_type === 'salam' && 'Selisih antara harga beli bank dengan harga pasar saat penyerahan.'}
                  {form.contract_type === 'istishna' && 'Persentase keuntungan bank atas biaya produksi total.'}
                  {form.contract_type === 'mudharabah' && `Contoh: isi 60 → nasabah dapat 60%, bank 40%. Total harus 100%.`}
                  {form.contract_type === 'musyarakah' && `Nisbah keuntungan untuk bank. Sisa (${form.rate_value ? 100 - Number(form.rate_value) : '...'}%) untuk nasabah.`}
                  {form.contract_type === 'musyarakah_mutanaqisah' && 'Nisbah bagi hasil dari sewa aset. Porsi kepemilikan bank berkurang tiap cicilan.'}
                  {form.contract_type === 'ijarah' && 'Ujrah tetap per bulan selama masa sewa. Bukan bunga — ini biaya manfaat aset.'}
                  {form.contract_type === 'imbt' && 'Ujrah sewa bulanan. Di akhir masa sewa, aset dapat dialihkan ke nasabah.'}
                  {form.contract_type === 'wakalah' && 'Fee atas jasa wakalah. Harus mencerminkan biaya riil yang dikeluarkan bank.'}
                  {form.contract_type === 'qardh' && 'Hanya biaya administrasi riil. Bank dilarang mengambil keuntungan dari Qardh.'}
                </div>

                {/* Preview simulasi angsuran untuk akad berbasis % */}
                {form.rate_value && form.financing_amount && form.tenor_months &&
                  akad?.requires_margin && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(192,160,98,.06)', borderRadius: 2, fontSize: 11, color: 'rgba(192,160,98,.6)' }}>
                    Estimasi angsuran: Rp {Math.round(
                      (Number(form.financing_amount) * (1 + Number(form.rate_value) / 100)) / Number(form.tenor_months)
                    ).toLocaleString('id-ID')} / bulan
                    {' '}· Total harga jual: Rp {Math.round(
                      Number(form.financing_amount) * (1 + Number(form.rate_value) / 100)
                    ).toLocaleString('id-ID')}
                  </div>
                )}

                {/* Preview nisbah untuk bagi hasil */}
                {form.rate_value && akad?.requires_profit_share && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(192,160,98,.06)', borderRadius: 2, fontSize: 11, color: 'rgba(192,160,98,.6)' }}>
                    {form.contract_type === 'mudharabah' || form.contract_type === 'musyarakah'
                      ? `Nisbah: Nasabah ${form.contract_type === 'mudharabah' ? Number(form.rate_value) : 100 - Number(form.rate_value)}% · Bank ${form.contract_type === 'mudharabah' ? 100 - Number(form.rate_value) : Number(form.rate_value)}%`
                      : `Nisbah bank: ${form.rate_value}%`}
                  </div>
                )}
              </div>
            </div>

            {/* Field deskripsi barang — Murabahah, Salam, Istishna, Ijarah, IMBT */}
            {akad?.requires_goods_desc && (
              <div className="field-highlight">
                <div className="fh-lbl">
                  {form.contract_type === 'murabahah' ? 'Objek yang dibeli (wajib — Fatwa DSN No.04)'
                    : form.contract_type === 'salam' ? 'Spesifikasi barang pesanan (wajib — Fatwa DSN No.05)'
                    : form.contract_type === 'istishna' ? 'Spesifikasi teknis objek (wajib — Fatwa DSN No.06)'
                    : 'Deskripsi objek sewa (wajib — Fatwa DSN No.09)'}
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Deskripsi lengkap barang / objek <span>*</span></label>
                  <textarea className={`inp ${errors.goods_description ? 'inp-error' : ''}`}
                    rows={3} value={form.goods_description}
                    onChange={e => set('goods_description', e.target.value)}
                    placeholder={
                      form.contract_type === 'murabahah'
                        ? 'Contoh: Rumah tinggal 2 lantai, LT 120m², LB 90m², 3 kamar tidur, lokasi Jl. Merdeka No.5 Bandung'
                        : form.contract_type === 'salam'
                        ? 'Contoh: Padi varietas IR64, 50 ton, kadar air maks 14%, gabah kering giling, diserahkan November 2025'
                        : form.contract_type === 'istishna'
                        ? 'Contoh: Gedung kantor 3 lantai, luas per lantai 150m², struktur beton, spesifikasi teknis terlampir'
                        : 'Contoh: Excavator Komatsu PC200, tahun 2020, kapasitas bucket 0.8m³, kondisi baik'
                    }
                    style={{ resize: 'vertical', minHeight: 70 }}
                  />
                  {errors.goods_description && <div className="err-msg">{errors.goods_description}</div>}
                </div>
              </div>
            )}

            {/* Field deskripsi proyek/usaha — Mudharabah, Musyarakah, MMQ, Istishna */}
            {akad?.requires_project_desc && (
              <div className="field-highlight">
                <div className="fh-lbl">
                  {form.contract_type === 'mudharabah' ? 'Deskripsi usaha nasabah (wajib — Fatwa DSN No.07)'
                    : form.contract_type === 'musyarakah' || form.contract_type === 'musyarakah_mutanaqisah'
                    ? 'Deskripsi usaha bersama (wajib — Fatwa DSN No.08)'
                    : 'Deskripsi proyek yang dipesan (wajib — Fatwa DSN No.06)'}
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>
                    {form.contract_type === 'mudharabah' ? 'Gambaran usaha yang dikelola nasabah'
                      : form.contract_type.startsWith('musyarakah') ? 'Gambaran usaha / proyek bersama'
                      : 'Deskripsi proyek / konstruksi'}
                    {' '}<span>*</span>
                  </label>
                  <textarea className={`inp ${errors.project_description ? 'inp-error' : ''}`}
                    rows={3} value={form.project_description}
                    onChange={e => set('project_description', e.target.value)}
                    placeholder={
                      form.contract_type === 'mudharabah'
                        ? 'Contoh: Usaha perdagangan sembako, omset Rp50jt/bulan, sudah berjalan 3 tahun, memiliki 2 karyawan tetap'
                        : form.contract_type === 'musyarakah'
                        ? 'Contoh: Pengembangan usaha konveksi seragam, kapasitas 5.000 pcs/bulan, kontrak dengan 3 instansi pemerintah'
                        : form.contract_type === 'musyarakah_mutanaqisah'
                        ? 'Contoh: Kepemilikan ruko untuk usaha retail, lokasi pusat kota, sewa saat ini Rp8jt/bulan'
                        : 'Contoh: Pembangunan 5 unit ruko 3 lantai, lahan sudah dimiliki nasabah, IMB dalam proses'
                    }
                    style={{ resize: 'vertical', minHeight: 70 }}
                  />
                  {errors.project_description && <div className="err-msg">{errors.project_description}</div>}
                </div>
              </div>
            )}
          </div>

          {/* ── BAGIAN 4: DATA JAMINAN ── */}
          <div className="section">
            <div className="section-lbl">Data jaminan</div>

            <div className="grid2">
              <div className="field">
                <label>Jenis jaminan <span>*</span></label>
                <select className="sel" value={form.collateral_type} onChange={e => set('collateral_type', e.target.value)}>
                  {Object.entries(COLLATERAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Status kepemilikan <span>*</span></label>
                <select className="sel" value={form.ownership_status} onChange={e => set('ownership_status', e.target.value)}>
                  {Object.entries(OWNERSHIP_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Nama pemilik jaminan <span>*</span></label>
              <input className={`inp ${errors.owner_name ? 'inp-error' : ''}`}
                value={form.owner_name} onChange={e => set('owner_name', e.target.value)}
                placeholder="Nama sesuai sertifikat/BPKB" />
              {errors.owner_name && <div className="err-msg">{errors.owner_name}</div>}
            </div>

            {/* Field tanah/bangunan */}
            {isLand && (
              <>
                <div className="grid2">
                  <div className="field">
                    <label>
                      {form.collateral_type === 'tanah_shm' ? 'Nomor SHM' : form.collateral_type === 'tanah_shgb' ? 'Nomor SHGB' : 'Nomor Sertifikat Tanah'} <span>*</span>
                    </label>
                    <input className={`inp ${errors.certificate_number ? 'inp-error' : ''}`}
                      value={form.certificate_number} onChange={e => set('certificate_number', e.target.value)}
                      placeholder="Contoh: SHM-12345-2019" />
                    {errors.certificate_number && <div className="err-msg">{errors.certificate_number}</div>}
                  </div>
                  <div className="field">
                    <label>Luas (m²)</label>
                    <input className="inp" type="number" value={form.area_m2}
                      onChange={e => set('area_m2', e.target.value)} placeholder="Contoh: 120" />
                  </div>
                </div>
                <div className="field">
                  <label>Alamat / lokasi jaminan <span>*</span></label>
                  <input className={`inp ${errors.address ? 'inp-error' : ''}`}
                    value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Alamat lengkap sesuai sertifikat" />
                  {errors.address && <div className="err-msg">{errors.address}</div>}
                </div>
              </>
            )}

            {/* Field kendaraan */}
            {isVehicle && (
              <>
                <div className="grid2">
                  <div className="field">
                    <label>Nomor Polisi / BPKB <span>*</span></label>
                    <input className={`inp ${errors.certificate_number ? 'inp-error' : ''}`}
                      value={form.certificate_number} onChange={e => set('certificate_number', e.target.value)}
                      placeholder="Contoh: B 1234 ABC" />
                    {errors.certificate_number && <div className="err-msg">{errors.certificate_number}</div>}
                  </div>
                  <div className="field">
                    <label>Tahun kendaraan <span>*</span></label>
                    <input className={`inp ${errors.vehicle_year ? 'inp-error' : ''}`}
                      type="number" value={form.vehicle_year}
                      onChange={e => set('vehicle_year', e.target.value)} placeholder="Contoh: 2020" />
                    {errors.vehicle_year && <div className="err-msg">{errors.vehicle_year}</div>}
                  </div>
                </div>
                <div className="field">
                  <label>Merk / tipe kendaraan</label>
                  <input className="inp" value={form.vehicle_plate}
                    onChange={e => set('vehicle_plate', e.target.value)}
                    placeholder="Contoh: Toyota Avanza 1.3 G MT" />
                </div>
                <div className="check-row" onClick={() => set('stnk_active', !form.stnk_active)}>
                  <div className={`check-box ${form.stnk_active ? 'checked' : ''}`}>
                    {form.stnk_active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#c0a062" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="check-lbl">STNK masih aktif / berlaku</span>
                </div>
                {!form.stnk_active && (
                  <div className="akad-warning">
                    <div className="akad-warning-lbl">Perhatian — STNK kadaluarsa</div>
                    AI akan mendeteksi kondisi ini dan memberikan jalur solusi perpanjangan dalam analisa.
                  </div>
                )}
              </>
            )}

            {/* Kondisi harta bersama */}
            {form.ownership_status === 'harta_bersama' && (
              <div className="field-highlight">
                <div className="fh-lbl">Konfirmasi harta bersama — UU No.1/1974 Ps.36</div>
                <div className="check-row" onClick={() => set('spouse_consent', !form.spouse_consent)}>
                  <div className={`check-box ${form.spouse_consent ? 'checked' : ''}`}>
                    {form.spouse_consent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#c0a062" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="check-lbl">Pasangan telah memberikan persetujuan tertulis bermaterai</span>
                </div>
                {errors.spouse_consent && <div className="err-msg" style={{ marginTop: 6 }}>{errors.spouse_consent}</div>}
              </div>
            )}

            {/* Kondisi warisan */}
            {form.ownership_status === 'warisan_belum_dibagi' && (
              <div className="field-highlight">
                <div className="fh-lbl">Konfirmasi status warisan — KHI Ps.171</div>
                <div className="check-row" onClick={() => set('heirs_involved', !form.heirs_involved)}>
                  <div className={`check-box ${form.heirs_involved ? 'checked' : ''}`}>
                    {form.heirs_involved && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#c0a062" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="check-lbl">Seluruh ahli waris setuju dan tidak ada yang di bawah umur</span>
                </div>
                <div className="check-row" style={{ marginTop: 4 }} onClick={() => set('heirs_certificate', !form.heirs_certificate)}>
                  <div className={`check-box ${form.heirs_certificate ? 'checked' : ''}`}>
                    {form.heirs_certificate && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#c0a062" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="check-lbl">Surat keterangan waris sudah tersedia</span>
                </div>
              </div>
            )}
          </div>

          {/* ── BAGIAN 5: CATATAN ── */}
          <div className="section">
            <div className="section-lbl">Catatan tambahan</div>
            <div className="field">
              <label>Informasi lain yang perlu diketahui lawyer / AI</label>
              <textarea className="inp" rows={3} value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Contoh: Nasabah sudah punya rekening aktif 3 tahun, pekerjaan PNS, ada jaminan tambahan BPKB motor..."
                style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
          </div>

          {/* ── SUBMIT ── */}
          <div className="submit-area">
            <div className="submit-note">
              Setelah dikirim, AI akan menganalisa data dalam beberapa menit. Pantau status di halaman riwayat pengajuan.
              Pastikan semua data sudah benar — perubahan setelah pengiriman memerlukan pengajuan ulang.
            </div>
            <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="spinner" /> : null}
              {submitting ? 'Mengirim & menganalisa…' : 'Kirim pengajuan'}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
      <StatusToastContainer branchId={branchId} />
    </>
  );
}
