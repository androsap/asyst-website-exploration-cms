import { f, type Fields, type Option, type RefTarget } from "./fields";
import { sections } from "./blocks";
import {
  cta,
  faq,
  iconCardFields,
  industryCardFields,
  labelValueFields,
  link,
  seo,
  statFields,
  tabPanelItemFields,
  textItemFields,
} from "./shared";

// ─────────────── Tipe registry ───────────────

export type ColumnKind = "text" | "l" | "media" | "bool" | "date" | "datetime" | "enum" | "enumList" | "status" | "number";
export type ListColumn = { path: string; label: string; kind: ColumnKind };

/**
 * Filter API publik → where Prisma.
 *  relKey     : FK ke Term/entitas lain, dicocokkan lewat `key`/`slug`   (?category=digital-transformation)
 *  relSomeKey : relasi many-to-many, dicocokkan lewat `key`            (?tag=cloud)
 *  joinKey    : relasi lewat tabel join (Product ↔ ProductCategory)    (?category=enterprise)
 *  enum       : kolom enum, nilai kebab-case diubah ke UPPER_SNAKE     (?vocabulary=news-category)
  *  enumHas    : kolom Json berisi array enum                                        (?placement=home-trusted)
 *  bool       : kolom boolean                                         (?featured=true)
 *  eq         : kolom string persis                                   (?path=/about)
 */
export type PublicFilter = {
  param: string;
  field: string;
  kind: "relKey" | "relSomeKey" | "joinKey" | "enum" | "enumHas" | "bool" | "eq";
  matchKey?: string;
  help?: string;
};

export type CollectionDef = {
  type: RefTarget | "offices" | "awards" | "leaders" | "page-seo" | "news" | "jobs";
  model: string;
  label: string;
  singular: string;
  group: string;
  icon: string;
  fields: Fields;
  titleField: string;
  slugField?: "slug" | "key" | "path";
  slugFrom?: string;
  hasStatus?: boolean;
  orderable?: boolean;
  reorderScope?: string;
  sort: { field: string; dir: "asc" | "desc" };
  searchFields: string[];
  columns: ListColumn[];
  listInclude?: Record<string, unknown>;
  adminFilters?: { field: string; label: string; options: Option[] }[];
  summary: string[];
  previewPath?: string;
  public: { filters?: PublicFilter[]; defaultLimit?: number; activeField?: string };
};

// ─────────────── Opsi enum ───────────────

export const VOCABULARY_OPTIONS: Option[] = [
  { value: "NEWS_CATEGORY", label: "Kategori berita" },
  { value: "PRODUCT_CATEGORY", label: "Kategori produk (filter Home)" },
  { value: "JOB_DEPARTMENT", label: "Departemen lowongan" },
  { value: "JOB_EXPERIENCE", label: "Level pengalaman" },
  { value: "JOB_LOCATION", label: "Lokasi kerja" },
  { value: "JOB_EMPLOYMENT_TYPE", label: "Tipe pekerjaan" },
  { value: "JOB_SKILL", label: "Skill" },
  { value: "CASE_INDUSTRY", label: "Industri studi kasus" },
  { value: "CASE_SOLUTION", label: "Solusi studi kasus" },
  { value: "CASE_TECHNOLOGY", label: "Teknologi studi kasus" },
  { value: "TAG", label: "Tag" },
];

export const CLIENT_PLACEMENTS: Option[] = [
  { value: "HOME_TRUSTED", label: "Home (Trusted by)" },
  { value: "ABOUT", label: "About" },
  { value: "SOLUTION", label: "Solusi" },
  { value: "AUXOSHIFT", label: "Auxoshift" },
  { value: "CASE_STUDY", label: "Studi kasus" },
];

export const TESTIMONIAL_PLACEMENTS: Option[] = [
  { value: "CASE_STUDY", label: "Studi kasus" },
  { value: "AUXOSHIFT", label: "Auxoshift" },
];

const STATUS_COL: ListColumn = { path: "status", label: "Status", kind: "status" };
const UPDATED_COL: ListColumn = { path: "updatedAt", label: "Diubah", kind: "datetime" };

// ─────────────── Definisi ───────────────

