"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useTranslation } from "@/app/locales";
import CategorizationList from "./list";

export default function CategorizationPage() {
  const t = useTranslation();
  useDynamicTitle(`${t.categorization} | ${t.registry}`);
  return <CategorizationList />;
}
