import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// MODEL PROVIDER CONFIG
// Ganti provider di sini saat pindah ke Claude / OpenRouter
// ============================================================
const PROVIDER: 'deepseek' | 'claude' | 'openrouter' = 'deepseek';

const PROVIDERS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (systemPrompt: string, userPrompt: string) => ({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
    extractText: (data: any) => data.choices?.[0]?.message?.content || '',
  },

  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (systemPrompt: string, userPrompt: string) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    extractText: (data: any) => data.content?.[0]?.text || '',
  },

  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'anthropic/claude-sonnet-4',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://elang-lawfirm.vercel.app',
      'X-Title': 'Erlangga Legal Intelligence',
    }),
    buildBody: (systemPrompt: string, userPrompt: string) => ({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
    extractText: (data: any) => data.choices?.[0]?.message?.content || '',
  },
};

// ============================================================
// SYSTEM PROMPT — Legal Intelligence Core
// ============================================================
const SYSTEM_PROMPT = `Kamu adalah AI Legal Analyst spesialis hukum jaminan kredit perbankan syariah Indonesia.

Keahlianmu:
- Hukum jaminan: APHT, fidusia, gadai, SKMHT
- Regulasi OJK: POJK No.31/2016, POJK No.77/2016
- Fatwa DSN-MUI: Murabahah, Musyarakah, Ijarah
- UU Perkawinan No.1/1974 (harta bersama, persetujuan pasangan)
- Hukum Waris Islam dan perdata (ahli waris, surat keterangan waris)
- UU Agraria dan BPN (SHM, SHGB, HGB, pendaftaran APHT)

Filosofi kerjamu:
- BUKAN sekadar gate checker yang menolak — kamu problem solver
- Setiap masalah hukum PASTI ada jalur solusinya
- Berikan 2-3 opsi solusi dengan trade-off masing-masing
- Tingkat risiko bukan alasan menolak, tapi panduan mitigasi
- Bahasa: profesional tapi dapat dipahami petugas lapangan

Output HARUS berupa JSON valid dengan struktur berikut:
{
  "risk_level": "rendah" | "sedang" | "tinggi",
  "risk_score": <angka 0-100>,
  "summary": "<ringkasan singkat 1-2 kalimat>",
  "recommendation": "<analisa lengkap dan rekomendasi tindakan>",
  "issues": [
    {
      "level": "tinggi" | "sedang" | "rendah",
      "category": "<kategori: identitas | kepemilikan | dokumen | harta_bersama | warisan | legalitas>",
      "text": "<deskripsi isu dan implikasi hukumnya>",
      "solution": "<jalur solusi konkret>"
    }
  ],
  "suggested_clauses": [
    "<klausul kontrak lengkap yang disarankan — siap pakai>"
  ],
  "documents_required": [
    {
      "name": "<nama dokumen>",
      "priority": "wajib" | "pendukung" | "kondisional",
      "reason": "<alasan diperlukan>"
    }
  ],
  "compliance_notes": {
    "ojk": "<catatan kepatuhan OJK>",
    "dsn_mui": "<catatan fatwa DSN-MUI yang relevan>",
    "civil_law": "<catatan hukum perdata/agraria>"
  }
}

Jangan tambahkan teks apapun di luar JSON.`;