const terms: CollectionDef = {
  type: "terms",
  model: "term",
  label: "Taksonomi",
  singular: "Term",
  group: "Fondasi",
  icon: "Tags",
  fields: {
    vocabulary: f.select("Vocabulary", VOCABULARY_OPTIONS, { required: true }),
    key: f.slug("Key", { help: "Nilai stabil untuk filter/URL, mis. digital-transformation." }),
    label: f.l("Label", { required: true }),
    isPopular: f.bool("Populer (skill karier)"),
  },
  titleField: "label",
  slugField: "key",
  slugFrom: "label",
  orderable: true,
  reorderScope: "vocabulary",
  sort: { field: "order", dir: "asc" },
  searchFields: ["label", "key"],
  columns: [
    { path: "label", label: "Label", kind: "l" },
    { path: "key", label: "Key", kind: "text" },
    { path: "vocabulary", label: "Vocabulary", kind: "enum" },
    UPDATED_COL,
  ],
  adminFilters: [{ field: "vocabulary", label: "Vocabulary", options: VOCABULARY_OPTIONS }],
  summary: ["key", "label"],
  public: {
    defaultLimit: 100,
    filters: [{ param: "vocabulary", field: "vocabulary", kind: "enum", help: "news-category, job-department, …" }],
  },
};

const offices: CollectionDef = {
  type: "offices",
  model: "office",
  label: "Kantor",
  singular: "Kantor",
  group: "Fondasi",
  icon: "Building2",
  fields: {
    title: f.l("Nama kantor", { required: true, placeholder: "Registered Office" }),
    addressLines: f.llist("Baris alamat", { required: true }),
    mapUrl: f.url("URL Google Maps"),
  },
  titleField: "title",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["title", "addressLines"],
  columns: [{ path: "title", label: "Nama", kind: "l" }, UPDATED_COL],
  summary: ["title", "addressLines", "mapUrl"],
  public: { defaultLimit: 50 },
};

const clients: CollectionDef = {
  type: "clients",
  model: "client",
  label: "Klien",
  singular: "Klien",
  group: "Fondasi",
  icon: "BriefcaseBusiness",
  fields: {
    name: f.text("Nama", { required: true }),
    logoId: f.media("Logo", { required: true }),
    logoColorId: f.media("Logo berwarna"),
    website: f.url("Website"),
    placements: f.multiselect("Tampil di", CLIENT_PLACEMENTS),
    isActive: f.bool("Aktif", { default: true }),
  },
  titleField: "name",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["name"],
  columns: [
    { path: "logo", label: "Logo", kind: "media" },
    { path: "name", label: "Nama", kind: "text" },
    { path: "placements", label: "Tampil di", kind: "enumList" },
    { path: "isActive", label: "Aktif", kind: "bool" },
  ],
  listInclude: { logo: true },
  summary: ["name", "logoId", "logoColorId", "website"],
  public: {
    defaultLimit: 100,
    activeField: "isActive",
    filters: [{ param: "placement", field: "placements", kind: "enumHas", help: "home-trusted, about, solution, …" }],
  },
};

const testimonials: CollectionDef = {
  type: "testimonials",
  model: "testimonial",
  label: "Testimoni",
  singular: "Testimoni",
  group: "Fondasi",
  icon: "MessageSquareQuote",
  fields: {
    name: f.text("Nama", { required: true }),
    role: f.l("Jabatan"),
    company: f.text("Perusahaan"),
    clientId: f.ref("Klien terkait", "clients"),
    quote: f.lt("Kutipan", { required: true }),
    photoId: f.media("Foto"),
    placements: f.multiselect("Tampil di", TESTIMONIAL_PLACEMENTS),
  },
  titleField: "name",
  hasStatus: true,
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["name", "company", "quote"],
  columns: [
    { path: "photo", label: "Foto", kind: "media" },
    { path: "name", label: "Nama", kind: "text" },
    { path: "company", label: "Perusahaan", kind: "text" },
    STATUS_COL,
  ],
  listInclude: { photo: true },
  summary: ["name", "role", "company", "quote", "photoId"],
  public: {
    defaultLimit: 50,
    filters: [{ param: "placement", field: "placements", kind: "enumHas", help: "case-study, auxoshift" }],
  },
};

