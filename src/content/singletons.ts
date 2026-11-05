import { f, type Fields } from "./fields";
import {
  cta,
  faq,
  heading,
  iconCardFields,
  industryCardFields,
  labelValueFields,
  link,
  linkFields,
  seo,
  statFields,
  textItemFields,
} from "./shared";

export type SingletonDef = {
  key: string; // enum SingletonKey
  slug: string; // segmen URL admin & resource API publik
  label: string;
  group: string;
  icon: string;
  /** true = punya draft terpisah, perlu "Publish". false = simpan langsung terbit. */
  draftable: boolean;
  previewPath?: string;
  fields: Fields;
  /** Data koleksi yang ikut disertakan di API publik (lihat src/server/public/extras.ts). */
  extras?: string[];
};

const l = f.l;
const lt = f.lt;
const labelPlaceholder = { label: l("Label"), placeholder: l("Placeholder") };
const errorMessages = () =>
  f.object("Pesan error", {
    required: l("Wajib diisi", { help: "{field} = nama field" }),
    email: l("Email tidak valid"),
    phone: l("Telepon tidak valid"),
  });

// ─────────────── Global ───────────────

const siteSettings: SingletonDef = {
  key: "SITE_SETTINGS",
  slug: "site-settings",
  label: "Pengaturan situs",
  group: "Global",
  icon: "Settings",
  draftable: false,
  extras: ["offices"],
  fields: {
    siteName: f.text("Nama situs", { required: true }),
    alternateName: f.text("Nama alternatif"),
    logo: f.media("Logo"),
    email: f.email("Email", { required: true }),
    phone: f.text("Telepon", { required: true }),
    address: lt("Alamat (footer)", { required: true }),
    postalAddress: f.object("Alamat pos (JSON-LD)", {
      street: f.text("Jalan"),
      locality: f.text("Kota"),
      region: f.text("Provinsi"),
      postalCode: f.text("Kode pos"),
      country: f.text("Negara (kode ISO)", { placeholder: "ID" }),
    }),
    socials: f.array(
      "Media sosial",
      {
        platform: f.select("Platform", ["linkedin", "instagram", "facebook", "youtube", "x", "tiktok"], { required: true }),
        url: f.url("URL", { required: true }),
      },
      { itemLabel: "platform" },
    ),
    defaultSeo: seo({ required: true }),
    searchUrlTemplate: f.text("Search URL template", { placeholder: "https://www.asyst.co.id/search?q={search_term_string}" }),
  },
};

const navigation: SingletonDef = {
  key: "NAVIGATION",
  slug: "navigation",
  label: "Navigasi (header)",
  group: "Global",
  icon: "Menu",
  draftable: true,
  fields: {
    productsPanelSubtitle: l("Subjudul panel produk", { required: true }),
    productsLink: f.text("Link semua produk", { placeholder: "/product" }),
    productCategories: f.array(
      "Kategori produk (mega menu)",
      {
        label: l("Label", { required: true }),
        shortLabel: l("Label singkat"),
        title: l("Judul", { required: true }),
        description: lt("Deskripsi"),
        items: f.array(
          "Item",
          {
            product: f.ref("Produk", "products", { help: "Kosongkan bila item belum punya halaman produk." }),
            name: l("Nama", { required: true }),
            description: lt("Deskripsi"),
            href: f.text("Link (override)"),
          },
          { itemLabel: "name" },
        ),
      },
      { itemLabel: "label" },
    ),
    solutionGroups: f.array(
      "Grup solusi & industri",
      {
        label: l("Label grup", { required: true }),
        link: f.text("Link grup"),
        linkLabel: l("Label link"),
        items: f.array("Item", { label: l("Label", { required: true }), href: f.text("Link"), icon: f.icon() }, { itemLabel: "label" }),
      },
      { itemLabel: "label" },
    ),
    companyGroup: f.object("Grup perusahaan", {
      label: l("Label", { required: true }),
      items: f.array("Item", { label: l("Label", { required: true }), href: f.text("Link"), icon: f.icon() }, { itemLabel: "label" }),
    }),
    featured: f.object(
      "Promo unggulan",
      { label: l("Label"), title: l("Judul"), image: f.media("Gambar"), href: f.text("Link") },
      { nullable: true },
    ),
    newsLink: f.text("Link berita", { placeholder: "/news" }),
    searchLink: f.text("Link pencarian", { placeholder: "/search" }),
  },
};

