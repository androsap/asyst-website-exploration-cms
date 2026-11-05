import type { SeedApi } from "../seed";
import { t, tl, type SeedRefs } from "./content";

type Builder = (refs: SeedRefs, api: SeedApi) => Promise<Record<string, unknown>> | Record<string, unknown>;

const seo = (id: string, en: string, descId: string, descEn: string) => ({
  title: t(id, en),
  description: t(descId, descEn),
});
const h = (id: string, en: string, descId = "", descEn = "") => ({ title: t(id, en), description: t(descId, descEn) });
const askAsyst = (id: string, en: string) => ({ label: t(id, en), type: "action", action: "ask-asyst" });
const internal = (id: string, en: string, href: string) => ({ label: t(id, en), type: "internal", href });
const cta = { title: t("Siap bertransformasi?", "Ready to transform?"), description: t("Diskusikan kebutuhan Anda dengan tim kami.", "Discuss your needs with our team."), buttonLabel: t("Bicara dengan ahli", "Talk to an expert") };

export const SEED_SINGLETONS: Record<string, Builder> = {
  "site-settings": async (_r, { media }) => ({
    siteName: "PT Aero Systems Indonesia",
    alternateName: "ASYST",
    logo: await media("Logo ASYST", 400, 120),
    email: "sales@asyst.co.id",
    phone: "+62 21 29356070",
    address: t(
      "Gedung Information System Lt. 3, Kawasan Garuda Indonesia, Tangerang, Banten",
      "Information System Building 3rd Floor, Garuda Indonesia Area, Tangerang, Banten",
    ),
    postalAddress: { street: "Information System Building, 3rd Floor", locality: "Tangerang", region: "Banten", country: "ID" },
    socials: [
      { platform: "linkedin", url: "https://www.linkedin.com/company/asyst" },
      { platform: "instagram", url: "https://www.instagram.com/asyst.id" },
    ],
    defaultSeo: seo(
      "Teknologi untuk Bisnis Anda",
      "Technology for Your Business",
      "PT Aero Systems Indonesia (ASYST) — mitra transformasi digital enterprise.",
      "PT Aero Systems Indonesia (ASYST) — your enterprise digital transformation partner.",
    ),
    searchUrlTemplate: "https://www.asyst.co.id/search?q={search_term_string}",
  }),

  navigation: async (r, { media }) => ({
    productsPanelSubtitle: t("Produk untuk setiap kebutuhan bisnis", "Products for every business need"),
    productsLink: "/product",
    productCategories: [
      {
        label: t("Enterprise", "Enterprise"),
        title: t("Solusi Enterprise", "Enterprise Solutions"),
        items: [
          { product: r.products.amala, name: t("Amala", "Amala"), description: t("Platform loyalty", "Loyalty platform") },
          { name: t("Commercial", "Commercial"), description: t("Segera hadir", "Coming soon") },
        ],
      },
      {
        label: t("Operasional", "Operations"),
        title: t("Operasional Aviasi", "Aviation Operations"),
        items: [{ product: r.products.chronus, name: t("Chronus", "Chronus"), description: t("Manajemen kru", "Crew management") }],
      },
    ],
    solutionGroups: [
      {
        label: t("Solusi", "Solutions"),
        link: "/solution",
        linkLabel: t("Semua solusi", "All solutions"),
        items: [
          { label: t("Security Operation Center", "Security Operation Center"), href: "/solution/security-operations-center", icon: "SecurityOperationCenter" },
          { label: t("Layanan TI Terkelola", "Managed IT Services"), href: "/solution/managed-it-services", icon: "InfraAppPlatformOperationAndITSM" },
        ],
      },
      {
        label: t("Industri", "Industries"),
        link: "/industry",
        linkLabel: t("Semua industri", "All industries"),
        items: [
          { label: t("Aviasi", "Aviation"), href: "/industry/aviation", icon: "Aviation" },
          { label: t("Kargo & Logistik", "Cargo & Logistics"), href: "/industry/cargo", icon: "Logistics" },
        ],
      },
    ],
    companyGroup: {
      label: t("Perusahaan", "Company"),
      items: [
        { label: t("Tentang Kami", "About Us"), href: "/about", icon: "AboutUs" },
        { label: t("Karier", "Careers"), href: "/career", icon: "Careers" },
        { label: t("FAQ", "FAQ"), icon: "FAQ" },
      ],
    },
    featured: {
      label: t("Baru", "New"),
      title: t("Platform Loyalty Amala", "Amala Loyalty Platform"),
      image: await media("Promo Loyalty", 600, 400),
      href: "/product/amala",
    },
    newsLink: "/news",
    searchLink: "/search",
  }),

  footer: () => ({
    companyTitle: t("Perusahaan", "Company"),
    columns: [
      { title: t("Produk", "Products"), href: "/product", items: [internal("Amala", "Amala", "/product/amala"), internal("Chronus", "Chronus", "/product/chronus")] },
      { title: t("Solusi", "Solutions"), href: "/solution", items: [internal("SOC", "SOC", "/solution/security-operations-center")] },
      { title: t("Perusahaan", "Company"), items: [internal("Tentang Kami", "About Us", "/about"), internal("Karier", "Careers", "/career"), internal("Berita", "News", "/news")] },
      { title: t("Bantuan", "Help"), items: [internal("Hubungi Kami", "Contact Us", "/contact-us")] },
    ],
    legalLinks: [internal("Kebijakan Privasi", "Privacy Policy", "/privacy-policy"), internal("Syarat Layanan", "Terms of Service", "/terms")],
  }),

  "ask-asyst-form": () => ({
    title: t("Bicara dengan ahli kami", "Talk to our experts"),
    topicLabel: t("Apa yang ingin Anda diskusikan?", "What would you like to discuss?"),
    successTitle: t("Terima kasih! Tim kami akan menghubungi Anda.", "Thank you! Our team will contact you."),
    submit: t("Kirim", "Submit"),
    close: t("Tutup", "Close"),
    back: t("Kembali", "Back"),
    topics: [
      { value: "enterprise", label: t("Solusi enterprise", "Enterprise solutions") },
      { value: "it-solutions", label: t("Solusi TI", "IT solutions") },
      { value: "product-demo", label: t("Demo produk", "Product demo") },
    ],
    fields: {
      fullName: { label: t("Nama lengkap", "Full name"), placeholder: t("Nama Anda", "Your name") },
      email: { label: t("Email kerja", "Work email"), placeholder: t("nama@perusahaan.com", "name@company.com") },
      phone: { label: t("Telepon", "Phone"), placeholder: t("812 3456 7890", "812 3456 7890") },
      company: { label: t("Perusahaan", "Company"), placeholder: t("Nama perusahaan", "Company name") },
      jobTitle: { label: t("Jabatan", "Job title"), placeholder: t("Pilih jabatan", "Select job title") },
      subject: { label: t("Subjek", "Subject"), placeholder: t("Topik singkat", "Short topic") },
      message: { label: t("Pesan", "Message"), placeholder: t("Ceritakan kebutuhan Anda", "Tell us your needs") },
    },
    jobTitleOptions: tl(["C-Level", "Direktur", "Manajer", "Staf", "Konsultan", "Lainnya"], ["C-Level", "Director", "Manager", "Staff", "Consultant", "Other"]),
    messageMaxLength: 255,
    phoneCountryCodes: ["+62", "+65", "+60"],
    errorMessages: {
      required: t("{field} wajib diisi", "{field} is required"),
      email: t("Format email tidak valid", "Invalid email format"),
      phone: t("Nomor telepon tidak valid", "Invalid phone number"),
    },
  }),

  "ui-strings": () => ({
    entries: [
      { key: "common.home", value: t("Beranda", "Home") },
      { key: "common.viewDetails", value: t("Lihat detail", "View Details") },
    ],
  }),

  home: async (r, { media }) => ({
    seo: seo("Teknologi untuk Bisnis Anda", "Technology for Your Business", "ASYST menghadirkan produk dan solusi TI enterprise.", "ASYST delivers enterprise IT products and solutions."),
    hero: {
      title: t("Teknologi yang\nMenggerakkan Bisnis", "Technology That\nMoves Business"),
      description: t("Produk & solusi digital untuk enterprise dan aviasi.", "Digital products & solutions for enterprise and aviation."),
      primaryButton: internal("Jelajahi Produk", "Explore Products", "/product"),
      secondaryButton: askAsyst("Bicara dengan Ahli", "Talk to Expert"),
      backgroundImage: await media("Hero Home", 1920, 1080),
    },
    awards: { show: true },
    trustedBy: { title: t("Dipercaya oleh", "Trusted by"), show: true },
    enterpriseHighlight: {
      heading: h("Mengapa ASYST", "Why ASYST"),
      items: [
        { icon: "EnterpriseSoftware", title: t("Software enterprise", "Enterprise software"), description: t("Produk teruji skala besar.", "Proven at scale.") },
        { icon: "ConnectEcosystem", title: t("Ekosistem terhubung", "Connected ecosystem"), description: t("Integrasi end-to-end.", "End-to-end integration.") },
        { icon: "DomainExpertise", title: t("Keahlian domain", "Domain expertise"), description: t("30+ tahun di aviasi.", "30+ years in aviation.") },
      ],
    },
    products: {
      heading: h("Produk Kami", "Our Products"),
      items: [
        {
          product: r.products.amala,
          title: t("Amala", "Amala"),
          description: t("Platform loyalty", "Loyalty platform"),
          category: r.terms.productCat.enterprise,
          image: await media("Home Amala", 800, 600),
          link: internal("Lihat", "View", "/product/amala"),
        },
      ],
    },
    capabilities: {
      heading: h("Kapabilitas", "Capabilities"),
      items: [
        {
          icon: "automate-operations",
          label: t("Otomasi", "Automate"),
          title: t("Otomasi operasional", "Automate operations"),
          tags: tl(["RPA", "Workflow"], ["RPA", "Workflow"]),
        },
      ],
    },
    partner: { title: t("Mitra Transformasi Anda", "Your Transformation Partner"), items: [{ title: t("Konsultasi", "Consulting") }] },
    industries: {
      heading: h("Industri", "Industries"),
      allLink: "/industry",
      items: [{ title: t("Aviasi", "Aviation"), industry: r.industries.aviation, tags: tl(["Maskapai"], ["Airlines"]) }],
    },
    news: { title: t("Berita Terbaru", "Latest News"), limit: 3 },
    cta,
  }),

  about: async (_r, { media }) => ({
    seo: seo("Tentang Kami", "About Us", "Profil PT Aero Systems Indonesia.", "About PT Aero Systems Indonesia."),
    hero: {
      title: t("Tentang ASYST", "About ASYST"),
      description: t("Anak perusahaan Garuda Indonesia di bidang TI.", "Garuda Indonesia's IT subsidiary."),
      button: internal("Hubungi kami", "Contact us", "/contact-us"),
      image: await media("Hero About", 1600, 900),
    },
    intro: { title: t("Sejarah kami", "Our history"), description: t("Berdiri sejak 2005.", "Established in 2005.") },
    leaders: { heading: h("Pimpinan", "Leadership") },
    principles: {
      tabs: [
        { label: t("Visi", "Vision"), items: [{ title: t("Mitra TI terpercaya", "Trusted IT partner") }] },
        { label: t("Misi", "Mission"), items: [{ title: t("Memberi nilai bisnis", "Deliver business value") }] },
      ],
      defaultTab: 0,
    },
    clients: { heading: h("Klien Kami", "Our Clients") },
    consultingAreas: { heading: h("Area Konsultasi", "Consulting Areas"), items: [{ title: t("Aviasi", "Aviation") }, { title: t("Pemerintahan", "Government") }] },
    joinTeam: {
      title: t("Bergabung dengan tim", "Join the team"),
      paragraphs: tl(["Kami mencari talenta terbaik."], ["We're looking for great talent."]),
      link: internal("Lihat karier", "See careers", "/career"),
    },
  }),

  contact: () => ({
    seo: seo("Hubungi Kami", "Contact Us", "Hubungi tim ASYST.", "Get in touch with ASYST."),
    hero: { title: t("Hubungi Kami", "Contact Us"), paragraphs: tl(["Kami siap membantu."], ["We're here to help."]) },
    form: {
      title: t("Kirim pesan", "Send a message"),
      bookCallLabel: t("Jadwalkan panggilan", "Book a Call"),
      submitLabel: t("Kirim", "Send"),
      successMessage: t("Terima kasih, pesan Anda terkirim.", "Thanks, your message has been sent."),
      fields: [
        { name: "fullName", placeholder: t("Nama lengkap", "Full name"), type: "text", required: true, row: 1 },
        { name: "email", placeholder: t("Email", "Email"), type: "email", required: true, row: 1 },
        { name: "company", placeholder: t("Perusahaan", "Company"), type: "text", required: true, row: 2 },
        { name: "message", placeholder: t("Pesan", "Message"), type: "textarea", required: true, row: 3 },
      ],
      errorMessages: { required: t("{field} wajib diisi", "{field} is required"), email: t("Email tidak valid", "Invalid email") },
    },
    nextSteps: { title: t("Langkah berikutnya", "Next steps"), steps: tl(["Kami meninjau pesan Anda", "Tim kami menghubungi Anda"], ["We review your message", "Our team contacts you"]) },
    offices: { title: t("Kantor kami", "Our offices"), viewMapLabel: t("Lihat peta", "View map") },
  }),

  "news-page": () => ({
    seo: seo("Berita", "News", "Berita & wawasan terbaru dari ASYST.", "Latest news & insights from ASYST."),
    hero: { title: t("Berita & Wawasan", "News & Insights"), description: t("Kabar terbaru dari ASYST.", "The latest from ASYST.") },
    pageSize: 9,
    moreSize: 6,
    relatedLimit: 6,
    detailLabels: {
      publishedBy: t("Dipublikasikan oleh", "Published by"),
      relatedTitle: t("Berita terkait", "Related news"),
      backToNews: t("Kembali ke berita", "Back to news"),
      share: t("Bagikan", "Share"),
      readingTime: t("{n} menit baca", "{n} min read"),
      readingTimePlural: t("{n} menit baca", "{n} mins read"),
    },
    dateFormat: t("D MMMM YYYY", "MMMM D, YYYY"),
    collaborationLink: "/contact-us",
  }),

  career: async (r, { media }) => ({
    seo: seo("Karier", "Careers", "Bergabung dengan ASYST.", "Join ASYST."),
    hero: {
      title: t("Bangun masa depan\nteknologi bersama kami", "Build the future\nof technology with us"),
      buttonLabel: t("Lihat lowongan", "See openings"),
      image: await media("Hero Karier", 1600, 900),
    },
    values: { title: t("Cara Kami Bekerja", "How We Work Together"), items: [{ icon: "HandshakeOutlined", title: t("Kolaborasi", "Collaboration") }] },
    opportunity: { title: t("Lowongan terbaru", "Latest openings"), buttonLabel: t("Semua lowongan", "All openings"), limit: 6 },
    life: { title: t("Hidup di ASYST", "Life at ASYST") },
    why: { heading: h("Mengapa ASYST", "Why ASYST"), items: [{ title: t("Proyek berskala nasional", "Nationwide projects") }] },
    indonesia: {
      heading: h("Bekerja di Indonesia", "Working in Indonesia"),
      items: [{ label: t("Lokasi", "Location"), value: t("Tangerang, Banten", "Tangerang, Banten") }],
    },
    internship: {
      title: t("Program magang", "Internship program"),
      buttonLabel: t("Lihat magang", "See internships"),
      filterKey: "type",
      filterValue: r.terms.empType.internship,
    },
    faq: {
      title: t("Pertanyaan umum", "FAQ"),
      items: [{ question: t("Bagaimana proses rekrutmen?", "What is the hiring process?"), answer: t("Seleksi berkas, tes, dan wawancara.", "Screening, test and interviews.") }],
    },
  }),

  "career-jobs": () => ({
    seo: seo("Lowongan", "Job Openings", "Lowongan kerja di ASYST.", "Job openings at ASYST."),
    hero: { title: t("Temukan peran Anda", "Find your role"), searchPlaceholder: t("Cari posisi…", "Search roles…") },
    jobList: { title: t("Semua lowongan", "All openings"), emptyText: t("Belum ada lowongan yang cocok.", "No matching openings."), pageSize: 10 },
    filterGroups: [
      { key: "department", label: t("Departemen", "Department"), allLabel: t("Semua", "All") },
      { key: "type", label: t("Tipe", "Type"), allLabel: t("Semua", "All") },
    ],
    applySteps: { heading: h("Cara melamar", "How to apply"), steps: [{ title: t("Kirim lamaran", "Submit application") }] },
  }),

  "career-job-detail": () => ({
    seoTitleTemplate: t("{title} — Karier", "{title} — Careers"),
    seoFallbackTitle: t("Lowongan", "Job opening"),
    applyLabel: t("Lamar sekarang", "Apply now"),
    applyShortLabel: t("Lamar", "Apply"),
    applyLink: internal("Lamar", "Apply", "/contact-us"),
    metaLabels: { location: t("Lokasi", "Location"), type: t("Tipe", "Type"), experience: t("Pengalaman", "Experience") },
    sectionLabels: { about: t("Tentang posisi", "About the role"), responsibilities: t("Tanggung jawab", "Responsibilities"), requirements: t("Persyaratan", "Requirements") },
    benefits: { title: t("Benefit", "Benefits"), items: tl(["Asuransi kesehatan", "Pelatihan"], ["Health insurance", "Training"]) },
  }),

  "case-study-page": async (r, { media }) => ({
    seo: seo("Studi Kasus", "Case Studies", "Studi kasus implementasi ASYST.", "ASYST implementation case studies."),
    hero: { title: t("Bukti nyata\ntransformasi", "Real proof\nof transformation"), image: await media("Hero Studi Kasus", 1600, 900) },
    intro: { title: t("Dampak bagi klien", "Impact for clients") },
    featured: {
      heading: h("Unggulan", "Featured"),
      caseStudy: r.caseGaruda,
      caseTitle: t("Modernisasi ERP Garuda Indonesia", "Garuda Indonesia ERP Modernisation"),
      buttonLabel: t("Baca studi kasus", "Read case study"),
      details: [{ label: t("Layanan", "Service"), value: t("Implementasi ERP", "ERP Implementation") }],
    },
    explorer: {
      allLabel: t("Semua", "All"),
      pageSize: 9,
      filterTabs: [
        { key: "industry", label: t("Industri", "Industry") },
        { key: "solution", label: t("Solusi", "Solution") },
      ],
    },
    testimonials: { title: t("Kata klien", "What clients say"), items: [r.testimonial] },
    cta: { title: t("Punya tantangan serupa?", "Facing a similar challenge?"), buttonLabel: t("Hubungi kami", "Contact us") },
  }),

  "product-landing": async (r, { media }) => ({
    seo: seo("Produk", "Products", "Produk software ASYST.", "ASYST software products."),
    hero: {
      eyebrow: t("Produk", "Products"),
      title: t("Software untuk\nbisnis modern", "Software for\nmodern business"),
      primaryButton: internal("Lihat katalog", "View catalogue", "#catalog"),
      secondaryButton: askAsyst("Minta demo", "Request a demo"),
      image: await media("Hero Produk", 1600, 900),
    },
    catalog: { heading: h("Katalog produk", "Product catalogue"), categories: [r.categories.enterpriseCat, r.categories.operationsCat] },
    experience: { heading: h("Pengalaman kami", "Our experience") },
    solve: {
      heading: h("Masalah yang kami selesaikan", "Problems we solve"),
      items: [
        {
          label: t("Efisiensi", "Efficiency"),
          title: t("Proses manual yang lambat", "Slow manual processes"),
          subDescription: t("<p>Otomasi dengan <strong>Amala</strong>.</p>", "<p>Automate with <strong>Amala</strong>.</p>"),
          links: [internal("Amala", "Amala", "/product/amala")],
        },
      ],
    },
    cta,
  }),

  "solution-landing": async (r, { media }) => ({
    seo: seo("Solusi", "Solutions", "Solusi TI dari ASYST.", "IT solutions by ASYST."),
    hero: {
      eyebrow: t("Solusi", "Solutions"),
      title: t("Solusi TI end-to-end", "End-to-end IT solutions"),
      primaryButton: internal("Lihat solusi", "See solutions", "#layers"),
      image: await media("Hero Solusi", 1600, 900),
    },
    capabilities: { heading: h("Kapabilitas", "Capabilities"), items: [{ icon: "ShieldOutlined", title: t("Keamanan", "Security") }] },
    layers: {
      heading: h("Lapisan solusi", "Solution layers"),
      items: [
        { title: t("Security Operation Center", "Security Operation Center"), solution: r.solutions.soc, link: internal("Detail", "Details", "/solution/security-operations-center") },
        { title: t("Layanan TI Terkelola", "Managed IT Services"), solution: r.solutions.managed },
      ],
    },
    value: { title: t("Nilai bagi bisnis", "Business value") },
    clients: { items: [r.clients.garuda, r.clients.gmf] },
    cta,
  }),

  "industry-landing": () => ({
    seo: seo("Industri", "Industries", "Industri yang kami layani.", "Industries we serve."),
    hero: {
      title: t("Keahlian lintas industri", "Cross-industry expertise"),
      stats: [{ value: t("5+", "5+"), label: t("Industri", "Industries") }],
    },
    intro: { title: t("Memahami industri Anda", "Understanding your industry") },
    expertise: { heading: h("Keahlian kami", "Our expertise"), items: [{ title: t("Aviasi", "Aviation"), link: internal("Lihat", "View", "/industry/aviation") }] },
    foundation: { heading: h("Fondasi kami", "Our foundation"), items: [{ icon: "VerifiedUserOutlined", title: t("Tersertifikasi", "Certified") }] },
    cta,
  }),

  "not-found": () => ({
    seoTitle: t("Halaman tidak ditemukan", "Page not found"),
    title: t("Ups, halaman tidak ditemukan", "Oops, page not found"),
    description: { before: t("Kembali ke", "Go back to"), linkLabel: t("beranda", "the homepage"), after: t("atau cari konten.", "or search for content.") },
    searchLabel: t("Cari", "Search"),
    searchPlaceholder: t("Ketik kata kunci…", "Type a keyword…"),
    searchSubmit: t("Cari", "Search"),
    cards: [{ title: t("Produk", "Products"), link: internal("Lihat produk", "View products", "/product") }],
  }),

  search: () => ({
    labels: { title: t("Pencarian", "Search"), placeholder: t("Cari produk, solusi, berita…", "Search products, solutions, news…"), noResult: t("Tidak ada hasil.", "No results.") },
    categories: [
      { key: "product", label: t("Produk", "Products") },
      { key: "solution", label: t("Solusi", "Solutions") },
    ],
    pageSize: 10,
    quickGroupLimit: 3,
    companyEntries: [{ title: t("Tentang Kami", "About Us"), link: internal("Tentang", "About", "/about"), keywords: t("profil perusahaan", "company profile") }],
  }),
};
