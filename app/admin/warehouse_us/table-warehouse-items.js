'use client';
import React from 'react';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TableWarehouseItems = ({ t, items, loading }) => (
  <div>
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {t.in_warehouse_items ?? 'Items en Bodega'}
        <span className="ml-2 text-sm font-normal text-gray-400">({items.length})</span>
      </h2>
      <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
    </div>

    <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-gray-900">
          <thead>
            <tr>
              <th className={`${thClass} text-center`}>{t.nro_order}</th>
              <th className={thClass}>{t.customer}</th>
              <th className={thClass}>{t.nro_part}</th>
              <th className={thClass}>{t.description ?? 'Descripción'}</th>
              <th className={`${thClass} text-center`}>{t.quantity ?? 'Cantidad'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-400">{t.loading ?? 'Cargando...'}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
              </tr>
            ) : items.map((o, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className={`${tdClass} text-center font-medium`}>{o.NroOrden}</td>
                <td className={tdClass}>{o.Cliente}</td>
                <td className={`${tdClass} text-primary`}>{o.NroParte}</td>
                <td className={tdClass}>{o.Descripcion}</td>
                <td className={`${tdClass} text-center`}>{o.Cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default TableWarehouseItems;
