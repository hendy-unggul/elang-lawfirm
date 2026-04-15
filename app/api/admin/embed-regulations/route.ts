import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/admin/embed-regulations
// One-time setup: embed semua artikel regulasi yang belum ada embedding
// Juga digunakan saat ada artikel baru ditambahkan
// Hanya bisa diakses oleh admin (service role)

export async function POST(req: NextRequest) {
  // Simple auth check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return NextResponse.json({ error: 'OPENAI_API_KEY tidak dikonfigurasi' }, { status: 500 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Ambil artikel yang belum di-embed
  const { data: articles, error } = await supabase
    .from('regulation_articles')
    .select('id, article_ref, content, content_summary')
    .is('embedding', null)
    .limit(100); // batch 100 per request

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles?.length) return NextResponse.json({ message: 'Semua artikel sudah di-embed', count: 0 });

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      // Text untuk embed: article_ref + summary + content (truncated)
      const textToEmbed = [
        article.article_ref,
        article.content_summary || '',
        article.content.slice(0, 2000),
      ].join('\n').trim();

      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: textToEmbed,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        errors.push(`${article.article_ref}: ${err}`);
        failed++;
        continue;
      }

      const data = await res.json();
      const embedding = data.data?.[0]?.embedding;

      if (!embedding) { failed++; continue; }

      const { error: updateErr } = await supabase
        .from('regulation_articles')
        .update({ embedding })
        .eq('id', article.id);

      if (updateErr) { errors.push(`${article.article_ref}: ${updateErr.message}`); failed++; }
      else success++;

      // Rate limit: 500ms antara requests
      await new Promise(r => setTimeout(r, 500));

    } catch (err: any) {
      errors.push(`${article.article_ref}: ${err.message}`);
      failed++;
    }
  }

  return NextResponse.json({
    message: `Embedding selesai: ${success} berhasil, ${failed} gagal`,
    success, failed,
    errors: errors.slice(0, 10),
    remaining: articles.length - success - failed,
  });
}

// GET /api/admin/embed-regulations — cek status
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count: total } = await supabase
    .from('regulation_articles')
    .select('*', { count: 'exact', head: true });

  const { count: embedded } = await supabase
    .from('regulation_articles')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  const { data: regulations } = await supabase
    .from('regulations')
    .select('code, short_title, status, type')
    .order('type', { ascending: true });

  return NextResponse.json({
    total_articles: total,
    embedded_articles: embedded,
    pending_embed: (total || 0) - (embedded || 0),
    regulations: regulations || [],
  });
}
