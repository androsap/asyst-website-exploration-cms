"use client";

import { useEffect, useState } from "react";
import { getMediaManyAction, type MediaItem } from "@/server/actions/media";

// Cache media di sisi client agar thumbnail tidak diambil berulang.
const cache = new Map<string, MediaItem>();
const listeners = new Set<() => void>();
let pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

export function putMedia(item: MediaItem) {
  cache.set(item.id, item);
  listeners.forEach((l) => l());
}

function flush() {
  timer = null;
  const ids = [...pending];
  pending = new Set();
  if (!ids.length) return;
  void getMediaManyAction(ids).then((res) => {
    if (res.ok) res.data.forEach((m) => cache.set(m.id, m));
    listeners.forEach((l) => l());
  });
}

/** Ambil detail media berdasarkan id (dibatch dalam satu request). */
export function useMediaItems(ids: (string | null | undefined)[]): Record<string, MediaItem | undefined> {
  const [, force] = useState(0);
  const key = ids.filter(Boolean).join(",");

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    let added = false;
    for (const id of key.split(",")) {
      if (id && !cache.has(id) && !pending.has(id)) {
        pending.add(id);
        added = true;
      }
    }
    if (added && !timer) timer = setTimeout(flush, 20);
  }, [key]);

  return Object.fromEntries(ids.filter((x): x is string => !!x).map((id) => [id, cache.get(id)]));
}
