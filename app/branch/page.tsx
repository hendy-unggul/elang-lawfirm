'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; }

.br-root {
  min-height: 100vh;
  background: #f5f3ef;
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
}

/* Top nav */
.br-nav {
  background: #0c0d0f;
  border-bottom: 1px solid rgba(192,160,98,0.2);
  padding: 0 40px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
}

.nav-brand {
  display: flex; align-items: center; gap: 12px;
}

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
  font-weight: 400;
}

.nav-right {
  display: flex; align-items: center; gap: 20px;
}

.nav-role {
  font-size: 11px; letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(192,160,98,0.6);
}

.nav-logout {
  font-size: 11px; letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(232,230,224,0.3);
  background: none; border: none;
  cursor: pointer; font-family: inherit;
  transition: color 0.2s;
}
.nav-logout:hover { color: rgba(232,230,224,0.6); }

/* Page layout */
.br-body {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 40px 80px;
}

/* Page header */
.page-header {
  margin-bottom: 48px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 1px solid rgba(26,26,26,0.1);
  padding-bottom: 28px;
}

.page-eyebrow {
  font-size: 11px; letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c0a062; margin-bottom: 8px;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 28px; font-weight: 400;
  color: #1a1a1a; line-height: 1.2;
}

.page-meta {
  font-size: 12px; color: rgba(26,26,26,0.4);
  text-align: right; line-height: 1.6;
}

/* Progress steps */
.steps-bar {
  display: flex; gap: 0;
  margin-bottom: 40px;
  background: white;
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 4px;
  overflow: hidden;
}

.step {
  flex: 1; padding: 14px 18px;
  display: flex; align-items: center; gap: 10px;
  border-right: 1px solid rgba(26,26,26,0.08);
  cursor: pointer; transition: background 0.15s;
  position: relative;
}

.step:last-child { border-right: none; }
.step:hover:not(.step-active) { background: rgba(26,26,26,0.02); }

.step-active { background: #0c0d0f; }
.step-done { background: rgba(192,160,98,0.06); }

.step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500;
  flex-shrink: 0;
  border: 1px solid rgba(26,26,26,0.2);
  color: rgba(26,26,26,0.4);
  transition: all 0.2s;
}

.step-active .step-num {
  background: #c0a062; border-color: #c0a062;
  color: #0c0d0f;
}

.step-done .step-num {
  background: rgba(192,160,98,0.15);
  border-color: rgba(192,160,98,0.4);
  color: #8a6e3a;
}

.step-label {
  font-size: 12px; font-weight: 400;
  color: rgba(26,26,26,0.4);
  white-space: nowrap;
}

.step-active .step-label { color: rgba(232,230,224,0.7); }
.step-done .step-label { color: rgba(138,110,58,0.8); }

