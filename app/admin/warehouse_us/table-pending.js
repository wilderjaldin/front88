'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconBackSpace from '@/components/icon/icon-backspace';
import IconRefresh from '@/components/icon/icon-refresh';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TablePending = ({ t, title, orders, loading, onRefresh, onViewItems }) => {

  const [selected, setSelected] = useState([]);
  const [filter,   setFilter]   = useState('');
  const [page,     setPage]     = useState(1);

  useEffect(() => { setSelected([]); setPage(1); }, [orders]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return orders;
    const f = filter.trim().toLowerCase();
    return orders.filter(o =>
      (o.Proveedor ?? '').toLowerCase().includes(f) ||
      (o.Cliente ?? '').toLowerCase().includes(f) ||
      (o.NroOrden ?? '').toString().toLowerCase().includes(f) ||
      (o.NumOrdenCompra ?? '').toString().includes(f) ||
      (o.Tracking ?? '').toLowerCase().includes(f)
    );
  }, [orders, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData    = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {title}
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

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title={t.refresh}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={() => onViewItems(selected)}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.view_items}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M3 12h18"/>
          </svg>
        </button>

        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={pageData.length > 0 && selected.length === pageData.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className={`${thClass} text-center`}>{t.purchase_order_number}</th>
                <th className={`${thClass} text-center`}>{t.nro_order}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.supplier}</th>
                <th className={`${thClass} text-center`}>{t.days_in_process}</th>
                <th className={thClass}>{t.status}</th>
                <th className={thClass}>{t.tracking}</th>
                <th className={thClass}>{t.country}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    selected.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox" checked={selected.includes(o)} onChange={() => toggleRow(o)} />
                  </td>
                  <td className={`${tdClass} text-center font-medium`}>{o.NumOrdenCompra}</td>
                  <td className={`${tdClass} text-center`}>{o.NroOrden}</td>
                  <td className={tdClass}>{o.Cliente}</td>
                  <td className={`${tdClass} font-medium`}>{o.Proveedor}</td>
                  <td className={`${tdClass} text-center`}>{o.Dias}</td>
                  <td className={tdClass}>
                    {o.Status ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                        {o.Status}
                      </span>
                    ) : '—'}
                  </td>
                  <td className={`${tdClass} text-gray-500`}>{o.Tracking || '—'}</td>
                  <td className={tdClass}>
                    {o.CodPais ? (
                      <div className="inline-flex items-center gap-1.5">
                        <img
                          src={`/assets/flags/${o.CodPais.toLowerCase()}.svg`}
                          alt={o.NomPais || o.CodPais}
                          className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span>{o.NomPais || o.CodPais}</span>
                      </div>
                    ) : '—'}
                  </td>
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

export default TablePending;
