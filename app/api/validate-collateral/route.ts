import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PROVIDER: 'deepseek' | 'claude' | 'openrouter' = 'deepseek';

const PROVIDERS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (system: string, user: string) => ({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.15,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
    extractText: (d: any) => d.choices?.[0]?.message?.content || '',
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (system: string, user: string) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    extractText: (d: any) => d.content?.[0]?.text || '',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    buildHeaders: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || '',
      'X-Title': 'Erlangga Legal Intelligence',
    }),
    buildBody: (system: string, user: string) => ({
      model: 'anthropic/claude-sonnet-4',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.15,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
    extractText: (d: any) => d.choices?.[0]?.message?.content || '',
  },
};

interface FieldCheck {
  field: string;
  label: string;
  reason: string;
  regulation: string;
}

const MINIMUM_REQUIREMENTS: Record<string, FieldCheck[]> = {
  _common: [
    { field: 'customer_name', label: 'Nama nasabah', reason: 'Identitas debitur wajib tercantum dalam akad', regulation: 'UU Perbankan No.10/1998 Ps.8' },
    { field: 'customer_id_number', label: 'NIK nasabah', reason: 'Verifikasi identitas wajib sesuai ketentuan KYC/AML', regulation: 'POJK No.12/POJK.01/2017 (KYC)' },
    { field: 'financing_amount', label: 'Nilai pembiayaan', reason: 'Nilai pokok wajib ada untuk menghitung FTV dan APHT', regulation: 'POJK No.40/POJK.03/2019 Ps.24' },
    { field: 'tenor_months', label: 'Tenor pembiayaan', reason: 'Jangka waktu menentukan kesesuaian dengan masa berlaku jaminan', regulation: 'POJK No.31/POJK.05/2014 Ps.3' },
    { field: 'collateral.details.owner_name', label: 'Nama pemilik jaminan', reason: 'Identitas pemilik jaminan wajib untuk pengikatan APHT/fidusia', regulation: 'UU UUHT No.4/1996 Ps.8' },
    { field: 'collateral.details.ownership_status', label: 'Status kepemilikan', reason: 'Menentukan dokumen pendukung dan mekanisme pengikatan yang sah', regulation: 'KUHPerdata Ps.1320, UU Perkawinan No.1/1974 Ps.36' },
  ],
  tanah_shm: [
    { field: 'collateral.details.certificate_number', label: 'Nomor sertifikat SHM', reason: 'Nomor sertifikat wajib untuk pengecekan BPN dan pendaftaran APHT', regulation: 'PP No.24/1997 Ps.32, UU UUHT No.4/1996 Ps.13' },
    { field: 'collateral.details.address', label: 'Alamat/lokasi tanah', reason: 'Deskripsi objek APHT wajib memuat lokasi jelas', regulation: 'UU UUHT No.4/1996 Ps.11 ayat 1' },
  ],
  tanah_shgb: [
    { field: 'collateral.details.certificate_number', label: 'Nomor sertifikat SHGB', reason: 'Nomor sertifikat dan tanggal berakhir HGB wajib dicek', regulation: 'UU Agraria No.5/1960 Ps.35, PP No.40/1996' },
    { field: 'collateral.details.address', label: 'Alamat/lokasi', reason: 'Deskripsi objek APHT wajib memuat lokasi jelas', regulation: 'UU UUHT No.4/1996 Ps.11 ayat 1' },
  ],
  bangunan: [
    { field: 'collateral.details.certificate_number', label: 'Nomor sertifikat tanah', reason: 'Sertifikat tanah di bawah bangunan wajib untuk APHT', regulation: 'UU UUHT No.4/1996 Ps.4 ayat 4' },
    { field: 'collateral.details.address', label: 'Alamat bangunan', reason: 'Identifikasi objek jaminan wajib memuat alamat lengkap', regulation: 'UU UUHT No.4/1996 Ps.11 ayat 1' },
  ],
  kendaraan_roda4: [
    { field: 'collateral.details.certificate_number', label: 'Nomor BPKB/Polisi', reason: 'Identifikasi objek fidusia wajib memuat nomor kendaraan', regulation: 'UU Fidusia No.42/1999 Ps.6 huruf b' },
    { field: 'collateral.details.vehicle_year', label: 'Tahun kendaraan', reason: 'Umur kendaraan menentukan kelayakan dan nilai jaminan fidusia', regulation: 'POJK No.29/POJK.05/2014 Ps.10' },
  ],
};