const footer: SingletonDef = {
  key: "FOOTER",
  slug: "footer",
  label: "Footer",
  group: "Global",
  icon: "PanelBottom",
  draftable: false,
  fields: {
    companyTitle: l("Judul kolom perusahaan", { required: true, help: "Alamat, telepon, email diambil dari Pengaturan situs." }),
    columns: f.array(
      "Kolom",
      { title: l("Judul"), href: f.text("Link judul"), items: f.array("Link", linkFields, { itemLabel: "label" }) },
      { itemLabel: "title" },
    ),
    legalLinks: f.array("Link legal", linkFields, { itemLabel: "label" }),
  },
};

const uiStrings: SingletonDef = {
  key: "UI_STRINGS",
  slug: "ui-strings",
  label: "Microcopy UI",
  group: "Global",
  icon: "Languages",
  draftable: false,
  fields: {
    entries: f.array(
      "String",
      { key: f.text("Key", { required: true, placeholder: "common.viewDetails" }), value: l("Teks", { required: true }) },
      { itemLabel: "key", help: "Opsional. Rekomendasi: microcopy tetap di kode (kamus i18n)." },
    ),
  },
};

const askAsyst: SingletonDef = {
  key: "ASK_ASYST_FORM",
  slug: "ask-asyst-form",
  label: "Form Ask ASYST",
  group: "Global",
  icon: "MessageCircleQuestion",
  draftable: false,
  fields: {
    title: l("Judul", { required: true }),
    topicLabel: l("Label topik"),
    successTitle: l("Judul sukses"),
    submit: l("Tombol kirim"),
    close: l("Tombol tutup"),
    back: l("Tombol kembali"),
    topics: f.array("Topik", { value: f.slug("Value"), label: l("Label", { required: true }) }, { itemLabel: "label" }),
    fields: f.object("Field form", {
      fullName: f.object("Nama lengkap", labelPlaceholder),
      email: f.object("Email", labelPlaceholder),
      phone: f.object("Telepon", labelPlaceholder),
      company: f.object("Perusahaan", labelPlaceholder),
      jobTitle: f.object("Jabatan", labelPlaceholder),
      subject: f.object("Subjek", labelPlaceholder),
      message: f.object("Pesan", labelPlaceholder),
    }),
    jobTitleOptions: f.llist("Opsi jabatan"),
    messageMaxLength: f.number("Panjang maksimal pesan", { min: 1 }),
    phoneCountryCodes: f.list("Kode negara telepon", { help: "Satu per baris, mis. +62" }),
    errorMessages: errorMessages(),
  },
};

// ─────────────── Halaman ───────────────

