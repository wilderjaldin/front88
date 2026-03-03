// app/providers/LoadingProvider.tsx
'use client';

import { useEffect, useState } from 'react';

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Captura clics en links internos
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.origin === location.origin) {
        setIsLoading(true);
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    const handleLoadComplete = () => {
      setIsLoading(false);
    };

    window.addEventListener('load', handleLoadComplete);
    return () => {
      window.removeEventListener('load', handleLoadComplete);
    };
  }, []);

  // También desactivar loading luego de unos segundos por seguridad
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setIsLoading(false), 0); // fallback
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 transition-opacity">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
        </div>
      )}
      {children}
    </>
  );
}