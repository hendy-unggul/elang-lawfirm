import { createClient } from '@supabase/supabase-js';

// ============================================================
// REGULATORY RETRIEVAL ENGINE
// Digunakan oleh data-intelligence dan validate-collateral
// ============================================================

// Provider embed — pakai provider yang sama dengan AI utama
const EMBED_PROVIDER: 'openai' | 'deepseek_compatible' = 'openai';

async function getEmbedding(text: string): Promise<number[] | null> {
  // OpenAI text-embedding-3-small (1536 dims, murah dan cukup)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY tidak ada — semantic search dinonaktifkan, hanya rule-based');
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch (err) {
    console.error('Embedding error:', err);
    return null;
  }
}

// ============================================================
// TYPES
// ============================================================
export interface RegulationArticle {
  article_id: string;
  regulation_id: string;
  regulation_code: string;
  regulation_title: string;
  article_ref: string;
  content: string;
  content_summary: string;
  topics: string[];
  is_mandatory: boolean;
  importance: number;
  similarity: number;
  retrieval_source: 'mandatory' | 'semantic';
}

export interface RetrievalContext {
  mandatory_articles: RegulationArticle[];
  semantic_articles: RegulationArticle[];
  all_articles: RegulationArticle[];
  context_block: string;  // siap diinjeksi ke system prompt
  regulation_codes: string[];
}

// ============================================================
// INFER TOPICS dari data request
// ============================================================
export function inferTopics(request: any): {
  topics: string[];
  collateral_type: string;
  ownership_type: string;
  akad_type: string;
} {
  const c = request.collateral || {};
  const d = c.details || {};
  const topics: string[] = [];

  // Dari jenis jaminan
  const collateralType = c.type || '';
  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(collateralType)) {
    topics.push('apht', 'tanah', 'jaminan', 'bpn');
    if (collateralType === 'tanah_shgb') topics.push('hgb');
    if (collateralType === 'bangunan') topics.push('imb');
  }
  if (collateralType === 'kendaraan_roda4') {
    topics.push('fidusia', 'kendaraan', 'jaminan', 'stnk');
    if (d.stnk_active === false) topics.push('stnk_mati');
  }

  // Dari status kepemilikan
  const ownershipType = d.ownership_status || '';
  if (ownershipType === 'harta_bersama') {
    topics.push('harta_bersama', 'perkawinan', 'persetujuan');
  }
  if (ownershipType === 'warisan_belum_dibagi') {
    topics.push('waris', 'ahli_waris', 'pembagian');
  }
  if (ownershipType === 'kuasa') {
    topics.push('kuasa', 'skmht');
  }

  // Dari nama nasabah vs nama pemilik
  if (request.customer_name && d.owner_name &&
      request.customer_name.toLowerCase().trim() !== d.owner_name.toLowerCase().trim()) {
    topics.push('kepemilikan', 'identitas', 'kuasa');
  }

  // Dari akad
  const akadType = (request.contract_type || 'murabahah').toLowerCase();
  topics.push(akadType, 'syariah', 'pembiayaan');

  // Selalu sertakan KYC dan kualitas aset
  topics.push('kyc', 'kualitas_aset', 'ftv');

  return {
    topics: [...new Set(topics)],
    collateral_type: collateralType,
    ownership_type: ownershipType,
    akad_type: akadType,
  };
}

