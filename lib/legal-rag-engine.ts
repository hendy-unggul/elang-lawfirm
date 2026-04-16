import { createClient } from '@supabase/supabase-js';

// ============================================================
// LEGAL RAG ENGINE
// Retrieval-Augmented Generation untuk analisa hukum syariah
// Mencegah halusinasi AI dengan anchor regulasi yang terverifikasi
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface LegalAnchor {
  code: string;
  type: string;
  hierarchy_level: number;
  article_number: string;
  content: string;
  content_plain: string;
  legal_implication: string;
  similarity?: number;
}

export interface MatchedScenario {
  scenario_code: string;
  title: string;
  risk_level: string;
  applicable_articles: string[];
  solution_paths: any[];
  mandatory_clauses: string[];
}

export interface LegalContext {
  anchors: LegalAnchor[];
  matched_scenarios: MatchedScenario[];
  applicable_regulations: string[];
  anchor_prompt_block: string;
  total_articles_found: number;
  scenarios_matched: number;
}

// ============================================================
// STEP 1: EXTRACT QUERY CONDITIONS FROM REQUEST DATA
// Konversi data request ke kondisi yang bisa diquery
// ============================================================

export function extractConditions(request: any): Record<string, any> {
  const c = request.collateral || {};
  const d = c.details || {};

  const conditions: Record<string, any> = {
    collateral_type: c.type,
    ownership_status: d.ownership_status,
  };

  // Deteksi kondisi khusus
  if (d.ownership_status === 'harta_bersama' && !d.spouse_consent) {
    conditions.spouse_consent = false;
  }

  if (d.ownership_status === 'warisan_belum_dibagi') {
    if (!d.heirs_involved) conditions.has_minor_heirs = true; // assume worst case jika tidak dikonfirmasi
    if (!d.heirs_certificate) conditions.missing_heirs_certificate = true;
  }

  if (c.type === 'kendaraan_roda4') {
    if (d.stnk_active === false) conditions.stnk_expired = true;
    if (d.vehicle_year) {
      const age = new Date().getFullYear() - parseInt(d.vehicle_year);
      if (age > 15) conditions.vehicle_over_age = true;
      if (age > 10) conditions.vehicle_near_age_limit = true;
    }
  }

  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(c.type)) {
    conditions.collateral_type_group = 'tanah';
  }

  // FTV check (rough estimate)
  const amount = Number(request.financing_amount) || 0;
  if (amount > 0) {
    const maxFTV = c.type === 'kendaraan_roda4' ? 0.80 : 0.85;
    // Kita tidak tahu nilai jaminan pasti, tapi jika nilai > 5M dan tidak ada appraisal, flag it
    if (amount > 5_000_000_000) conditions.high_value_needs_appraisal = true;
  }

  return conditions;
}

// ============================================================
// STEP 2: KEYWORD-BASED ARTICLE RETRIEVAL
// Tanpa embedding, gunakan keyword + kondisi matching
// (Fallback jika pgvector belum setup atau embedding belum ada)
// ============================================================

export async function retrieveByKeywords(
  conditions: Record<string, any>,
  collateralType: string
): Promise<LegalAnchor[]> {
  // Map kondisi ke keyword pencarian
  const topicsToSearch: string[] = [];

  if (conditions.ownership_status === 'harta_bersama') {
    topicsToSearch.push('harta_bersama', 'persetujuan_pasangan', 'perkawinan');
  }
  if (conditions.ownership_status === 'warisan_belum_dibagi') {
    topicsToSearch.push('waris', 'ahli_waris', 'perwalian');
  }
  if (conditions.has_minor_heirs) {
    topicsToSearch.push('perwalian', 'anak_minor');
  }
  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(collateralType)) {
    topicsToSearch.push('apht', 'hak_tanggungan', 'tanah', 'pendaftaran_tanah');
  }
  if (collateralType === 'kendaraan_roda4') {
    topicsToSearch.push('fidusia', 'kendaraan', 'bpkb');
  }
  if (conditions.stnk_expired) {
    topicsToSearch.push('fidusia', 'kendaraan');
  }

  // Selalu include topik dasar pembiayaan syariah
  topicsToSearch.push('rahn', 'jaminan', 'pembiayaan', 'kehati_hatian');

  const { data, error } = await supabase
    .from('regulation_articles')
    .select(`
      id,
      article_number,
      content,
      content_plain,
      legal_implication,
      topics,
      collateral_types,
      regulations!inner (
        code,
        type,
        hierarchy_level,
        status
      )
    `)
    .eq('regulations.status', 'active')
    .or(
      `topics.cs.{${topicsToSearch.join(',')}},collateral_types.cs.{${collateralType}},collateral_types.cs.{semua}`
    )
    .order('regulations(hierarchy_level)', { ascending: true })
    .limit(15);

  if (error || !data) {
    console.error('RAG retrieval error:', error);
    return [];
  }

  return data.map((row: any) => ({
    code: row.regulations.code,
    type: row.regulations.type,
    hierarchy_level: row.regulations.hierarchy_level,
    article_number: row.article_number,
    content: row.content,
    content_plain: row.content_plain || '',
    legal_implication: row.legal_implication || '',
  }));
}

