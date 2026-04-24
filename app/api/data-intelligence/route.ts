import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// PROVIDER CONFIG -- sama dengan validate-collateral
// ============================================================
// ============================================================
// TWIN ENGINE -- Stage 1b menggunakan DeepSeek
// DeepSeek: cepat, efisien untuk pattern recognition & korelasi
// Claude Sonnet: digunakan di Stage 2-3 untuk legal reasoning
// ============================================================
const STAGE1B_ENGINE: 'deepseek' | 'claude' | 'openrouter' = 'deepseek';
const STAGE1B_FALLBACK: 'claude' | 'openrouter' = 'openrouter';

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
      temperature: 0.1,  // lebih deterministik untuk data audit
      max_tokens: 3000,
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
      max_tokens: 3000,
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
      'X-Title': 'Syarikat Islam - DSN',
    }),
    buildBody: (system: string, user: string) => ({
      model: 'anthropic/claude-sonnet-4',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
    extractText: (d: any) => d.choices?.[0]?.message?.content || '',
  },
};

// ============================================================
// STAGE 1A -- HARD VALIDATION (lokal, tanpa AI)
// Hanya cek field wajib kosong/tidak -- tidak lebih dari itu
// ============================================================

function hardValidation(r: any): { passed: boolean; empty_fields: string[] } {
  const empty_fields: string[] = [];
  const required = [
    ['customer_name', 'Nama nasabah'],
    ['customer_id_number', 'NIK nasabah'],
    ['financing_amount', 'Nilai pembiayaan'],
    ['tenor_months', 'Tenor'],
    ['collateral.type', 'Jenis jaminan'],
    ['collateral.details.owner_name', 'Nama pemilik jaminan'],
    ['collateral.details.ownership_status', 'Status kepemilikan'],
  ];

  for (const [path, label] of required) {
    const val = path.split('.').reduce((o: any, k) => o?.[k], r);
    if (val === undefined || val === null || val === '') {
      empty_fields.push(label);
    }
  }

  return { passed: empty_fields.length === 0, empty_fields };
}

// ============================================================
// STAGE 1B -- SYSTEM PROMPT: DATA INTELLIGENCE & CORRELATION
// Tugas: BUKAN menilai risiko hukum
// Tugas: membaca, menghubungkan, menemukan inkonsistensi
// dan menentukan apakah data sudah cukup untuk dianalisa
// ============================================================

