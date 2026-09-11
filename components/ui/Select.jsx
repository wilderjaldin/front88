'use client';
import ReactSelect from 'react-select';

/**
 * Wrapper de react-select para todo el proyecto.
 * Fija `classNamePrefix="select"` para que el tema oscuro global
 * (`.dark .select__*` en styles/tailwind.css) aplique a todas las instancias.
 * Cualquier prop del caller —incluido un classNamePrefix propio— tiene prioridad.
 */
export default function Select(props) {
  return <ReactSelect classNamePrefix="select" {...props} />;
}
