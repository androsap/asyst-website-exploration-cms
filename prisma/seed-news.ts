// Berita dummy untuk mengisi CMS & website saat pengembangan.
//
//   npm run db:seed-news                       → buat/update berita dummy (idempoten, dicocokkan lewat slug)
//   NEWS_DUMMY_REMOVE=true npm run db:seed-news → hapus lagi semua berita dummy dari script ini
//
// Memakai kategori/tag/penulis yang sudah ada (hasil db:import-web). Data melewati
// withDefaults + validasi + sanitasi yang sama dengan form admin (saveItem).
//
// Sampul: foto dari ../asyst-web dikurasi agar seragam ala "feed aesthetic" (semua foto orang/area
// kerja bercahaya alami, tanpa screenshot UI/ilustrasi), lalu diberi color grading yang sama
// (desaturasi + nuansa navy ASYST) dan crop 16:9 → disimpan sebagai media "news/<slug>.webp".
// Jumlah berita terbit = 9 agar grid 3 kolom di website penuh (3×3).
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { prisma } from "../src/lib/prisma";
import { blobEnabled } from "../src/lib/env";
import { withDefaults } from "../src/content/fields";
import { getCollection } from "../src/content/collections";
import { saveItem, type Status } from "../src/server/repo/collections";
import { findImportUser } from "./shared";

const WEB_DIR = path.resolve(process.env.ASYST_WEB_DIR ?? "../asyst-web");
const IMG = "src/assets/asyst/img/background/";
const COVER_W = 1600;
const COVER_H = 900;

type L = { id: string; en: string };
type Dummy = {
  slug: string;
  title: L;
  excerpt: L;
  content: L;
  /** Foto sumber, relatif ke ASYST_WEB_DIR. */
  cover: string;
  coverAlt: L;
  category: string; // key NEWS_CATEGORY
  tags: string[]; // key TAG
  featured?: boolean;
  status: Status;
  publishedAt?: string;
};

const p = (...xs: string[]) => xs.map((x) => `<p>${x}</p>`).join("");