const CONDITIONAL_REQUIREMENTS: Array<{ condition: (r: any) => boolean; checks: FieldCheck[] }> = [
  {
    condition: (r) => r.collateral?.details?.ownership_status === 'harta_bersama',
    checks: [{ field: 'collateral.details.spouse_consent', label: 'Persetujuan pasangan', reason: 'Harta bersama tidak dapat dijaminkan tanpa persetujuan kedua pihak', regulation: 'UU Perkawinan No.1/1974 Ps.36 ayat 1' }],
  },
  {
    condition: (r) => r.collateral?.details?.ownership_status === 'warisan_belum_dibagi',
    checks: [{ field: 'collateral.details.heirs_certificate', label: 'Surat keterangan waris', reason: 'Pengikatan jaminan warisan wajib didahului pembuktian hak waris', regulation: 'KHI Ps.171, Instruksi Dirjen Agraria No.4/1981' }],
  },
];

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

interface CompletenessResult {
  is_complete: boolean;
  missing_fields: Array<{ field: string; label: string; reason: string; regulation: string }>;
  warnings: Array<{ field: string; label: string; note: string }>;
}

function checkCompleteness(request: any): CompletenessResult {
  const missing: CompletenessResult['missing_fields'] = [];
  const warnings: CompletenessResult['warnings'] = [];
  const collateralType = request.collateral?.type || '';

  for (const check of MINIMUM_REQUIREMENTS._common) {
    const val = getNestedValue(request, check.field);
    if (!val && val !== 0 && val !== false) missing.push(check);
  }

  const typeChecks = MINIMUM_REQUIREMENTS[collateralType] || [];
  for (const check of typeChecks) {
    const val = getNestedValue(request, check.field);
    if (!val && val !== 0) missing.push(check);
  }

  for (const cond of CONDITIONAL_REQUIREMENTS) {
    if (cond.condition(request)) {
      for (const check of cond.checks) {
        const val = getNestedValue(request, check.field);
        if (!val) missing.push(check);
      }
    }
  }

  if (collateralType === 'kendaraan_roda4' && request.collateral?.details?.stnk_active === false) {
    warnings.push({ field: 'stnk_active', label: 'STNK kadaluarsa', note: 'STNK tidak aktif — AI akan menyarankan jalur solusi perpanjangan' });
  }
  if (!request.collateral?.details?.notes) {
    warnings.push({ field: 'notes', label: 'Catatan tambahan', note: 'Tidak ada catatan khusus — analisa berdasarkan data standar saja' });
  }

  return { is_complete: missing.length === 0, missing_fields: missing, warnings };
}