const awards: CollectionDef = {
  type: "awards",
  model: "award",
  label: "Penghargaan",
  singular: "Penghargaan",
  group: "Fondasi",
  icon: "Award",
  fields: {
    title: f.l("Judul", { required: true }),
    subtitle: f.l("Subjudul"),
    imageId: f.media("Gambar"),
    year: f.number("Tahun", { min: 1900, max: 2100 }),
  },
  titleField: "title",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["title", "subtitle"],
  columns: [
    { path: "image", label: "Gambar", kind: "media" },
    { path: "title", label: "Judul", kind: "l" },
    { path: "year", label: "Tahun", kind: "number" },
  ],
  listInclude: { image: true },
  summary: ["title", "subtitle", "imageId", "year"],
  public: { defaultLimit: 50 },
};

const leaders: CollectionDef = {
  type: "leaders",
  model: "leader",
  label: "Pimpinan",
  singular: "Pimpinan",
  group: "Fondasi",
  icon: "UserRound",
  fields: {
    name: f.text("Nama", { required: true }),
    position: f.l("Jabatan", { required: true }),
    photoId: f.media("Foto", { required: true }),
    linkedin: f.url("LinkedIn"),
  },
  titleField: "name",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["name", "position"],
  columns: [
    { path: "photo", label: "Foto", kind: "media" },
    { path: "name", label: "Nama", kind: "text" },
    { path: "position", label: "Jabatan", kind: "l" },
  ],
  listInclude: { photo: true },
  summary: ["name", "position", "photoId", "linkedin"],
  public: { defaultLimit: 50 },
};

const authors: CollectionDef = {
  type: "authors",
  model: "author",
  label: "Penulis",
  singular: "Penulis",
  group: "Berita",
  icon: "PenLine",
  fields: {
    name: f.text("Nama", { required: true }),
    avatarId: f.media("Avatar"),
    bio: f.lt("Bio"),
  },
  titleField: "name",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["name"],
  columns: [
    { path: "avatar", label: "Avatar", kind: "media" },
    { path: "name", label: "Nama", kind: "text" },
  ],
  listInclude: { avatar: true },
  summary: ["name", "avatarId"],
  public: { defaultLimit: 50 },
};

const pageSeo: CollectionDef = {
  type: "page-seo",
  model: "pageSeo",
  label: "SEO halaman statis",
  singular: "SEO halaman",
  group: "Global",
  icon: "SearchCheck",
  fields: {
    path: f.text("Path", { required: true, placeholder: "/about", help: "Route statis tanpa dokumen konten." }),
    seo: seo({ required: true }),
  },
  titleField: "path",
  slugField: "path",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["path"],
  columns: [{ path: "path", label: "Path", kind: "text" }, UPDATED_COL],
  summary: ["path", "seo"],
  public: { defaultLimit: 100, filters: [{ param: "path", field: "path", kind: "eq" }] },
};

const news: CollectionDef = {
  type: "news",
  model: "newsArticle",
  label: "Berita",
  singular: "Berita",
  group: "Berita",
  icon: "Newspaper",
  fields: {
    title: f.l("Judul", { required: true }),
    slug: f.slug(),
    excerpt: f.lt("Ringkasan", { required: true }),
    content: f.lrich("Isi", { required: true }),
    coverImageId: f.media("Gambar sampul", { required: true }),
    categoryId: f.ref("Kategori", "terms", { vocabulary: "NEWS_CATEGORY", required: true }),
    tags: f.ref("Tag", "terms", { vocabulary: "TAG", multiple: true }),
    authorId: f.ref("Penulis", "authors"),
    isFeatured: f.bool("Unggulan (featured)"),
    seo: seo(),
  },
  titleField: "title",
  slugField: "slug",
  slugFrom: "title",
  hasStatus: true,
  sort: { field: "publishedAt", dir: "desc" },
  searchFields: ["title", "slug", "excerpt"],
  columns: [
    { path: "coverImage", label: "Sampul", kind: "media" },
    { path: "title", label: "Judul", kind: "l" },
    { path: "category.label", label: "Kategori", kind: "l" },
    STATUS_COL,
    { path: "publishedAt", label: "Terbit", kind: "datetime" },
  ],
  listInclude: { coverImage: true, category: true },
  summary: ["slug", "title", "excerpt", "coverImageId", "categoryId"],
  previewPath: "/news/{slug}",
  public: {
    defaultLimit: 9,
    filters: [
      { param: "category", field: "category", kind: "relKey" },
      { param: "tag", field: "tags", kind: "relSomeKey" },
      { param: "featured", field: "isFeatured", kind: "bool" },
    ],
  },
};

