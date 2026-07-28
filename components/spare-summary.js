'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';

const Field = ({ label, value }) => (
  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right">
      {value === '' || value == null ? '—' : value}
    </span>
  </div>
);

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-BO');
};

const SpareSummary = ({ close, t, codRepuesto }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSummary(); }, []);

  const getSummary = async () => {
    try {
      const rs = await axiosClient.get(`repuestos/resumen/${codRepuesto}`);
      setData(rs.data);
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
    <div className="py-2">
      <div className="px-5 pb-3">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{data.nroParte}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.desRepuesto}</p>
        <div className="h-0.5 w-8 rounded bg-primary/60 mt-2" />
      </div>

      <Field label={t.brand ?? 'Marca'}                     value={data.marca} />
      <Field label={t.supplier ?? 'Proveedor'}               value={data.proveedor} />
      <Field label={t.application ?? 'Aplicación'}           value={data.aplicacion} />
      <Field label={t.cost ?? 'Costo'}                       value={customFormat(data.costo ?? 0)} />
      <Field label={t.min_quantity ?? 'Cant. Mínima'}        value={data.canMin} />
      <Field label={`${t.weight ?? 'Peso'} (lb)`}            value={customFormat(data.peso ?? 0)} />
      <Field label={t.abb_validity_date ?? 'Vencimiento'}    value={formatDate(data.fecVencimiento)} />

      <div className="flex justify-center px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={close}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150"
        >
          {t.close ?? 'Cerrar'}
        </button>
      </div>
    </div>
  );
};

export default SpareSummary;
