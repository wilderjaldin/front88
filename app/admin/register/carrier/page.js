"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { useTranslation } from "@/app/locales";
import CarrierList from "./list";

export default function CarrierPage() {
  const t = useTranslation();
  useDynamicTitle(`${t.carriers} | ${t.registry}`);
  return <CarrierList />;
}
