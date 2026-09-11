'use client';
import ReactAsyncSelect from 'react-select/async';

/**
 * Wrapper de react-select/async para todo el proyecto.
 * Fija `classNamePrefix="select"` para que el tema oscuro global
 * (`.dark .select__*` en styles/tailwind.css) aplique a todas las instancias.
 * Cualquier prop del caller —incluido un classNamePrefix propio— tiene prioridad.
 */
export default function AsyncSelect(props) {
  return <ReactAsyncSelect classNamePrefix="select" {...props} />;
}
