'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
export default function BranchDashboard() {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({ customer_name: '', financing_amount: '', margin_percent: '5', tenor_months: '12', collateral: { type: 'tanah_shm', details: { owner_name: '', ownership_status: 'Hak Milik pribadi', heirs_involved: false, heirs_certificate: false, notes: '' } } });
  useEffect(() => {
    const getBranch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('branch_id').eq('id', user.id).single();
        if (profile) setBranchId(profile.branch_id);
      }
    };
    getBranch();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return alert('Branch ID not found');
    setLoading(true);
    const { data: request, error } = await supabase.from('contract_requests').insert({ branch_id: branchId, contract_type: 'Murabahah', customer_name: form.customer_name, financing_amount: parseFloat(form.financing_amount), margin_percent: parseFloat(form.margin_percent), tenor_months: parseInt(form.tenor_months), collateral: form.collateral, status: 'collateral_validation' }).select().single();
    if (error) { alert('Gagal simpan'); setLoading(false); return; }
    const res = await fetch('/api/validate-collateral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: request.id }) });
    if (res.ok) router.push(`/branch/status?id=${request.id}`);
    else alert('Validasi gagal');
    setLoading(false);
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Form Permintaan Akad</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Nama Nasabah" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} required />
        <input className="w-full border p-2 rounded" placeholder="Nilai Pembiayaan (Rp)" type="number" value={form.financing_amount} onChange={e => setForm({...form, financing_amount: e.target.value})} required />
        <input className="w-full border p-2 rounded" placeholder="Margin (%)" type="number" step="0.1" value={form.margin_percent} onChange={e => setForm({...form, margin_percent: e.target.value})} />
        <input className="w-full border p-2 rounded" placeholder="Tenor (bulan)" type="number" value={form.tenor_months} onChange={e => setForm({...form, tenor_months: e.target.value})} />
        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Jaminan</h3>
          <select className="w-full border p-2 rounded mb-2" value={form.collateral.type} onChange={e => setForm({...form, collateral: {...form.collateral, type: e.target.value}})}><option value="tanah_shm">Tanah SHM</option><option value="kendaraan_roda4">Kendaraan</option></select>
          <input className="w-full border p-2 rounded mb-2" placeholder="Atas nama" value={form.collateral.details.owner_name} onChange={e => setForm({...form, collateral: {...form.collateral, details: {...form.collateral.details, owner_name: e.target.value}}})} />
          <select className="w-full border p-2 rounded mb-2" value={form.collateral.details.ownership_status} onChange={e => setForm({...form, collateral: {...form.collateral, details: {...form.collateral.details, ownership_status: e.target.value}}})}><option>Hak Milik pribadi</option><option>Warisan belum dibagi</option></select>
          {form.collateral.details.ownership_status === 'Warisan belum dibagi' && (<div className="bg-yellow-50 p-2 mb-2"><label className="block"><input type="checkbox" checked={form.collateral.details.heirs_involved} onChange={e => setForm({...form, collateral: {...form.collateral, details: {...form.collateral.details, heirs_involved: e.target.checked}}})} /> Ahli waris setuju?</label><label><input type="checkbox" checked={form.collateral.details.heirs_certificate} onChange={e => setForm({...form, collateral: {...form.collateral, details: {...form.collateral.details, heirs_certificate: e.target.checked}}})} /> Surat waris ada?</label></div>)}
          <textarea placeholder="Catatan khusus" className="w-full border p-2 rounded" rows={2} value={form.collateral.details.notes} onChange={e => setForm({...form, collateral: {...form.collateral, details: {...form.collateral.details, notes: e.target.value}}})} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Memproses...' : 'Kirim Permintaan'}</button>
      </form>
    </div>
  );
}
