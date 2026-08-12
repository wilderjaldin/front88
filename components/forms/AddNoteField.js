'use client';
import React, { useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import IconPlus from '@/components/icon/icon-plus';

const URL_ADD_NOTE = 'repuestos/agregar-nota-adicional';

// Campo reutilizable "Agregar nota": título + textarea + botón, que guarda
// directo contra POST repuestos/agregar-nota-adicional ({ codRepuesto, nota }).
// Usuario y fecha los resuelve el backend por JWT. onSaved recibe el array
// notasAdicionales ya actualizado que devuelve la respuesta.
const AddNoteField = ({ t, codRepuesto, onSaved, onError, rows = 3 }) => {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const nota = value.trim();
    if (!nota) return;
    setSaving(true);
    try {
      const rs = await axiosClient.post(URL_ADD_NOTE, { codRepuesto, nota });
      onSaved?.(rs.data?.notasAdicionales ?? []);
      setValue('');
    } catch (error) {
      onError?.(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {t.add_note ?? 'Agregar nota'}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.write_a_note ?? 'Escribe una nota...'}
        className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !value.trim()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <IconPlus className="h-3.5 w-3.5" />
          )}
          {saving ? (t.saving ?? 'Guardando...') : (t.add ?? 'Agregar')}
        </button>
      </div>
    </div>
  );
};

export default AddNoteField;
