import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface RegulationQuery {
  topics: string[];
  collateral_type: string | null;
  ownership_type: string | null;
  akad_type: string | null;
}

export interface RegulationResult {
  id: string;
  code: string;
  type: string;
  hierarchy_level: number;
  article_number: string;
  content: string;
  content_plain: string;
  legal_implication: string;
  topics: string[];
}

export function buildRegulationQuery(
  collateralType: string,
  ownershipStatus: string,
  akadType: string = 'murabahah'
): RegulationQuery {
  const topics: string[] = [];

  if (ownershipStatus === 'harta_bersama') {
    topics.push('harta_bersama', 'persetujuan_pasangan', 'perkawinan');
  }
  if (ownershipStatus === 'warisan_belum_dibagi') {
    topics.push('waris', 'ahli_waris', 'perwalian');
  }
  if (['tanah_shm', 'tanah_shgb', 'bangunan'].includes(collateralType)) {
    topics.push('apht', 'hak_tanggungan', 'tanah');
  }
  if (collateralType === 'kendaraan_roda4') {
    topics.push('fidusia', 'kendaraan', 'bpkb');
  }
  topics.push('jaminan', 'pembiayaan', 'kehati_hatian');

  return {
    topics: Array.from(new Set(topics)),
    collateral_type: collateralType || null,
    ownership_type: ownershipStatus || null,
    akad_type: akadType || null,
  };
}

export async function retrieveRegulations(
  query: RegulationQuery
): Promise<RegulationResult[]> {
  const supabase = getSupabase();

  const topicsFilter = `{${query.topics.join(',')}}`;
  const collateralFilter = query.collateral_type
    ? `{${query.collateral_type}}`
    : '{semua}';

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
    console.error('regulation-retrieval error:', error?.message);
    return [];
  }

  return (data as any[])
    .sort(
      (a, b) =>
        (a.regulations?.hierarchy_level ?? 9) -
        (b.regulations?.hierarchy_level ?? 9)
    )
    .map((row) => ({
      id: row.id,
      code: row.regulations?.code || '',
      type: row.regulations?.type || '',
      hierarchy_level: row.regulations?.hierarchy_level || 5,
      article_number: row.article_number,
      content: row.content,
      content_plain: row.content_plain || '',
      legal_implication: row.legal_implication || '',
      topics: row.topics || [],
    }));
}
