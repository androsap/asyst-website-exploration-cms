"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lang } from "@/lib/i18n";
import { LangFlag } from "../lang-flag";

export function LangTabs({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Lang)}>
      <TabsList>
        <TabsTrigger value="id" className="gap-2">
          <LangFlag lang="id" /> Indonesia
        </TabsTrigger>
        <TabsTrigger value="en" className="gap-2">
          <LangFlag lang="en" /> English
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
