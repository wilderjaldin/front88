'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';

const Row = ({ label, value, negative = false }) => (
  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-100">
    <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
    <span className={`tabular-nums font-semibold ${negative && (value ?? 0) > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-700 dark:text-blue-200'}`}>
      {negative && (value ?? 0) > 0 ? `- ${customFormat(value)}` : customFormat(value ?? 0)}
    </span>
  </div>
);

const CostSummary = ({ close, token, t, order, setItems, setOrder }) => {

  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSummary(); }, []);

  const getSummary = async () => {
    try {
      const rs = await axiosClient.get(`cotizaciondetalle/resumencosto/${order.NroOrden}`);
      setSummary(rs.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const total =
    (summary.costo              ?? 0) +
    (summary.fleteInternacional ?? 0) +
    (summary.aduana             ?? 0) +
    (summary.fleteInterno       ?? 0) +
    (summary.utilidad           ?? 0) -
    (summary.descuento          ?? 0) +
    (summary.impuesto           ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="py-2">

      <Row label={t.spare_parts_cost        ?? 'Costo Repuestos'}      value={summary.costo} />
      <Row label={t.international_freight   ?? 'Flete Internacional'}  value={summary.fleteInternacional} />
      <Row label={t.customs                 ?? 'Aduana'}               value={summary.aduana} />
      <Row label={t.freight                 ?? 'Flete Interno'}        value={summary.fleteInterno} />
      <Row label={t.utility                 ?? 'Utilidad'}             value={summary.utilidad} />
      <Row label={t.discount                ?? 'Descuento'}            value={summary.descuento} negative />
      <Row label={t.tax                     ?? 'Impuesto'}             value={summary.impuesto} />

      <div className="mx-0 mt-3 flex items-center justify-between rounded-xl bg-gray-100 dark:bg-gray-700/60 px-5 py-3.5">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{customFormat(total)}</span>
      </div>

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

export default CostSummary;