const jobs: CollectionDef = {
  type: "jobs",
  model: "job",
  label: "Lowongan",
  singular: "Lowongan",
  group: "Karier",
  icon: "BriefcaseBusiness",
  fields: {
    title: f.l("Judul posisi", { required: true }),
    slug: f.slug(),
    summary: f.lt("Ringkasan", { required: true }),
    departmentId: f.ref("Departemen", "terms", { vocabulary: "JOB_DEPARTMENT", required: true }),
    experienceId: f.ref("Level pengalaman", "terms", { vocabulary: "JOB_EXPERIENCE", required: true }),
    employmentTypeId: f.ref("Tipe pekerjaan", "terms", { vocabulary: "JOB_EMPLOYMENT_TYPE", required: true }),
    locationId: f.ref("Lokasi kerja", "terms", { vocabulary: "JOB_LOCATION", required: true }),
    skills: f.llist("Chip skill (kartu)"),
    tags: f.ref("Skill (filter)", "terms", { vocabulary: "JOB_SKILL", multiple: true }),
    about: f.llist("Tentang posisi", { required: true, help: "Satu paragraf per baris." }),
    responsibilities: f.llist("Tanggung jawab", { required: true }),
    requirements: f.llist("Persyaratan", { required: true }),
    applyUrl: f.url("URL lamaran (override)", { help: "Kosongkan untuk memakai link default di template detail." }),
    postedDate: f.date("Tanggal posting", { required: true }),
    closingDate: f.date("Tanggal tutup"),
  },
  titleField: "title",
  slugField: "slug",
  slugFrom: "title",
  hasStatus: true,
  sort: { field: "postedDate", dir: "desc" },
  searchFields: ["title", "slug", "summary"],
  columns: [
    { path: "title", label: "Posisi", kind: "l" },
    { path: "department.label", label: "Departemen", kind: "l" },
    { path: "employmentType.label", label: "Tipe", kind: "l" },
    STATUS_COL,
    { path: "postedDate", label: "Diposting", kind: "date" },
  ],
  listInclude: { department: true, employmentType: true },
  summary: ["slug", "title", "summary", "departmentId", "employmentTypeId", "locationId", "experienceId", "postedDate"],
  previewPath: "/career/jobs/{slug}",
  public: {
    defaultLimit: 10,
    filters: [
      { param: "department", field: "department", kind: "relKey" },
      { param: "experience", field: "experience", kind: "relKey" },
      { param: "type", field: "employmentType", kind: "relKey" },
      { param: "location", field: "location", kind: "relKey" },
      { param: "skill", field: "tags", kind: "relSomeKey" },
    ],
  },
};

const caseStudyDetail = f.object(
  "Halaman detail",
  {
    hero: f.object("Hero", {
      title: f.l("Judul", { required: true, multiline: true }),
      description: f.lt("Deskripsi"),
      buttonLabel: f.l("Label tombol"),
      image: f.media("Gambar"),
    }),
    summary: f.object("Ringkasan", {
      items: f.array("Item", labelValueFields, { itemLabel: "label", help: "Logo & nama diambil dari klien." }),
    }),
    challenge: f.object("Challenge", {
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul"),
      paragraphs: f.llist("Paragraf"),
      image: f.media("Gambar"),
    }),
    solution: f.object("Solution", {
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul"),
      architecture: f.object("Arsitektur", {
        top: f.l("Atas"),
        core: f.l("Inti"),
        branches: f.array("Cabang", { label: f.l("Label", { required: true }), child: f.l("Anak") }, { itemLabel: "label" }),
      }),
      items: f.array("Item", textItemFields, { itemLabel: "title" }),
    }),
    technologies: f.object("Teknologi", {
      title: f.l("Judul"),
      images: f.mediaList("Logo teknologi"),
      groups: f.array("Grup", { label: f.l("Label", { required: true }), items: f.text("Item") }, { itemLabel: "label" }),
    }),
    approach: f.object("Pendekatan", {
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul"),
      steps: f.array(
        "Langkah",
        { phase: f.l("Fase"), title: f.l("Judul", { required: true }), description: f.lt("Deskripsi") },
        { itemLabel: "title" },
      ),
    }),
    outcome: f.object("Hasil", {
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul"),
      items: f.array("Item", textItemFields, { itemLabel: "title" }),
    }),
    related: f.object("Studi kasus terkait", {
      title: f.l("Judul", { help: "Daftar studi kasus diambil dari field \"Studi kasus terkait\"." }),
    }),
  },
  { nullable: true, help: "Aktifkan bila studi kasus memiliki halaman detail. Sitemap hanya memuat yang punya detail." },
);

