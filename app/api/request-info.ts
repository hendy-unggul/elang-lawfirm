import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/request-info
// Lawyer meminta informasi tambahan ke cabang
// Body: { request_id, questions: string[] }

export async function POST(req: NextRequest) {
  try {
    const { request_id, questions } = await req.json();

    if (!request_id || !questions?.length) {
      return NextResponse.json({ error: 'request_id dan questions diperlukan' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ambil data existing info_requests
    const { data: existing } = await supabase
      .from('contract_requests')
      .select('info_requests')
      .eq('id', request_id)
      .single();

    const previousRequests = existing?.info_requests || [];

    const newInfoRequest = {
      id: crypto.randomUUID(),
      asked_at: new Date().toISOString(),
      questions,
      status: 'pending',
      answered_at: null,
      answers: [],
    };

    const { error } = await supabase
      .from('contract_requests')
      .update({
        status: 'info_requested',
        info_requests: [...previousRequests, newInfoRequest],
      })
      .eq('id', request_id);

    if (error) {
      return NextResponse.json({ error: 'Gagal menyimpan permintaan info' }, { status: 500 });
    }

    return NextResponse.json({ success: true, info_request_id: newInfoRequest.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
