'use client';
import React from 'react';
import { Pagination } from '@mantine/core';
import IconArrowDown from '@/components/icon/icon-arrow-down';
import SearchFilter from '@/components/SearchFilter';

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2 py-1.5";

const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z" />
        <path d="M3.5 11L0 6.5H7L3.5 11Z" />
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc'
        ? <path d="M3.5 0L7 7H0L3.5 0Z" />
        : <path d="M3.5 7L0 0H7L3.5 7Z" />
      }
    </svg>
  );
};

const SortableHeader = ({ col, label, sort, dir, onSort, className = '' }) => (
  <th
    onClick={() => onSort(col)}
    className={`${thClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
  >
    <span className="inline-flex items-center gap-1.5">
      {label}
      <SortIcon active={sort === col} dir={dir} />
    </span>
  </th>
);

const PendingDelivery = ({
  t, data = [], seleccionados, setSeleccionados, attachItems, handleCancelPacking,
  page, sortColumn, sortDir, totalPages, onSort, onPageChange, loading,
  term = '', onSearch, onClear,
}) => {

  const toggleAll = () =>
    setSeleccionados(seleccionados.length === data.length ? [] : [...data]);
  const toggleRow = (row) =>
    setSeleccionados(prev => prev.includes(row) ? prev.filter(i => i !== row) : [...prev, row]);

  const isEmpty = seleccionados.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={attachItems}
          disabled={isEmpty}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.attach_items}
          <IconArrowDown className="w-3.5 h-3.5 rotate-90" />
        </button>

        <button
          type="button"
          onClick={handleCancelPacking}
          disabled={isEmpty}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-35 disabled:cursor-not-allowed transition dark:bg-red-900/20 dark:text-red-400"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t.cancel_packaging}
        </button>

        <SearchFilter t={t} value={term} onSearch={onSearch} onClear={onClear} className="ml-auto w-80" />
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${thClass} w-10 text-center`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-[16px] w-[16px]"
                    checked={data.length > 0 && seleccionados.length === data.length}
                    onChange={toggleAll}
                  />
                </th>
                <SortableHeader col="delivery"  label={t.nro_delivery}  sort={sortColumn} dir={sortDir} onSort={onSort} />
                <SortableHeader col="date"      label={t.delivery_date} sort={sortColumn} dir={sortDir} onSort={onSort} />
                <SortableHeader col="customer"  label={t.customer}      sort={sortColumn} dir={sortDir} onSort={onSort} />
                <SortableHeader col="received"  label={t.received_by}  sort={sortColumn} dir={sortDir} onSort={onSort} />
                <SortableHeader col="delivered" label={t.delivered_by} sort={sortColumn} dir={sortDir} onSort={onSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">{t.loading}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : data.map((o, index) => (
                <tr
                  key={index}
                  onClick={() => toggleRow(o)}
                  className={`cursor-pointer transition-colors ${
                    seleccionados.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="form-checkbox h-[16px] w-[16px]"
                      checked={seleccionados.includes(o)}
                      onChange={() => toggleRow(o)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>
                    <span className="inline-flex items-center gap-1.5">
                      {o.numEntrega}
                      {o.esCopia && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                          {t.copy}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={tdClass}>{o.fecEntrega}</td>
                  <td className={tdClass}>{o.cliente}</td>
                  <td className={tdClass}>{o.recibidoPor}</td>
                  <td className={tdClass}>{o.entregadoPor}</td>
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

export default PendingDelivery;
