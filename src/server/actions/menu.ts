"use server";

import { revalidatePath } from "next/cache";
import { menuConfigSchema, normalizeMenu } from "@/lib/admin-menu";
import { prisma } from "@/lib/prisma";
import { listAdminModules, MENU_SETTING_KEY, requireModule } from "@/server/admin-menu";
import { ValidationError } from "@/server/repo/collections";
import { run } from "./result";

export async function saveMenuAction(input: unknown) {
  return run(async () => {
    const me = await requireModule("sys:menu", "update");
    const parsed = menuConfigSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new ValidationError(issue?.message && issue.code === "custom" ? issue.message : "Struktur menu tidak valid.");
    }
    const ids = parsed.data.groups.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]);
    if (new Set(ids).size !== ids.length) throw new ValidationError("ID grup/item duplikat.");
    const value = normalizeMenu(parsed.data, listAdminModules());
    await prisma.adminSetting.upsert({
      where: { key: MENU_SETTING_KEY },
      create: { key: MENU_SETTING_KEY, value, updatedById: me.id },
      update: { value, updatedById: me.id },
    });
    revalidatePath("/admin", "layout");
  });
}

export async function resetMenuAction() {
  return run(async () => {
    await requireModule("sys:menu", "update");
    await prisma.adminSetting.deleteMany({ where: { key: MENU_SETTING_KEY } });
    revalidatePath("/admin", "layout");
  });
}
