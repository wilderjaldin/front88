"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

// Página deshabilitada por ahora — cualquier ingreso redirige al panel principal.
export default function Settings() {
  const router = useRouter();
  const t = useTranslation();
  useDynamicTitle(`${t.settings}`);

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
