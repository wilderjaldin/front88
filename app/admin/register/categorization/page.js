"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import CategorizationList from "./list";

export default function CategorizationPage() {
  useDynamicTitle("Categorización | Registro");
  return <CategorizationList />;
}
