import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
export async function POST(req: NextRequest) {
  try {
    const { request_id } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });
    const { data: request, error } = await supabase.from('contract_requests').select('*').eq('id', request_id).single();
    if (error || !request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const collateral = request.collateral;
    const prompt = `Anda AI validasi jaminan syariah. Data: jenis=${collateral.type}, status=${collateral.details?.ownership_status}, ahli waris terlibat=${collateral.details?.heirs_involved}, catatan=${collateral.details?.notes || '-'}. Output JSON: { "risk_level": "TINGGI/SEDANG/RENDAH", "flags": [], "recommendation": "...", "required_documents": [] }`;
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: 'json_object' } })
    });
    const aiResult = await deepseekRes.json();
    const validation = JSON.parse(aiResult.choices[0].message.content);
    const newStatus = validation.risk_level === 'TINGGI' ? 'collateral_rejected' : 'drafting';
    await supabase.from('contract_requests').update({ collateral_validation_result: validation, status: newStatus }).eq('id', request_id);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
