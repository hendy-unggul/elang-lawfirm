'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const router = useRouter();
  useEffect(() => { supabase.from('contract_requests').select('*, branches(name)').eq('id', id).single().then(({ data }) => setRequest(data)); }, [id]);
  const handleApprove = async (escalate: boolean) => {
    const update: any = { erlangga_status: 'approved', erlangga_notes: notes, status: escalate ? 'bsi_legal_review' : 'approved' };
    if (!escalate) update.final_status = 'final_approved';
    await supabase.from('contract_requests').update(update).eq('id', id);
    router.push('/lawyer');
  };
  const generateDraft = async () => {
    const res = await fetch('/api/draft-contract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: id }) });
    if (res.ok) alert('Draft generated, refresh');
  };
  if (!request) return <div>Loading...</div>;
  const validation = request.collateral_validation_result || {};
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Request: {request.request_number}</h1>
      <div className="bg-gray-50 p-4 my-4"><p><strong>Cabang:</strong> {request.branches?.name}</p><p><strong>Nasabah:</strong> {request.customer_name}</p><p><strong>Nilai:</strong> Rp {request.financing_amount?.toLocaleString()}</p></div>
      <div className="border p-4 my-4"><h2 className="font-bold">Validasi Jaminan</h2><pre>{JSON.stringify(validation, null, 2)}</pre></div>
      {request.ai_generated_draft && (<div className="border p-4 my-4"><h2 className="font-bold">Draf Akad</h2><pre className="whitespace-pre-wrap text-sm">{request.ai_generated_draft}</pre></div>)}
      <textarea className="w-full border p-2" rows={3} placeholder="Catatan lawyer" value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="flex gap-2 mt-4">
        {!request.ai_generated_draft && <button onClick={generateDraft} className="bg-green-600 text-white px-4 py-2 rounded">Generate Draft</button>}
        <button onClick={() => handleApprove(false)} className="bg-blue-600 text-white px-4 py-2 rounded">Approve</button>
        <button onClick={() => handleApprove(true)} className="bg-yellow-600 text-white px-4 py-2 rounded">Eskalasi ke BSI</button>
      </div>
    </div>
  );
}