const ARTICLES: Dummy[] = [
  {
    slug: "asyst-perkuat-transformasi-digital-maskapai",
    title: {
      id: "ASYST Perkuat Transformasi Digital Industri Penerbangan",
      en: "ASYST Strengthens Digital Transformation in Aviation",
    },
    excerpt: {
      id: "Platform terintegrasi membantu maskapai menyatukan operasional, data, dan layanan pelanggan dalam satu ekosistem.",
      en: "An integrated platform helps airlines unify operations, data, and customer service in one ecosystem.",
    },
    content: {
      id:
        p(
          "Industri penerbangan terus bergerak cepat. Maskapai dituntut melayani penumpang lebih baik sambil menjaga efisiensi biaya operasional.",
          "ASYST menghadirkan rangkaian solusi yang menghubungkan sistem reservasi, loyalitas, hingga kargo sehingga data mengalir tanpa hambatan antar-unit.",
        ) +
        "<h2>Fokus pada integrasi</h2>" +
        p("Dengan arsitektur berbasis API, sistem lama tetap dapat dimanfaatkan sembari fitur baru dikembangkan secara bertahap."),
      en:
        p(
          "The aviation industry moves fast. Airlines must serve passengers better while keeping operating costs efficient.",
          "ASYST delivers a suite of solutions connecting reservation, loyalty, and cargo systems so data flows seamlessly across units.",
        ) +
        "<h2>Focus on integration</h2>" +
        p("With an API-first architecture, legacy systems remain useful while new features are rolled out incrementally."),
    },
    cover: IMG + "industry/airline-airport/airline.webp",
    coverAlt: { id: "Pesawat di apron bandara saat persiapan keberangkatan", en: "Aircraft on the airport apron preparing for departure" },
    category: "digital-transformation",
    tags: ["aviation", "airlines", "enterprise"],
    featured: true,
    status: "PUBLISHED",
    publishedAt: "2026-11-03T09:00:00+07:00",
  },
  {
    slug: "lima-langkah-modernisasi-sistem-legacy",
    title: { id: "5 Langkah Memodernisasi Sistem Legacy Tanpa Mengganggu Bisnis", en: "5 Steps to Modernize Legacy Systems Without Disrupting Business" },
    excerpt: {
      id: "Modernisasi tidak harus dimulai dari nol. Berikut pendekatan bertahap yang meminimalkan risiko.",
      en: "Modernization doesn't have to start from scratch. Here is a phased approach that minimizes risk.",
    },
    content: {
      id:
        p("Banyak perusahaan masih bergantung pada sistem yang dibangun belasan tahun lalu. Menggantinya sekaligus berisiko tinggi.") +
        "<ol><li>Petakan proses bisnis dan ketergantungan sistem.</li><li>Prioritaskan modul dengan dampak terbesar.</li><li>Bangun lapisan integrasi (API).</li><li>Migrasikan data secara bertahap.</li><li>Ukur hasil dan ulangi.</li></ol>",
      en:
        p("Many companies still rely on systems built over a decade ago. Replacing them all at once is high risk.") +
        "<ol><li>Map business processes and system dependencies.</li><li>Prioritize modules with the biggest impact.</li><li>Build an integration layer (APIs).</li><li>Migrate data incrementally.</li><li>Measure results and iterate.</li></ol>",
    },
    cover: IMG + "story/story-2-jpg.webp",
    coverAlt: { id: "Dua engineer berdiskusi di ruang server", en: "Two engineers discussing in a server room" },
    category: "software-development",
    tags: ["enterprise", "information-technology"],
    status: "PUBLISHED",
    publishedAt: "2026-10-27T10:00:00+07:00",
  },
  {
    slug: "cloud-untuk-skalabilitas-layanan-perusahaan",
    title: { id: "Memanfaatkan Cloud untuk Skalabilitas Layanan Perusahaan", en: "Leveraging the Cloud for Enterprise Service Scalability" },
    excerpt: {
      id: "Cloud memungkinkan layanan tumbuh mengikuti kebutuhan tanpa investasi infrastruktur besar di awal.",
      en: "The cloud lets services grow with demand without large upfront infrastructure investment.",
    },
    content: {
      id: p(
        "Lonjakan trafik musiman menjadi tantangan klasik bagi layanan digital. Dengan cloud, kapasitas dapat ditambah dan dikurangi secara otomatis.",
        "Tim ASYST membantu merancang arsitektur yang aman, hemat biaya, dan mudah dipantau.",
      ),
      en: p(
        "Seasonal traffic spikes are a classic challenge for digital services. With the cloud, capacity scales up and down automatically.",
        "The ASYST team helps design architecture that is secure, cost-efficient, and easy to monitor.",
      ),
    },
    cover: IMG + "industry/finance/challenge-disconnected.webp",
    coverAlt: { id: "Meja kerja dengan beberapa monitor menampilkan kode", en: "Workstation with multiple monitors showing code" },
    category: "cloud",
    tags: ["enterprise", "web"],
    status: "PUBLISHED",
    publishedAt: "2026-10-18T08:30:00+07:00",
  },
  {
    slug: "digitalisasi-operasional-kargo",
    title: { id: "Digitalisasi Operasional Kargo: Dari Manual ke Real-time", en: "Digitizing Cargo Operations: From Manual to Real-time" },
    excerpt: {
      id: "Pelacakan real-time dan dokumen digital mempercepat proses kargo serta mengurangi kesalahan input.",
      en: "Real-time tracking and digital documents speed up cargo processes and reduce input errors.",
    },
    content: {
      id: p(
        "Proses kargo melibatkan banyak pihak dan dokumen. Digitalisasi membuat status pengiriman dapat dipantau kapan saja.",
        "Integrasi dengan sistem pelanggan dan mitra juga memangkas waktu rekonsiliasi data.",
      ),
      en: p(
        "Cargo processes involve many parties and documents. Digitization makes shipment status visible at any time.",
        "Integration with customer and partner systems also cuts data reconciliation time.",
      ),
    },
    cover: IMG + "industry/cargo/intro.webp",
    coverAlt: { id: "Petugas memproses dokumen di loket penerimaan kargo udara", en: "Staff processing documents at an air cargo acceptance counter" },
    category: "enterprise",
    tags: ["cargo", "transportation", "analytics"],
    status: "PUBLISHED",
    publishedAt: "2026-10-06T13:00:00+07:00",
  },
  {
    slug: "pentingnya-quality-assurance-dalam-proyek-it",
    title: { id: "Pentingnya Quality Assurance dalam Proyek TI", en: "Why Quality Assurance Matters in IT Projects" },
    excerpt: {
      id: "Pengujian sejak awal mencegah biaya perbaikan yang membengkak setelah sistem berjalan.",
      en: "Testing early prevents costly fixes after a system goes live.",
    },
    content: {
      id: p(
        "Bug yang ditemukan di tahap produksi bisa berbiaya puluhan kali lipat dibanding saat pengembangan.",
        "Otomasi pengujian dan review berkala menjaga kualitas tetap konsisten di setiap rilis.",
      ),
      en: p(
        "Bugs found in production can cost many times more than those caught during development.",
        "Test automation and regular reviews keep quality consistent across every release.",
      ),
    },
    cover: IMG + "industry/finance/challenge-operations.webp",
    coverAlt: { id: "Pengembang meninjau aplikasi di laptop dengan diagram alur di papan", en: "Developer reviewing an app on a laptop with a flow diagram on the board" },
    category: "quality-assurance",
    tags: ["information-technology", "web", "mobile"],
    status: "PUBLISHED",
    publishedAt: "2026-09-22T09:00:00+07:00",
  },
  {
    slug: "manajemen-proyek-agile-di-perusahaan-besar",
    title: { id: "Menerapkan Manajemen Proyek Agile di Perusahaan Besar", en: "Applying Agile Project Management in Large Enterprises" },
    excerpt: {
      id: "Agile bukan hanya untuk startup. Kuncinya ada pada komunikasi lintas tim dan prioritas yang jelas.",
      en: "Agile isn't just for startups. The key lies in cross-team communication and clear priorities.",
    },
    content: {
      id: p(
        "Perusahaan besar sering memiliki banyak pemangku kepentingan. Iterasi pendek membantu menyelaraskan ekspektasi lebih cepat.",
        "Dashboard proyek yang transparan memudahkan manajemen memantau progres dan risiko.",
      ),
      en: p(
        "Large enterprises often have many stakeholders. Short iterations help align expectations faster.",
        "Transparent project dashboards make it easy for management to track progress and risks.",
      ),
    },
    cover: IMG + "story/story-1-jpg.webp",
    coverAlt: { id: "Tim proyek berdiskusi di ruang kerja", en: "Project team discussing in the workspace" },
    category: "project-management",
    tags: ["enterprise", "analytics"],
    status: "PUBLISHED",
    publishedAt: "2026-09-08T10:00:00+07:00",
  },
  {
    slug: "tren-pembayaran-digital-sektor-transportasi",
    title: { id: "Tren Pembayaran Digital di Sektor Transportasi", en: "Digital Payment Trends in the Transportation Sector" },
    excerpt: {
      id: "Penumpang kini mengharapkan pembayaran yang cepat, aman, dan beragam pilihan metode.",
      en: "Passengers now expect fast, secure payments with a wide choice of methods.",
    },
    content: {
      id: p("Dari tiket kereta hingga pengiriman barang, pembayaran digital menjadi standar baru layanan transportasi."),
      en: p("From train tickets to parcel delivery, digital payment has become the new standard for transportation services."),
    },
    cover: IMG + "industry/cargo/value.webp",
    coverAlt: { id: "Tangan memegang ponsel dengan aplikasi peta", en: "Hand holding a phone with a map app" },
    category: "business",
    tags: ["payment", "transportation", "travel"],
    status: "PUBLISHED",
    publishedAt: "2026-08-25T09:00:00+07:00",
  },
  {
    slug: "peran-konsultan-ti-mempercepat-keputusan-bisnis",
    title: { id: "Peran Konsultan TI dalam Mempercepat Keputusan Bisnis", en: "How IT Consultants Speed Up Business Decisions" },
    excerpt: {
      id: "Data yang tersaji rapi membantu pimpinan mengambil keputusan lebih cepat dan tepat sasaran.",
      en: "Well-presented data helps leaders make faster, better-targeted decisions.",
    },
    content: {
      id: p(
        "Konsultan TI menjembatani kebutuhan bisnis dengan kemampuan teknologi, mulai dari analisis proses hingga rancangan solusi.",
        "Hasilnya adalah dashboard dan laporan yang benar-benar dipakai untuk mengambil keputusan, bukan sekadar pajangan.",
      ),
      en: p(
        "IT consultants bridge business needs and technology capabilities, from process analysis to solution design.",
        "The result is dashboards and reports that are actually used to make decisions, not just for display.",
      ),
    },
    cover: IMG + "industry/transportation/solution-infrastructure.webp",
    coverAlt: { id: "Konsultan mempresentasikan dashboard operasional kepada klien", en: "Consultant presenting an operations dashboard to a client" },
    category: "consulting",
    tags: ["analytics", "enterprise", "information-technology"],
    status: "PUBLISHED",
    publishedAt: "2026-08-11T09:00:00+07:00",
  },
  {
    slug: "erp-terintegrasi-satu-sumber-data",
    title: { id: "ERP Terintegrasi: Satu Sumber Data untuk Keuangan dan Operasional", en: "Integrated ERP: One Source of Truth for Finance and Operations" },
    excerpt: {
      id: "Menyatukan data keuangan dan operasional dalam satu sistem mengurangi rekonsiliasi manual di akhir bulan.",
      en: "Unifying finance and operations data in one system reduces manual month-end reconciliation.",
    },
    content: {
      id: p(
        "Data yang tersebar di banyak spreadsheet membuat laporan keuangan lambat dan rawan selisih.",
        "ERP terintegrasi menjadikan setiap transaksi tercatat sekali dan langsung tersedia untuk tim keuangan maupun operasional.",
      ),
      en: p(
        "Data scattered across many spreadsheets makes financial reporting slow and error-prone.",
        "An integrated ERP records each transaction once and makes it instantly available to finance and operations teams.",
      ),
    },
    cover: IMG + "industry/finance/intro.webp",
    coverAlt: { id: "Kalkulator dan laporan keuangan di meja kerja", en: "Calculator and financial reports on a desk" },
    category: "erp",
    tags: ["enterprise", "banking", "analytics"],
    status: "PUBLISHED",
    publishedAt: "2026-07-28T09:00:00+07:00",
  },
  {
    slug: "draf-peluncuran-produk-baru-asyst",
    title: { id: "Segera Hadir: Produk Baru ASYST untuk Analitik Bisnis", en: "Coming Soon: A New ASYST Product for Business Analytics" },
    excerpt: {
      id: "Draf pengumuman produk analitik terbaru. Belum untuk dipublikasikan.",
      en: "Draft announcement of the latest analytics product. Not for publication yet.",
    },
    content: {
      id: p("Konten masih dalam penyusunan oleh tim pemasaran."),
      en: p("Content is still being prepared by the marketing team."),
    },
    cover: IMG + "story/story-3-jpg.webp",
    coverAlt: { id: "Suasana kerja tim ASYST", en: "ASYST team at work" },
    category: "business-analysis",
    tags: ["analytics", "enterprise"],
    status: "DRAFT",
  },
];

