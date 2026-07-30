'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconBackSpace from '@/components/icon/icon-backspace';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TableAttached = ({ t, items, loading }) => {

  const [filter, setFilter] = useState('');
  const [page,   setPage]   = useState(1);

  useEffect(() => { setPage(1); }, [items]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.trim().toLowerCase();
    return items.filter(o =>
      (o.Cliente ?? '').toLowerCase().includes(f) ||
      (o.NroParte ?? '').toLowerCase().includes(f) ||
      (o.Descripcion ?? '').toLowerCase().includes(f) ||
      (o.NroOrden ?? '').toString().includes(f)
    );
  }, [items, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData    = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.attached_items}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro local */}
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            placeholder={t.filter}
            className="h-10 w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {filter && (
            <button onClick={() => setFilter('')} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
              <IconBackSpace className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} text-center`}>{t.nro_order}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>Nro. Parte</th>
                <th className={thClass}>{t.description ?? 'Descripción'}</th>
                <th className={`${thClass} text-center`}>{t.quantity}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-400">{t.loading ?? 'Cargando...'}</td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${tdClass} text-center font-medium`}>{o.NroOrden}</td>
                  <td className={tdClass}>{o.Cliente}</td>
                  <td className={`${tdClass} text-primary`}>{o.NroParte}</td>
                  <td className={tdClass}>{o.Descripcion}</td>
                  <td className={`${tdClass} text-center`}>{o.CanRecibida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}
    </div>
  )
}

export default TableAttached;
