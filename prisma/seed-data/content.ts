import type { SeedApi } from "../seed";

// Contoh data collection. Teks singkat & representatif — bukan migrasi penuh dari asyst-web.
export const t = (id: string, en: string) => ({ id, en });
export const tl = (id: string[], en: string[]) => ({ id, en });

export type SeedRefs = Awaited<ReturnType<typeof seedContent>>;

export async function seedContent({ media, create }: SeedApi) {
  // ─────────── Taksonomi ───────────
  const term = async (vocabulary: string, key: string, id: string, en: string, isPopular = false) =>
    create("terms", { vocabulary, key, label: t(id, en), isPopular });

  const news = {
    transformation: await term("NEWS_CATEGORY", "digital-transformation", "Transformasi Digital", "Digital Transformation"),
    company: await term("NEWS_CATEGORY", "company-news", "Berita Perusahaan", "Company News"),
    product: await term("NEWS_CATEGORY", "product-update", "Pembaruan Produk", "Product Update"),
  };
  const productCat = {
    enterprise: await term("PRODUCT_CATEGORY", "enterprise", "Enterprise", "Enterprise"),
    aviation: await term("PRODUCT_CATEGORY", "aviation", "Aviasi", "Aviation"),
    itService: await term("PRODUCT_CATEGORY", "it-service", "Layanan TI", "IT Service"),
  };
  const dept = {
    engineering: await term("JOB_DEPARTMENT", "engineering", "Engineering", "Engineering"),
    product: await term("JOB_DEPARTMENT", "product", "Produk", "Product"),
    sales: await term("JOB_DEPARTMENT", "sales", "Penjualan", "Sales"),
  };
  const exp = {
    internship: await term("JOB_EXPERIENCE", "internship", "Magang", "Internship"),
    junior: await term("JOB_EXPERIENCE", "junior", "Junior", "Junior"),
    mid: await term("JOB_EXPERIENCE", "mid", "Menengah", "Mid-level"),
    senior: await term("JOB_EXPERIENCE", "senior", "Senior", "Senior"),
  };
  const loc = {
    onsite: await term("JOB_LOCATION", "on-site", "Di kantor", "On-site"),
    hybrid: await term("JOB_LOCATION", "hybrid", "Hybrid", "Hybrid"),
    remote: await term("JOB_LOCATION", "remote", "Remote", "Remote"),
  };
  const empType = {
    fullTime: await term("JOB_EMPLOYMENT_TYPE", "full-time", "Penuh waktu", "Full-time"),
    contract: await term("JOB_EMPLOYMENT_TYPE", "contract", "Kontrak", "Contract"),
    internship: await term("JOB_EMPLOYMENT_TYPE", "internship", "Magang", "Internship"),
  };
  const skill = {
    react: await term("JOB_SKILL", "react", "React", "React", true),
    java: await term("JOB_SKILL", "java", "Java", "Java", true),
    sap: await term("JOB_SKILL", "sap", "SAP", "SAP"),
    cloud: await term("JOB_SKILL", "cloud", "Cloud", "Cloud", true),
  };
  const caseIndustry = {
    airlines: await term("CASE_INDUSTRY", "airlines", "Maskapai", "Airlines"),
    logistics: await term("CASE_INDUSTRY", "logistics", "Logistik", "Logistics"),
  };
  const caseSolution = {
    erp: await term("CASE_SOLUTION", "erp", "ERP", "ERP"),
    managed: await term("CASE_SOLUTION", "managed-it-services", "Layanan TI Terkelola", "Managed IT Services"),
  };
  const caseTech = {
    sap: await term("CASE_TECHNOLOGY", "sap", "SAP", "SAP"),
    aws: await term("CASE_TECHNOLOGY", "aws", "AWS", "AWS"),
    k8s: await term("CASE_TECHNOLOGY", "kubernetes", "Kubernetes", "Kubernetes"),
  };
  const tag = {
    cloud: await term("TAG", "cloud", "Cloud", "Cloud"),
    ai: await term("TAG", "ai", "AI", "AI"),
    erp: await term("TAG", "erp", "ERP", "ERP"),
  };

  // ─────────── Fondasi ───────────
  const office = await create("offices", {
    title: t("Kantor Terdaftar", "Registered Office"),
    addressLines: tl(
      ["Gedung Information System, Lantai 3", "Kawasan Garuda Indonesia, Tangerang, Banten"],
      ["Information System Building, 3rd Floor", "Garuda Indonesia Area, Tangerang, Banten"],
    ),
    mapUrl: "https://maps.google.com/?q=PT+Aero+Systems+Indonesia",
  });

  const client = async (name: string, placements: string[]) =>
    create("clients", { name, logoId: await media(`Logo ${name}`, 400, 160), placements, isActive: true });
  const clients = {
    garuda: await client("Garuda Indonesia", ["HOME_TRUSTED", "ABOUT", "SOLUTION", "CASE_STUDY"]),
    citilink: await client("Citilink", ["HOME_TRUSTED", "ABOUT"]),
    gmf: await client("GMF AeroAsia", ["HOME_TRUSTED", "SOLUTION"]),
  };

  await create("leaders", {
    name: "Contoh Pimpinan",
    position: t("Direktur Utama", "President Director"),
    photoId: await media("Foto Pimpinan", 600, 600),
  });
  await create("leaders", {
    name: "Contoh Direktur",
    position: t("Direktur Teknologi", "Technology Director"),
    photoId: await media("Foto Direktur", 600, 600),
  });

  await create("awards", {
    title: t("Top Digital Transformation", "Top Digital Transformation"),
    subtitle: t("Penghargaan industri 2025", "Industry award 2025"),
    imageId: await media("Award", 400, 400),
    year: 2025,
  });
  await create("awards", {
    title: t("ISO/IEC 27001", "ISO/IEC 27001"),
    subtitle: t("Sertifikasi keamanan informasi", "Information security certification"),
    imageId: await media("ISO 27001", 400, 400),
    year: 2024,
  });

  const testimonial = await create("testimonials", {
    name: "Contoh Klien",
    role: t("VP Teknologi Informasi", "VP of Information Technology"),
    company: "Garuda Indonesia",
    clientId: clients.garuda,
    quote: t(
      "ASYST membantu kami memodernisasi sistem inti dengan risiko minimal.",
      "ASYST helped us modernise our core systems with minimal risk.",
    ),
    placements: ["CASE_STUDY"],
  });

  const author = await create("authors", { name: "Asyst Admin", bio: t("Tim komunikasi ASYST", "ASYST communications team") });

  await create("page-seo", {
    path: "/about-us",
    seo: { title: t("Tentang Kami", "About Us"), description: t("Dialihkan ke /about", "Redirects to /about"), noIndex: true },
  });
  await create("page-seo", {
    path: "/search",
    seo: { title: t("Pencarian", "Search"), description: t("Cari konten ASYST", "Search ASYST content"), noIndex: true },
  });

  // ─────────── Berita ───────────
  const article = (id: string, en: string) =>
    t(
      `<p>${id}</p><h2>Langkah berikutnya</h2><p>ASYST terus berinvestasi pada teknologi cloud, data, dan keamanan untuk mendukung klien.</p>`,
      `<p>${en}</p><h2>What's next</h2><p>ASYST keeps investing in cloud, data and security technology to support its clients.</p>`,
    );
  await create("news", {
    title: t("ASYST Meluncurkan Platform Loyalty Generasi Baru", "ASYST Launches Next-Generation Loyalty Platform"),
    excerpt: t("Platform baru untuk program loyalitas maskapai dan ritel.", "A new platform for airline and retail loyalty programmes."),
    content: article("ASYST resmi meluncurkan platform loyalty berbasis cloud.", "ASYST officially launched its cloud-based loyalty platform."),
    coverImageId: await media("Berita Loyalty", 1200, 630),
    categoryId: news.product,
    tags: [tag.cloud],
    authorId: author,
    isFeatured: true,
    seo: { title: t("", ""), description: t("", "") },
  });
  await create("news", {
    title: t("Transformasi Digital di Industri Aviasi", "Digital Transformation in the Aviation Industry"),
    excerpt: t("Bagaimana data dan otomasi mengubah operasional maskapai.", "How data and automation reshape airline operations."),
    content: article("Industri aviasi bergerak cepat menuju otomasi.", "The aviation industry is moving fast towards automation."),
    coverImageId: await media("Berita Aviasi", 1200, 630),
    categoryId: news.transformation,
    tags: [tag.ai, tag.cloud],
    authorId: author,
  });
  await create(
    "news",
    {
      title: t("Draft: Laporan Tahunan", "Draft: Annual Report"),
      excerpt: t("Ringkasan kinerja tahun ini.", "This year's performance summary."),
      content: article("Konten masih disusun.", "Content in progress."),
      coverImageId: await media("Laporan Tahunan", 1200, 630),
      categoryId: news.company,
    },
    "DRAFT",
  );

  // ─────────── Karier ───────────
  const today = new Date().toISOString().slice(0, 10);
  await create("jobs", {
    title: t("Frontend Engineer (React)", "Frontend Engineer (React)"),
    summary: t("Membangun antarmuka web untuk produk enterprise ASYST.", "Build web interfaces for ASYST enterprise products."),
    departmentId: dept.engineering,
    experienceId: exp.mid,
    employmentTypeId: empType.fullTime,
    locationId: loc.hybrid,
    skills: tl(["React", "TypeScript", "Tailwind"], ["React", "TypeScript", "Tailwind"]),
    tags: [skill.react],
    about: tl(["Anda akan bergabung dengan tim produk digital."], ["You will join the digital product team."]),
    responsibilities: tl(
      ["Mengembangkan fitur UI", "Menjaga kualitas kode dan aksesibilitas"],
      ["Develop UI features", "Maintain code quality and accessibility"],
    ),
    requirements: tl(["Pengalaman 3+ tahun dengan React", "Paham TypeScript"], ["3+ years of React experience", "Solid TypeScript skills"]),
    postedDate: today,
  });
  await create("jobs", {
    title: t("Program Magang IT", "IT Internship Program"),
    summary: t("Magang 6 bulan di tim engineering.", "A 6-month internship with the engineering team."),
    departmentId: dept.engineering,
    experienceId: exp.internship,
    employmentTypeId: empType.internship,
    locationId: loc.onsite,
    tags: [skill.java, skill.cloud],
    about: tl(["Kesempatan belajar langsung di proyek nyata."], ["Learn hands-on in real projects."]),
    responsibilities: tl(["Membantu pengembangan aplikasi"], ["Assist with application development"]),
    requirements: tl(["Mahasiswa tingkat akhir jurusan TI"], ["Final-year IT student"]),
    postedDate: today,
  });
  await create(
    "jobs",
    {
      title: t("SAP Consultant", "SAP Consultant"),
      summary: t("Implementasi modul SAP untuk klien enterprise.", "Implement SAP modules for enterprise clients."),
      departmentId: dept.product,
      experienceId: exp.senior,
      employmentTypeId: empType.contract,
      locationId: loc.onsite,
      tags: [skill.sap],
      about: tl(["Posisi kontrak 12 bulan."], ["12-month contract role."]),
      responsibilities: tl(["Analisis kebutuhan bisnis"], ["Analyse business requirements"]),
      requirements: tl(["Sertifikasi SAP"], ["SAP certification"]),
      postedDate: today,
    },
    "DRAFT",
  );

  // ─────────── Studi kasus ───────────
  const caseOther = await create("case-studies", {
    title: t("Otomasi Gudang Logistik", "Logistics Warehouse Automation"),
    cardImageId: await media("Studi Kasus Logistik", 800, 600),
    industryId: caseIndustry.logistics,
    solutionId: caseSolution.managed,
    technologies: [caseTech.aws, caseTech.k8s],
    tags: [tag.cloud],
  });
  const caseGaruda = await create("case-studies", {
    title: t("Modernisasi ERP Garuda Indonesia", "Garuda Indonesia ERP Modernisation"),
    slug: "garuda-indonesia",
    clientId: clients.garuda,
    cardImageId: await media("Studi Kasus Garuda", 800, 600),
    industryId: caseIndustry.airlines,
    solutionId: caseSolution.erp,
    technologies: [caseTech.sap],
    tags: [tag.erp],
    related: [caseOther],
    detail: {
      hero: {
        title: t("Modernisasi ERP\nMaskapai Nasional", "ERP Modernisation\nfor the National Airline"),
        description: t("Migrasi sistem keuangan dan pengadaan ke SAP S/4HANA.", "Migrating finance and procurement to SAP S/4HANA."),
        buttonLabel: t("Diskusikan proyek Anda", "Discuss your project"),
        image: await media("Hero Garuda", 1600, 900),
      },
      summary: { items: [{ label: t("Layanan", "Service"), value: t("Implementasi ERP", "ERP Implementation") }] },
      challenge: {
        eyebrow: t("Tantangan", "Challenge"),
        title: t("Sistem lama yang terfragmentasi", "Fragmented legacy systems"),
        paragraphs: tl(["Data tersebar di banyak aplikasi."], ["Data was spread across many applications."]),
      },
      outcome: {
        eyebrow: t("Hasil", "Outcome"),
        title: t("Proses lebih cepat", "Faster processes"),
        items: [{ title: t("40% lebih cepat", "40% faster"), description: t("Penutupan buku bulanan.", "Monthly closing.") }],
      },
      related: { title: t("Studi kasus terkait", "Related case studies") },
    },
  });

  // ─────────── Produk ───────────
  const amala = await create("products", {
    name: "Amala",
    slug: "amala",
    tagline: t("Platform Loyalty", "Loyalty Platform"),
    shortDescription: t("Kelola program loyalitas pelanggan secara end-to-end.", "Manage customer loyalty programmes end to end."),
    cardImageId: await media("Produk Amala", 800, 600),
    homeCategoryId: productCat.enterprise,
    featuredOnHome: true,
    template: "BLOCKS",
    hero: {
      breadcrumb: t("Produk", "Product"),
      title: t("Loyalty yang\nmendorong pertumbuhan", "Loyalty that\ndrives growth"),
      description: t("Amala menghubungkan poin, mitra, dan data pelanggan.", "Amala connects points, partners and customer data."),
      primaryButton: t("Hubungi kami", "Talk to us"),
      image: await media("Hero Amala", 1600, 900),
    },
    sections: [
      {
        type: "overview",
        title: t("Satu platform untuk semua program", "One platform for every programme"),
        paragraphs: tl(["Amala dirancang untuk maskapai dan ritel."], ["Amala is built for airlines and retail."]),
        points: tl(["Multi-mitra", "Real-time"], ["Multi-partner", "Real-time"]),
        cards: [{ title: t("Skalabel", "Scalable"), description: t("Jutaan anggota.", "Millions of members."), icon: "HubOutlined" }],
      },
      {
        type: "capabilities",
        heading: "top",
        title: t("Kapabilitas utama", "Key capabilities"),
        items: [
          { title: t("Manajemen poin", "Points management"), description: t("Akrual & redeem.", "Accrual & redemption."), icon: "InsightsOutlined" },
          { title: t("Kampanye", "Campaigns"), description: t("Promosi tertarget.", "Targeted promotions."), icon: "RouteOutlined" },
        ],
      },
    ],
    faq: {
      title: t("Pertanyaan umum", "FAQ"),
      items: [{ question: t("Apakah Amala berbasis cloud?", "Is Amala cloud-based?"), answer: t("Ya, tersedia SaaS dan on-premise.", "Yes, available as SaaS and on-premise.") }],
    },
    cta: { title: t("Siap memulai?", "Ready to start?"), buttonLabel: t("Bicara dengan ahli", "Talk to an expert") },
    seo: { title: t("Amala – Platform Loyalty", "Amala – Loyalty Platform"), description: t("Platform loyalty dari ASYST.", "ASYST's loyalty platform.") },
  });
  const chronus = await create("products", {
    name: "Chronus",
    slug: "chronus",
    tagline: t("Manajemen Kru", "Crew Management"),
    shortDescription: t("Penjadwalan kru maskapai yang efisien.", "Efficient airline crew scheduling."),
    cardImageId: await media("Produk Chronus", 800, 600),
    homeCategoryId: productCat.aviation,
    template: "CLASSIC",
    hero: {
      title: t("Jadwal kru tanpa kerumitan", "Crew scheduling without the hassle"),
      description: t("Optimasi roster dan kepatuhan regulasi.", "Roster optimisation and regulatory compliance."),
      statsCaption: t("Dipercaya maskapai", "Trusted by airlines"),
      stats: [{ value: t("24/7", "24/7"), label: t("Operasional", "Operations"), icon: "TimerOutlined" }],
    },
    classic: {
      overview: {
        title: t("Ringkasan", "Overview"),
        paragraphs: tl(["Chronus mengotomasi penjadwalan kru."], ["Chronus automates crew scheduling."]),
        challenges: [{ title: t("Kepatuhan", "Compliance"), description: t("Aturan jam terbang.", "Flight-time rules."), icon: "VerifiedUserOutlined" }],
      },
      features: { title: t("Fitur", "Features"), items: [{ title: t("Roster otomatis", "Auto roster"), description: t("Berbasis optimasi.", "Optimisation-based.") }] },
    },
    seo: { title: t("Chronus – Manajemen Kru", "Chronus – Crew Management"), description: t("Sistem manajemen kru maskapai.", "Airline crew management system.") },
  });
  const auxoshift = await create("products", {
    name: "Auxoshift",
    slug: "auxoshift",
    tagline: t("Manajemen Shift", "Shift Management"),
    shortDescription: t("Kelola shift tenaga kerja operasional.", "Manage operational workforce shifts."),
    cardImageId: await media("Produk Auxoshift", 800, 600),
    homeCategoryId: productCat.itService,
    template: "LEGACY_API",
    hero: { title: t("Auxoshift", "Auxoshift") },
    legacy: { note: "Konten sementara memakai struktur API lama; migrasikan ke template Blocks." },
    seo: { title: t("Auxoshift", "Auxoshift"), description: t("Manajemen shift tenaga kerja.", "Workforce shift management.") },
  });

  const enterpriseCat = await create("product-categories", {
    key: "enterprise",
    label: t("Enterprise", "Enterprise"),
    shortLabel: t("Enterprise", "Enterprise"),
    title: t("Solusi Enterprise", "Enterprise Solutions"),
    description: t("Produk untuk operasi bisnis inti.", "Products for core business operations."),
    button: { label: t("Lihat produk", "View products"), type: "internal", href: "/product" },
    products: [amala, auxoshift],
  });
  const operationsCat = await create("product-categories", {
    key: "operations",
    label: t("Operasional", "Operations"),
    title: t("Operasional Aviasi", "Aviation Operations"),
    description: t("Produk untuk operasi maskapai.", "Products for airline operations."),
    products: [chronus],
  });

  // ─────────── Solusi ───────────
  const soc = await create("solutions", {
    menuLabel: t("Security Operation Center", "Security Operation Center"),
    slug: "security-operations-center",
    menuIcon: "SecurityOperationCenter",
    template: "SOC",
    hero: {
      breadcrumb: t("Solusi", "Solution"),
      title: t("Pantau ancaman 24/7", "Monitor threats 24/7"),
      description: t("SOC terkelola untuk perusahaan.", "Managed SOC for enterprises."),
      primaryButton: t("Konsultasi", "Consult"),
    },
    soc: {
      challenge: {
        title: t("Tantangan keamanan", "Security challenges"),
        items: [
          {
            label: t("Ancaman", "Threats"),
            title: t("Serangan makin canggih", "Increasingly sophisticated attacks"),
            paragraphs: tl(["Ransomware meningkat setiap tahun."], ["Ransomware grows every year."]),
            solution: { title: t("Deteksi dini", "Early detection"), description: t("SIEM & SOAR.", "SIEM & SOAR.") },
          },
        ],
      },
      why: { title: t("Mengapa ASYST", "Why ASYST"), items: [{ title: t("Tim bersertifikat", "Certified team"), icon: "ShieldOutlined" }] },
    },
    clients: [clients.garuda, clients.gmf],
    seo: { title: t("Security Operation Center", "Security Operation Center"), description: t("Layanan SOC terkelola.", "Managed SOC services.") },
  });
  const managed = await create("solutions", {
    menuLabel: t("Layanan TI Terkelola", "Managed IT Services"),
    slug: "managed-it-services",
    menuIcon: "InfraAppPlatformOperationAndITSM",
    template: "BLOCKS",
    hero: { title: t("Operasi TI yang andal", "Reliable IT operations"), description: t("Infrastruktur, aplikasi, dan ITSM.", "Infrastructure, applications and ITSM.") },
    sections: [
      {
        type: "intro",
        title: t("Fokus pada bisnis Anda", "Focus on your business"),
        paragraphs: tl(["Kami mengelola TI Anda end-to-end."], ["We run your IT end to end."]),
      },
      {
        type: "cards",
        heading: "center",
        columns: "3",
        title: t("Cakupan layanan", "Service scope"),
        items: [
          { title: t("Infrastruktur", "Infrastructure"), description: t("Server & jaringan.", "Servers & network."), icon: "DevicesOutlined" },
          { title: t("Aplikasi", "Applications"), description: t("Monitoring aplikasi.", "Application monitoring."), icon: "WidgetsOutlined" },
        ],
      },
    ],
    seo: { title: t("Layanan TI Terkelola", "Managed IT Services"), description: t("Operasi TI terkelola dari ASYST.", "Managed IT operations by ASYST.") },
  });

  // ─────────── Industri ───────────
  const aviation = await create("industries", {
    menuLabel: t("Aviasi", "Aviation"),
    slug: "aviation",
    menuIcon: "Aviation",
    template: "AVIATION",
    hero: {
      eyebrow: t("Industri", "Industry"),
      title: t("Teknologi untuk aviasi", "Technology for aviation"),
      description: t("Dari operasional hingga pengalaman penumpang.", "From operations to passenger experience."),
      stats: [{ value: t("30+", "30+"), label: t("Tahun pengalaman", "Years of experience") }],
    },
    aviation: {
      overview: { title: t("Ekosistem aviasi", "The aviation ecosystem"), paragraphs: tl(["ASYST lahir dari industri aviasi."], ["ASYST was born in aviation."]) },
      valueChain: {
        title: t("Rantai nilai", "Value chain"),
        steps: [{ label: t("Reservasi", "Reservation") }, { label: t("Operasi", "Operations") }],
      },
    },
    seo: { title: t("Industri Aviasi", "Aviation Industry"), description: t("Solusi TI untuk aviasi.", "IT solutions for aviation.") },
  });
  const cargo = await create("industries", {
    menuLabel: t("Kargo & Logistik", "Cargo & Logistics"),
    slug: "cargo",
    menuIcon: "Logistics",
    template: "BLOCKS",
    hero: { title: t("Logistik yang terhubung", "Connected logistics"), description: t("Visibilitas kargo end-to-end.", "End-to-end cargo visibility.") },
    sections: [
      {
        type: "highlights",
        columns: "3",
        items: [{ title: t("Pelacakan real-time", "Real-time tracking"), icon: "LocalShippingOutlined" }],
      },
    ],
    seo: { title: t("Kargo & Logistik", "Cargo & Logistics"), description: t("Solusi TI untuk kargo.", "IT solutions for cargo.") },
  });

  return {
    media,
    terms: { news, productCat, dept, exp, loc, empType, skill, caseIndustry, caseSolution, caseTech, tag },
    office,
    clients,
    testimonial,
    caseGaruda,
    products: { amala, chronus, auxoshift },
    categories: { enterpriseCat, operationsCat },
    solutions: { soc, managed },
    industries: { aviation, cargo },
  };
}
