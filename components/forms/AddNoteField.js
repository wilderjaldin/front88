'use client';
import React, { useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import IconNotesEdit from '@/components/icon/icon-notes-edit';
import IconPlus from '@/components/icon/icon-plus';

const URL_ADD_NOTE = 'repuestos/agregar-nota-adicional';

// Campo reutilizable "Agregar nota": tarjeta propia (encabezado con ícono +
// textarea + botón), que guarda directo contra POST
// repuestos/agregar-nota-adicional ({ codRepuesto, nota }). Usuario y fecha
// los resuelve el backend por JWT. onSaved recibe el array notasAdicionales
// ya actualizado que devuelve la respuesta.
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

  const handleKeyDown = (e) => {
    // Ctrl/Cmd+Enter envía sin salir del textarea — Enter solo sigue bajando de línea.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
          <IconNotesEdit className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {t.add_note ?? 'Agregar nota'}
        </span>
      </div>

      <div className="p-3">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder={t.write_a_note ?? 'Escribe una nota...'}
          className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition"
        />
        <div className="flex justify-end mt-2.5">
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !value.trim()}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition"
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
    </div>
  );
};

export default AddNoteField;
