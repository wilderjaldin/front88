'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';
import AddNoteField from '@/components/forms/AddNoteField';
import { swalError } from '@/app/lib/swal';

const Field = ({ label, value }) => (
  <div>
    <span className="block text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
    <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
      {value === '' || value == null ? '—' : value}
    </span>
  </div>
);

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-BO');
};

const formatDateTime = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const SpareSummary = ({ close, t, codRepuesto, onNotesUpdated, initialNotes = [] }) => {
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSummary(); }, []);

  const getSummary = async () => {
    try {
      const rs = await axiosClient.get(`repuestos/resumen/${codRepuesto}`);
      setData(rs.data);
      // El endpoint de resumen no siempre trae notasAdicionales; si no viene,
      // se mantiene lo que ya se tenía cargado desde la cotización.
      if (rs.data?.notasAdicionales) setNotes(rs.data.notasAdicionales);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">{t.empty_results ?? 'Sin resultados'}</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-5">
      <div className="pb-2">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{data.nroParte}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.desRepuesto}</p>
        <div className="h-0.5 w-8 rounded bg-primary/60 mt-2" />
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 py-3 border-y border-gray-100 dark:border-gray-700/60">
        <Field label={t.brand ?? 'Marca'}                     value={data.marca} />
        <Field label={t.supplier ?? 'Proveedor'}               value={data.proveedor} />
        <Field label={t.application ?? 'Aplicación'}           value={data.aplicacion} />
        <Field label={t.cost ?? 'Costo'}                       value={customFormat(data.costo ?? 0)} />
        <Field label={t.min_quantity ?? 'Cant. Mínima'}        value={data.canMin} />
        <Field label={`${t.weight ?? 'Peso'} (lb)`}            value={customFormat(data.peso ?? 0)} />
        <Field label={t.abb_validity_date ?? 'Vencimiento'}    value={formatDate(data.fecVencimiento)} />
      </div>

      <div className="pt-3">
        {notes.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
              {t.history ?? 'Historial'}
            </p>
            <div className="max-h-28 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {notes.map((n, i) => (
                <div key={i} className="px-3 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{n.nomUsuario}</span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(n.fecha)}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{n.nota}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-2">
          <AddNoteField
            t={t}
            codRepuesto={codRepuesto}
            rows={2}
            onSaved={(updatedNotes) => {
              setNotes(updatedNotes);
              onNotesUpdated?.(updatedNotes);
            }}
            onError={(error) => swalError(t.error, error?.response?.data?.mensaje ?? 'No se pudo guardar la nota')}
          />
        </div>
      </div>

      <div className="flex justify-center pt-3 pb-1">
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150"
        >
          {t.close ?? 'Cerrar'}
        </button>
      </div>
    </div>
  );
};

export default SpareSummary;
