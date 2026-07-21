'use client';
import { useEffect } from 'react';

const RELOAD_FLAG = 'chunk-error-reload';

function isChunkLoadError(value?: string | null) {
  if (!value) return false;
  return /Loading chunk [\w.-]+ failed|ChunkLoadError/i.test(value);
}

// El servidor de desarrollo (webpack HMR) invalida los chunks al recompilar.
// Si la pestaña estuvo en segundo plano o la PC en suspensión, el navegador
// intenta cargar un chunk que ya no existe y la app queda en blanco. Se
// recarga una sola vez para recuperar los chunks vigentes.
export default function ChunkErrorHandler() {
  useEffect(() => {
    const reloadOnce = () => {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event?.message) || isChunkLoadError((event?.error as Error)?.name)) {
        reloadOnce();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      if (isChunkLoadError(reason?.message) || isChunkLoadError(reason?.name)) {
        reloadOnce();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    const clearFlag = setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      clearTimeout(clearFlag);
    };
  }, []);

  return null;
}