const home: SingletonDef = {
  key: "HOME",
  slug: "home",
  label: "Home",
  group: "Halaman",
  icon: "House",
  draftable: true,
  previewPath: "/",
  extras: ["awards", "trustedClients", "latestNews"],
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      primaryButton: link("Tombol utama"),
      secondaryButton: link("Tombol kedua"),
      backgroundImage: f.media("Gambar latar"),
    }),
    awards: f.object("Penghargaan", { show: f.bool("Tampilkan", { default: true, help: "Item diambil dari koleksi Penghargaan." }) }),
    trustedBy: f.object("Trusted by", {
      title: l("Judul"),
      show: f.bool("Tampilkan", { default: true, help: "Logo dari Klien dengan penempatan Home." }),
    }),
    enterpriseHighlight: f.object("Enterprise highlight", {
      heading: heading(),
      items: f.array("Item", iconCardFields, { itemLabel: "title" }),
    }),
    products: f.object("Produk", {
      heading: heading(),
      items: f.array(
        "Item",
        {
          product: f.ref("Produk", "products"),
          title: l("Judul", { required: true }),
          description: lt("Deskripsi"),
          category: f.ref("Kategori filter", "terms", { vocabulary: "PRODUCT_CATEGORY" }),
          image: f.media("Gambar"),
          link: link(),
        },
        { itemLabel: "title" },
      ),
    }),
    capabilities: f.object("Kapabilitas", {
      heading: heading(),
      items: f.array(
        "Tab",
        {
          icon: f.icon(),
          label: l("Label tab", { required: true }),
          title: l("Judul"),
          description: lt("Deskripsi"),
          tags: f.llist("Tag"),
          image: f.media("Gambar"),
        },
        { itemLabel: "label" },
      ),
    }),
    partner: f.object("Partner", {
      title: l("Judul"),
      items: f.array("Item", { title: l("Judul", { required: true }), description: lt("Deskripsi"), image: f.media("Gambar") }, { itemLabel: "title" }),
    }),
    industries: f.object("Industri", {
      heading: heading(),
      allLink: f.text("Link semua industri", { placeholder: "/industry" }),
      items: f.array(
        "Item",
        {
          title: l("Judul", { required: true }),
          description: lt("Deskripsi"),
          image: f.media("Gambar"),
          tags: f.llist("Tag"),
          industry: f.ref("Halaman industri", "industries"),
        },
        { itemLabel: "title" },
      ),
    }),
    news: f.object("Berita", {
      title: l("Judul"),
      limit: f.number("Jumlah berita", { min: 1, max: 12, help: "Berita terbaru disertakan otomatis di API." }),
    }),
    cta: cta(),
  },
};

const about: SingletonDef = {
  key: "ABOUT",
  slug: "about",
  label: "About",
  group: "Halaman",
  icon: "Info",
  draftable: true,
  previewPath: "/about",
  extras: ["leaders", "aboutClients"],
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      button: link("Tombol"),
      image: f.media("Gambar"),
    }),
    intro: f.object("Intro", { title: l("Judul"), description: lt("Deskripsi") }),
    leaders: f.object("Pimpinan", { heading: heading() }),
    principles: f.object("Prinsip", {
      video: f.object("Video", {
        embedUrl: f.url("Embed URL"),
        thumbnail: f.media("Thumbnail"),
        title: l("Judul video"),
        thumbnailAlt: l("Alt thumbnail"),
      }),
      tabs: f.array("Tab", { label: l("Label", { required: true }), items: f.array("Item", textItemFields, { itemLabel: "title" }) }, { itemLabel: "label" }),
      defaultTab: f.number("Tab default (indeks mulai 0)", { min: 0 }),
    }),
    clients: f.object("Klien", { heading: heading() }),
    consultingAreas: f.object("Area konsultasi", {
      heading: heading(),
      items: f.array("Item", textItemFields, { itemLabel: "title" }),
    }),
    joinTeam: f.object("Bergabung", {
      title: l("Judul"),
      paragraphs: f.llist("Paragraf"),
      link: link(),
      images: f.mediaList("Gambar"),
    }),
  },
};

const contact: SingletonDef = {
  key: "CONTACT",
  slug: "contact",
  label: "Contact",
  group: "Halaman",
  icon: "Mail",
  draftable: true,
  previewPath: "/contact-us",
  extras: ["offices"],
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", { title: l("Judul", { required: true }), paragraphs: f.llist("Paragraf") }),
    form: f.object("Form", {
      title: l("Judul"),
      bookCallLabel: l("Label Book a Call"),
      bookCallUrl: f.url("URL Book a Call"),
      description: lt("Deskripsi"),
      submitLabel: l("Label kirim"),
      successMessage: lt("Pesan sukses"),
      fields: f.array(
        "Field",
        {
          name: f.select("Nama field", ["fullName", "email", "phone", "company", "jobTitle", "subject", "message"], { required: true }),
          placeholder: l("Placeholder"),
          type: f.select("Tipe", ["text", "email", "tel", "textarea"], { default: "text" }),
          required: f.bool("Wajib"),
          row: f.number("Baris", { min: 1 }),
        },
        { itemLabel: "name" },
      ),
      errorMessages: errorMessages(),
    }),
    nextSteps: f.object("Langkah berikutnya", { title: l("Judul"), steps: f.llist("Langkah") }),
    offices: f.object("Kantor", { title: l("Judul"), viewMapLabel: l("Label lihat peta") }),
  },
};

