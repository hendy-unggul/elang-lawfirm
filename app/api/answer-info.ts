import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { request_id, answers, questions } = await req.json();
    if (!request_id || !answers || !questions) {
      return NextResponse.json({ error: 'request_id, answers, questions diperlukan' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: request, error: fetchErr } = await supabase
      .from('contract_requests').select('info_requests').eq('id', request_id).single();

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    const infoReqs: any[] = request.info_requests || [];
    if (infoReqs.length === 0) {
      return NextResponse.json({ error: 'Tidak ada pertanyaan aktif' }, { status: 400 });
    }

    const updated = [...infoReqs];
    updated[updated.length - 1] = {
      ...updated[updated.length - 1],
      answers,
      answered_at: new Date().toISOString(),
      status: 'answered',
    };

    const { error } = await supabase
      .from('contract_requests')
      .update({ info_requests: updated, status: 'under_review' })
      .eq('id', request_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: 'under_review' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
