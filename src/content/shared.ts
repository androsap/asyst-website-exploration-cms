import { f, type Fields } from "./fields";

// Tipe bersama (CONTENT_SCHEMA §2.2)

export const linkFields: Fields = {
  label: f.l("Label"),
  type: f.select(
    "Jenis link",
    [
      { value: "internal", label: "Internal" },
      { value: "external", label: "Eksternal" },
      { value: "action", label: "Aksi (buka modal / scroll)" },
    ],
    { default: "internal" },
  ),
  href: f.text("URL / path", { placeholder: "/product/amala atau https://…" }),
  action: f.select(
    "Aksi",
    [
      { value: "ask-asyst", label: "Buka modal Ask ASYST" },
      { value: "scroll-to", label: "Scroll ke section" },
    ],
    { showIf: { field: "type", equals: "action" } },
  ),
  newTab: f.bool("Buka di tab baru"),
};

export const link = (label = "Link", o: { required?: boolean } = {}) => f.object(label, linkFields, o);

export const sectionHeadingFields: Fields = {
  eyebrow: f.l("Eyebrow"),
  title: f.l("Judul", { required: true, help: "Gunakan baris baru untuk memecah judul." , multiline: true }),
  description: f.lt("Deskripsi"),
};
export const heading = (label = "Judul section") => f.object(label, sectionHeadingFields);

export const textItemFields: Fields = {
  title: f.l("Judul", { required: true }),
  description: f.lt("Deskripsi"),
};

export const iconCardFields: Fields = {
  icon: f.icon(),
  title: f.l("Judul", { required: true }),
  description: f.lt("Deskripsi"),
  tag: f.l("Tag"),
};

export const statFields: Fields = {
  icon: f.icon(),
  value: f.l("Nilai", { required: true, help: "Boleh teks, mis. \"Enterprise\"." }),
  label: f.l("Label", { required: true }),
};

export const faqItemFields: Fields = {
  question: f.l("Pertanyaan", { required: true }),
  answer: f.lt("Jawaban", { required: true }),
};

export const faq = (label = "FAQ") =>
  f.object(label, {
    title: f.l("Judul"),
    items: f.array("Pertanyaan", faqItemFields, { itemLabel: "question" }),
  });

export const ctaFields: Fields = {
  title: f.l("Judul"),
  description: f.lt("Deskripsi"),
  buttonLabel: f.l("Label tombol", { help: "Tombol membuka modal Ask ASYST." }),
};
export const cta = (label = "CTA banner") => f.object(label, ctaFields);

export const seo = (o: { required?: boolean } = {}) =>
  f.object("SEO", {
    title: f.l("Meta title", {
      required: o.required,
      help: "Frontend menambahkan sufiks \"| PT Aero Systems Indonesia\".",
    }),
    description: f.lt("Meta description", { required: o.required }),
    ogImage: f.media("OG image"),
    noIndex: f.bool("noindex (jangan diindeks mesin pencari)"),
  });

export const tabPanelItemFields: Fields = {
  label: f.l("Label tab", { required: true }),
  title: f.l("Judul"),
  description: f.lt("Deskripsi"),
  points: f.llist("Poin"),
  subtitle: f.l("Subjudul"),
  subPoints: f.llist("Sub-poin"),
  tags: f.llist("Tag"),
  image: f.media("Gambar"),
};

export const industryCardFields: Fields = {
  tag: f.l("Tag"),
  title: f.l("Judul", { required: true }),
  description: f.lt("Deskripsi"),
  chips: f.llist("Chip"),
  link: link(),
  image: f.media("Gambar"),
  industry: f.ref("Halaman industri", "industries"),
};

export const labelValueFields: Fields = {
  label: f.l("Label", { required: true }),
  value: f.l("Nilai", { multiline: true }),
};