const newsPage: SingletonDef = {
  key: "NEWS_PAGE",
  slug: "news-page",
  label: "Halaman Berita",
  group: "Halaman",
  icon: "Newspaper",
  draftable: false,
  previewPath: "/news",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", { title: l("Judul", { required: true }), description: lt("Deskripsi") }),
    pageSize: f.number("Jumlah awal", { min: 1 }),
    moreSize: f.number("Jumlah load more", { min: 1 }),
    relatedLimit: f.number("Jumlah berita terkait", { min: 0 }),
    detailLabels: f.object("Label halaman detail", {
      publishedBy: l("Published by"),
      postedBy: l("Posted by"),
      publishedAt: l("Published at"),
      collaboration: l("Kolaborasi"),
      contactLabel: l("Label kontak"),
      relatedTitle: l("Judul terkait"),
      notFoundTitle: l("Judul tidak ditemukan"),
      notFoundDescription: lt("Deskripsi tidak ditemukan"),
      backToNews: l("Kembali ke berita"),
      share: l("Bagikan"),
      linkCopied: l("Link disalin"),
      readingTime: l("Waktu baca (tunggal)", { help: "{n} = menit" }),
      readingTimePlural: l("Waktu baca (jamak)"),
    }),
    dateFormat: l("Format tanggal (dayjs)", { placeholder: "D MMMM YYYY" }),
    collaborationLink: f.text("Link kolaborasi", { placeholder: "/contact-us" }),
  },
};

const career: SingletonDef = {
  key: "CAREER",
  slug: "career",
  label: "Karier",
  group: "Halaman",
  icon: "BriefcaseBusiness",
  draftable: true,
  previewPath: "/career",
  extras: ["latestJobs"],
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      buttonLabel: l("Label tombol"),
      image: f.media("Gambar"),
    }),
    values: f.object("Nilai", {
      title: l("Judul"),
      items: f.array(
        "Nilai",
        { icon: f.icon(), title: l("Judul", { required: true }), subtitle: l("Subjudul"), description: lt("Deskripsi") },
        { itemLabel: "title" },
      ),
    }),
    opportunity: f.object("Peluang", {
      title: l("Judul"),
      description: lt("Deskripsi"),
      buttonLabel: l("Label tombol"),
      limit: f.number("Jumlah lowongan", { min: 1 }),
    }),
    life: f.object("Life at ASYST", { title: l("Judul"), description: lt("Deskripsi"), images: f.mediaList("Galeri") }),
    why: f.object("Why ASYST", { heading: heading(), items: f.array("Item", textItemFields, { itemLabel: "title" }) }),
    indonesia: f.object("Bekerja di Indonesia", {
      heading: heading(),
      items: f.array("Item", labelValueFields, { itemLabel: "label" }),
    }),
    internship: f.object("Magang", {
      title: l("Judul"),
      description: lt("Deskripsi"),
      buttonLabel: l("Label tombol"),
      filterKey: f.select("Filter preset", ["type", "department", "experience", "location"], { default: "type" }),
      filterValue: f.ref("Nilai filter", "terms"),
    }),
    faq: faq(),
  },
};