const SYSTEM_PROMPT = `Kamu adalah AI Legal Analyst spesialis hukum jaminan kredit perbankan syariah Indonesia dengan keahlian mendalam pada:

REGULASI UTAMA YANG WAJIB DIRUJUK:
1. OJK — Perbankan Syariah
   - POJK No.16/POJK.03/2023 (Prinsip kehati-hatian bank syariah)
   - POJK No.40/POJK.03/2019 (Penilaian kualitas aset bank umum)
   - POJK No.31/POJK.05/2014 (Penyelenggaraan usaha pembiayaan syariah)
   - POJK No.12/POJK.01/2017 (Penerapan program APU PPT — KYC)
   - SE OJK No.24/SEOJK.03/2021 (Penilaian kualitas aset)

2. DSN-MUI — Fatwa yang berlaku
   - Fatwa No.4/DSN-MUI/IV/2000 (Murabahah)
   - Fatwa No.8/DSN-MUI/IV/2000 (Musyarakah)
   - Fatwa No.9/DSN-MUI/IV/2000 (Ijarah)
   - Fatwa No.92/DSN-MUI/IV/2014 (Pembiayaan yang disertai rahn)
   - Fatwa No.115/DSN-MUI/IX/2017 (Akad wakalah bil ujrah)

3. Hukum Jaminan
   - UU UUHT No.4/1996 (Hak Tanggungan atas tanah)
   - UU Fidusia No.42/1999 (Jaminan fidusia kendaraan)
   - PP No.21/2015 (Tata cara pendaftaran fidusia)
   - UU Agraria No.5/1960 + PP No.24/1997 (Pendaftaran tanah)

4. Hukum Perdata Terkait
   - UU Perkawinan No.1/1974 Ps.36 (harta bersama)
   - KUHPerdata Ps.1131-1149 (jaminan umum)
   - KHI Ps.171-214 (waris Islam)

FILOSOFI ANALISA:
- Setiap masalah hukum WAJIB disertai minimal 2 jalur solusi konkret
- Risk rating berdasarkan dampak ke bank jika terjadi sengketa
- Klausul yang disarankan harus siap pakai, bukan template generik
- Bahasa profesional tapi dapat dipahami lawyer non-spesialis

OUTPUT WAJIB berupa JSON valid persis dengan struktur ini:
{
  "stage2_compliance": {
    "ojk_status": "compliant" | "non_compliant" | "needs_clarification",
    "ojk_findings": ["<temuan spesifik dengan nomor pasal>"],
    "dsn_mui_status": "compliant" | "non_compliant" | "needs_clarification",
    "dsn_mui_findings": ["<temuan spesifik dengan nomor fatwa>"],
    "applicable_regulations": ["<regulasi yang relevan>"]
  },
  "stage3_analysis": {
    "risk_level": "rendah" | "sedang" | "tinggi",
    "risk_score": <0-100>,
    "summary": "<ringkasan 1-2 kalimat>",
    "recommendation": "<analisa lengkap dan langkah konkret>",
    "issues": [
      {
        "level": "tinggi" | "sedang" | "rendah",
        "category": "identitas" | "kepemilikan" | "dokumen" | "harta_bersama" | "warisan" | "legalitas" | "compliance",
        "text": "<deskripsi isu dan implikasi hukumnya>",
        "solution": "<jalur solusi 1 dan jalur solusi 2>",
        "regulation_basis": "<dasar regulasi>"
      }
    ],
    "suggested_clauses": ["<klausul kontrak lengkap siap pakai>"],
    "documents_required": [
      {
        "name": "<nama dokumen>",
        "priority": "wajib" | "pendukung" | "kondisional",
        "reason": "<alasan hukum>",
        "deadline": "sebelum_akad" | "sebelum_pencairan" | "setelah_pencairan"
      }
    ],
    "ftv_assessment": {
      "recommended_max_ftv": <persentase 0-100>,
      "basis": "<dasar perhitungan FTV>"
    }
  }
}

Jangan tambahkan teks apapun di luar JSON.`;