// ============================================================
// STEP 3: SCENARIO MATCHING
// Cari skenario hukum yang kondisinya cocok
// ============================================================

export async function matchScenarios(
  conditions: Record<string, any>
): Promise<MatchedScenario[]> {
  // Build JSONB query — cari skenario yang kondisinya subset dari kondisi kita
  const conditionEntries = Object.entries(conditions)
    .filter(([_, v]) => v !== undefined && v !== null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const { data, error } = await supabase
    .from('legal_scenarios')
    .select('*')
    .or(
      Object.entries(conditionEntries)
        .map(([k, v]) => `conditions->>'${k}'.eq.${String(v)}`)
        .join(',')
    )
    .limit(5);

  if (error || !data) {
    // Fallback: ambil skenario berdasarkan tag
    const tags = buildTagsFromConditions(conditions);
    const { data: tagData } = await supabase
      .from('legal_scenarios')
      .select('*')
      .overlaps('tags', tags)
      .limit(5);
    return (tagData || []).map(mapScenario);
  }

  return (data || []).map(mapScenario);
}

function buildTagsFromConditions(conditions: Record<string, any>): string[] {
  const tags: string[] = [];
  if (conditions.ownership_status === 'warisan_belum_dibagi') tags.push('warisan');
  if (conditions.has_minor_heirs) tags.push('ahli_waris_minor');
  if (conditions.ownership_status === 'harta_bersama') tags.push('harta_bersama');
  if (conditions.collateral_type === 'kendaraan_roda4') tags.push('kendaraan');
  if (conditions.collateral_type_group === 'tanah') tags.push('tanah', 'apht');
  if (conditions.stnk_expired) tags.push('kendaraan');
  if (conditions.ftv_exceeded) tags.push('ftv');
  return tags;
}

function mapScenario(row: any): MatchedScenario {
  return {
    scenario_code: row.scenario_code,
    title: row.title,
    risk_level: row.risk_level,
    applicable_articles: row.applicable_articles || [],
    solution_paths: row.solution_paths || [],
    mandatory_clauses: row.mandatory_clauses || [],
  };
}

// ============================================================
// STEP 4: BUILD ANCHOR PROMPT BLOCK
// Format semua regulasi yang ditemukan menjadi blok teks
// yang diinjeksi ke system prompt AI
// ============================================================

function buildAnchorBlock(
  anchors: LegalAnchor[],
  scenarios: MatchedScenario[]
): string {
  if (anchors.length === 0 && scenarios.length === 0) {
    return '(Tidak ada anchor regulasi spesifik yang ditemukan. Gunakan pengetahuan umum hukum syariah Indonesia dengan kehati-hatian.)';
  }

  const hierarchyNames: Record<number, string> = {
    1: 'UNDANG-UNDANG',
    2: 'FATWA DSN-MUI',
    3: 'PERATURAN OJK (POJK)',
    4: 'SE OJK / PBI',
    5: 'HUKUM PERDATA UMUM',
  };

  // Kelompokkan per hierarki
  const grouped: Record<number, LegalAnchor[]> = {};
  for (const anchor of anchors) {
    if (!grouped[anchor.hierarchy_level]) grouped[anchor.hierarchy_level] = [];
    grouped[anchor.hierarchy_level].push(anchor);
  }

  let block = `=== LEGAL ANCHORS — REGULASI YANG BERLAKU UNTUK KASUS INI ===
INSTRUKSI KRITIS: Setiap pernyataan hukum dalam analisa WAJIB merujuk minimal satu anchor di bawah ini.
Format referensi: [KODE_REGULASI NOMOR_PASAL]
Contoh: [UU-1-1974 Pasal 36] atau [DSN-92-2014 Ketentuan Umum 2]
Jika tidak ada anchor yang mendukung suatu klaim, nyatakan: "tidak ada regulasi eksplisit yang mengatur" — DILARANG berspekulasi.

`;

  // Tulis per hierarki (dari tertinggi)
  for (const level of [1, 2, 3, 4, 5]) {
    if (!grouped[level]) continue;
    block += `── ${hierarchyNames[level]} ──\n`;
    for (const a of grouped[level]) {
      block += `[${a.code} ${a.article_number}]\n`;
      block += `"${a.content}"\n`;
      if (a.content_plain) block += `→ Makna awam: ${a.content_plain}\n`;
      if (a.legal_implication) block += `→ Implikasi: ${a.legal_implication}\n`;
      block += '\n';
    }
  }

  // Tambahkan skenario yang cocok
  if (scenarios.length > 0) {
    block += `── SKENARIO HUKUM YANG TERDETEKSI ──\n`;
    for (const s of scenarios) {
      block += `[${s.scenario_code}] ${s.title} (Risiko: ${s.risk_level})\n`;
      if (s.solution_paths.length > 0) {
        block += `Jalur solusi tersedia:\n`;
        for (const p of s.solution_paths) {
          block += `  • ${p.title} — estimasi ${p.timeline}, risiko residual: ${p.risk_after}\n`;
        }
      }
      if (s.mandatory_clauses.length > 0) {
        block += `Klausul wajib yang harus ada di kontrak:\n`;
        for (const cl of s.mandatory_clauses) {
          block += `  → "${cl.slice(0, 120)}..."\n`;
        }
      }
      block += '\n';
    }
  }

  block += `=== END LEGAL ANCHORS ===\n`;
  return block;
}

// ============================================================
// MAIN FUNCTION: getLegalContext
// Dipanggil sebelum AI analysis prompt dibangun
// ============================================================

export async function getLegalContext(request: any): Promise<LegalContext> {
  const conditions = extractConditions(request);
  const collateralType = request.collateral?.type || '';

  // Parallel retrieval
  const [anchors, scenarios] = await Promise.all([
    retrieveByKeywords(conditions, collateralType),
    matchScenarios(conditions),
  ]);

  // Deduplicate anchors by code+article
  const seen = new Set<string>();
  const uniqueAnchors = anchors.filter(a => {
    const key = `${a.code}:${a.article_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by hierarchy (highest authority first)
  uniqueAnchors.sort((a, b) => a.hierarchy_level - b.hierarchy_level);

  const applicableRegulations = [...new Set(uniqueAnchors.map(a => `${a.code} ${a.article_number}`))];

  const anchorBlock = buildAnchorBlock(uniqueAnchors, scenarios);

  // Log usage untuk analytics
  try {
    await supabase.from('regulation_usage_log').insert({
      request_id: request.id,
      articles_used: uniqueAnchors.map(a => a.code),
      scenarios_matched: scenarios.map(s => s.scenario_code),
      query_context: conditions,
    });
  } catch { /* non-critical */ }

  return {
    anchors: uniqueAnchors,
    matched_scenarios: scenarios,
    applicable_regulations: applicableRegulations,
    anchor_prompt_block: anchorBlock,
    total_articles_found: uniqueAnchors.length,
    scenarios_matched: scenarios.length,
  };
}

// ============================================================
// HELPER: Inject legal context ke system prompt
// Dipanggil dari validate-collateral dan data-intelligence
// ============================================================

export function injectLegalContext(
  baseSystemPrompt: string,
  legalContext: LegalContext
): string {
  if (legalContext.total_articles_found === 0) return baseSystemPrompt;

  return `${baseSystemPrompt}

${legalContext.anchor_prompt_block}

CATATAN PENTING TENTANG PENGGUNAAN ANCHOR:
1. Hierarki otoritas: UU > Fatwa DSN-MUI > POJK > SE/PBI > Hukum perdata umum
2. Jika ada konflik antar regulasi: lex superior menang (hierarki lebih tinggi), atau lex specialis (aturan khusus menggantikan umum)
3. Fatwa DSN-MUI wajib untuk aspek syariah, POJK wajib untuk aspek prudensial
4. Selalu sebutkan nomor pasal eksplisit dalam setiap rekomendasi
`;
}