const caseStudies: CollectionDef = {
  type: "case-studies",
  model: "caseStudy",
  label: "Studi Kasus",
  singular: "Studi kasus",
  group: "Konten",
  icon: "FileChartColumn",
  fields: {
    title: f.l("Judul", { required: true }),
    slug: f.slug(),
    clientId: f.ref("Klien", "clients"),
    cardImageId: f.media("Gambar kartu", { required: true }),
    industryId: f.ref("Industri", "terms", { vocabulary: "CASE_INDUSTRY", required: true }),
    solutionId: f.ref("Solusi", "terms", { vocabulary: "CASE_SOLUTION", required: true }),
    technologies: f.ref("Teknologi", "terms", { vocabulary: "CASE_TECHNOLOGY", multiple: true }),
    tags: f.ref("Tag", "terms", { vocabulary: "TAG", multiple: true }),
    related: f.ref("Studi kasus terkait", "case-studies", { multiple: true }),
    detail: caseStudyDetail,
    seo: seo(),
  },
  titleField: "title",
  slugField: "slug",
  slugFrom: "title",
  hasStatus: true,
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["title", "slug"],
  columns: [
    { path: "cardImage", label: "Gambar", kind: "media" },
    { path: "title", label: "Judul", kind: "l" },
    { path: "industry.label", label: "Industri", kind: "l" },
    STATUS_COL,
    UPDATED_COL,
  ],
  listInclude: { cardImage: true, industry: true },
  summary: ["slug", "title", "cardImageId", "clientId", "industryId", "solutionId"],
  previewPath: "/case-study/{slug}",
  public: {
    defaultLimit: 9,
    filters: [
      { param: "industry", field: "industry", kind: "relKey" },
      { param: "solution", field: "solution", kind: "relKey" },
      { param: "technology", field: "technologies", kind: "relSomeKey" },
      { param: "tag", field: "tags", kind: "relSomeKey" },
    ],
  },
};

const productCategories: CollectionDef = {
  type: "product-categories",
  model: "productCategory",
  label: "Kategori Produk",
  singular: "Kategori produk",
  group: "Produk & Solusi",
  icon: "LayoutGrid",
  fields: {
    label: f.l("Label", { required: true }),
    key: f.slug("Key", { help: "enterprise, travel, commercial, operations, cargo, it-service" }),
    shortLabel: f.l("Label singkat (header)"),
    title: f.l("Judul (katalog)", { required: true }),
    description: f.lt("Deskripsi (katalog)", { required: true }),
    menuTitle: f.l("Judul mega menu"),
    menuDescription: f.lt("Deskripsi mega menu"),
    button: link("Tombol"),
    products: f.ref("Produk (berurutan)", "products", { multiple: true, relation: "join" }),
  },
  titleField: "label",
  slugField: "key",
  slugFrom: "label",
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["label", "key", "title"],
  columns: [
    { path: "label", label: "Label", kind: "l" },
    { path: "key", label: "Key", kind: "text" },
    UPDATED_COL,
  ],
  summary: ["key", "label", "shortLabel", "title", "description"],
  public: { defaultLimit: 50 },
};

