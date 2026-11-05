"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/session";
import { run } from "./result";

const schema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]),
  notes: z.string().max(5000).optional(),
});

export async function updateSubmissionAction(id: string, input: unknown) {
  return run(async () => {
    await requireUser();
    const data = schema.parse(input);
    await prisma.formSubmission.update({ where: { id }, data });
    revalidatePath("/admin/submissions", "layout");
  });
}

export async function deleteSubmissionAction(id: string) {
  return run(async () => {
    await requireUser("ADMIN");
    await prisma.formSubmission.delete({ where: { id } });
    revalidatePath("/admin/submissions", "layout");
  });
}
