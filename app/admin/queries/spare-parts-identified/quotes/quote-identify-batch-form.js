'use client';

import React, { useState } from 'react';

// Pega Cantidad + Nro. Parte + Descripción copiadas de Excel (3 columnas,
// separadas por TAB) y agrega filas nuevas al final de la tabla actual.
const QuoteIdentifyBatchForm = ({ close, t, items, setItems, currentRow, setCurrentRow, setValue }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError(t.required_items);
      return;
    }

    const rows = lines.map(line => {
      const cols = line.split('\t').map(c => c.trim());
      const [cantidadRaw, nroParte, descripcion] = cols.length >= 3
        ? cols
        : ['1', '', line];
      const cantidad = parseInt(cantidadRaw, 10);
      return {
        cantidad: (isNaN(cantidad) || cantidad < 1) ? 1 : cantidad,
        nroParte: (nroParte ?? '').toUpperCase(),
        desRepuesto: (descripcion ?? '').toUpperCase(),
      };
    });

    const newItems = rows.map((r, i) => ({
      id: currentRow + i, codItem: currentRow + i, cantidad: r.cantidad, desRepuesto: r.desRepuesto, desRepReal: '', nroParte: r.nroParte,
    }));
    setItems([...items, ...newItems]);
    setCurrentRow(currentRow + newItems.length);
    newItems.forEach(r => {
      setValue(`items.${r.codItem}.amount`, r.cantidad);
      setValue(`items.${r.codItem}.description`, r.desRepuesto);
      setValue(`items.${r.codItem}.nro_part`, r.nroParte);
    });
    close();
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="px-4 py-4 space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.help_batch_amount_part_description}
        </p>
        <textarea
          rows={10}
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={'3\t4840404\tdescripcion 1\n2\t1920224\tdescripcion 2\n4\t6135951\tdescripcion 3'}
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

export default QuoteIdentifyBatchForm;
