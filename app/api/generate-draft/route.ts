import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PROVIDER: 'deepseek' | 'claude' | 'openrouter' = 'deepseek';

const PROVIDERS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    buildHeaders: (k: string) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }),
    buildBody: (sys: string, usr: string) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
      temperature: 0.1, max_tokens: 6000,
      response_format: { type: 'json_object' },
    }),
    extractText: (d: any) => d.choices?.[0]?.message?.content || '',
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    buildHeaders: (k: string) => ({ 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' }),
    buildBody: (sys: string, usr: string) => ({ model: 'claude-sonnet-4-20250514', max_tokens: 6000, system: sys, messages: [{ role: 'user', content: usr }] }),
    extractText: (d: any) => d.content?.[0]?.text || '',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    buildHeaders: (k: string) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}`, 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || '', 'X-Title': 'Erlangga Legal Intelligence' }),
    buildBody: (sys: string, usr: string) => ({ model: 'anthropic/claude-sonnet-4', messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }], temperature: 0.1, max_tokens: 6000, response_format: { type: 'json_object' } }),
    extractText: (d: any) => d.choices?.[0]?.message?.content || '',
  },
};

// ============================================================
// SYSTEM PROMPT — DRAFT KONTRAK GENERATOR
// ============================================================
const DRAFT_SYSTEM_PROMPT = `Kamu adalah notaris dan ahli hukum perbankan syariah yang bertugas menyusun draft akad pembiayaan.

STANDAR YANG HARUS DIPENUHI:
- Sesuai fatwa DSN-MUI yang berlaku (Murabahah No.4, Musyarakah No.8, dst)
- Compliant dengan POJK perbankan syariah terkini
- Sesuai UU UUHT No.4/1996 (jika jaminan tanah) atau UU Fidusia No.42/1999 (kendaraan)
- Sesuai UU Perkawinan No.1/1974 jika melibatkan harta bersama
- Mengakomodasi semua klausul pengamanan yang sudah diidentifikasi dari analisa risiko

STRUKTUR AKAD YANG WAJIB ADA:
1. Pembukaan: komparisi (identitas para pihak) + dasar hukum
2. Definisi dan interpretasi
3. Pokok akad (objek, harga, margin, mekanisme pembayaran)
4. Jangka waktu dan pelunasan
5. Jaminan: jenis, pengikatan, APHT/fidusia
6. Hak dan kewajiban bank
7. Hak dan kewajiban debitur/nasabah
8. Klausul khusus (dari analisa risiko — wajib dimasukkan semua)
9. Wanprestasi dan konsekuensi
10. Penyelesaian sengketa (Pengadilan Agama sesuai UU No.3/2006)
11. Ketentuan lain (force majeure, asuransi, dsb)
12. Penutup dan tanda tangan

GAYA PENULISAN:
- Bahasa hukum Indonesia formal yang tepat
- Setiap pasal bernomor dengan judul
- Referensikan nomor fatwa/pasal regulasi di footnote atau dalam teks
- Placeholder dalam format [NAMA] atau [TANGGAL] untuk data yang belum final

OUTPUT WAJIB berupa JSON valid:
{
  "contract_type": "Akad Pembiayaan Murabahah" atau sesuai akad,
  "contract_title": "<judul lengkap akad>",
  "parties": {
    "bank": { "name": "[NAMA BANK]", "address": "[ALAMAT BANK]", "represented_by": "[NAMA DIREKSI]", "position": "[JABATAN]" },
    "debtor": { "name": "<nama nasabah>", "nik": "<NIK>", "address": "[ALAMAT NASABAH]" },
    "guarantor": { "name": "<nama pemilik jaminan jika berbeda>", "nik": "[NIK PENJAMIN]", "relationship": "<hubungan dengan nasabah>" }
  },
  "preamble": "<paragraf pembukaan formal>",
  "articles": [
    {
      "number": 1,
      "title": "<judul pasal>",
      "content": "<isi pasal lengkap dalam bahasa hukum formal>",
      "sub_articles": ["<ayat 1>", "<ayat 2>", "..."]
    }
  ],
  "special_clauses": [
    {
      "title": "<judul klausul khusus dari analisa risiko>",
      "content": "<isi klausul lengkap>",
      "basis": "<dasar hukum/alasan dimasukkan>"
    }
  ],
  "closing": "<paragraf penutup formal>",
  "signature_block": {
    "bank_signatory": "________________________________\n[NAMA DIREKSI]\n[JABATAN]",
    "debtor_signatory": "________________________________\n[NAMA NASABAH]\nNasabah/Debitur",
    "guarantor_signatory": "________________________________\n[NAMA PENJAMIN]\nPenjamin",
    "witness_block": "Saksi-saksi:\n1. ____________________\n2. ____________________",
    "notary_block": "Dibuat dan ditandatangani di hadapan:\n[NAMA NOTARIS]\nNotaris di [KOTA]\nSK No. [NOMOR SK]"
  },
  "metadata": {
    "draft_version": "1.0",
    "generated_at": "<timestamp>",
    "applicable_regulations": ["<daftar regulasi yang dirujuk>"],
    "notes_for_notary": "<catatan penting untuk notaris yang akan finalisasi>",
    "pending_items": ["<item yang masih perlu dilengkapi sebelum akad ditandatangani>"]
  }
}

Jangan tambahkan teks apapun di luar JSON.`;

// ============================================================
// BUILD DRAFT PROMPT
// ============================================================
function buildDraftPrompt(req: any): string {
  const c = req.collateral || {};
  const d = c.details || {};
  const v = req.collateral_validation_result || {};
  const intel = req.data_intelligence_result || {};

  const jaminanFull: Record<string, string> = {
    tanah_shm: 'Tanah dengan Sertifikat Hak Milik (SHM)',
    tanah_shgb: 'Tanah dengan Sertifikat Hak Guna Bangunan (SHGB)',
    bangunan: 'Bangunan/Rumah/Ruko beserta tanah',
    kendaraan_roda4: 'Kendaraan bermotor roda empat (fidusia)',
  };

  const ikatanJaminan = ['tanah_shm', 'tanah_shgb', 'bangunan'].includes(c.type)
    ? 'Akta Pemberian Hak Tanggungan (APHT) sesuai UU UUHT No.4/1996'
    : 'Akta Jaminan Fidusia sesuai UU No.42/1999';

  let prompt = `Susun draft akad pembiayaan lengkap berdasarkan data berikut:

=== PARA PIHAK ===
Nasabah/Debitur    : ${req.customer_name}
NIK Nasabah        : ${req.customer_id_number || '[NIK NASABAH]'}
Pemilik Jaminan    : ${d.owner_name || req.customer_name}
Status Kepemilikan : ${d.ownership_status || 'hak_milik_pribadi'}
${d.ownership_status === 'harta_bersama' ? 'Pasangan Nasabah  : [NAMA PASANGAN] (persetujuan terlampir)' : ''}
${d.ownership_status === 'warisan_belum_dibagi' ? 'Ahli Waris        : [DAFTAR AHLI WARIS dari surat keterangan waris]' : ''}

=== STRUKTUR PEMBIAYAAN ===
Jenis Akad         : ${req.contract_type || 'Murabahah'}
Nilai Pembiayaan   : Rp ${Number(req.financing_amount).toLocaleString('id-ID')}
Margin             : ${req.margin_percent}% flat
Harga Jual Total   : Rp ${(Number(req.financing_amount) * (1 + req.margin_percent / 100)).toLocaleString('id-ID')}
Tenor              : ${req.tenor_months} bulan
Est. Angsuran/bln  : Rp ${Math.round(Number(req.financing_amount) * (1 + req.margin_percent / 100) / req.tenor_months).toLocaleString('id-ID')}

=== DATA JAMINAN ===
Jenis Jaminan      : ${jaminanFull[c.type] || c.type}
Atas Nama          : ${d.owner_name || '[NAMA PEMILIK]'}
No. Sertifikat     : ${d.certificate_number || '[NOMOR SERTIFIKAT]'}
Alamat/Lokasi      : ${d.address || '[ALAMAT JAMINAN]'}
${d.area_m2 ? `Luas               : ${d.area_m2} m²` : ''}
${c.type === 'kendaraan_roda4' ? `No. Polisi         : ${d.vehicle_plate || '[NOMOR POLISI]'}` : ''}
Mekanisme Ikatan   : ${ikatanJaminan}
FTV Direkomendasikan: ${v.ftv_assessment?.recommended_max_ftv || 80}%
`;

  // Klausul khusus dari analisa risiko
  const suggestedClauses: string[] = v.suggested_clauses || [];
  if (suggestedClauses.length > 0) {
    prompt += `
=== KLAUSUL KHUSUS DARI ANALISA RISIKO (WAJIB DIMASUKKAN) ===
${suggestedClauses.map((cl, i) => `${i + 1}. ${cl}`).join('\n\n')}
`;
  }

  // Isu kritis yang perlu diakomodasi
  const criticalIssues = (v.issues || []).filter((iss: any) => {
    const lvl = (iss.level || '').toLowerCase();
    return lvl === 'tinggi' || lvl === 'high';
  });

  if (criticalIssues.length > 0) {
    prompt += `
=== ISU KRITIS YANG HARUS DIAKOMODASI DALAM AKAD ===
${criticalIssues.map((iss: any, i: number) => `${i + 1}. ${typeof iss === 'string' ? iss : iss.text || ''}`).join('\n')}
`;
  }

  // Korelasi kritis dari intelligence
  const critCorr = (intel.correlations_found || []).filter((c: any) => c.severity === 'kritis');
  if (critCorr.length > 0) {
    prompt += `
=== TEMUAN DATA INTELLIGENCE YANG HARUS DIPERHATIKAN ===
${critCorr.map((c: any, i: number) => `${i + 1}. ${c.finding} — Dasar: ${c.legal_basis}`).join('\n')}
`;
  }

  // Kondisi khusus
  if (d.ownership_status === 'harta_bersama' && !d.spouse_consent) {
    prompt += `\nPERHATIAN: Klausul persetujuan pasangan harus ada sebelum akad ditandatangani.\n`;
  }
  if (d.ownership_status === 'warisan_belum_dibagi') {
    prompt += `\nPERHATIAN: Akad ini melibatkan aset warisan. Semua ahli waris harus hadir atau diwakili secara sah.\n`;
  }
  if (d.stnk_active === false) {
    prompt += `\nPERHATIAN: STNK kendaraan kadaluarsa. Klausul kewajiban perpanjangan STNK harus ada.\n`;
  }

  prompt += `
=== CATATAN NOTARIS DARI PETUGAS CABANG ===
${d.notes || '(tidak ada catatan khusus)'}

Susun akad yang lengkap, formal, dan siap digunakan sebagai dasar penandatanganan. Semua klausul pengamanan dari analisa risiko WAJIB dimasukkan ke pasal yang tepat.`;

  return prompt;
}

// ============================================================
// MAIN HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { request_id } = await req.json();
    if (!request_id) return NextResponse.json({ error: 'request_id diperlukan' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: request, error: fetchErr } = await supabase
      .from('contract_requests').select('*').eq('id', request_id).single();

    if (fetchErr || !request) return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });

    // Hanya bisa generate jika sudah ada analisa
    if (!request.collateral_validation_result?.risk_level) {
      return NextResponse.json({ error: 'Analisa hukum belum selesai. Jalankan validate-collateral terlebih dahulu.' }, { status: 400 });
    }

    const provider = PROVIDERS[PROVIDER];
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) return NextResponse.json({ error: `${provider.apiKeyEnv} tidak dikonfigurasi` }, { status: 500 });

    const aiRes = await fetch(provider.url, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: JSON.stringify(provider.buildBody(DRAFT_SYSTEM_PROMPT, buildDraftPrompt(request))),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return NextResponse.json({ error: 'AI service error', detail: err }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const raw = provider.extractText(aiData);

    let draft: any;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      draft = JSON.parse(cleaned);
    } catch {
      draft = { error: 'Parse failed', raw_text: raw };
    }

    // Simpan draft ke database
    await supabase.from('contract_requests').update({
      draft_contract: { ...draft, generated_at: new Date().toISOString() },
      status: 'draft_ready',
      draft_generated_at: new Date().toISOString(),
    }).eq('id', request_id);

    return NextResponse.json({
      success: true,
      request_id,
      contract_type: draft.contract_type,
      articles_count: draft.articles?.length || 0,
      special_clauses_count: draft.special_clauses?.length || 0,
      pending_items: draft.metadata?.pending_items || [],
    });

  } catch (err: any) {
    console.error('generate-draft error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
