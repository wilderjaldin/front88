"use client";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import CarrierList from "./list";

export default function CarrierPage() {
  useDynamicTitle("Transportistas | Registro");
  return <CarrierList />;
}