const DATA_INTELLIGENCE_PROMPT = `Kamu adalah Data Intelligence Agent untuk sistem hukum perbankan syariah Indonesia.

TUGAS UTAMAMU -- TIGA LAPIS PEMBACAAN:

LAPIS 1 -- PEMBACAAN INDIVIDUAL
Baca setiap field data yang diberikan. Nilai apakah masuk akal secara kontekstual:
- Apakah nilainya konsisten dengan field lain?
- Apakah ada nilai yang mengindikasikan sesuatu yang tidak dideklarasikan?
- Apakah ada nilai yang secara teknis mungkin salah input?

LAPIS 2 -- PEMBACAAN KORELASIONAL (INI PALING PENTING)
Cross-check setiap kombinasi field yang relevan secara hukum. Contoh korelasi yang WAJIB kamu cari:
- Status perkawinan di KK x nama pemilik sertifikat x ownership_status yang dideklarasikan
  -> Jika menikah + sertifikat atas nama satu pihak + diisi "hak milik pribadi" = presumsi harta bersama belum dipatahkan
- Tahun kendaraan x nilai pembiayaan x tenor
  -> Kendaraan tua + nilai besar = FTV tersirat tidak wajar, usia ekonomis terlampaui
- Nomor sertifikat (prefix) x jenis jaminan yang dideklarasikan
  -> Prefix HGB/HGU/HP di nomor sertifikat != klaim SHM
- Jumlah ahli waris x usia dari KK x ownership_status warisan
  -> Ahli waris minor = perlu penetapan wali PA, bukan sekadar tanda tangan
- Lokasi jaminan x jenis bangunan x nilai
  -> Lokasi zona bencana = kemungkinan tidak bisa diasuransikan, POJK wajib asuransi
- Nilai pembiayaan x profil jaminan x tenor
  -> FTV tersirat, kemampuan jaminan cover outstanding di akhir tenor
- Catatan petugas x data terstruktur
  -> Inkonsistensi antara narasi bebas dan data form (misal: catatan bilang "rumah keluarga" tapi diisi hak pribadi)
- Nama di sertifikat x nama di KTP pemilik
  -> Perbedaan ejaan, nama gadis vs menikah, perubahan nama resmi
- Sisa masa HGB x tenor pembiayaan
  -> HGB habis sebelum tenor berakhir = APHT tidak dapat didaftarkan penuh

LAPIS 3 -- PEMBACAAN INFERENSIAL
Dari kombinasi data, identifikasi apa yang TIDAK disebutkan tapi seharusnya ada:
- Jika ada anak dalam KK berusia < 18 tahun dan status warisan -> siapa yang wakili mereka?
- Jika kendaraan atas nama pihak ketiga dan ada catatan "dari mertua" -> butuh surat kuasa fidusia
- Jika nilai besar + tenor panjang -> apakah ada klausul asuransi jiwa?
- Jika SHGB + lokasi kawasan industri -> apakah HGB di atas HPL negara?

SIKAP YANG BENAR:
- Kamu BUKAN menilai risiko hukum -- itu tugas stage berikutnya
- Kamu seperti asisten research yang memastikan semua data lengkap dan konsisten SEBELUM lawyer mulai kerja
- Lebih baik terlalu teliti daripada melewatkan sesuatu
- Setiap temuan inkonsistensi WAJIB disertai pertanyaan klarifikasi yang spesifik

OUTPUT WAJIB berupa JSON valid persis struktur ini:
{
  "is_ready": true | false,
  "readiness_score": <0-100, seberapa siap data untuk dianalisa>,
  "individual_findings": [
    {
      "field": "<nama field>",
      "value_noted": "<nilai yang tercatat>",
      "observation": "<apa yang diperhatikan dari nilai ini>"
    }
  ],
  "correlations_found": [
    {
      "fields_involved": ["<field 1>", "<field 2>", "..."],
      "correlation_type": "inkonsistensi" | "implikasi_tersembunyi" | "risiko_tersirat" | "data_kurang",
      "severity": "kritis" | "penting" | "informatif",
      "finding": "<penjelasan korelasi yang ditemukan -- spesifik dan konkret>",
      "legal_basis": "<dasar hukum mengapa ini relevan>",
      "clarification_needed": "<pertanyaan spesifik yang harus dijawab cabang>"
    }
  ],
  "inferences": [
    {
      "basis": "<data yang menjadi dasar inferensi>",
      "inference": "<apa yang diinferensikan>",
      "action_required": "<apa yang harus dilakukan>"
    }
  ],
  "documents_to_request": [
    {
      "document": "<nama dokumen>",
      "reason": "<mengapa diperlukan -- berdasarkan korelasi/inferensi mana>",
      "urgency": "wajib_sebelum_analisa" | "wajib_sebelum_akad" | "wajib_sebelum_pencairan" | "pendukung",
      "from_whom": "nasabah" | "penjamin" | "instansi" | "notaris"
    }
  ],
  "questions_for_branch": [
    {
      "priority": "kritis" | "penting" | "konfirmasi",
      "question": "<pertanyaan yang harus dijawab cabang>",
      "why_needed": "<mengapa jawaban ini krusial untuk analisa>"
    }
  ],
  "data_quality_notes": "<catatan umum tentang kualitas dan kelengkapan data yang diberikan>"
}

Jangan tambahkan teks apapun di luar JSON.`;

// ============================================================
// BUILD USER PROMPT -- semua data diumpan, tidak ada yang
// disembunyikan dari AI agar korelasi bisa ditarik maksimal
// ============================================================

