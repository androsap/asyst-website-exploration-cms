import { f, type BlockDef, type Fields } from "./fields";
import { iconCardFields, industryCardFields, link, textItemFields } from "./shared";

// Katalog blok page builder (CONTENT_SCHEMA §3.M). Dipakai bersama oleh Produk, Solusi, Industri.

const title = () => f.l("Judul", { required: true, multiline: true });
const desc = () => f.lt("Deskripsi");
const paragraphs = () => f.llist("Paragraf", { help: "Satu paragraf per baris." });
const image = () => f.media("Gambar");
const mediaFirst = () => f.bool("Gambar di kiri (media first)");

const cardItem: Fields = {
  title: f.l("Judul", { required: true }),
  description: f.lt("Deskripsi"),
  tag: f.l("Tag"),
  icon: f.icon(),
};

const groupItem: Fields = {
  title: f.l("Judul grup", { required: true }),
  items: f.llist("Item"),
};

export const BLOCKS: Record<string, BlockDef> = {
  intro: {
    label: "Intro",
    description: "Solusi, Industri",
    fields: { title: title(), paragraphs: paragraphs(), image: image() },
  },
  challenge: {
    label: "Challenge",
    description: "Produk",
    fields: {
      title: title(),
      paragraphs: paragraphs(),
      lead: f.lt("Lead"),
      items: f.array("Item", cardItem, { itemLabel: "title" }),
    },
  },
  overview: {
    label: "Overview",
    description: "Produk",
    fields: {
      title: title(),
      paragraphs: paragraphs(),
      points: f.llist("Poin"),
      closing: f.lt("Penutup"),
      image: image(),
      cards: f.array("Kartu", cardItem, { itemLabel: "title" }),
    },
  },
  flow: {
    label: "Flow",
    description: "Produk",
    fields: {
      title: title(),
      description: desc(),
      steps: f.array(
        "Langkah",
        { label: f.l("Label"), icon: f.icon(), title: f.l("Judul", { required: true }), description: desc(), image: image() },
        { itemLabel: "title" },
      ),
    },
  },
  timeline: {
    label: "Timeline",
    description: "Produk, Solusi",
    fields: {
      layout: f.select("Layout", ["band", "split"], { default: "band" }),
      mediaFirst: mediaFirst(),
      title: title(),
      description: desc(),
      image: image(),
      items: f.array(
        "Item",
        { title: f.l("Judul", { required: true }), lead: f.l("Lead"), description: desc() },
        { itemLabel: "title" },
      ),
    },
  },
  capabilities: {
    label: "Capabilities",
    description: "Produk",
    fields: {
      heading: f.select("Posisi judul", ["top", "column"], { default: "top" }),
      mediaFirst: mediaFirst(),
      title: title(),
      description: desc(),
      image: image(),
      items: f.array(
        "Kapabilitas",
        {
          title: f.l("Judul", { required: true }),
          description: desc(),
          highlight: f.bool("Highlight"),
          points: f.llist("Poin"),
          icon: f.icon(),
        },
        { itemLabel: "title" },
      ),
    },
  },
  architecture: {
    label: "Architecture",
    description: "Produk",
    fields: {
      mediaFirst: mediaFirst(),
      title: title(),
      description: desc(),
      tabs: f.array(
        "Tab",
        {
          label: f.l("Label tab", { required: true }),
          title: f.l("Judul"),
          paragraphs: paragraphs(),
          points: f.llist("Poin"),
          groups: f.array("Grup", groupItem, { itemLabel: "title" }),
          roles: f.array("Peran", textItemFields, { itemLabel: "title" }),
          image: image(),
        },
        { itemLabel: "label" },
      ),
    },
  },
  expertise: {
    label: "Expertise",
    description: "Produk",
    fields: { title: title(), description: desc(), items: f.array("Item", iconCardFields, { itemLabel: "title" }) },
  },
  cards: {
    label: "Cards",
    description: "Solusi, Industri",
    fields: {
      heading: f.select("Posisi judul", ["center", "split"], { default: "center" }),
      title: title(),
      description: desc(),
      columns: f.select("Kolom", ["3", "4"], { default: "3" }),
      soft: f.bool("Gaya soft"),
      connected: f.bool("Terhubung (connected)"),
      items: f.array(
        "Kartu",
        {
          ...cardItem,
          points: f.llist("Poin"),
          groups: f.array(
            "Grup",
            { label: f.l("Label", { required: true }), text: f.lt("Teks"), points: f.llist("Poin") },
            { itemLabel: "label" },
          ),
          footnote: f.l("Catatan kaki"),
          image: image(),
        },
        { itemLabel: "title" },
      ),
    },
  },
  matrix: {
    label: "Matrix",
    description: "Solusi",
    fields: {
      title: title(),
      description: desc(),
      items: f.array(
        "Item",
        { title: f.l("Judul", { required: true }), description: desc(), icon: f.icon(), points: f.llist("Poin") },
        { itemLabel: "title" },
      ),
    },
  },
  carousel: {
    label: "Carousel",
    description: "Solusi",
    fields: {
      title: title(),
      description: desc(),
      items: f.array("Slide", { title: f.l("Judul", { required: true }), description: desc(), image: image() }, { itemLabel: "title" }),
    },
  },
  steps: {
    label: "Steps",
    description: "Solusi",
    fields: {
      title: title(),
      description: desc(),
      image: image(),
      items: f.array(
        "Langkah",
        {
          label: f.l("Label", { required: true }),
          title: f.l("Judul"),
          description: desc(),
          groups: f.array("Grup", groupItem, { itemLabel: "title" }),
        },
        { itemLabel: "label" },
      ),
    },
  },
  tabs: {
    label: "Tabs",
    description: "Solusi",
    fields: {
      variant: f.select("Varian", ["pill", "boxed"], { default: "pill" }),
      title: title(),
      description: desc(),
      items: f.array(
        "Tab",
        {
          label: f.l("Label tab", { required: true }),
          title: f.l("Judul"),
          paragraphs: paragraphs(),
          subtitle: f.l("Subjudul"),
          points: f.llist("Poin"),
          image: image(),
        },
        { itemLabel: "label" },
      ),
    },
  },
  list: {
    label: "List",
    description: "Solusi",
    fields: {
      layout: f.select("Layout", ["stacked", "aside"], { default: "stacked" }),
      title: title(),
      paragraphs: paragraphs(),
      image: image(),
      items: f.array("Item", textItemFields, { itemLabel: "title" }),
    },
  },
  highlights: {
    label: "Highlights",
    description: "Industri",
    fields: {
      columns: f.select("Kolom", ["3", "4"], { default: "3" }),
      items: f.array("Item", { title: f.l("Judul", { required: true }), description: desc(), icon: f.icon() }, { itemLabel: "title" }),
    },
  },
  features: {
    label: "Features",
    description: "Industri",
    fields: {
      layout: f.select("Layout", ["inline", "stacked"], { default: "inline" }),
      columns: f.select("Kolom", ["2", "3", "4"], { default: "3" }),
      title: title(),
      description: desc(),
      items: f.array("Item", iconCardFields, { itemLabel: "title" }),
    },
  },
  ecosystem: {
    label: "Ecosystem",
    description: "Industri",
    fields: {
      title: title(),
      description: desc(),
      items: f.array("Item", { title: f.l("Judul", { required: true }), points: f.llist("Poin") }, { itemLabel: "title" }),
    },
  },
  showcase: {
    label: "Showcase",
    description: "Industri",
    fields: {
      title: title(),
      items: f.array(
        "Item",
        { title: f.l("Judul", { required: true }), description: desc(), icon: f.icon(), link: link(), image: image() },
        { itemLabel: "title" },
      ),
    },
  },
  challenges: {
    label: "Challenges",
    description: "Industri",
    fields: {
      title: title(),
      description: desc(),
      items: f.array(
        "Item",
        { title: f.l("Judul", { required: true }), description: desc(), link: link(), image: image(), wide: f.bool("Lebar penuh") },
        { itemLabel: "title" },
      ),
    },
  },
  slider: {
    label: "Slider",
    description: "Industri",
    fields: {
      title: title(),
      items: f.array(
        "Slide",
        { title: f.l("Judul", { required: true }), description: desc(), link: link(), image: image() },
        { itemLabel: "title" },
      ),
    },
  },
  values: {
    label: "Values",
    description: "Industri",
    fields: { title: title(), image: image(), items: f.array("Item", textItemFields, { itemLabel: "title" }) },
  },
  process: {
    label: "Process",
    description: "Industri",
    fields: {
      aside: f.object("Aside", { title: f.l("Judul"), paragraphs: paragraphs(), image: image() }),
      title: title(),
      items: f.array("Item", textItemFields, { itemLabel: "title" }),
    },
  },
  filter: {
    label: "Filter",
    description: "Industri",
    fields: {
      title: f.l("Judul", { multiline: true }),
      description: desc(),
      items: f.array("Kartu industri", industryCardFields, { itemLabel: "title" }),
    },
  },
};

export const sections = (label = "Sections (page builder)") => f.blocks(label, BLOCKS);
