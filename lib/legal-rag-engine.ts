import { createClient } from '@supabase/supabase-js';

// ============================================================
// LEGAL RAG ENGINE — Fixed version
// ============================================================

// FIX [1]: Lazy init — bukan top-level, dipanggil saat dibutuhkan
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface LegalAnchor {
  code: string;
  type: string;
  hierarchy_level: number;
  article_number: string;
  content: string;
  content_plain: string;
  legal_implication: string;
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
// STEP 1: Extract conditions dari request
// ============================================================
export function extractConditions(request: any): Record<string, any> {
  const c = request.collateral || {};
  const d = c.details || {};
  const conditions: Record<string, any> = {
    collateral_type: c.type,
    ownership_status: d.ownership_status,
  };

  if (d.ownership_status === 'harta_bersama' && !d.spouse_consent) {
    conditions.spouse_consent = false;
  }
  if (d.ownership_status === 'warisan_belum_dibagi') {
    if (!d.heirs_involved) conditions.has_minor_heirs = true;
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
  if (Number(request.financing_amount) > 5_000_000_000) {
    conditions.high_value_needs_appraisal = true;
  }

  return conditions;
}

// ============================================================
// STEP 2: Keyword-based article retrieval
// FIX [2]: Hapus .order() foreign table, sort di JS
// FIX [3]: Gunakan .contains() bukan .or() dengan JSONB
// ============================================================
export async function retrieveByKeywords(
  conditions: Record<string, any>,
  collateralType: string
): Promise<LegalAnchor[]> {
  const supabase = getSupabase();
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
  topicsToSearch.push('rahn', 'jaminan', 'pembiayaan', 'kehati_hatian');

  // FIX [2]: Tidak pakai .order() foreign table
  // FIX [3]: Gunakan .filter() dengan operator cs untuk array overlap
  const topicsFilter = `{${Array.from(new Set(topicsToSearch)).join(',')}}`;
  const collateralFilter = `{${collateralType}}`;

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
      `topics.cs.${topicsFilter},collateral_types.cs.${collateralFilter},collateral_types.cs.{semua}`
    )
    .limit(20);

  if (error || !data) {
    console.error('RAG retrieval error:', error?.message);
    return [];
  }

  // FIX [2]: Sort di JavaScript bukan di query
  const sorted = (data as any[]).sort(
    (a, b) => (a.regulations?.hierarchy_level ?? 9) - (b.regulations?.hierarchy_level ?? 9)
  );

  return sorted.map((row: any) => ({
    code: row.regulations?.code || '',
    type: row.regulations?.type || '',
    hierarchy_level: row.regulations?.hierarchy_level || 5,
    article_number: row.article_number,
    content: row.content,
    content_plain: row.content_plain || '',
    legal_implication: row.legal_implication || '',
  }));
}

// ============================================================
// STEP 3: Scenario matching
// FIX [3]: Gunakan .contains() untuk JSONB
// FIX [4]: Ganti .overlaps() dengan .filter() cs
// ============================================================
export async function matchScenarios(
  conditions: Record<string, any>
): Promise<MatchedScenario[]> {
  const supabase = getSupabase();

  // Coba match berdasarkan tag dulu — lebih reliable
  const tags = buildTagsFromConditions(conditions);

  if (tags.length === 0) return [];

  // FIX [4]: Ganti .overlaps() dengan .filter('tags', 'cs', ...)
  const tagsFilter = `{${tags.join(',')}}`;
  const { data, error } = await supabase
    .from('legal_scenarios')
    .select('*')
    .filter('tags', 'cs', tagsFilter)
    .limit(5);

  if (error || !data || data.length === 0) {
    // Fallback: ambil berdasarkan risk_level tinggi
    const { data: fallback } = await supabase
      .from('legal_scenarios')
      .select('*')
      .eq('risk_level', 'tinggi')
      .limit(3);
    return (fallback || []).map(mapScenario);
  }

  return data.map(mapScenario);
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
  return Array.from(new Set(tags)); // deduplicate
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
// STEP 4: Build anchor prompt block
// ============================================================
function buildAnchorBlock(anchors: LegalAnchor[], scenarios: MatchedScenario[]): string {
  if (anchors.length === 0 && scenarios.length === 0) {
    return '(Tidak ada anchor regulasi spesifik. Gunakan pengetahuan umum hukum syariah Indonesia dengan kehati-hatian.)';
  }

  const hierarchyNames: Record<number, string> = {
    1: 'UNDANG-UNDANG',
    2: 'FATWA DSN-MUI',
    3: 'PERATURAN OJK (POJK)',
    4: 'SE OJK / PBI',
    5: 'HUKUM PERDATA UMUM',
  };

  const grouped: Record<number, LegalAnchor[]> = {};
  for (const anchor of anchors) {
    const lvl = anchor.hierarchy_level;
    if (!grouped[lvl]) grouped[lvl] = [];
    grouped[lvl].push(anchor);
  }

  let block = `=== LEGAL ANCHORS — REGULASI YANG BERLAKU ===
INSTRUKSI KRITIS: Setiap pernyataan hukum WAJIB merujuk anchor di bawah ini.
Format: [KODE_REGULASI NOMOR_PASAL] — contoh: [UU-1-1974 Pasal 36]
Jika tidak ada anchor yang mendukung → nyatakan "tidak ada regulasi eksplisit" — DILARANG berspekulasi.

`;

  for (const level of [1, 2, 3, 4, 5]) {
    if (!grouped[level]) continue;
    block += `── ${hierarchyNames[level]} ──\n`;
    for (const a of grouped[level]) {
      block += `[${a.code} ${a.article_number}]\n`;
      block += `"${a.content}"\n`;
      if (a.content_plain) block += `→ Makna: ${a.content_plain}\n`;
      if (a.legal_implication) block += `→ Implikasi: ${a.legal_implication}\n`;
      block += '\n';
    }
  }

  if (scenarios.length > 0) {
    block += `── SKENARIO HUKUM TERDETEKSI ──\n`;
    for (const s of scenarios) {
      block += `[${s.scenario_code}] ${s.title} (Risiko: ${s.risk_level})\n`;
      for (const p of s.solution_paths || []) {
        block += `  • ${p.title} — ${p.timeline}, risiko residual: ${p.risk_after}\n`;
      }
      for (const cl of (s.mandatory_clauses || []).slice(0, 2)) {
        block += `  → Klausul wajib: "${cl.slice(0, 100)}..."\n`;
      }
      block += '\n';
    }
  }

  block += `=== END LEGAL ANCHORS ===\n`;
  return block;
}

// ============================================================
// MAIN: getLegalContext
// ============================================================
export async function getLegalContext(request: any): Promise<LegalContext> {
  const conditions = extractConditions(request);
  const collateralType = request.collateral?.type || '';

  const [anchors, scenarios] = await Promise.all([
    retrieveByKeywords(conditions, collateralType),
    matchScenarios(conditions),
  ]);

  // Deduplicate
  const seen = new Set<string>();
  const uniqueAnchors = anchors.filter(a => {
    const key = `${a.code}:${a.article_number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const applicableRegulations = Array.from(new Set(uniqueAnchors.map(a => `${a.code} ${a.article_number}`)));
  const anchorBlock = buildAnchorBlock(uniqueAnchors, scenarios);

  // Log usage — non-critical, jangan sampai crash
  try {
    const supabase = getSupabase();
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
// HELPER: Inject ke system prompt
// ============================================================
export function injectLegalContext(
  baseSystemPrompt: string,
  legalContext: LegalContext
): string {
  if (legalContext.total_articles_found === 0 && legalContext.scenarios_matched === 0) {
    return baseSystemPrompt;
  }

  return `${baseSystemPrompt}

${legalContext.anchor_prompt_block}

CATATAN PENGGUNAAN ANCHOR:
1. Hierarki: UU > Fatwa DSN-MUI > POJK > SE/PBI > Hukum perdata umum
2. Konflik regulasi: lex superior menang, atau lex specialis untuk aturan khusus
3. Fatwa DSN-MUI wajib untuk aspek syariah, POJK untuk aspek prudensial
4. Sebutkan nomor pasal eksplisit di setiap rekomendasi
`;
}