function buildIntelligencePrompt(r: any): string {
  const c = r.collateral || {};
  const d = c.details || {};

  // Hitung derived values yang membantu korelasi
  const currentYear = new Date().getFullYear();
  const vehicleAge = d.vehicle_year ? currentYear - parseInt(d.vehicle_year) : null;
  const monthlyInstallment = r.financing_amount && r.tenor_months
    ? Math.round((Number(r.financing_amount) * (1 + (r.margin_percent / 100))) / r.tenor_months)
    : null;

  return `Lakukan tiga lapis pembacaan data (individual, korelasional, inferensial) untuk permintaan pembiayaan berikut.

=== DATA NASABAH ===
Nama lengkap          : ${r.customer_name || 'KOSONG'}
NIK                   : ${r.customer_id_number || 'KOSONG'}

=== DATA PEMBIAYAAN ===
Nilai pembiayaan      : Rp ${Number(r.financing_amount || 0).toLocaleString('id-ID')}
Margin                : ${r.margin_percent}%
Tenor                 : ${r.tenor_months} bulan (${Math.round(r.tenor_months / 12 * 10) / 10} tahun)
Estimasi angsuran/bln : ${monthlyInstallment ? 'Rp ' + monthlyInstallment.toLocaleString('id-ID') : 'tidak dapat dihitung'}
Jenis akad            : ${r.contract_type || 'Murabahah'}

=== DATA JAMINAN ===
Jenis jaminan         : ${c.type || 'KOSONG'}
Nama pemilik          : ${d.owner_name || 'KOSONG'}
Status kepemilikan    : ${d.ownership_status || 'KOSONG'}
Nomor sertifikat/BPKB : ${d.certificate_number || 'tidak diisi'}
Alamat jaminan        : ${d.address || 'tidak diisi'}
Luas                  : ${d.area_m2 ? d.area_m2 + ' m2' : 'tidak diisi'}
${c.type === 'kendaraan_roda4' ? `
=== DETAIL KENDARAAN ===
Nomor polisi          : ${d.vehicle_plate || 'tidak diisi'}
Tahun kendaraan       : ${d.vehicle_year || 'tidak diisi'}
Usia kendaraan        : ${vehicleAge !== null ? vehicleAge + ' tahun' : 'tidak dapat dihitung'}
Status STNK           : ${d.stnk_active === false ? 'KADALUARSA' : 'aktif'}
` : ''}
=== STATUS KONDISIONAL ===
Persetujuan pasangan  : ${d.spouse_consent === true ? 'Ada' : d.spouse_consent === false ? 'Tidak ada' : 'Tidak relevan/tidak diisi'}
Persetujuan ahli waris: ${d.heirs_involved === true ? 'Ada' : d.heirs_involved === false ? 'Tidak ada' : 'Tidak relevan/tidak diisi'}
Surat keterangan waris: ${d.heirs_certificate === true ? 'Ada' : d.heirs_certificate === false ? 'Tidak ada' : 'Tidak relevan/tidak diisi'}

=== NAMA NASABAH vs NAMA PEMILIK JAMINAN ===
Nasabah               : ${r.customer_name || '-'}
Pemilik jaminan       : ${d.owner_name || '-'}
Apakah sama           : ${r.customer_name && d.owner_name
    ? r.customer_name.toLowerCase().trim() === d.owner_name.toLowerCase().trim()
      ? 'Ya (identik)'
      : 'TIDAK SAMA -- perlu klarifikasi hubungan'
    : 'tidak dapat dibandingkan'}

=== CATATAN BEBAS DARI PETUGAS CABANG ===
${d.notes || '(tidak ada catatan tambahan)'}

=== METADATA ===
Tanggal pengajuan     : ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Branch ID             : ${r.branch_id || 'tidak diketahui'}

Perhatikan khusus:
1. Korelasi antara nama nasabah dan nama pemilik jaminan -- jika berbeda, hubungan apa yang paling mungkin?
2. Status perkawinan yang TERSIRAT dari data (misal: dari catatan, nama, atau konteks)
3. Nilai pembiayaan vs profil jaminan -- apakah proporsinya wajar?
4. Inkonsistensi antara catatan bebas dan data terstruktur
5. Apa yang TIDAK ada tapi seharusnya ada berdasarkan konteks

Tarik semua korelasi yang bisa kamu temukan.`;
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
      .from('contract_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });
    }

    // -- STAGE 1A: Hard validation lokal ----------------------
    const hard = hardValidation(request);
    if (!hard.passed) {
      await supabase
        .from('contract_requests')
        .update({
          status: 'data_incomplete',
          data_intelligence_result: {
            stage: '1a',
            is_ready: false,
            empty_fields: hard.empty_fields,
            checked_at: new Date().toISOString(),
          },
        })
        .eq('id', request_id);

      return NextResponse.json({
        success: false,
        stage: '1a',
        status: 'data_incomplete',
        empty_fields: hard.empty_fields,
        message: `Field wajib belum diisi: ${hard.empty_fields.join(', ')}`,
      });
    }

    // Update status -> data_intelligence_running
    await supabase
      .from('contract_requests')
      .update({ status: 'data_intelligence' })
      .eq('id', request_id);

    // -- STAGE 1B: AI Data Intelligence -----------------------
    // Twin engine: gunakan DeepSeek untuk Stage 1b
  const engineKey = STAGE1B_ENGINE;
  const provider = PROVIDERS[engineKey];
    const apiKey = process.env[provider.apiKeyEnv];

    // Jika primary engine tidak terkonfigurasi, fallback
    if (!apiKey) {
      console.warn(\`Stage 1b: \${provider.apiKeyEnv} tidak ada, fallback ke \${STAGE1B_FALLBACK}\`);
      const fallbackProvider = PROVIDERS[STAGE1B_FALLBACK];
      const fallbackKey = process.env[fallbackProvider.apiKeyEnv];
      if (!fallbackKey) {
        return NextResponse.json({ error: \`Tidak ada AI engine yang terkonfigurasi. Set \${provider.apiKeyEnv} atau \${fallbackProvider.apiKeyEnv}\` }, { status: 500 });
      }
    }
    if (!apiKey) {
      return NextResponse.json({ error: `${provider.apiKeyEnv} tidak dikonfigurasi` }, { status: 500 });
    }

    const aiRes = await fetch(provider.url, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: JSON.stringify(
        provider.buildBody(DATA_INTELLIGENCE_PROMPT, buildIntelligencePrompt(request))
      ),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('AI Stage 1b error:', err);
      await supabase
        .from('contract_requests')
        .update({ status: 'data_incomplete' })
        .eq('id', request_id);
      return NextResponse.json({ error: 'AI service error', detail: err }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const raw = provider.extractText(aiData);

    let intelligence: any;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      intelligence = JSON.parse(cleaned);
    } catch {
      console.error('Stage 1b JSON parse error:', raw.slice(0, 300));
      intelligence = {
        is_ready: false,
        readiness_score: 0,
        correlations_found: [],
        inferences: [],
        documents_to_request: [],
        questions_for_branch: [{ priority: 'kritis', question: 'Parse error pada analisa AI -- mohon review manual', why_needed: 'Sistem tidak dapat memproses respons AI' }],
        data_quality_notes: raw,
      };
    }

    // Simpan hasil Stage 1b
    await supabase
      .from('contract_requests')
      .update({
        data_intelligence_result: {
          ...intelligence,
          stage: '1b',
          analyzed_at: new Date().toISOString(),
        },
        status: intelligence.is_ready ? 'compliance_check' : 'data_incomplete',
      })
      .eq('id', request_id);

    // Jika tidak siap -- kembalikan dengan detail lengkap
    if (!intelligence.is_ready) {
      const criticalCorrelations = (intelligence.correlations_found || [])
        .filter((c: any) => c.severity === 'kritis');
      const criticalQuestions = (intelligence.questions_for_branch || [])
        .filter((q: any) => q.priority === 'kritis');
      const mandatoryDocs = (intelligence.documents_to_request || [])
        .filter((d: any) => d.urgency === 'wajib_sebelum_analisa');

      return NextResponse.json({
        success: false,
        stage: '1b',
        status: 'data_incomplete',
        readiness_score: intelligence.readiness_score,
        critical_correlations: criticalCorrelations,
        critical_questions: criticalQuestions,
        mandatory_documents: mandatoryDocs,
        all_questions: intelligence.questions_for_branch || [],
        all_documents: intelligence.documents_to_request || [],
        data_quality_notes: intelligence.data_quality_notes,
        message: `Data belum siap untuk analisa hukum. Ditemukan ${criticalCorrelations.length} inkonsistensi kritis dan ${mandatoryDocs.length} dokumen wajib yang belum ada.`,
      });
    }

    // Data siap -- trigger Stage 2-3 langsung
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/validate-collateral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id }),
    }).catch(console.error); // fire-and-forget

    return NextResponse.json({
      success: true,
      stage: '1b',
      status: 'compliance_check',
      readiness_score: intelligence.readiness_score,
      correlations_found: intelligence.correlations_found?.length || 0,
      inferences: intelligence.inferences?.length || 0,
      documents_flagged: intelligence.documents_to_request?.length || 0,
      message: 'Data valid. Analisa hukum Stage 2-3 dimulai otomatis.',
    });

  } catch (err: any) {
    console.error('Stage 1b unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}