const coverPathname = (slug: string) => `news/${slug}.webp`;

/** Crop 16:9 + grading seragam: desaturasi, sedikit kontras, lalu lapisan navy ASYST (soft-light) + cast biru lembut. */
async function gradeCover(src: string) {
  const navy = Buffer.from(
    `<svg width="${COVER_W}" height="${COVER_H}"><rect width="100%" height="100%" fill="#17386b" fill-opacity="0.55"/></svg>`,
  );
  const cool = Buffer.from(`<svg width="${COVER_W}" height="${COVER_H}"><rect width="100%" height="100%" fill="#e6edf8"/></svg>`);
  const base = await sharp(src)
    .resize(COVER_W, COVER_H, { fit: "cover", position: "attention" })
    .modulate({ saturation: 0.6, brightness: 1.04 })
    .linear(1.06, -8)
    .toBuffer();
  return sharp(base)
    .composite([
      { input: navy, blend: "soft-light" },
      { input: cool, blend: "multiply" },
    ])
    .webp({ quality: 82 })
    .toBuffer();
}

async function uploadCover(a: Dummy, userId: string | null) {
  const src = path.resolve(WEB_DIR, a.cover);
  const buf = await gradeCover(src);
  const pathname = coverPathname(a.slug);
  let url: string;
  if (blobEnabled()) {
    url = (await put(pathname, buf, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/webp" })).url;
  } else {
    const dest = path.join(process.cwd(), "public", "uploads", ...pathname.split("/"));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    url = `/uploads/${pathname}`;
  }
  const data = {
    url,
    filename: path.basename(pathname),
    size: buf.length,
    mimeType: "image/webp",
    width: COVER_W,
    height: COVER_H,
    alt: a.coverAlt,
  };
  const m = await prisma.media.upsert({
    where: { pathname },
    create: { ...data, pathname, uploadedById: userId },
    update: data,
    select: { id: true },
  });
  return m.id;
}

async function main() {
  const def = getCollection("news");
  if (!def) throw new Error('Collection "news" tidak ditemukan');

  if (process.env.NEWS_DUMMY_REMOVE === "true") {
    const { count } = await prisma.newsArticle.deleteMany({ where: { slug: { in: ARTICLES.map((a) => a.slug) } } });
    const media = await prisma.media.deleteMany({ where: { pathname: { in: ARTICLES.map((a) => coverPathname(a.slug)) } } });
    console.log(`✔ ${count} berita dummy & ${media.count} sampulnya dihapus (file di public/uploads/news atau Blob tidak ikut dihapus)`);
    return;
  }

  const user = await findImportUser();
  const [terms, authors] = await Promise.all([
    prisma.term.findMany({ where: { vocabulary: { in: ["NEWS_CATEGORY", "TAG"] } }, select: { id: true, vocabulary: true, key: true } }),
    prisma.author.findMany({ select: { id: true }, orderBy: { order: "asc" }, take: 1 }),
  ]);
  const termId = (vocab: string, key: string) => terms.find((t) => t.vocabulary === vocab && t.key === key)?.id;

  let created = 0;
  let updated = 0;
  for (const a of ARTICLES) {
    const coverImageId = await uploadCover(a, user?.id ?? null);
    const categoryId = termId("NEWS_CATEGORY", a.category);
    if (!categoryId) throw new Error(`${a.slug}: kategori "${a.category}" tidak ada — jalankan db:import-web dulu`);

    const values = withDefaults(def.fields, {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImageId,
      categoryId,
      tags: a.tags.map((k) => termId("TAG", k)).filter(Boolean),
      authorId: authors[0]?.id ?? null,
      isFeatured: a.featured ?? false,
    });
    const existing = await prisma.newsArticle.findUnique({ where: { slug: a.slug }, select: { id: true } });
    await saveItem(def, existing?.id ?? null, values, { status: a.status, publishedAt: a.publishedAt ?? null }, user?.id ?? null);
    if (existing) updated++;
    else created++;
  }
  console.log(`✔ Berita dummy: ${created} baru, ${updated} diperbarui (${ARTICLES.length} total)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