const careerJobs: SingletonDef = {
  key: "CAREER_JOBS",
  slug: "career-jobs",
  label: "Daftar Lowongan",
  group: "Halaman",
  icon: "ListChecks",
  draftable: true,
  previewPath: "/career/jobs",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true }),
      description: lt("Deskripsi"),
      searchPlaceholder: l("Placeholder pencarian"),
      popularSkillsLabel: l("Label skill populer"),
      allSkillsLabel: l("Label semua skill"),
    }),
    jobList: f.object("Daftar lowongan", {
      title: l("Judul"),
      description: lt("Deskripsi"),
      emptyText: l("Teks kosong"),
      resetFilterLabel: l("Label reset filter"),
      loadMoreLabel: l("Label load more"),
      pageSize: f.number("Jumlah per halaman", { min: 1 }),
    }),
    sidebar: f.object("Sidebar", {
      browseLabel: l("Label browse"),
      filtersLabel: l("Label filter"),
      searchPlaceholder: l("Placeholder pencarian"),
    }),
    filterGroups: f.array(
      "Grup filter",
      {
        key: f.select("Key", ["department", "experience", "type", "location", "skill"], { required: true }),
        label: l("Label", { required: true }),
        allLabel: l("Label semua"),
      },
      { itemLabel: "label", help: "Opsi filter diambil dari Taksonomi." },
    ),
    connects: f.object("Connects", {
      title: l("Judul"),
      paragraphs: f.llist("Paragraf"),
      items: f.array("Item", iconCardFields, { itemLabel: "title" }),
    }),
    applySteps: f.object("Langkah melamar", {
      heading: heading(),
      image: f.media("Gambar"),
      steps: f.array("Langkah", textItemFields, { itemLabel: "title" }),
    }),
    faq: faq(),
  },
};

const careerJobDetail: SingletonDef = {
  key: "CAREER_JOB_DETAIL",
  slug: "career-job-detail",
  label: "Template detail lowongan",
  group: "Halaman",
  icon: "FileText",
  draftable: false,
  fields: {
    seoTitleTemplate: l("Template SEO title", { help: "{title} = judul lowongan" }),
    seoFallbackTitle: l("SEO title fallback"),
    applyLabel: l("Label lamar"),
    applyShortLabel: l("Label lamar (singkat)"),
    applyLink: link("Link lamaran default"),
    metaLabels: f.object("Label meta", { location: l("Lokasi"), type: l("Tipe"), experience: l("Pengalaman") }),
    sectionLabels: f.object("Label section", {
      about: l("Tentang"),
      responsibilities: l("Tanggung jawab"),
      requirements: l("Persyaratan"),
    }),
    whyMatters: f.object("Why it matters", { title: l("Judul"), paragraphs: f.llist("Paragraf") }),
    benefits: f.object("Benefit", { title: l("Judul"), items: f.llist("Item") }),
    why: f.object("Why ASYST", { title: l("Judul"), items: f.array("Item", textItemFields, { itemLabel: "title" }) }),
    beforeApply: f.object("Sebelum melamar", {
      title: l("Judul"),
      items: f.llist("Item"),
      note: lt("Catatan"),
      requireLabel: l("Label persyaratan"),
      groups: f.array("Grup", { title: l("Judul", { required: true }), items: f.llist("Item") }, { itemLabel: "title" }),
    }),
    faq: faq("FAQ ({title} = judul lowongan)"),
  },
};