const productHero = f.object("Hero", {
  breadcrumb: f.l("Breadcrumb"),
  title: f.l("Judul", { required: true, multiline: true }),
  description: f.lt("Deskripsi"),
  primaryButton: f.l("Label tombol utama"),
  secondaryButton: f.l("Label tombol kedua"),
  image: f.media("Gambar", { help: "Template blocks." }),
  imageAlt: f.l("Alt gambar"),
  statsCaption: f.l("Keterangan statistik", { help: "Template classic." }),
  stats: f.array("Statistik", statFields, { itemLabel: "label", help: "Template classic." }),
});

const productClassic = f.object(
  "Konten template classic",
  {
    overview: f.object("Overview", {
      title: f.l("Judul"),
      paragraphs: f.llist("Paragraf"),
      image: f.media("Gambar"),
      challenges: f.array("Tantangan", iconCardFields, { itemLabel: "title" }),
    }),
    lifecycle: f.object("Lifecycle", {
      title: f.l("Judul"),
      description: f.lt("Deskripsi"),
      items: f.array(
        "Item",
        { label: f.l("Label"), title: f.l("Judul", { required: true }), description: f.lt("Deskripsi"), image: f.media("Gambar") },
        { itemLabel: "title" },
      ),
    }),
    features: f.object("Fitur", {
      title: f.l("Judul"),
      items: f.array(
        "Fitur",
        { title: f.l("Judul", { required: true }), description: f.lt("Deskripsi"), image: f.media("Gambar") },
        { itemLabel: "title" },
      ),
    }),
    howItWorks: f.object("How it works", {
      title: f.l("Judul"),
      items: f.array(
        "Item",
        { label: f.l("Label"), title: f.l("Judul", { required: true }), description: f.lt("Deskripsi"), image: f.media("Gambar") },
        { itemLabel: "title" },
      ),
    }),
    businessModels: f.object("Model bisnis", {
      title: f.l("Judul"),
      items: f.array("Item", { icon: f.icon(), title: f.l("Judul", { required: true }), points: f.llist("Poin") }, { itemLabel: "title" }),
    }),
  },
  { nullable: true, showIf: { field: "template", equals: "CLASSIC" } },
);

const products: CollectionDef = {
  type: "products",
  model: "product",
  label: "Produk",
  singular: "Produk",
  group: "Produk & Solusi",
  icon: "Package",
  fields: {
    name: f.text("Nama produk", { required: true, help: "Nama merek, tidak diterjemahkan." }),
    slug: f.slug(),
    tagline: f.l("Tagline", { required: true, placeholder: "Enterprise Resource Planning" }),
    shortDescription: f.lt("Deskripsi singkat", { required: true }),
    cardImageId: f.media("Gambar kartu", { required: true }),
    homeCategoryId: f.ref("Kategori filter Home", "terms", { vocabulary: "PRODUCT_CATEGORY" }),
    featuredOnHome: f.bool("Tampilkan di Home", {
      help: "Aktifkan agar produk ini muncul di section Produk pada halaman Home. Tab tempat produk tampil mengikuti \"Kategori filter Home\" di atas.",
    }),
    template: f.select(
      "Template",
      [
        { value: "BLOCKS", label: "Blocks (page builder)" },
        { value: "CLASSIC", label: "Classic" },
        { value: "LEGACY_API", label: "Legacy API (Auxoshift)" },
      ],
      { required: true, default: "BLOCKS" },
    ),
    hero: productHero,
    sections: { ...sections(), showIf: { field: "template", equals: "BLOCKS" } },
    classic: productClassic,
    legacy: f.json("Data legacy (JSON)", {
      showIf: { field: "template", equals: "LEGACY_API" },
      help: "Struktur API lama Auxoshift. Disarankan migrasi ke template Blocks.",
    }),
    faq: faq(),
    cta: cta(),
    seo: seo({ required: true }),
    searchKeywords: f.l("Kata kunci pencarian"),
  },
  titleField: "name",
  slugField: "slug",
  slugFrom: "name",
  hasStatus: true,
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["name", "slug", "tagline", "searchKeywords"],
  columns: [
    { path: "cardImage", label: "Gambar", kind: "media" },
    { path: "name", label: "Nama", kind: "text" },
    { path: "template", label: "Template", kind: "enum" },
    STATUS_COL,
    UPDATED_COL,
  ],
  listInclude: { cardImage: true },
  summary: ["slug", "name", "tagline", "shortDescription", "cardImageId"],
  previewPath: "/product/{slug}",
  public: {
    defaultLimit: 50,
    filters: [
      { param: "category", field: "categories", kind: "joinKey" },
      { param: "homeCategory", field: "homeCategory", kind: "relKey" },
      { param: "featured", field: "featuredOnHome", kind: "bool" },
    ],
  },
};