// ============================================================
// MAIN RETRIEVAL FUNCTION
// ============================================================
export async function retrieveRegulations(
  request: any,
  supabase: ReturnType<typeof createClient>
): Promise<RetrievalContext> {

  const { topics, collateral_type, ownership_type, akad_type } = inferTopics(request);

  // Build query context untuk embedding
  const queryContext = `
    Jaminan: ${collateral_type}
    Kepemilikan: ${ownership_type}
    Akad: ${akad_type}
    Topik: ${topics.join(', ')}
    Catatan: ${request.collateral?.details?.notes || ''}
    Nasabah: ${request.customer_name} | Pemilik jaminan: ${request.collateral?.details?.owner_name}
  `.trim();

  // Get embedding (optional — graceful fallback jika gagal)
  const embedding = await getEmbedding(queryContext);

  let articles: RegulationArticle[] = [];

  if (embedding) {
    // Hybrid search via DB function
    const { data, error } = await supabase.rpc('hybrid_regulation_search', {
      query_embedding: embedding,
      p_topics: topics,
      p_collateral_type: collateral_type || null,
      p_ownership_type: ownership_type || null,
      p_akad_type: akad_type || null,
      semantic_limit: 10,
      mandatory_only: false,
    });

    if (!error && data) articles = data as RegulationArticle[];
  } else {
    // Fallback: hanya rule-based lookup jika tidak ada embedding
    const { data, error } = await supabase
      .from('regulation_articles')
      .select(`
        id,
        regulation_id,
        article_ref,
        content,
        content_summary,
        topics,
        is_mandatory,
        importance,
        regulations!inner(code, short_title, title)
      `)
      .eq('is_mandatory', true)
      .eq('regulations.status', 'aktif')
      .or(`topics.cs.{${topics.join(',')}},collateral_types.cs.{${collateral_type}},ownership_types.cs.{${ownership_type}}`)
      .order('importance', { ascending: false })
      .limit(20);

    if (!error && data) {
      articles = (data as any[]).map(a => ({
        article_id: a.id,
        regulation_id: a.regulation_id,
        regulation_code: a.regulations?.code || '',
        regulation_title: a.regulations?.short_title || a.regulations?.title || '',
        article_ref: a.article_ref,
        content: a.content,
        content_summary: a.content_summary,
        topics: a.topics,
        is_mandatory: a.is_mandatory,
        importance: a.importance,
        similarity: 1.0,
        retrieval_source: 'mandatory' as const,
      }));
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = articles.filter(a => {
    if (seen.has(a.article_id)) return false;
    seen.add(a.article_id);
    return true;
  });

  const mandatory = deduped.filter(a => a.is_mandatory);
  const semantic = deduped.filter(a => !a.is_mandatory);

  // Build context block
  const contextBlock = buildContextBlock(mandatory, semantic, request);

  // Log query (fire-and-forget)
  supabase.from('regulation_query_log').insert({
    request_id: request.id,
    query_context: queryContext.slice(0, 500),
    retrieved_ids: deduped.map(a => a.article_id),
    retrieval_method: embedding ? 'hybrid' : 'rule_based',
  }).then(() => {}).catch(() => {});

  return {
    mandatory_articles: mandatory,
    semantic_articles: semantic,
    all_articles: deduped,
    context_block: contextBlock,
    regulation_codes: [...new Set(deduped.map(a => a.regulation_code))],
  };
}

// ============================================================
// BUILD CONTEXT BLOCK
// Format yang diinjeksi ke system prompt AI
// ============================================================
function buildContextBlock(
  mandatory: RegulationArticle[],
  semantic: RegulationArticle[],
  request: any
): string {
  const d = request.collateral?.details || {};
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('REGULATORY KNOWLEDGE BASE — ANCHOR HUKUM UNTUK ANALISA INI');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');
  lines.push('INSTRUKSI KRITIS:');
  lines.push('1. Setiap temuan hukum WAJIB merujuk ke pasal yang tercantum di bawah ini');
  lines.push('2. DILARANG merujuk regulasi, pasal, atau fatwa yang tidak ada dalam daftar ini');
  lines.push('3. Jika situasi tidak tercakup → nyatakan "perlu konfirmasi legal counsel" — jangan mengarang');
  lines.push('4. Nomor pasal yang disebutkan dalam analisa HARUS cocok persis dengan yang di bawah ini');
  lines.push('');

  if (mandatory.length > 0) {
    lines.push('─── PASAL WAJIB (berlaku untuk kasus ini secara deterministik) ───');
    lines.push('');
    mandatory.forEach((a, i) => {
      lines.push(`[${i + 1}] ${a.article_ref}`);
      lines.push(`    Regulasi: ${a.regulation_code} — ${a.regulation_title}`);
      lines.push(`    Ringkasan: ${a.content_summary}`);
      lines.push(`    Isi: "${a.content.slice(0, 400)}${a.content.length > 400 ? '…' : ''}"`);
      lines.push('');
    });
  }

  if (semantic.length > 0) {
    lines.push('─── PASAL RELEVAN (berdasarkan konteks spesifik kasus ini) ───');
    lines.push('');
    semantic
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6)
      .forEach((a, i) => {
        lines.push(`[${mandatory.length + i + 1}] ${a.article_ref} (relevansi: ${Math.round(a.similarity * 100)}%)`);
        lines.push(`    Regulasi: ${a.regulation_code} — ${a.regulation_title}`);
        lines.push(`    Ringkasan: ${a.content_summary}`);
        lines.push('');
      });
  }

  // Tambahkan catatan kontekstual
  lines.push('─── KONTEKS KEPEMILIKAN YANG BERLAKU ───');
  if (d.ownership_status === 'harta_bersama') {
    lines.push('AKTIF: UU Perkawinan Ps.36 — persetujuan KEDUA pihak adalah WAJIB HUKUM');
    lines.push('       Tanpa persetujuan pasangan = akad berpotensi batal demi hukum');
  }
  if (d.ownership_status === 'warisan_belum_dibagi') {
    lines.push('AKTIF: KHI Ps.187 — seluruh ahli waris harus hadir atau diwakili secara sah');
    lines.push('       Ahli waris minor memerlukan penetapan wali dari Pengadilan Agama');
  }
  if (d.stnk_active === false) {
    lines.push('PERHATIAN: Tidak ada regulasi yang membolehkan jaminan kendaraan dengan STNK mati');
    lines.push('           Solusi hukum: klausul kewajiban perpanjangan dengan batas waktu + denda');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}

// ============================================================
// INJECT ke system prompt
// Panggil ini di validate-collateral dan data-intelligence
// sebelum buildUserPrompt
// ============================================================
export function injectRegulatoryContext(
  baseSystemPrompt: string,
  regulatoryContext: RetrievalContext
): string {
  return regulatoryContext.context_block + '\n\n' + baseSystemPrompt;
}