const caseStudyPage: SingletonDef = {
  key: "CASE_STUDY_PAGE",
  slug: "case-study-page",
  label: "Halaman Studi Kasus",
  group: "Halaman",
  icon: "FileChartColumn",
  draftable: true,
  previewPath: "/case-study",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      buttonLabel: l("Label tombol"),
      image: f.media("Gambar"),
    }),
    intro: f.object("Intro", { title: l("Judul"), description: lt("Deskripsi") }),
    featured: f.object("Unggulan", {
      heading: heading(),
      caseStudy: f.ref("Studi kasus", "case-studies"),
      caseTitle: l("Judul kasus"),
      summary: lt("Ringkasan"),
      buttonLabel: l("Label tombol"),
      tags: f.llist("Tag"),
      image: f.media("Gambar"),
      imageAlt: l("Alt gambar"),
      details: f.array("Detail", labelValueFields, { itemLabel: "label" }),
    }),
    explorer: f.object("Explorer", {
      allLabel: l("Label semua"),
      searchPlaceholder: l("Placeholder pencarian"),
      emptyText: l("Teks kosong"),
      loadMoreLabel: l("Label load more"),
      pageSize: f.number("Jumlah per halaman", { min: 1 }),
      filterTabs: f.array(
        "Tab filter",
        { key: f.select("Key", ["industry", "solution", "technology"], { required: true }), label: l("Label", { required: true }) },
        { itemLabel: "label" },
      ),
    }),
    testimonials: f.object("Testimoni", {
      title: l("Judul"),
      items: f.ref("Testimoni", "testimonials", { multiple: true }),
    }),
    experience: f.object("Pengalaman", {
      title: l("Judul"),
      buttonLabel: l("Label tombol"),
      items: f.array(
        "Item",
        { title: l("Judul", { required: true }), description: lt("Deskripsi"), image: f.media("Gambar"), link: link() },
        { itemLabel: "title" },
      ),
    }),
    cta: f.object("CTA", { title: l("Judul"), subtitle: l("Subjudul"), description: lt("Deskripsi"), buttonLabel: l("Label tombol") }),
  },
};

const productLanding: SingletonDef = {
  key: "PRODUCT_LANDING",
  slug: "product-landing",
  label: "Landing Produk",
  group: "Halaman",
  icon: "Package",
  draftable: true,
  previewPath: "/product",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      eyebrow: l("Eyebrow"),
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      primaryButton: link("Tombol utama"),
      secondaryButton: link("Tombol kedua"),
      image: f.media("Gambar"),
    }),
    catalog: f.object("Katalog", {
      heading: heading(),
      categories: f.ref("Kategori (berurutan)", "product-categories", { multiple: true }),
    }),
    experience: f.object("Pengalaman", {
      heading: heading(),
      items: f.array("Item", { image: f.media("Gambar (SVG)"), title: l("Judul", { required: true }), description: lt("Deskripsi") }, { itemLabel: "title" }),
    }),
    solve: f.object("Solve", {
      heading: heading(),
      items: f.array(
        "Tab",
        {
          label: l("Label tab", { required: true }),
          title: l("Judul"),
          description: lt("Deskripsi"),
          points: f.llist("Poin"),
          subtitle: l("Subjudul"),
          subDescription: f.lrich("Sub-deskripsi"),
          links: f.array("Link", linkFields, { itemLabel: "label" }),
          image: f.media("Gambar"),
        },
        { itemLabel: "label" },
      ),
    }),
    cta: cta(),
  },
};

const solutionLanding: SingletonDef = {
  key: "SOLUTION_LANDING",
  slug: "solution-landing",
  label: "Landing Solusi",
  group: "Halaman",
  icon: "Lightbulb",
  draftable: true,
  previewPath: "/solution",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      eyebrow: l("Eyebrow"),
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      primaryButton: link("Tombol utama"),
      secondaryButton: link("Tombol kedua"),
      image: f.media("Gambar"),
    }),
    capabilities: f.object("Kapabilitas", { heading: heading(), items: f.array("Item", iconCardFields, { itemLabel: "title" }) }),
    layers: f.object("Layer", {
      heading: heading(),
      items: f.array(
        "Item",
        {
          tag: l("Tag"),
          title: l("Judul", { required: true }),
          description: lt("Deskripsi"),
          link: link(),
          image: f.media("Gambar"),
          solution: f.ref("Halaman solusi", "solutions"),
        },
        { itemLabel: "title" },
      ),
    }),
    value: f.object("Value", {
      title: l("Judul"),
      items: f.array(
        "Tab",
        {
          label: l("Label", { required: true }),
          title: l("Judul"),
          description: lt("Deskripsi"),
          points: f.llist("Poin"),
          tags: f.llist("Tag"),
          image: f.media("Gambar"),
        },
        { itemLabel: "label" },
      ),
    }),
    clients: f.object("Klien", { items: f.ref("Klien", "clients", { multiple: true }) }),
    faq: faq(),
    cta: cta(),
  },
};

