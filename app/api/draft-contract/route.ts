import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
export async function POST(req: NextRequest) {
  try {
    const { request_id } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });
    const { data: request } = await supabase.from('contract_requests').select('*').eq('id', request_id).single();
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const prompt = `Buat draft akad Murabahah untuk nasabah ${request.customer_name}, nilai Rp ${request.financing_amount}, margin ${request.margin_percent}%, tenor ${request.tenor_months} bulan. Output dalam bahasa Indonesia formal.`;
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.3 })
    });
    const data = await res.json();
    const draft = data.choices[0].message.content;
    await supabase.from('contract_requests').update({ ai_generated_draft: draft, status: 'erlangga_review' }).eq('id', request_id);
    return NextResponse.json({ success: true, draft });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
