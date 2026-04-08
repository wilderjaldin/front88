'use client'
import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { usePathname } from 'next/navigation';
import { useTranslation } from "@/app/locales";
export default function RouteClickInterceptor() {
  const pathname = usePathname();
  const t = useTranslation();
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (
        anchor &&
        !anchor.classList.contains('no-load') &&
        anchor.href &&
        anchor.origin === window.location.origin && // Solo links internos
        anchor.pathname !== window.location.pathname // Evitar reload misma ruta
      ) {
        Swal.fire({
          title: t.loading,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

   useEffect(() => {
    Swal.close();
   }, [pathname]);

  return null;
}