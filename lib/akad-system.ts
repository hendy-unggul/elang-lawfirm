export interface AkadDefinition {
  code: string;
  name: string;
  arabic: string;
  category: 'jual_beli' | 'bagi_hasil' | 'sewa' | 'pinjaman' | 'jasa';
  fatwa_dsn: string[];
  description: string;
  use_cases: string[];
  requires_margin: boolean;
  requires_profit_share: boolean;
  requires_rental_rate: boolean;
  requires_project_desc: boolean;
  requires_goods_desc: boolean;
  amount_label: string;
  rate_label: string;
  rate_placeholder: string;
  common_collateral: string[];
  warnings: string[];
  is_active: boolean;
}

export const AKAD_LIST: AkadDefinition[] = [
  {
    code: 'murabahah', name: 'Murabahah', arabic: 'المرابحة', category: 'jual_beli',
    fatwa_dsn: ['No.04/DSN-MUI/IV/2000', 'No.84/DSN-MUI/XII/2012'],
    description: 'Jual beli dengan harga pokok ditambah margin keuntungan yang disepakati dan transparan.',
    use_cases: ['Pembelian rumah/properti', 'Pembelian kendaraan', 'Pembelian barang konsumsi', 'Peralatan usaha'],
    requires_margin: true, requires_profit_share: false, requires_rental_rate: false,
    requires_project_desc: false, requires_goods_desc: true,
    amount_label: 'Nilai pembiayaan (harga pokok)', rate_label: 'Margin keuntungan (%)', rate_placeholder: 'Contoh: 5',
    common_collateral: ['tanah_shm', 'tanah_shgb', 'bangunan', 'kendaraan_roda4'],
    warnings: [], is_active: true,
  },
  {
    code: 'salam', name: 'Salam', arabic: 'السلم', category: 'jual_beli',
    fatwa_dsn: ['No.05/DSN-MUI/IV/2000'],
    description: 'Jual beli barang yang belum ada (pesanan). Pembayaran di muka, barang diserahkan kemudian.',
    use_cases: ['Pembiayaan pertanian', 'Pembiayaan peternakan', 'Pembelian hasil panen di muka'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: false,
    requires_project_desc: false, requires_goods_desc: true,
    amount_label: 'Nilai pembiayaan (harga barang)', rate_label: 'Keuntungan bank (%)', rate_placeholder: 'Selisih harga beli vs pasar',
    common_collateral: ['tanah_shm', 'bangunan'],
    warnings: ['Spesifikasi barang harus terukur dan jelas', 'Tanggal penyerahan barang wajib ditetapkan'], is_active: true,
  },
  {
    code: 'istishna', name: "Istishna'", arabic: 'الاستصناع', category: 'jual_beli',
    fatwa_dsn: ['No.06/DSN-MUI/IV/2000', 'No.22/DSN-MUI/III/2002'],
    description: 'Akad pemesanan barang yang dibuat sesuai spesifikasi. Pembayaran bisa bertahap sesuai progress.',
    use_cases: ['Pembangunan rumah/gedung', 'Pembuatan kapal', 'Pengadaan mesin industri kustom'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: false,
    requires_project_desc: true, requires_goods_desc: true,
    amount_label: 'Nilai pembiayaan (biaya produksi)', rate_label: 'Keuntungan bank (%)', rate_placeholder: 'Margin atas biaya produksi',
    common_collateral: ['tanah_shm', 'bangunan'],
    warnings: ['Spesifikasi teknis wajib dilampirkan', 'Jadwal pembayaran sesuai progress konstruksi'], is_active: true,
  },
  {
    code: 'mudharabah', name: 'Mudharabah', arabic: 'المضاربة', category: 'bagi_hasil',
    fatwa_dsn: ['No.07/DSN-MUI/IV/2000', 'No.135/DSN-MUI/V/2020'],
    description: 'Bank menyediakan modal penuh, nasabah mengelola usaha. Keuntungan dibagi sesuai nisbah.',
    use_cases: ['Modal kerja usaha', 'Pembiayaan proyek bisnis', 'Pembiayaan perdagangan'],
    requires_margin: false, requires_profit_share: true, requires_rental_rate: false,
    requires_project_desc: true, requires_goods_desc: false,
    amount_label: 'Modal yang disediakan bank', rate_label: 'Nisbah bagi hasil nasabah (%)', rate_placeholder: 'Contoh: 60 (nasabah 60%, bank 40%)',
    common_collateral: ['tanah_shm', 'bangunan', 'kendaraan_roda4'],
    warnings: ['Laporan keuangan usaha wajib diserahkan berkala', 'Kerugian ditanggung bank kecuali ada kelalaian nasabah'], is_active: true,
  },
  {
    code: 'musyarakah', name: 'Musyarakah', arabic: 'المشاركة', category: 'bagi_hasil',
    fatwa_dsn: ['No.08/DSN-MUI/IV/2000'],
    description: 'Bank dan nasabah sama-sama menyetor modal. Keuntungan dan kerugian dibagi proporsional.',
    use_cases: ['Modal kerja bersama', 'Proyek joint venture', 'Pengembangan bisnis aktif'],
    requires_margin: false, requires_profit_share: true, requires_rental_rate: false,
    requires_project_desc: true, requires_goods_desc: false,
    amount_label: 'Porsi modal bank', rate_label: 'Nisbah bagi hasil bank (%)', rate_placeholder: 'Contoh: 40 (bank 40%, nasabah 60%)',
    common_collateral: ['tanah_shm', 'bangunan'],
    warnings: ['Modal nasabah harus terverifikasi', 'Laporan usaha berkala wajib'], is_active: true,
  },
  {
    code: 'musyarakah_mutanaqisah', name: 'Musyarakah Mutanaqisah (MMQ)', arabic: 'المشاركة المتناقصة', category: 'bagi_hasil',
    fatwa_dsn: ['No.73/DSN-MUI/XI/2008'],
    description: 'Musyarakah di mana porsi kepemilikan bank berkurang bertahap hingga aset sepenuhnya milik nasabah.',
    use_cases: ['KPR syariah', 'Kepemilikan properti komersial', 'Kepemilikan kendaraan jangka panjang'],
    requires_margin: false, requires_profit_share: true, requires_rental_rate: true,
    requires_project_desc: false, requires_goods_desc: false,
    amount_label: 'Nilai porsi kepemilikan bank', rate_label: 'Nisbah bagi hasil bank (%)', rate_placeholder: 'Contoh: 30 (bank 30%)',
    common_collateral: ['tanah_shm', 'tanah_shgb', 'bangunan'],
    warnings: ['Nilai sewa periodik ditetapkan di awal', 'Porsi kepemilikan bank berkurang tiap cicilan'], is_active: true,
  },
  {
    code: 'ijarah', name: 'Ijarah', arabic: 'الإجارة', category: 'sewa',
    fatwa_dsn: ['No.09/DSN-MUI/IV/2000', 'No.112/DSN-MUI/IX/2017'],
    description: 'Akad sewa manfaat atas aset dalam jangka waktu tertentu dengan imbalan ujrah. Kepemilikan tetap di bank.',
    use_cases: ['Sewa peralatan/mesin usaha', 'Sewa kendaraan operasional', 'Pembiayaan jasa pendidikan/kesehatan'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: true,
    requires_project_desc: false, requires_goods_desc: true,
    amount_label: 'Nilai objek sewa', rate_label: 'Ujrah bulanan (Rp)', rate_placeholder: 'Biaya sewa per bulan',
    common_collateral: ['tanah_shm', 'bangunan', 'kendaraan_roda4'],
    warnings: ['Bank bertanggung jawab atas kerusakan bukan akibat pemakaian'], is_active: true,
  },
  {
    code: 'imbt', name: 'Ijarah Muntahia Bittamlik (IMBT)', arabic: 'الإجارة المنتهية بالتمليك', category: 'sewa',
    fatwa_dsn: ['No.27/DSN-MUI/III/2002'],
    description: 'Ijarah dengan opsi perpindahan kepemilikan di akhir masa sewa melalui hibah atau jual beli.',
    use_cases: ['Leasing kendaraan syariah', 'Sewa-beli peralatan berat', 'Pembiayaan aset dengan opsi beli'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: true,
    requires_project_desc: false, requires_goods_desc: true,
    amount_label: 'Nilai aset (harga perolehan)', rate_label: 'Ujrah bulanan (Rp)', rate_placeholder: 'Cicilan sewa bulanan',
    common_collateral: ['kendaraan_roda4', 'bangunan'],
    warnings: ['Mekanisme perpindahan kepemilikan disepakati di awal', 'Opsi beli tidak boleh diwajibkan saat akad'], is_active: true,
  },
  {
    code: 'wakalah', name: 'Wakalah bil Ujrah', arabic: 'الوكالة بالأجر', category: 'jasa',
    fatwa_dsn: ['No.10/DSN-MUI/IV/2000', 'No.115/DSN-MUI/IX/2017'],
    description: 'Pemberian kuasa kepada bank untuk melakukan tindakan atas nama nasabah dengan imbalan fee.',
    use_cases: ['Transfer/pembayaran atas nama nasabah', 'Pengadaan barang oleh bank', 'Kombinasi dengan Murabahah'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: false,
    requires_project_desc: false, requires_goods_desc: false,
    amount_label: 'Nilai yang dikuasakan', rate_label: 'Fee wakalah (%)', rate_placeholder: 'Fee jasa bank',
    common_collateral: ['tanah_shm', 'bangunan'],
    warnings: ['Ruang lingkup kuasa harus jelas', 'Biasanya dikombinasikan dengan akad pembiayaan lain'], is_active: true,
  },
  {
    code: 'qardh', name: 'Qardh', arabic: 'القرض', category: 'pinjaman',
    fatwa_dsn: ['No.19/DSN-MUI/IV/2001'],
    description: 'Pinjaman murni tanpa keuntungan bagi bank. Nasabah hanya mengembalikan pokok.',
    use_cases: ['Dana talangan haji/umroh', 'Pinjaman darurat', 'Pembiayaan sosial/kebajikan'],
    requires_margin: false, requires_profit_share: false, requires_rental_rate: false,
    requires_project_desc: false, requires_goods_desc: false,
    amount_label: 'Jumlah pinjaman', rate_label: 'Biaya administrasi (%)', rate_placeholder: 'Biaya admin riil saja',
    common_collateral: ['tanah_shm', 'kendaraan_roda4'],
    warnings: ['Bank dilarang mensyaratkan keuntungan', 'Hanya biaya administrasi riil yang boleh dibebankan'], is_active: true,
  },
];

export const AKAD_BY_CODE: Record<string, AkadDefinition> =
  AKAD_LIST.reduce((acc, a) => ({ ...acc, [a.code]: a }), {});

export const CATEGORY_LABELS: Record<string, string> = {
  jual_beli: 'Jual Beli', bagi_hasil: 'Bagi Hasil',
  sewa: 'Sewa (Ijarah)', pinjaman: 'Pinjaman', jasa: 'Jasa',
};

export function getActiveAkad(): AkadDefinition[] {
  return AKAD_LIST.filter(a => a.is_active);
}

export function getAkadByCategory(): Record<string, AkadDefinition[]> {
  return AKAD_LIST.filter(a => a.is_active).reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, AkadDefinition[]>);
}
