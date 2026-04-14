import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/answer-info
// Cabang menjawab pertanyaan dari lawyer → trigger re-analisa AI
// Body: { request_id, info_request_id, answers: string[] }

export async function POST(req: NextRequest) {
  try {
    const { request_id, info_request_id, answers } = await req.json();

    if (!request_id || !info_request_id || !answers?.length) {
      return NextResponse.json({ error: 'request_id, info_request_id, dan answers diperlukan' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
      .from('contract_requests')
      .select('info_requests, collateral')
      .eq('id', request_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    // Update info_request yang dijawab
    const updatedInfoRequests = (existing.info_requests || []).map((ir: any) =>
      ir.id === info_request_id
        ? { ...ir, status: 'answered', answered_at: new Date().toISOString(), answers }
        : ir
    );

    // Append jawaban ke catatan jaminan agar AI bisa membacanya
    const existingNotes = existing.collateral?.details?.notes || '';
    const answersText = updatedInfoRequests
      .find((ir: any) => ir.id === info_request_id)
      ?.questions
      ?.map((q: string, i: number) => `T: ${q}\nJ: ${answers[i] || '(tidak dijawab)'}`)
      ?.join('\n\n') || '';

    const updatedCollateral = {
      ...existing.collateral,
      details: {
        ...existing.collateral?.details,
        notes: existingNotes
          ? `${existingNotes}\n\n--- Info tambahan dari cabang ---\n${answersText}`
          : `--- Info tambahan dari cabang ---\n${answersText}`,
      },
    };

    await supabase
      .from('contract_requests')
      .update({
        status: 'compliance_check',
        info_requests: updatedInfoRequests,
        collateral: updatedCollateral,
      })
      .eq('id', request_id);

    // Trigger re-analisa AI otomatis
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/validate-collateral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id }),
    }).catch(console.error); // fire-and-forget

    return NextResponse.json({ success: true, message: 'Jawaban disimpan, re-analisa AI dimulai' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
