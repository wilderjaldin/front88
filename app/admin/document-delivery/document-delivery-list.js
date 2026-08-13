'use client';
import React from 'react';
import { Pagination } from '@mantine/core';
import IconPrinter from '@/components/icon/icon-printer';
import IconX from '@/components/icon/icon-x';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

// Reenviar / acción del tercer ícono (flecha circular azul en la referencia) —
// sin definir todavía qué hace, se deja el ícono a la espera de confirmación.
const IconForward = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const DocumentDeliveryList = ({ t, data = [], loading, page, totalPages, onPageChange, onCancel, onForward, onPrint }) => {
  return (
    <div>
      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-24 text-center`}>{t.actions ?? 'Acciones'}</th>
                <th className={`${thClass} text-center`}>{t.nro_packaging}</th>
                <th className={`${thClass} text-center`}>{t.nro_dispatch}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.transport}</th>
                <th className={thClass}>{t.delivery_address}</th>
                <th className={thClass}>{t.cargo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.loading}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td></tr>
              ) : data.map((o, i) => (
                <tr key={o.id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${tdClass} text-center`}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPrint?.(o)}
                        title={t.print ?? 'Imprimir'}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/30 transition"
                      >
                        <IconPrinter className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel?.(o)}
                        title={t.cancel_reception ?? 'Anular'}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition"
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onForward?.(o)}
                        title={t.forward ?? 'Reenviar'}
                        className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 transition"
                      >
                        <IconForward className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className={`${tdClass} text-center font-medium`}>{o.NumEmbalaje}</td>
                  <td className={`${tdClass} text-center`}>{o.NumDespacho}</td>
                  <td className={`${tdClass} font-medium`}>{o.Cliente}</td>
                  <td className={tdClass}>{o.Transporte}</td>
                  <td className={tdClass}>{o.DireccionEntrega}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.Carga}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" radius="xl" />
        </div>
      )}
    </div>
  );
};

export default DocumentDeliveryList;
