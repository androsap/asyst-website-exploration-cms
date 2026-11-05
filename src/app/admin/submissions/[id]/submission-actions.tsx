"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { nativeSelectClass } from "@/components/admin/form/field-shell";
import { deleteSubmissionAction, updateSubmissionAction } from "@/server/actions/submissions";

export function SubmissionActions({
  id,
  status: initialStatus,
  notes: initialNotes,
  canDelete,
}: {
  id: string;
  status: string;
  notes: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [pending, start] = useTransition();

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle className="text-subtitle-sm">Tindak lanjut</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" className={nativeSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="NEW">Baru</option>
            <option value="IN_PROGRESS">Diproses</option>
            <option value="CLOSED">Selesai</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Catatan internal</Label>
          <Textarea id="notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateSubmissionAction(id, { status, notes });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Disimpan");
              router.refresh();
            })
          }
        >
          {pending && <Spinner size="xs" className="text-current" label="Memproses" />} Simpan
        </Button>
        {canDelete && (
          <ConfirmButton
            color="danger" variant="tertiary"
            size="sm"
            className="w-full"
            title="Hapus kiriman ini?"
            confirmLabel="Hapus"
            onConfirm={async () => {
              const res = await deleteSubmissionAction(id);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Dihapus");
              router.replace("/admin/submissions");
            }}
          >
            <Trash2 /> Hapus
          </ConfirmButton>
        )}
      </CardContent>
    </Card>
  );
}
