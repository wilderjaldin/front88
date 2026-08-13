'use client';
import React, { useEffect, useState } from 'react';
import { Pagination } from '@mantine/core';
import { customFormat } from '@/app/lib/format';
import IconBackSpace from '@/components/icon/icon-backspace';
import IconSearch from '@/components/icon/icon-search';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TableUnassigned = ({ t, orders_unassigned, assignOrder, goToTab, onSearch, onClear }) => {

  const [selected,   setSelected]   = useState([]);
  const [term,       setTerm]       = useState('');
  const [page,       setPage]       = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setSelected([]); setPage(1); }, [orders_unassigned]);

  const totalPages = Math.ceil(orders_unassigned.length / PAGE_SIZE);
  const pageData    = orders_unassigned.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e) => { e.preventDefault(); onSearch?.(term); };
  const handleClear  = () => { setTerm(''); onClear?.(); };

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);

  const assignOrderTable = async () => {
    setSubmitting(true);
    const res = await assignOrder(selected);
    setSubmitting(false);
    if (res) {
      setSelected([]);
      goToTab('assigned');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.pending_orders_not_assigned}
            <span className="ml-2 text-sm font-normal text-gray-400">({orders_unassigned.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro server-side */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder={t.filter}
            className="h-10 w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="flex h-10 items-center gap-1.5 rounded-lg px-3 bg-primary/20 text-primary hover:bg-primary/40 transition text-sm">
            <IconSearch className="h-4 w-4" />
            {t.search ?? 'Buscar'}
          </button>
          <button type="button" onClick={handleClear} className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <IconBackSpace className="h-4 w-4" />
            {t.btn_clear ?? 'Limpiar'}
          </button>
        </form>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          onClick={assignOrderTable}
          disabled={selected.length === 0 || submitting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.assign}
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
                <th className={thClass}>{t.supplier}</th>
                <th className={`${thClass} text-center`}>{t.nro_order}</th>
                <th className={`${thClass} text-center`}>Items</th>
                <th className={`${thClass} text-right`}>{t.value}</th>
                <th className={`${thClass} text-center`}>{t.days}</th>
                <th className={thClass}>{t.customer}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
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
                  <td className={`${tdClass} font-medium`}>{o.NomProveedor}</td>
                  <td className={`${tdClass} text-center`}>{o.NroOrden}</td>
                  <td className={`${tdClass} text-center`}>{o.NroItems}</td>
                  <td className={`${tdClass} text-right`}>{customFormat(o.Monto)}</td>
                  <td className={`${tdClass} text-center`}>{o.Dias}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.NomCliente}</td>
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

export default TableUnassigned;
