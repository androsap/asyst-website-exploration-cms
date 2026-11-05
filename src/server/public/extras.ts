/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Lang } from "@/lib/i18n";
import type { SingletonDef } from "@/content/singletons";
import { fetchSerialized } from "./query";

// Data collection yang otomatis disisipkan ke respons singleton,
// supaya frontend cukup satu request per halaman.

type Data = Record<string, any>;

function section(data: Data, key: string): Data {
  if (!data[key] || typeof data[key] !== "object") data[key] = {};
  return data[key];
}

const EXTRAS: Record<string, (data: Data, lang: Lang, preview: boolean) => Promise<void>> = {
  offices: async (data, lang, preview) => {
    const offices = await fetchSerialized("offices", lang, preview);
    if ("postalAddress" in data) data.offices = offices; // site-settings
    else section(data, "offices").items = offices; // contact
  },
  awards: async (data, lang, preview) => {
    section(data, "awards").items = await fetchSerialized("awards", lang, preview);
  },
  trustedClients: async (data, lang, preview) => {
    section(data, "trustedBy").items = await fetchSerialized("clients", lang, preview, {
      where: { placements: { array_contains: ["HOME_TRUSTED"] } },
    });
  },
  latestNews: async (data, lang, preview) => {
    const news = section(data, "news");
    news.items = await fetchSerialized("news", lang, preview, { take: Number(news.limit) || 3 });
  },
  leaders: async (data, lang, preview) => {
    section(data, "leaders").items = await fetchSerialized("leaders", lang, preview);
  },
  aboutClients: async (data, lang, preview) => {
    section(data, "clients").items = await fetchSerialized("clients", lang, preview, {
      where: { placements: { array_contains: ["ABOUT"] } },
    });
  },
  latestJobs: async (data, lang, preview) => {
    const opp = section(data, "opportunity");
    opp.items = await fetchSerialized("jobs", lang, preview, { take: Number(opp.limit) || 6 });
  },
};

export async function applyExtras(def: SingletonDef, data: Data, lang: Lang, preview: boolean) {
  await Promise.all((def.extras ?? []).map((name) => EXTRAS[name]?.(data, lang, preview)));
  if (def.slug === "ui-strings" && Array.isArray(data.entries)) {
    data.strings = Object.fromEntries(data.entries.map((e: { key: string; value: string }) => [e.key, e.value]));
  }
}
