// ============================================================
// PATCH: Tambahkan ke validate-collateral-v3.ts
// Inject legal context dari RAG engine ke AI prompt
// ============================================================

// 1. Import di bagian atas file (setelah import yang ada):
import { getLegalContext, injectLegalContext } from '@/lib/legal-rag-engine';

// 2. Di dalam MAIN HANDLER, setelah status update ke 'compliance_check'
//    dan sebelum AI call, tambahkan:

/*
  // ── LEGAL RAG: Ambil anchor regulasi yang relevan ──────────
  let enrichedSystemPrompt = SYSTEM_PROMPT;
  try {
    const legalContext = await getLegalContext(request);
    enrichedSystemPrompt = injectLegalContext(SYSTEM_PROMPT, legalContext);
    console.log(`Legal RAG: ${legalContext.total_articles_found} pasal, ${legalContext.scenarios_matched} skenario`);
  } catch (ragErr) {
    console.error('Legal RAG error (non-critical):', ragErr);
    // Lanjutkan dengan system prompt base jika RAG gagal
  }
*/

// 3. Ubah AI call untuk menggunakan enrichedSystemPrompt:
/*
  const aiResponse = await fetch(provider.url, {
    method: 'POST',
    headers: provider.buildHeaders(apiKey),
    body: JSON.stringify(
      provider.buildBody(enrichedSystemPrompt, buildUserPrompt(request, completeness))
    ),
  });
*/

// ============================================================
// Versi lengkap MAIN HANDLER yang sudah diintegrasikan:
// (Ganti seluruh blok export async function POST di v3)
// ============================================================

export const VALIDATE_COLLATERAL_HANDLER_PATCH = `
// Di dalam POST handler, setelah update status ke 'compliance_check':

// ── LEGAL RAG ──────────────────────────────────────────────
let enrichedSystemPrompt = SYSTEM_PROMPT;
try {
  const { getLegalContext, injectLegalContext } = await import('@/lib/legal-rag-engine');
  const legalContext = await getLegalContext(request);
  enrichedSystemPrompt = injectLegalContext(SYSTEM_PROMPT, legalContext);

  // Simpan context yang digunakan untuk transparency
  await supabase.from('contract_requests').update({
    legal_context_used: {
      articles_count: legalContext.total_articles_found,
      scenarios_count: legalContext.scenarios_matched,
      regulations: legalContext.applicable_regulations,
    }
  }).eq('id', request_id);

} catch (ragErr) {
  console.error('Legal RAG (non-critical):', ragErr);
}

// Update status
await supabase.from('contract_requests').update({ status: 'under_analysis' }).eq('id', request_id);

// AI call dengan enriched prompt
const aiResponse = await fetch(provider.url, {
  method: 'POST',
  headers: provider.buildHeaders(apiKey),
  body: JSON.stringify(
    provider.buildBody(enrichedSystemPrompt, buildUserPrompt(request, completeness))
  ),
});
`;
