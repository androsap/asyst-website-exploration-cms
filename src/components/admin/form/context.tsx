"use client";

import { createContext, useContext } from "react";
import type { Lang } from "@/lib/i18n";

export type AdminConfig = { blobEnabled: boolean; previewEnabled: boolean };

const AdminConfigContext = createContext<AdminConfig>({ blobEnabled: false, previewEnabled: false });
export const AdminConfigProvider = AdminConfigContext.Provider;
export const useAdminConfig = () => useContext(AdminConfigContext);

/** Bahasa yang sedang diedit (tab Indonesia / English di atas form). */
const EditLangContext = createContext<Lang>("id");
export const EditLangProvider = EditLangContext.Provider;
export const useEditLang = () => useContext(EditLangContext);

export const join = (prefix: string, key: string) => (prefix ? `${prefix}.${key}` : key);
