'use client';
// components/ui/BrandSelect.jsx
//
// Select de marcas con búsqueda por prioridad, reutilizable en cualquier
// lugar que hoy arma un <Select options={brands} filterOption={...}> a mano:
//   - 1-2 caracteres escritos → solo "empieza con" (evita listas gigantes).
//   - 3+ caracteres           → "contiene" en cualquier parte, pero ordenado
//     por posición del match: primero lo que EMPIEZA con el texto, después
//     lo que lo tiene en el MEDIO, al final lo que lo tiene al FINAL.
// react-select filtra pero no reordena por relevancia, así que acá el
// filtrado+orden se calcula antes y se le pasan las opciones ya listas
// (filterOption={null} para que no vuelva a filtrar por su cuenta).
import { useState } from 'react';
import Select from '@/components/ui/Select';

export function filterBrandOptions(options, query, { showAllWhenEmpty = false } = {}) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return showAllWhenEmpty ? (options ?? []) : [];
  // razSoc (razón social) es opcional — cuando una opción lo trae (ej.
  // proveedores: "SANDEN" con razSoc "RANSHU LLC") también se busca ahí,
  // así se encuentra el proveedor escribiendo cualquiera de los dos nombres.
  if (q.length <= 2) {
    return (options ?? []).filter(o =>
      (o.label ?? '').toLowerCase().startsWith(q) ||
      (o.razSoc ?? '').toLowerCase().startsWith(q)
    );
  }
  return (options ?? [])
    .map(o => {
      const labelIdx  = (o.label  ?? '').toLowerCase().indexOf(q);
      const razSocIdx = (o.razSoc ?? '').toLowerCase().indexOf(q);
      const idx = labelIdx !== -1 ? labelIdx : razSocIdx;
      return { option: o, idx, matched: labelIdx !== -1 || razSocIdx !== -1 };
    })
    .filter(({ matched }) => matched)
    .sort((a, b) => a.idx - b.idx)
    .map(({ option }) => option);
}

// showAllWhenEmpty: por default el menú arranca vacío hasta que se escribe
// (mismo comportamiento que ya tenían casi todos los <Select> de marcas de
// la app, pensado para catálogos grandes). Pasar `showAllWhenEmpty` en los
// pocos casos que sí mostraban la lista completa al abrir el menú (sin
// escribir nada) para no perder esa navegación.
export default function BrandSelect({ options = [], noOptionsMessage, onInputChange, showAllWhenEmpty = false, t, ...props }) {
  const [query, setQuery] = useState('');

  return (
    <Select
      {...props}
      options={filterBrandOptions(options, query, { showAllWhenEmpty })}
      filterOption={null}
      onInputChange={(val, meta) => {
        if (meta.action === 'input-change') setQuery(val);
        onInputChange?.(val, meta);
      }}
      noOptionsMessage={noOptionsMessage ?? (() =>
        query.trim().length === 0 && !showAllWhenEmpty
          ? (t?.type_to_search_ph ?? 'Escribe para buscar')
          : (t?.no_options ?? 'Sin opciones')
      )}
    />
  );
}
