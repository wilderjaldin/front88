import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store/theme';

// El header global solo es sticky en top:0 cuando la barra de navegación está
// en modo "Fija" o "Flotante" — en modo "Estática" se va con el scroll, así
// que los bloques que se enganchan justo debajo de su borde (título/filtros)
// no deben dejar ese hueco reservado o queda contenido asomando por arriba.
export const useStickyTop = (): number => {
  const navbar = useSelector((state: IRootState) => state.themeConfig.navbar);
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    if (navbar === 'navbar-static') {
      setStickyTop(0);
      return;
    }
    const updateStickyTop = () => {
      const header = document.getElementById('site-header');
      setStickyTop(header?.getBoundingClientRect().height ?? 0);
    };
    updateStickyTop();
    window.addEventListener('resize', updateStickyTop);
    return () => window.removeEventListener('resize', updateStickyTop);
  }, [navbar]);

  return stickyTop;
};
