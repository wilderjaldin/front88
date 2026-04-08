"use client";

import { useEffect } from "react";

/**
 * Cambia dinámicamente el título del documento
 * @param title Texto que se mostrará en el título del navegador
 */
export function useDynamicTitle(title: string) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}