const solutions: CollectionDef = {
  type: "solutions",
  model: "solution",
  label: "Solusi",
  singular: "Solusi",
  group: "Produk & Solusi",
  icon: "Lightbulb",
  fields: {
    menuLabel: f.l("Label menu", { required: true }),
    slug: f.slug(),
    menuIcon: f.icon("Ikon menu"),
    template: f.select(
      "Template",
      [
        { value: "BLOCKS", label: "Blocks (page builder)" },
        { value: "SOC", label: "SOC" },
      ],
      { required: true, default: "BLOCKS" },
    ),
    hero: f.object("Hero", {
      breadcrumb: f.l("Breadcrumb"),
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul", { required: true, multiline: true }),
      description: f.lt("Deskripsi"),
      primaryButton: f.l("Label tombol utama"),
      secondaryButton: f.l("Label tombol kedua"),
      image: f.media("Gambar"),
    }),
    sections: { ...sections(), showIf: { field: "template", equals: "BLOCKS" } },
    soc: f.object(
      "Konten template SOC",
      {
        challenge: f.object("Challenge", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array(
            "Item",
            {
              label: f.l("Label"),
              title: f.l("Judul", { required: true }),
              paragraphs: f.llist("Paragraf"),
              solution: f.object("Solusi", textItemFields),
              image: f.media("Gambar"),
            },
            { itemLabel: "title" },
          ),
        }),
        definition: f.object("Definisi", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array(
            "Item",
            {
              label: f.l("Label"),
              tag: f.l("Tag"),
              title: f.l("Judul", { required: true }),
              description: f.lt("Deskripsi"),
              pillars: f.llist("Pilar"),
            },
            { itemLabel: "title" },
          ),
        }),
        howItWorks: f.object("How it works", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array("Tab", tabPanelItemFields, { itemLabel: "label" }),
        }),
        why: f.object("Why", { title: f.l("Judul"), items: f.array("Item", iconCardFields, { itemLabel: "title" }) }),
      },
      { nullable: true, showIf: { field: "template", equals: "SOC" } },
    ),
    clients: f.ref("Klien", "clients", { multiple: true }),
    faq: faq(),
    cta: cta(),
    seo: seo({ required: true }),
    searchKeywords: f.l("Kata kunci pencarian"),
  },
  titleField: "menuLabel",
  slugField: "slug",
  slugFrom: "menuLabel",
  hasStatus: true,
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["menuLabel", "slug", "searchKeywords"],
  columns: [
    { path: "menuLabel", label: "Nama", kind: "l" },
    { path: "slug", label: "Slug", kind: "text" },
    { path: "template", label: "Template", kind: "enum" },
    STATUS_COL,
    UPDATED_COL,
  ],
  summary: ["slug", "menuLabel", "menuIcon"],
  previewPath: "/solution/{slug}",
  public: { defaultLimit: 50 },
};