const industryLanding: SingletonDef = {
  key: "INDUSTRY_LANDING",
  slug: "industry-landing",
  label: "Landing Industri",
  group: "Halaman",
  icon: "Factory",
  draftable: true,
  previewPath: "/industry",
  fields: {
    seo: seo({ required: true }),
    hero: f.object("Hero", {
      title: l("Judul", { required: true, multiline: true }),
      description: lt("Deskripsi"),
      primaryButton: link("Tombol utama"),
      secondaryButton: link("Tombol kedua"),
      stats: f.array("Statistik", statFields, { itemLabel: "label" }),
    }),
    intro: f.object("Intro", { title: l("Judul"), paragraphs: f.llist("Paragraf"), image: f.media("Gambar") }),
    expertise: f.object("Keahlian", { heading: heading(), items: f.array("Kartu industri", industryCardFields, { itemLabel: "title" }) }),
    foundation: f.object("Fondasi", { heading: heading(), items: f.array("Item", iconCardFields, { itemLabel: "title" }) }),
    faq: faq(),
    cta: cta(),
  },
};

const notFound: SingletonDef = {
  key: "NOT_FOUND",
  slug: "not-found",
  label: "Halaman 404",
  group: "Halaman",
  icon: "CircleOff",
  draftable: false,
  fields: {
    seoTitle: l("SEO title", { required: true }),
    title: l("Judul", { required: true }),
    description: f.object("Deskripsi", { before: lt("Teks sebelum link"), linkLabel: l("Label link"), after: lt("Teks setelah link") }),
    searchLabel: l("Label pencarian"),
    searchPlaceholder: l("Placeholder pencarian"),
    searchSubmit: l("Tombol cari"),
    cards: f.array(
      "Kartu",
      { title: l("Judul", { required: true }), description: lt("Deskripsi"), image: f.media("Gambar"), link: link() },
      { itemLabel: "title" },
    ),
  },
};

const search: SingletonDef = {
  key: "SEARCH",
  slug: "search",
  label: "Halaman Pencarian",
  group: "Halaman",
  icon: "Search",
  draftable: false,
  fields: {
    labels: f.object("Label", {
      title: l("Judul"),
      placeholder: l("Placeholder"),
      clear: l("Hapus"),
      tabAll: l("Tab semua"),
      resultCount: l("Jumlah hasil", { help: "{n} = jumlah" }),
      noResult: lt("Tidak ada hasil"),
      loadMore: l("Load more"),
      quickTitle: l("Judul pencarian cepat"),
      seeAll: l("Lihat semua"),
      close: l("Tutup"),
    }),
    categories: f.array("Kategori hasil", { key: f.text("Key", { required: true }), label: l("Label", { required: true }) }, { itemLabel: "label" }),
    pageSize: f.number("Jumlah per halaman", { min: 1 }),
    quickGroupLimit: f.number("Batas per grup (cepat)", { min: 1 }),
    companyEntries: f.array(
      "Entri statis perusahaan",
      { title: l("Judul", { required: true }), description: lt("Deskripsi"), link: link(), keywords: l("Kata kunci") },
      { itemLabel: "title" },
    ),
  },
};

export const SINGLETONS: SingletonDef[] = [
  siteSettings,
  navigation,
  footer,
  askAsyst,
  uiStrings,
  home,
  about,
  contact,
  newsPage,
  career,
  careerJobs,
  careerJobDetail,
  caseStudyPage,
  productLanding,
  solutionLanding,
  industryLanding,
  notFound,
  search,
];

export const SINGLETON_MAP: Record<string, SingletonDef> = Object.fromEntries(SINGLETONS.map((s) => [s.slug, s]));

export function getSingleton(slug: string): SingletonDef | undefined {
  return SINGLETON_MAP[slug];
}
