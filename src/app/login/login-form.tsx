"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && (
            <Alert color="danger" title="Gagal masuk" dismissible={false}>
              {state.error}
            </Alert>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending && <Spinner size="xs" className="text-current" label="Memproses" />}
            Masuk
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
