'use client';
import React, { useEffect, useState } from 'react';
import IconSearchFilled from '@/components/icon/icon-search-filled';
import IconX from '@/components/icon/icon-x';

// Filtro de búsqueda estándar: input + botón "x" para limpiar (inline, solo
// visible con texto) + botón de lupa adosado a la derecha. La búsqueda se
// dispara al enviar el form (Enter o click en la lupa), no al escribir.
const SearchFilter = ({ t, value = '', onSearch, onClear, placeholder, className = 'w-80' }) => {
  const [term, setTerm] = useState(value);
  // Solo hay algo que "limpiar" a nivel API si la última acción confirmada
  // (búsqueda enviada o sincronizada desde afuera) dejó un término activo.
  const [applied, setApplied] = useState(!!value);

  useEffect(() => { setTerm(value); setApplied(!!value); }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setApplied(!!term.trim());
    onSearch?.(term);
  };

  const handleClear = () => {
    setTerm('');
    if (applied) {
      setApplied(false);
      onClear?.();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-stretch h-9 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className}`}
    >
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder={placeholder ?? t?.filter}
          className="w-full h-full px-3 pe-7 text-sm bg-transparent border-0 focus:outline-none"
        />
        {term && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 end-1.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="flex items-center justify-center w-10 shrink-0 bg-primary text-white hover:bg-primary/90 transition"
      >
        <IconSearchFilled className="h-4 w-4" />
      </button>
    </form>
  );
};

export default SearchFilter;
