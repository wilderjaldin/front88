'use client';

import React, { useState } from 'react';

// Pega Cantidad + Descripción copiadas de Excel (2 columnas, separadas por TAB)
// y reemplaza por completo las filas actuales de la tabla.
const QuoteWithoutCodeBatchForm = ({ close, t, items, setItems, setCurrentRow, setValue, unregister }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError(t.required_items);
      return;
    }

    const rows = lines.map(line => {
      const tabIdx = line.indexOf('\t');
      let cantidadRaw, descripcion;
      if (tabIdx !== -1) {
        cantidadRaw = line.slice(0, tabIdx).trim();
        descripcion = line.slice(tabIdx + 1).trim();
      } else {
        const m = line.match(/^(\d+)\s+(.+)$/);
        if (m) { cantidadRaw = m[1]; descripcion = m[2]; }
        else { cantidadRaw = '1'; descripcion = line; }
      }
      const cantidad = parseInt(cantidadRaw, 10);
      return { Cantidad: (isNaN(cantidad) || cantidad < 1) ? 1 : cantidad, DesRepuesto: descripcion.toUpperCase() };
    });

    items.forEach(r => {
      unregister(`data[${r.CodItem}][amount]`);
      unregister(`data[${r.CodItem}][description]`);
    });

    const newItems = rows.map((r, i) => ({ CodItem: i + 1, Cantidad: r.Cantidad, DesRepuesto: r.DesRepuesto }));
    setItems(newItems);
    setCurrentRow(newItems.length + 1);
    newItems.forEach(r => {
      setValue(`data[${r.CodItem}][amount]`, r.Cantidad);
      setValue(`data[${r.CodItem}][description]`, r.DesRepuesto);
    });
    close();
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.help_batch_amount_description}
        </p>
        <textarea
          rows={10}
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={'3\tdescripcion 1\n2\tdescripcion 2\n4\tdescripcion 3'}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900
            px-3 py-2 text-sm font-mono resize-none
            focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <span className="text-red-400 text-xs block">{error}</span>}
      </div>

      <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={close}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150">
          {t.btn_cancel}
        </button>
        <button type="button" onClick={handleImport}
          className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition">
          {t.btn_import}
        </button>
      </div>
    </div>
  );
};

export default QuoteWithoutCodeBatchForm;