// ============================================================
// BUILD USER PROMPT dari data request
// ============================================================
function buildUserPrompt(request: any): string {
  const c = request.collateral || {};
  const d = c.details || {};

  const jaminanDesc: Record<string, string> = {
    tanah_shm: 'Tanah dengan Sertifikat Hak Milik (SHM)',
    tanah_shgb: 'Tanah dengan Sertifikat Hak Guna Bangunan (SHGB)',
    bangunan: 'Bangunan / Rumah / Ruko',
    kendaraan_roda4: 'Kendaraan roda empat',
  };

  const ownershipDesc: Record<string, string> = {
    hak_milik_pribadi: 'Hak milik pribadi',
    harta_bersama: 'Harta bersama suami-istri',
    warisan_belum_dibagi: 'Warisan belum dibagi',
    kuasa: 'Atas kuasa pemilik',
  };

  let prompt = `Analisa permintaan pembiayaan murabahah berikut:

=== DATA PEMBIAYAAN ===
Nasabah        : ${request.customer_name}
NIK            : ${request.customer_id_number || 'Tidak diberikan'}
Nilai          : Rp ${Number(request.financing_amount).toLocaleString('id-ID')}
Margin         : ${request.margin_percent}%
Tenor          : ${request.tenor_months} bulan
Jenis akad     : ${request.contract_type || 'Murabahah'}

=== DATA JAMINAN ===
Jenis          : ${jaminanDesc[c.type] || c.type}
Atas nama      : ${d.owner_name || 'Tidak diberikan'}
Status kepemilikan: ${ownershipDesc[d.ownership_status] || d.ownership_status}
`;

  if (c.type === 'kendaraan_roda4') {
    prompt += `Nomor polisi   : ${d.vehicle_plate || 'Tidak diberikan'}
Tahun kendaraan: ${d.vehicle_year || 'Tidak diberikan'}
Status STNK    : ${d.stnk_active === false ? 'KADALUARSA — perlu penanganan khusus' : 'Aktif'}
`;
  }

  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(c.type)) {
    prompt += `Nomor sertifikat: ${d.certificate_number || 'Tidak diberikan'}
Alamat jaminan : ${d.address || 'Tidak diberikan'}
Luas           : ${d.area_m2 ? d.area_m2 + ' m²' : 'Tidak diberikan'}
`;
  }

  if (d.ownership_status === 'warisan_belum_dibagi') {
    prompt += `\n=== KONDISI WARISAN ===
Seluruh ahli waris setuju: ${d.heirs_involved ? 'Ya' : 'BELUM / TIDAK DIKONFIRMASI'}
Surat keterangan waris ada: ${d.heirs_certificate ? 'Ya' : 'Belum ada'}
`;
  }

  if (d.ownership_status === 'harta_bersama') {
    prompt += `\n=== HARTA BERSAMA ===
Persetujuan pasangan: ${d.spouse_consent ? 'Sudah ada' : 'BELUM ADA — perlu persetujuan notariil'}
`;
  }

  if (d.notes) {
    prompt += `\n=== CATATAN PETUGAS CABANG ===
${d.notes}
`;
  }

  prompt += `
Berikan analisa hukum lengkap, identifikasi semua risiko, dan berikan jalur solusi konkret untuk setiap masalah yang ditemukan. Ingat: tugasmu adalah membantu menemukan solusi, bukan sekadar menolak.`;

  return prompt;
}

// ============================================================
// MAIN HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { request_id } = await req.json();
    if (!request_id) {
      return NextResponse.json({ error: 'request_id diperlukan' }, { status: 400 });
    }

    // Init Supabase dengan service role untuk akses penuh
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ambil data request
    const { data: request, error: fetchErr } = await supabase
      .from('contract_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    // Ambil API key
    const provider = PROVIDERS[PROVIDER];
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      return NextResponse.json({ error: `${provider.apiKeyEnv} tidak dikonfigurasi` }, { status: 500 });
    }

    // Build prompts
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(request);

    // Call AI
    const aiResponse = await fetch(provider.url, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: JSON.stringify(provider.buildBody(systemPrompt, userPrompt)),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', errText);
      return NextResponse.json({ error: 'AI service error', detail: errText }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const rawText = provider.extractText(aiData);

    // Parse JSON dari response
    let validationResult: any;
    try {
      // Bersihkan jika ada markdown fence
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      validationResult = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse error, raw:', rawText);
      // Fallback structure jika parse gagal
      validationResult = {
        risk_level: 'sedang',
        risk_score: 50,
        summary: 'Analisa selesai. Mohon review manual diperlukan.',
        recommendation: rawText,
        issues: [],
        suggested_clauses: [],
        documents_required: [],
        compliance_notes: {},
      };
    }

    // Simpan hasil ke Supabase
    const { error: updateErr } = await supabase
      .from('contract_requests')
      .update({
        collateral_validation_result: validationResult,
        status: 'under_review',
        validated_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    if (updateErr) {
      console.error('Supabase update error:', updateErr);
      return NextResponse.json({ error: 'Gagal menyimpan hasil' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request_id,
      risk_level: validationResult.risk_level,
      risk_score: validationResult.risk_score,
    });

  } catch (err: any) {
    console.error('Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
