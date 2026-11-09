"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ChoiceField } from "@/components/admin/form/choice-field";
import { createUserAction, deleteUserAction, updateUserAction } from "@/server/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type RoleOption = { key: string; name: string; isSuperAdmin: boolean };
type FormValues = { name: string; email: string; roleKey: string; isActive: boolean; password: string };

function UserDialog({
  user,
  roles,
  meIsSuperAdmin,
  open,
  onOpenChange,
}: {
  user: UserRow | null;
  roles: RoleOption[];
  meIsSuperAdmin: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<FormValues>({
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      // Pengguna baru: role dipilih eksplisit (tidak ada role bawaan).
      roleKey: user?.roleKey ?? "",
      isActive: user?.isActive ?? true,
      password: "",
    },
  });
  const { register, handleSubmit, setError, formState, setValue, control } = form;
  const isActive = useWatch({ control, name: "isActive" });
  const roleKey = useWatch({ control, name: "roleKey" });

  const submit = handleSubmit((values) =>
    start(async () => {
      const res = user ? await updateUserAction(user.id, values) : await createUserAction(values);
      if (!res.ok) {
        for (const [k, v] of Object.entries(res.fieldErrors ?? {})) setError(k as keyof FormValues, { message: v });
        toast.error(res.error);
        return;
      }
      toast.success(user ? "Pengguna diperbarui" : "Pengguna dibuat");
      onOpenChange(false);
      router.refresh();
    }),
  );

  const err = (k: keyof FormValues) =>
    formState.errors[k]?.message ? <p className="text-xs text-destructive">{formState.errors[k]?.message}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit pengguna" : "Pengguna baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nama</Label>
            <Input id="u-name" {...register("name", { required: "Nama wajib diisi" })} />
            {err("name")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" {...register("email", { required: "Email wajib diisi" })} />
            {err("email")}
          </div>
          <div className="space-y-1.5">
            <Label id="u-role-label">Role</Label>
            <ChoiceField
              id="u-role"
              ariaLabel="Role"
              value={roleKey}
              onChange={(v) => setValue("roleKey", v, { shouldDirty: true, shouldValidate: true })}
              options={roles.map((r) => ({
                value: r.key,
                label: r.name,
                disabled: r.isSuperAdmin && !meIsSuperAdmin,
              }))}
            />
            <input type="hidden" {...register("roleKey", { required: "Pilih role" })} />
            {err("roleKey")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-password">{user ? "Password baru (opsional)" : "Password"}</Label>
            <Input
              id="u-password"
              type="password"
              autoComplete="new-password"
              {...register("password", user ? {} : { required: "Password wajib diisi" })}
            />
            {err("password")}
            <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={isActive} onCheckedChange={(v) => setValue("isActive", v)} />
            Akun aktif
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner size="xs" className="text-current" label="Memproses" />} Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManager({
  users,
  roles,
  meId,
  meIsSuperAdmin,
  can,
}: {
  users: UserRow[];
  roles: RoleOption[];
  meId: string;
  meIsSuperAdmin: boolean;
  can: { create: boolean; update: boolean; delete: boolean };
}) {
  const roleName = new Map(roles.map((r) => [r.key, r.name]));
  const router = useRouter();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      {can.create && (
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Tambah pengguna
        </Button>
      </div>
      )}
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Login terakhir</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">
                    {u.name} {u.id === meId && <span className="text-xs text-muted-foreground">(Anda)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <Badge color={u.isSuperAdmin ? "primary" : "neutral"} variant="light">
                    {roleName.get(u.roleKey) ?? u.roleKey}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{u.isActive ? "Aktif" : <span className="text-muted-foreground">Nonaktif</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {can.update && (meIsSuperAdmin || !u.isSuperAdmin) && (
                    <Button
                      size="icon-sm"
                      color="neutral" variant="tertiary"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(u);
                        setOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    )}
                    {can.delete && (meIsSuperAdmin || !u.isSuperAdmin) && u.id !== meId && (
                      <ConfirmButton
                        size="icon-sm"
                        color="danger" variant="tertiary"
                        aria-label="Hapus"
                        title={`Hapus ${u.name}?`}
                        description="Akun akan dihapus permanen. Pertimbangkan menonaktifkan saja."
                        confirmLabel="Hapus"
                        onConfirm={async () => {
                          const res = await deleteUserAction(u.id);
                          if (!res.ok) return void toast.error(res.error);
                          toast.success("Pengguna dihapus");
                          router.refresh();
                        }}
                      >
                        <Trash2 />
                      </ConfirmButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <UserDialog user={editing} roles={roles} meIsSuperAdmin={meIsSuperAdmin} open={open} onOpenChange={setOpen} />
    </>
  );
}