/* Section cards */
.section-card {
  background: white;
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-head {
  padding: 20px 24px 18px;
  border-bottom: 1px solid rgba(26,26,26,0.07);
  display: flex; align-items: center;
  justify-content: space-between;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px; font-weight: 400;
  color: #1a1a1a;
}

.section-badge {
  font-size: 10px; letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 2px;
}

.badge-required { background: rgba(220,80,60,0.07); color: #a03020; }
.badge-optional { background: rgba(26,26,26,0.05); color: rgba(26,26,26,0.4); }
.badge-conditional { background: rgba(192,160,98,0.1); color: #8a6e3a; }

.section-body { padding: 24px; }

/* Field system */
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.field-row.full { grid-template-columns: 1fr; }
.field-row.three { grid-template-columns: 1fr 1fr 1fr; }

.field {
  display: flex; flex-direction: column; gap: 6px;
}

.field-label {
  font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(26,26,26,0.45);
  display: flex; align-items: center; gap: 6px;
}

.req-star { color: #c0a062; font-size: 13px; line-height: 1; }

.field-input, .field-select, .field-textarea {
  background: #faf9f7;
  border: 1px solid rgba(26,26,26,0.12);
  border-radius: 2px;
  padding: 11px 14px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 300;
  color: #1a1a1a;
  transition: border-color 0.18s, background 0.18s;
  outline: none; width: 100%;
}

.field-input:focus, .field-select:focus, .field-textarea:focus {
  border-color: rgba(192,160,98,0.6);
  background: white;
}

.field-input::placeholder, .field-textarea::placeholder {
  color: rgba(26,26,26,0.22);
}

.field-select { cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a1a1a' stroke-opacity='0.3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}

.field-textarea { resize: vertical; min-height: 88px; line-height: 1.6; }

.field-hint {
  font-size: 11px; color: rgba(26,26,26,0.35);
  line-height: 1.5; margin-top: 2px;
}

/* Currency display */
.currency-wrap { position: relative; }
.currency-prefix {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 13px; color: rgba(26,26,26,0.35);
  pointer-events: none; font-weight: 400;
}
.currency-wrap .field-input { padding-left: 46px; }

/* Checkbox styled */
.check-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px;
  background: #faf9f7;
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 2px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.check-row:hover { background: #f5f3ef; }
.check-row:last-child { margin-bottom: 0; }

.check-box {
  width: 18px; height: 18px; flex-shrink: 0;
  border: 1px solid rgba(26,26,26,0.2);
  border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px; transition: all 0.15s;
  background: white;
}

.check-box.checked {
  background: #c0a062; border-color: #c0a062;
}

.check-text { flex: 1; }
.check-title { font-size: 13px; font-weight: 400; color: #1a1a1a; }
.check-desc { font-size: 12px; color: rgba(26,26,26,0.45); margin-top: 2px; line-height: 1.4; }

/* Risk indicator */
.risk-panel {
  background: rgba(192,160,98,0.06);
  border: 1px solid rgba(192,160,98,0.2);
  border-radius: 4px;
  padding: 16px 20px;
  margin-top: 16px;
  display: flex; align-items: flex-start; gap: 14px;
}

.risk-icon {
  width: 20px; height: 20px; flex-shrink: 0;
  opacity: 0.6; margin-top: 1px;
}

.risk-body { flex: 1; }
.risk-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #8a6e3a; margin-bottom: 4px; }
.risk-text { font-size: 13px; color: rgba(26,26,26,0.6); line-height: 1.5; }

/* Submit area */
.submit-area {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 28px 0 0;
  border-top: 1px solid rgba(26,26,26,0.08);
  margin-top: 8px;
}

.submit-note {
  font-size: 12px; color: rgba(26,26,26,0.35);
  max-width: 400px; line-height: 1.5;
}

.submit-btn {
  background: #0c0d0f;
  border: none; border-radius: 2px;
  padding: 14px 32px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #e8e6e0; cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: flex; align-items: center; gap: 10px;
  white-space: nowrap;
}

.submit-btn:hover:not(:disabled) { background: #1e2023; }
.submit-btn:active:not(:disabled) { transform: scale(0.99); }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 1.5px solid rgba(232,230,224,0.25);
  border-top-color: #e8e6e0;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Alert */
.alert {
  display: flex; gap: 12px; padding: 14px 16px;
  border-radius: 2px; margin-bottom: 20px;
  font-size: 13px; line-height: 1.5;
}
.alert-error {
  background: rgba(220,80,60,0.06);
  border: 1px solid rgba(220,80,60,0.18);
  color: #a03020;
}

@media (max-width: 640px) {
  .field-row, .field-row.three { grid-template-columns: 1fr; }
  .br-body { padding: 24px 20px 60px; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .steps-bar { display: none; }
}
`;

type CollateralType = 'tanah_shm' | 'tanah_shgb' | 'kendaraan_roda4' | 'bangunan';
type OwnershipStatus = 'hak_milik_pribadi' | 'harta_bersama' | 'warisan_belum_dibagi' | 'kuasa';

export default function BranchDashboard() {
  const router = useRouter();
  const [branchId, setBranchId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    customer_id_number: '',
    financing_amount: '',
    margin_percent: '5',
    tenor_months: '12',
    collateral_type: 'tanah_shm' as CollateralType,
    owner_name: '',
    ownership_status: 'hak_milik_pribadi' as OwnershipStatus,
    heirs_involved: false,
    heirs_certificate: false,
    spouse_consent: false,
    address: '',
    area_m2: '',
    certificate_number: '',
    vehicle_plate: '',
    vehicle_year: '',
    stnk_active: true,
    notes: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserEmail(user.email || '');
      supabase.from('user_profiles').select('branch_id').eq('id', user.id).single()
        .then(({ data }) => { if (data) setBranchId(data.branch_id); });
    });
  }, []);

  const isLandType = ['tanah_shm', 'tanah_shgb', 'bangunan'].includes(form.collateral_type);
  const isVehicle = form.collateral_type === 'kendaraan_roda4';
  const showHeirsFields = form.ownership_status === 'warisan_belum_dibagi';
  const showSpouseConsent = form.ownership_status === 'harta_bersama';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) { setError('Branch ID tidak ditemukan. Hubungi administrator.'); return; }
    setLoading(true); setError('');

    const collateralPayload = {
      type: form.collateral_type,
      details: {
        owner_name: form.owner_name,
        ownership_status: form.ownership_status,
        certificate_number: form.certificate_number,
        address: form.address,
        ...(isLandType && { area_m2: form.area_m2 }),
        ...(isVehicle && { vehicle_plate: form.vehicle_plate, vehicle_year: form.vehicle_year, stnk_active: form.stnk_active }),
        ...(showHeirsFields && { heirs_involved: form.heirs_involved, heirs_certificate: form.heirs_certificate }),
        ...(showSpouseConsent && { spouse_consent: form.spouse_consent }),
        notes: form.notes,
      },
    };

    const { data: request, error: insertErr } = await supabase
      .from('contract_requests')
      .insert({
        branch_id: branchId,
        contract_type: 'Murabahah',
        customer_name: form.customer_name,
        customer_id_number: form.customer_id_number,
        financing_amount: parseFloat(form.financing_amount.replace(/\./g, '')),
        margin_percent: parseFloat(form.margin_percent),
        tenor_months: parseInt(form.tenor_months),
        collateral: collateralPayload,
        status: 'collateral_validation',
      })
      .select().single();

    if (insertErr || !request) { setError('Gagal menyimpan permintaan. Coba lagi.'); setLoading(false); return; }

    const res = await fetch('/api/data-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: request.id }),
    });

    if (res.ok) router.push(`/branch/status?id=${request.id}`);
    else { setError('Proses validasi gagal. Coba beberapa saat lagi.'); setLoading(false); }
  };

  const formatCurrency = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <style>{STYLES}</style>
      <div className="br-root">
        <nav className="br-nav">
          <div className="nav-brand">
            <div className="nav-sigil">E</div>
            <span className="nav-name">Erlangga Legal</span>
          </div>
          <div className="nav-right">
            <span className="nav-role">Kantor Cabang</span>
            <button className="nav-logout" onClick={() => { supabase.auth.signOut(); router.push('/login'); }}>
              Keluar
            </button>
          </div>
        </nav>

        <div className="br-body">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Permintaan Baru</div>
              <h1 className="page-title">Formulir Pengajuan Akad</h1>
            </div>
            <div className="page-meta">
              {today}<br />
              <span style={{ color: 'rgba(26,26,26,0.25)' }}>{userEmail}</span>
            </div>
          </div>

          {/* Steps */}
          <div className="steps-bar">
            {['Data Nasabah', 'Pembiayaan', 'Jaminan', 'Kirim'].map((s, i) => (
              <div key={i} className={`step ${i === 0 ? 'step-active' : ''}`}>
                <div className="step-num">{i + 1}</div>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Section 1: Nasabah */}
            <div className="section-card">
              <div className="section-head">
                <span className="section-title">Data Nasabah</span>
                <span className="section-badge badge-required">Wajib</span>
              </div>
              <div className="section-body">
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Nama lengkap <span className="req-star">*</span></label>
                    <input className="field-input" placeholder="Sesuai KTP" value={form.customer_name}
                      onChange={e => set('customer_name', e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="field-label">Nomor KTP <span className="req-star">*</span></label>
                    <input className="field-input" placeholder="16 digit NIK" value={form.customer_id_number}
                      onChange={e => set('customer_id_number', e.target.value)}
                      maxLength={16} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Pembiayaan */}
            <div className="section-card">
              <div className="section-head">
                <span className="section-title">Struktur Pembiayaan</span>
                <span className="section-badge badge-required">Wajib</span>
              </div>
              <div className="section-body">
                <div className="field-row three">
                  <div className="field">
                    <label className="field-label">Nilai pembiayaan <span className="req-star">*</span></label>
                    <div className="currency-wrap">
                      <span className="currency-prefix">Rp</span>
                      <input className="field-input" placeholder="0" value={form.financing_amount}
                        onChange={e => set('financing_amount', formatCurrency(e.target.value))}
                        required />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Margin (%)</label>
                    <input className="field-input" type="number" step="0.1" min="0" max="30"
                      value={form.margin_percent}
                      onChange={e => set('margin_percent', e.target.value)} />
                    <span className="field-hint">Contoh: 5 untuk 5%</span>
                  </div>
                  <div className="field">
                    <label className="field-label">Tenor (bulan) <span className="req-star">*</span></label>
                    <select className="field-select" value={form.tenor_months}
                      onChange={e => set('tenor_months', e.target.value)}>
                      {[6,12,18,24,36,48,60,84,120,180,240].map(t => (
                        <option key={t} value={t}>{t} bulan</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Jaminan */}
            <div className="section-card">
              <div className="section-head">
                <span className="section-title">Objek Jaminan</span>
                <span className="section-badge badge-required">Wajib</span>
              </div>
              <div className="section-body">
                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Jenis jaminan <span className="req-star">*</span></label>
                    <select className="field-select" value={form.collateral_type}
                      onChange={e => set('collateral_type', e.target.value as CollateralType)}>
                      <option value="tanah_shm">Tanah — SHM</option>
                      <option value="tanah_shgb">Tanah — SHGB</option>
                      <option value="bangunan">Bangunan / Ruko / Rumah</option>
                      <option value="kendaraan_roda4">Kendaraan roda 4</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Status kepemilikan <span className="req-star">*</span></label>
                    <select className="field-select" value={form.ownership_status}
                      onChange={e => set('ownership_status', e.target.value as OwnershipStatus)}>
                      <option value="hak_milik_pribadi">Hak milik pribadi</option>
                      <option value="harta_bersama">Harta bersama suami-istri</option>
                      <option value="warisan_belum_dibagi">Warisan belum dibagi</option>
                      <option value="kuasa">Atas kuasa pemilik</option>
                    </select>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Nama pemilik jaminan <span className="req-star">*</span></label>
                    <input className="field-input" placeholder="Sesuai sertifikat / BPKB"
                      value={form.owner_name} onChange={e => set('owner_name', e.target.value)} required />
                  </div>
                  <div className="field">
                    <label className="field-label">
                      {isVehicle ? 'Nomor BPKB / Polisi' : 'Nomor sertifikat'}
                    </label>
                    <input className="field-input"
                      placeholder={isVehicle ? 'B 1234 XYZ' : 'No. sertifikat'}
                      value={form.certificate_number}
                      onChange={e => set('certificate_number', e.target.value)} />
                  </div>
                </div>

                {isLandType && (
                  <div className="field-row">
                    <div className="field">
                      <label className="field-label">Alamat jaminan <span className="req-star">*</span></label>
                      <input className="field-input" placeholder="Alamat lengkap lokasi jaminan"
                        value={form.address} onChange={e => set('address', e.target.value)} required />
                    </div>
                    <div className="field">
                      <label className="field-label">Luas (m²)</label>
                      <input className="field-input" type="number" placeholder="Luas tanah/bangunan"
                        value={form.area_m2} onChange={e => set('area_m2', e.target.value)} />
                    </div>
                  </div>
                )}

                {isVehicle && (
                  <div className="field-row">
                    <div className="field">
                      <label className="field-label">Tahun kendaraan</label>
                      <input className="field-input" type="number" placeholder="Contoh: 2019"
                        value={form.vehicle_year} onChange={e => set('vehicle_year', e.target.value)} />
                    </div>
                    <div className="field" style={{ justifyContent: 'flex-end' }}>
                      <label className="field-label">Status STNK</label>
                      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        {[{ v: true, l: 'Aktif' }, { v: false, l: 'Kadaluarsa' }].map(opt => (
                          <label key={String(opt.v)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: form.stnk_active === opt.v ? '#1a1a1a' : 'rgba(26,26,26,0.45)' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${form.stnk_active === opt.v ? '#c0a062' : 'rgba(26,26,26,0.2)'}`, background: form.stnk_active === opt.v ? '#c0a062' : 'white', transition: 'all 0.15s' }}
                              onClick={() => set('stnk_active', opt.v)} />
                            {opt.l}
                          </label>
                        ))}
                      </div>
                      {!form.stnk_active && (
                        <span className="field-hint" style={{ color: '#8a6e3a', marginTop: 6 }}>
                          AI akan menyarankan jalur solusi perpanjangan STNK
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Conditional: Warisan */}
                {showHeirsFields && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a6e3a', marginBottom: 10 }}>
                      Kondisi warisan
                    </div>
                    <label className="check-row" onClick={() => set('heirs_involved', !form.heirs_involved)}>
                      <div className={`check-box ${form.heirs_involved ? 'checked' : ''}`}>
                        {form.heirs_involved && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0c0d0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="check-text">
                        <div className="check-title">Seluruh ahli waris telah setuju</div>
                        <div className="check-desc">Semua ahli waris yang tercantum dalam surat keterangan waris menyetujui penggunaan aset sebagai jaminan</div>
                      </div>
                    </label>
                    <label className="check-row" onClick={() => set('heirs_certificate', !form.heirs_certificate)}>
                      <div className={`check-box ${form.heirs_certificate ? 'checked' : ''}`}>
                        {form.heirs_certificate && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0c0d0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="check-text">
                        <div className="check-title">Surat keterangan waris tersedia</div>
                        <div className="check-desc">Dokumen surat waris dari kelurahan / pengadilan agama sudah dimiliki</div>
                      </div>
                    </label>
                    {!form.heirs_involved && (
                      <div className="risk-panel">
                        <svg className="risk-icon" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2L2 17h16L10 2z" stroke="#8a6e3a" strokeWidth="1.2" strokeLinejoin="round"/>
                          <path d="M10 8v4M10 14v1" stroke="#8a6e3a" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        <div className="risk-body">
                          <div className="risk-label">Perhatian AI</div>
                          <div className="risk-text">Jaminan warisan tanpa persetujuan seluruh ahli waris berpotensi batal demi hukum. AI akan menyiapkan jalur solusi dan klausul pengamanan.</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional: Harta bersama */}
                {showSpouseConsent && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a6e3a', marginBottom: 10 }}>
                      Persetujuan pasangan
                    </div>
                    <label className="check-row" onClick={() => set('spouse_consent', !form.spouse_consent)}>
                      <div className={`check-box ${form.spouse_consent ? 'checked' : ''}`}>
                        {form.spouse_consent && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#0c0d0f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="check-text">
                        <div className="check-title">Pasangan telah memberikan persetujuan tertulis</div>
                        <div className="check-desc">Surat persetujuan bermaterai Rp10.000 dari suami/istri tersedia dan siap dilampirkan</div>
                      </div>
                    </label>
                    {!form.spouse_consent && (
                      <div className="risk-panel">
                        <svg className="risk-icon" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2L2 17h16L10 2z" stroke="#8a6e3a" strokeWidth="1.2" strokeLinejoin="round"/>
                          <path d="M10 8v4M10 14v1" stroke="#8a6e3a" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        <div className="risk-body">
                          <div className="risk-label">Wajib hukum</div>
                          <div className="risk-text">UU Perkawinan No.1/1974 Pasal 36 — harta bersama tidak dapat dijaminkan tanpa persetujuan kedua pihak. AI akan menyiapkan template surat persetujuan.</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Catatan */}
            <div className="section-card">
              <div className="section-head">
                <span className="section-title">Catatan Tambahan</span>
                <span className="section-badge badge-optional">Opsional</span>
              </div>
              <div className="section-body">
                <div className="field">
                  <label className="field-label">Informasi khusus untuk analis</label>
                  <textarea className="field-textarea"
                    placeholder="Kondisi khusus jaminan, riwayat kepemilikan, atau informasi lain yang relevan untuk analisa hukum…"
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)} />
                  <span className="field-hint">Semakin detail konteks yang diberikan, semakin akurat analisa AI</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="submit-area">
              <p className="submit-note">
                Setelah dikirim, AI akan menganalisa kelengkapan dan risiko hukum jaminan.
                Hasil analisa dan draft kontrak akan tersedia dalam beberapa menit.
              </p>
              <button className="submit-btn" type="submit" disabled={loading || !branchId}>
                {loading ? (
                  <><div className="spinner" />Memproses…</>
                ) : (
                  <>Kirim untuk analisa</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