const industries: CollectionDef = {
  type: "industries",
  model: "industry",
  label: "Industri",
  singular: "Industri",
  group: "Produk & Solusi",
  icon: "Factory",
  fields: {
    menuLabel: f.l("Label menu", { required: true }),
    slug: f.slug(),
    menuIcon: f.icon("Ikon menu"),
    template: f.select(
      "Template",
      [
        { value: "BLOCKS", label: "Blocks (page builder)" },
        { value: "AVIATION", label: "Aviation" },
      ],
      { required: true, default: "BLOCKS" },
    ),
    hero: f.object("Hero", {
      breadcrumb: f.l("Breadcrumb"),
      eyebrow: f.l("Eyebrow"),
      title: f.l("Judul", { required: true, multiline: true }),
      description: f.lt("Deskripsi"),
      primaryButton: f.l("Label tombol utama"),
      secondaryButton: f.l("Label tombol kedua"),
      stats: f.array("Statistik", statFields, { itemLabel: "label" }),
    }),
    sections: { ...sections(), showIf: { field: "template", equals: "BLOCKS" } },
    aviation: f.object(
      "Konten template Aviation",
      {
        overview: f.object("Overview", { title: f.l("Judul"), paragraphs: f.llist("Paragraf"), image: f.media("Gambar") }),
        challenges: f.object("Tantangan", {
          title: f.l("Judul"),
          items: f.array(
            "Item",
            {
              label: f.l("Label"),
              title: f.l("Judul", { required: true }),
              description: f.lt("Deskripsi"),
              points: f.llist("Poin"),
              image: f.media("Gambar"),
            },
            { itemLabel: "title" },
          ),
        }),
        layers: f.object("Layer", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array(
            "Layer",
            {
              label: f.l("Label", { required: true }),
              description: f.lt("Deskripsi"),
              capabilities: f.llist("Kapabilitas"),
              value: f.l("Value", { multiline: true }),
              image: f.media("Gambar", { help: "Opsional. Kosongkan untuk memakai gambar bawaan website." }),
            },
            { itemLabel: "label" },
          ),
        }),
        valueChain: f.object("Value chain", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          steps: f.array(
            "Langkah",
            { label: f.l("Label", { required: true }), title: f.l("Judul"), points: f.llist("Poin") },
            { itemLabel: "label" },
          ),
        }),
        domains: f.object("Domain", {
          title: f.l("Judul"),
          items: f.array(
            "Domain",
            {
              title: f.l("Judul", { required: true }),
              description: f.lt("Deskripsi"),
              points: f.llist("Poin"),
              popover: f.object("Popover", { title: f.l("Judul"), points: f.llist("Poin") }, { nullable: true }),
            },
            { itemLabel: "title" },
          ),
        }),
        products: f.object("Produk", { title: f.l("Judul"), paragraphs: f.llist("Paragraf"), image: f.media("Gambar") }),
        solutions: f.object("Solusi", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array("Kartu", industryCardFields, { itemLabel: "title" }),
        }),
        connect: f.object("Connect", {
          title: f.l("Judul"),
          description: f.lt("Deskripsi"),
          items: f.array("Tab", tabPanelItemFields, { itemLabel: "label" }),
        }),
        priorities: f.object("Prioritas", {
          title: f.l("Judul"),
          items: f.array("Item", { title: f.l("Judul", { required: true }), points: f.llist("Poin") }, { itemLabel: "title" }),
          matrixColumns: f.llist("Kolom matriks"),
          matrixRows: f.array(
            "Baris matriks",
            {
              label: f.l("Label", { required: true }),
              values: f.text("Nilai per kolom", { help: "Isi 1/0 per kolom, dipisah koma. Contoh: 1,0,1" }),
            },
            { itemLabel: "label" },
          ),
        }),
      },
      { nullable: true, showIf: { field: "template", equals: "AVIATION" } },
    ),
    faq: faq(),
    cta: cta(),
    seo: seo({ required: true }),
    searchKeywords: f.l("Kata kunci pencarian"),
  },
  titleField: "menuLabel",
  slugField: "slug",
  slugFrom: "menuLabel",
  hasStatus: true,
  orderable: true,
  sort: { field: "order", dir: "asc" },
  searchFields: ["menuLabel", "slug", "searchKeywords"],
  columns: [
    { path: "menuLabel", label: "Nama", kind: "l" },
    { path: "slug", label: "Slug", kind: "text" },
    { path: "template", label: "Template", kind: "enum" },
    STATUS_COL,
    UPDATED_COL,
  ],
  summary: ["slug", "menuLabel", "menuIcon"],
  previewPath: "/industry/{slug}",
  public: { defaultLimit: 50 },
};

export const COLLECTIONS: CollectionDef[] = [
  news,
  authors,
  jobs,
  caseStudies,
  products,
  productCategories,
  solutions,
  industries,
  clients,
  testimonials,
  awards,
  leaders,
  offices,
  terms,
  pageSeo,
];

export const COLLECTION_MAP: Record<string, CollectionDef> = Object.fromEntries(COLLECTIONS.map((c) => [c.type, c]));

export function getCollection(type: string): CollectionDef | undefined {
  return COLLECTION_MAP[type];
}
