import { useEffect, useState } from 'react';

// Alto real del <header> del sitio cuando está sticky/fixed (0 en navbar-static),
// para que una barra sticky quede justo debajo sin tapar ni quedar oculta.
export function useHeaderOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => {
      const pos = getComputedStyle(header).position;
      setOffset(pos === 'sticky' || pos === 'fixed' ? header.getBoundingClientRect().height : 0);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return offset;
}
