"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lang } from "@/lib/i18n";

export function LangTabs({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Lang)}>
      <TabsList>
        <TabsTrigger value="id">🇮🇩 Indonesia</TabsTrigger>
        <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
