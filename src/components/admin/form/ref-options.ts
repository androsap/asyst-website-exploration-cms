"use client";

import { useEffect, useState } from "react";
import { refOptionsAction } from "@/server/actions/content";
import type { RefOption } from "@/server/repo/collections";

const cache = new Map<string, Promise<RefOption[]>>();

export function invalidateRefOptions(target?: string) {
  for (const k of [...cache.keys()]) if (!target || k.startsWith(`${target}|`)) cache.delete(k);
}

/** Opsi relasi (dibagi antar field dengan target yang sama). */
export function useRefOptions(target: string, vocabulary?: string) {
  const key = `${target}|${vocabulary ?? ""}`;
  const [state, setState] = useState<{ key: string; options: RefOption[] | null; error?: string }>({ key, options: null });

  useEffect(() => {
    let alive = true;
    let p = cache.get(key);
    if (!p) {
      p = refOptionsAction(target, vocabulary).then((r) => {
        if (!r.ok) throw new Error(r.error);
        return r.data;
      });
      cache.set(key, p);
    }
    p.then(
      (options) => alive && setState({ key, options }),
      (e: Error) => {
        cache.delete(key);
        if (alive) setState({ key, options: [], error: e.message });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, target, vocabulary]);

  return state.key === key ? state : { key, options: null };
}