function buildUserPrompt(request: any, completeness: CompletenessResult): string {
  const c = request.collateral || {};
  const d = c.details || {};

  const jaminanDesc: Record<string, string> = {
    tanah_shm: 'Tanah dengan Sertifikat Hak Milik (SHM)',
    tanah_shgb: 'Tanah dengan Sertifikat Hak Guna Bangunan (SHGB)',
    bangunan: 'Bangunan / Rumah / Ruko beserta tanah',
    kendaraan_roda4: 'Kendaraan bermotor roda empat',
  };

  const ownershipDesc: Record<string, string> = {
    hak_milik_pribadi: 'Hak milik pribadi murni',
    harta_bersama: 'Harta bersama dalam perkawinan (UU No.1/1974)',
    warisan_belum_dibagi: 'Harta warisan belum dibagi (KHI Ps.171)',
    kuasa: 'Atas kuasa dari pemilik',
  };

  let prompt = `Lakukan analisa Stage 2 (compliance OJK/DSN-MUI) dan Stage 3 (analisa risiko) untuk kasus berikut:

=== DATA PEMBIAYAAN ===
Nasabah          : ${request.customer_name}
NIK              : ${request.customer_id_number || 'Tidak diberikan'}
Nilai pembiayaan : Rp ${Number(request.financing_amount).toLocaleString('id-ID')}
Margin           : ${request.margin_percent}%
Tenor            : ${request.tenor_months} bulan
Jenis akad       : ${request.contract_type || 'Murabahah'}

=== DATA JAMINAN ===
Jenis            : ${jaminanDesc[c.type] || c.type}
Atas nama        : ${d.owner_name || 'Tidak diberikan'}
Status kepemilikan: ${ownershipDesc[d.ownership_status] || d.ownership_status}
`;

  if (c.type === 'kendaraan_roda4') {
    prompt += `Nomor kendaraan  : ${d.vehicle_plate || 'Tidak diberikan'}
Tahun kendaraan  : ${d.vehicle_year || 'Tidak diberikan'}
Status STNK      : ${d.stnk_active === false ? 'KADALUARSA — perlu penanganan' : 'Aktif'}
`;
  }

  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(c.type)) {
    prompt += `No. sertifikat   : ${d.certificate_number || 'Tidak diberikan'}
Alamat jaminan   : ${d.address || 'Tidak diberikan'}
Luas             : ${d.area_m2 ? d.area_m2 + ' m²' : 'Tidak diberikan'}
`;
  }

  if (d.ownership_status === 'warisan_belum_dibagi') {
    prompt += `\n=== KONDISI WARISAN ===
Persetujuan ahli waris  : ${d.heirs_involved ? 'Seluruh ahli waris setuju' : 'BELUM TERKONFIRMASI'}
Surat keterangan waris  : ${d.heirs_certificate ? 'Tersedia' : 'Belum ada'}
`;
  }

  if (d.ownership_status === 'harta_bersama') {
    prompt += `\n=== HARTA BERSAMA ===
Persetujuan pasangan    : ${d.spouse_consent ? 'Sudah ada (bermaterai)' : 'BELUM ADA — wajib hukum'}
`;
  }

  if (d.notes) {
    prompt += `\n=== CATATAN PETUGAS CABANG ===
${d.notes}
`;
  }

  if (completeness.warnings.length > 0) {
    prompt += `\n=== CATATAN SISTEM (SOFT WARNINGS) ===
${completeness.warnings.map((w: any) => `- ${w.label}: ${w.note}`).join('\n')}
`;
  }

  // Inject Stage 1b intelligence context jika ada
  const intel = request.data_intelligence_result;
  if (intel && intel.stage === '1b') {
    const criticalCorrelations = (intel.correlations_found || []).filter((c: any) => c.severity === 'kritis');
    const importantCorrelations = (intel.correlations_found || []).filter((c: any) => c.severity === 'penting');
    const allInferences = intel.inferences || [];

    if (criticalCorrelations.length > 0) {
      prompt += `\n=== TEMUAN KRITIS DARI DATA INTELLIGENCE (Stage 1b) ===
${criticalCorrelations.map((c: any, i: number) => `[KRITIS-${i + 1}] Field: ${(c.fields_involved || []).join(' × ')}
Temuan: ${c.finding}
Dasar hukum: ${c.legal_basis}
Klarifikasi: ${c.clarification_needed}`).join('\n\n')}
`;
    }

    if (importantCorrelations.length > 0) {
      prompt += `\n=== KORELASI PENTING (Stage 1b) ===
${importantCorrelations.map((c: any, i: number) => `[PENTING-${i + 1}] ${c.finding} (Dasar: ${c.legal_basis})`).join('\n')}
`;
    }

    if (allInferences.length > 0) {
      prompt += `\n=== INFERENSI DATA INTELLIGENCE ===
${allInferences.map((inf: any, i: number) => `[INF-${i + 1}] ${inf.basis} → ${inf.inference} → Aksi: ${inf.action_required}`).join('\n')}
`;
    }

    if (intel.readiness_score) {
      prompt += `\nData readiness score: ${intel.readiness_score}/100\n`;
    }
  }

  const estimatedFTV = c.type === 'kendaraan_roda4' ? '70-80%' : '80-90%';
  prompt += `\n=== KONTEKS TAMBAHAN ===
Estimasi FTV: ~${estimatedFTV} (perlu appraisal formal)
Tanggal analisa: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

Berikan analisa compliance dan risiko yang menyeluruh dengan jalur solusi konkret per isu.`;

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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: request, error: fetchErr } = await supabase
      .from('contract_requests').select('*').eq('id', request_id).single();

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    // ── STAGE 1: Hard completeness check (lokal) ─────────────
    const completeness = checkCompleteness(request);

    if (!completeness.is_complete) {
      await supabase.from('contract_requests').update({
        status: 'data_incomplete',
        completeness_check: {
          is_complete: false,
          checked_at: new Date().toISOString(),
          missing_fields: completeness.missing_fields,
          warnings: completeness.warnings,
        },
      }).eq('id', request_id);

      return NextResponse.json({
        success: false,
        stage: 1,
        status: 'data_incomplete',
        missing_fields: completeness.missing_fields,
        message: `${completeness.missing_fields.length} field wajib belum diisi.`,
      });
    }

    // Update ke compliance_check
    await supabase.from('contract_requests').update({
      status: 'compliance_check',
      completeness_check: {
        is_complete: true,
        checked_at: new Date().toISOString(),
        warnings: completeness.warnings,
      },
    }).eq('id', request_id);

    // ── STAGE 2+3: AI Analysis ───────────────────────────────
    // Deklarasi provider dan apiKey DULU sebelum digunakan
    const provider = PROVIDERS[PROVIDER];
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      return NextResponse.json({ error: `${provider.apiKeyEnv} tidak dikonfigurasi` }, { status: 500 });
    }

    // Legal RAG: inject anchor regulasi ke system prompt
    // Dilakukan SETELAH provider/apiKey siap, SEBELUM AI call
    let enrichedSystemPrompt = SYSTEM_PROMPT;
    try {
      const { getLegalContext, injectLegalContext } = await import('@/lib/legal-rag-engine');
      const legalContext = await getLegalContext(request);
      enrichedSystemPrompt = injectLegalContext(SYSTEM_PROMPT, legalContext);
      console.log(`Legal RAG: ${legalContext.total_articles_found} pasal, ${legalContext.scenarios_matched} skenario`);
    } catch (ragErr) {
      console.error('Legal RAG (non-critical, lanjut tanpa anchor):', ragErr);
    }

    // Update status ke under_analysis (sekali saja)
    await supabase.from('contract_requests')
      .update({ status: 'under_analysis' })
      .eq('id', request_id);

    // AI call dengan enrichedSystemPrompt
    const aiResponse = await fetch(provider.url, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: JSON.stringify(
        provider.buildBody(enrichedSystemPrompt, buildUserPrompt(request, completeness))
      ),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', errText);
      await supabase.from('contract_requests').update({ status: 'analysis_failed' }).eq('id', request_id);
      return NextResponse.json({ error: 'AI service error', detail: errText }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const rawText = provider.extractText(aiData);

    let parsed: any;
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse error:', rawText.slice(0, 200));
      parsed = {
        stage2_compliance: {
          ojk_status: 'needs_clarification',
          ojk_findings: ['Parse error — review manual diperlukan'],
          dsn_mui_status: 'needs_clarification',
          dsn_mui_findings: [],
          applicable_regulations: [],
        },
        stage3_analysis: {
          risk_level: 'sedang',
          risk_score: 50,
          summary: 'Analisa selesai dengan error parsing. Review manual diperlukan.',
          recommendation: rawText,
          issues: [],
          suggested_clauses: [],
          documents_required: [],
          ftv_assessment: { recommended_max_ftv: 70, basis: 'Default — analisa manual diperlukan' },
        },
      };
    }

    const validationResult = {
      compliance: parsed.stage2_compliance,
      risk_level: parsed.stage3_analysis?.risk_level,
      risk_score: parsed.stage3_analysis?.risk_score,
      summary: parsed.stage3_analysis?.summary,
      recommendation: parsed.stage3_analysis?.recommendation,
      issues: parsed.stage3_analysis?.issues || [],
      suggested_clauses: parsed.stage3_analysis?.suggested_clauses || [],
      documents_required: parsed.stage3_analysis?.documents_required || [],
      ftv_assessment: parsed.stage3_analysis?.ftv_assessment,
      compliance_notes: {
        ojk: parsed.stage2_compliance?.ojk_findings?.join(' | ') || '',
        dsn_mui: parsed.stage2_compliance?.dsn_mui_findings?.join(' | ') || '',
        civil_law: parsed.stage3_analysis?.issues
          ?.filter((i: any) => i.category === 'kepemilikan' || i.category === 'warisan')
          .map((i: any) => i.text).join(' | ') || '',
      },
      completeness_warnings: completeness.warnings,
      analyzed_at: new Date().toISOString(),
    };

    await supabase.from('contract_requests').update({
      collateral_validation_result: validationResult,
      status: 'under_review',
      validated_at: new Date().toISOString(),
    }).eq('id', request_id);

    return NextResponse.json({
      success: true,
      request_id,
      stage: 3,
      status: 'under_review',
      risk_level: validationResult.risk_level,
      risk_score: validationResult.risk_score,
      compliance_ojk: parsed.stage2_compliance?.ojk_status,
      compliance_dsn: parsed.stage2_compliance?.dsn_mui_status,
    });

  } catch (err: any) {
    console.error('Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
