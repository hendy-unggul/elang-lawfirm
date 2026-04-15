import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/download-draft?id=<request_id>
// Generate HTML dokumen akad yang bisa diprint/save as PDF dari browser
// Pendekatan: return HTML yang dioptimasi untuk print — lebih reliable dari PDF library di serverless

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: request, error } = await supabase
      .from('contract_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) return NextResponse.json({ error: 'Request tidak ditemukan' }, { status: 404 });

    const draft = request.draft_contract;
    if (!draft || !draft.articles) return NextResponse.json({ error: 'Draft belum tersedia' }, { status: 404 });

    const html = buildContractHTML(request, draft);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="akad-${request.request_number || id.slice(0, 8)}.html"`,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// BUILD CONTRACT HTML — print-optimized
// ============================================================
function buildContractHTML(request: any, draft: any): string {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const reqNo = request.request_number || request.id.slice(0, 8).toUpperCase();
  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const articles = draft.articles || [];
  const specialClauses = draft.special_clauses || [];
  const pending = draft.metadata?.pending_items || [];
  const regulations = draft.metadata?.applicable_regulations || [];
  const notaryNotes = draft.metadata?.notes_for_notary || '';

  const articlesHTML = articles.map((art: any) => `
    <div class="article">
      <div class="article-title">Pasal ${art.number}<br>${(art.title || '').toUpperCase()}</div>
      ${art.content ? `<p>${art.content}</p>` : ''}
      ${(art.sub_articles || []).length > 0 ? `
        <ol class="sub-articles">
          ${art.sub_articles.map((sub: string) => `<li>${sub}</li>`).join('')}
        </ol>
      ` : ''}
    </div>
  `).join('');

  const specialHTML = specialClauses.length > 0 ? `
    <div class="article">
      <div class="article-title">KLAUSUL KHUSUS PENGAMANAN</div>
      ${specialClauses.map((sc: any, i: number) => `
        <div class="special-clause">
          <strong>${i + 1}. ${sc.title || 'Klausul ' + (i + 1)}</strong>
          <p>${sc.content}</p>
          ${sc.basis ? `<p class="basis-note">Dasar: ${sc.basis}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const pendingHTML = pending.length > 0 ? `
    <div class="pending-box no-print">
      <div class="pending-title">Item yang masih perlu dilengkapi sebelum penandatanganan:</div>
      <ul>
        ${pending.map((p: string) => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const regulationsHTML = regulations.length > 0 ? `
    <div class="regulations">
      <strong>Regulasi yang dirujuk:</strong>
      <span>${regulations.join(' · ')}</span>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${draft.contract_title || 'Akad Pembiayaan'} — ${reqNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      line-height: 1.6;
    }

    .page-wrapper {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 25mm;
    }

    /* Header */
    .contract-header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }

    .bank-name {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }

    .bank-tagline {
      font-size: 9pt;
      color: #555;
      margin-bottom: 16px;
    }

    .contract-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .contract-number {
      font-size: 10pt;
      color: #333;
    }

    .draft-watermark {
      display: inline-block;
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      font-size: 9pt;
      padding: 3px 10px;
      border-radius: 3px;
      margin-top: 8px;
      font-family: Arial, sans-serif;
    }

    /* Preamble */
    .preamble {
      margin-bottom: 24px;
      text-align: justify;
      line-height: 1.8;
    }

    /* Parties */
    .parties-section {
      margin-bottom: 24px;
    }

    .parties-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 12px;
      font-size: 11pt;
    }

    .party-block {
      margin-bottom: 16px;
      padding: 12px 16px;
      border-left: 3px solid #333;
      background: #f9f9f9;
    }

    .party-role {
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
      margin-bottom: 6px;
      color: #333;
    }

    .party-detail {
      font-size: 11pt;
      line-height: 1.7;
    }

    /* Articles */
    .article {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }

    .article-title {
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-size: 11pt;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .article p {
      text-align: justify;
      margin-bottom: 8px;
      line-height: 1.8;
    }

    .sub-articles {
      padding-left: 24px;
      margin-top: 8px;
    }

    .sub-articles li {
      margin-bottom: 8px;
      line-height: 1.8;
      text-align: justify;
    }

    /* Special clauses */
    .special-clause {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #ddd;
      background: #fafafa;
    }

    .special-clause p {
      margin-top: 8px;
      text-align: justify;
      line-height: 1.8;
    }

    .basis-note {
      font-size: 9pt;
      color: #666;
      font-style: italic;
    }

    /* Closing */
    .closing {
      margin: 28px 0;
      text-align: justify;
      line-height: 1.8;
    }

    /* Signature block */
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }

    .signature-title {
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-bottom: 32px;
      font-size: 11pt;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 32px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-role {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 60px;
    }

    .signature-line {
      border-bottom: 1px solid #000;
      margin-bottom: 6px;
    }

    .signature-name {
      font-size: 10pt;
    }

    .witness-block {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #ccc;
    }

    .witness-title {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .witness-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .notary-block {
      margin-top: 32px;
      padding: 16px;
      border: 2px solid #000;
      text-align: center;
    }

    .notary-title {
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
      margin-bottom: 40px;
    }

    /* Footer */
    .contract-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #666;
    }

    .regulations {
      margin-top: 8px;
      line-height: 1.5;
    }

    /* Pending box — only shown on screen */
    .pending-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 16px 20px;
      margin: 24px 0;
      font-family: Arial, sans-serif;
      font-size: 10pt;
    }

    .pending-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 10px;
    }

    .pending-box ul {
      padding-left: 20px;
      color: #856404;
    }

    .pending-box li { margin-bottom: 4px; }

    /* Print controls */
    .print-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 100;
      font-family: Arial, sans-serif;
    }

    .btn-print, .btn-close {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .btn-print {
      background: #0c0d0f;
      color: #e8e6e0;
    }

    .btn-print:hover { background: #1e2023; }

    .btn-close {
      background: rgba(255,255,255,0.9);
      color: #333;
      border: 1px solid #ddd;
    }

    .divider {
      border: none;
      border-top: 1px solid #ccc;
      margin: 20px 0;
    }

    @media print {
      .no-print, .print-controls { display: none !important; }
      body { font-size: 11pt; }
      .page-wrapper { padding: 15mm 20mm; max-width: 100%; }
      .article { page-break-inside: avoid; }
      .signature-section { page-break-before: always; }
      @page { margin: 15mm 20mm; size: A4; }
    }
  </style>
</head>
<body>

<div class="print-controls no-print">
  <button class="btn-close" onclick="window.close()">✕ Tutup</button>
  <button class="btn-print" onclick="window.print()">⎙ Print / Simpan PDF</button>
</div>

<div class="page-wrapper">

  <!-- Header -->
  <div class="contract-header">
    <div class="bank-name">[NAMA BANK SYARIAH]</div>
    <div class="bank-tagline">Perbankan Syariah Indonesia</div>
    <div class="contract-title">${draft.contract_title || 'Akad Pembiayaan Murabahah'}</div>
    <div class="contract-number">No: ${reqNo} / ${new Date().getFullYear()}</div>
    <span class="draft-watermark no-print">DRAFT — Belum Final, Perlu Review Notaris</span>
  </div>

  <!-- Pending items alert -->
  ${pendingHTML}

  <!-- Preamble -->
  ${draft.preamble ? `<div class="preamble">${draft.preamble}</div>` : ''}

  <!-- Parties -->
  <div class="parties-section">
    <div class="parties-title">Para Pihak</div>

    ${draft.parties?.bank ? `
    <div class="party-block">
      <div class="party-role">Pihak Pertama — Bank</div>
      <div class="party-detail">
        <strong>${draft.parties.bank.name || '[NAMA BANK]'}</strong><br>
        ${draft.parties.bank.address || '[ALAMAT BANK]'}<br>
        Diwakili oleh: ${draft.parties.bank.represented_by || '[NAMA DIREKSI]'}<br>
        Jabatan: ${draft.parties.bank.position || '[JABATAN]'}
      </div>
    </div>
    ` : ''}

    ${draft.parties?.debtor ? `
    <div class="party-block">
      <div class="party-role">Pihak Kedua — Nasabah/Debitur</div>
      <div class="party-detail">
        <strong>${draft.parties.debtor.name || request.customer_name}</strong><br>
        NIK: ${draft.parties.debtor.nik || request.customer_id_number || '[NIK]'}<br>
        ${draft.parties.debtor.address || '[ALAMAT NASABAH]'}
      </div>
    </div>
    ` : ''}

    ${draft.parties?.guarantor && draft.parties.guarantor.name ? `
    <div class="party-block">
      <div class="party-role">Pihak Ketiga — Penjamin</div>
      <div class="party-detail">
        <strong>${draft.parties.guarantor.name}</strong><br>
        NIK: ${draft.parties.guarantor.nik || '[NIK PENJAMIN]'}<br>
        Hubungan: ${draft.parties.guarantor.relationship || '[HUBUNGAN DENGAN NASABAH]'}
      </div>
    </div>
    ` : ''}
  </div>

  <hr class="divider">

  <!-- Articles -->
  ${articlesHTML}

  <!-- Special clauses -->
  ${specialHTML}

  <!-- Closing -->
  ${draft.closing ? `<div class="closing">${draft.closing}</div>` : ''}

  <hr class="divider">

  <!-- Signature block -->
  <div class="signature-section">
    <div class="signature-title">Demikian akad ini dibuat dan ditandatangani pada tanggal ${today}</div>

    <div class="signature-grid">
      <div class="signature-block">
        <div class="signature-role">Pihak Pertama<br>(Bank)</div>
        <div class="signature-line"></div>
        <div class="signature-name">${draft.parties?.bank?.represented_by || '[NAMA DIREKSI]'}<br>${draft.parties?.bank?.position || '[JABATAN]'}</div>
      </div>
      <div class="signature-block">
        <div class="signature-role">Pihak Kedua<br>(Nasabah)</div>
        <div class="signature-line"></div>
        <div class="signature-name">${request.customer_name}<br>Nasabah/Debitur</div>
      </div>
    </div>

    ${draft.parties?.guarantor?.name ? `
    <div class="signature-grid" style="grid-template-columns: 1fr; max-width: 50%; margin: 0 auto;">
      <div class="signature-block">
        <div class="signature-role">Pihak Ketiga<br>(Penjamin)</div>
        <div class="signature-line"></div>
        <div class="signature-name">${draft.parties.guarantor.name}<br>Penjamin</div>
      </div>
    </div>
    ` : ''}

    <div class="witness-block">
      <div class="witness-title">Saksi-Saksi:</div>
      <div class="witness-grid">
        <div class="signature-block">
          <div class="signature-role">Saksi 1</div>
          <div class="signature-line"></div>
          <div class="signature-name">[NAMA SAKSI 1]</div>
        </div>
        <div class="signature-block">
          <div class="signature-role">Saksi 2</div>
          <div class="signature-line"></div>
          <div class="signature-name">[NAMA SAKSI 2]</div>
        </div>
      </div>
    </div>

    <div class="notary-block">
      <div class="notary-title">Dibuat di hadapan Notaris</div>
      <div style="margin-bottom: 50px;">
        [NAMA NOTARIS]<br>
        Notaris di [KOTA]<br>
        SK No. [NOMOR SK NOTARIS]
      </div>
      <div style="border-top: 1px solid #000; padding-top: 8px;">
        Tanda Tangan & Cap Notaris
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="contract-footer no-print">
    <div>Generated: ${new Date().toLocaleString('id-ID')} · No. Request: ${reqNo} · Draft v${draft.metadata?.draft_version || '1.0'}</div>
    ${regulationsHTML}
    ${notaryNotes ? `<div style="margin-top: 8px;"><strong>Catatan untuk notaris:</strong> ${notaryNotes}</div>` : ''}
  </div>

</div>

</body>
</html>`;
}
