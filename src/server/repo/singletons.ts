import { Prisma } from "@/generated/prisma/client";
import type { SingletonKey } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { withDefaults } from "@/content/fields";
import { getSingleton, type SingletonDef } from "@/content/singletons";
import { sanitizeFields } from "./sanitize";
import { ValidationError, validateValues } from "./collections";

export function mustSingleton(slug: string): SingletonDef {
  const def = getSingleton(slug);
  if (!def) throw new ValidationError(`Singleton tidak dikenal: ${slug}`);
  return def;
}

export async function loadSingleton(def: SingletonDef) {
  const row = await prisma.singleton.findUnique({ where: { key: def.key as SingletonKey } });
  const draft = withDefaults(def.fields, row?.draft ?? {});
  const published = row?.published ? withDefaults(def.fields, row.published) : null;
  const dirty = !row?.published || JSON.stringify(row.draft) !== JSON.stringify(row.published);
  return { row, draft, published, dirty };
}

/** Simpan draft; bila `publish` atau singleton tidak memakai draft, langsung terbit. */
export async function saveSingleton(def: SingletonDef, input: unknown, userId: string | null, publish: boolean) {
  const values = sanitizeFields(def.fields, validateValues(def.fields, input));
  const json = values as Prisma.InputJsonValue;
  const goLive = publish || !def.draftable;
  const key = def.key as SingletonKey;
  return prisma.singleton.upsert({
    where: { key },
    create: { key, draft: json, published: goLive ? json : Prisma.DbNull, publishedAt: goLive ? new Date() : null, updatedById: userId },
    update: { draft: json, ...(goLive ? { published: json, publishedAt: new Date() } : {}), updatedById: userId },
  });
}

/** Kembalikan draft ke versi terbit. */
export async function discardSingletonDraft(def: SingletonDef) {
  const key = def.key as SingletonKey;
  const row = await prisma.singleton.findUnique({ where: { key } });
  if (!row?.published) throw new ValidationError("Belum ada versi terbit.");
  return prisma.singleton.update({ where: { key }, data: { draft: row.published as Prisma.InputJsonValue } });
}

export async function unpublishSingleton(def: SingletonDef) {
  const key = def.key as SingletonKey;
  return prisma.singleton.update({ where: { key }, data: { published: Prisma.DbNull, publishedAt: null } });
}
