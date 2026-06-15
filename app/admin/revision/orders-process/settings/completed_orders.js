"use client";
import { useEffect, useState } from "react";
import { Pagination } from '@mantine/core';
import IconSearch from "@/components/icon/icon-search";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconListCheck from "@/components/icon/icon-list-check";
import { customFormat } from '@/app/lib/format';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z"/>
        <path d="M3.5 11L0 6.5H7L3.5 11Z"/>
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc'
        ? <path d="M3.5 0L7 7H0L3.5 0Z"/>
        : <path d="M3.5 7L0 0H7L3.5 7Z"/>
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

export default function CompletedOrders({
  t, items = [], loading = false,
  page = 1, total = 0, pageSize = 20, onPageChange,
  sort = '', dir = 'asc', onSort,
  search = '', onSearch,
}) {
  const [view,     setView]     = useState('list');
  const [inputVal, setInputVal] = useState(search);

  useEffect(() => { setInputVal(search); }, [search]);

  const submitSearch = () => onSearch?.(inputVal);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-3 pr-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.completed_orders}{' '}
            <span className="font-normal text-gray-400">({total})</span>
          </p>
          <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputVal}
              placeholder={t.search}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitSearch()}
              className="h-9 w-44 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={submitSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-400 transition dark:bg-gray-700 dark:hover:bg-primary/20"
            >
              <IconSearch className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button type="button" onClick={() => setView('list')}
              className={`p-2 transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
              <IconListCheck className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView('grid')}
              className={`p-2 transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-400'}`}>
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <span className="text-sm text-gray-400 animate-pulse">{t.searching}</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-gray-400">{t.quotes_empty}</p>
        </div>
      )}

      {!loading && view === 'list' && items.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <SortableHeader col="quote"     label={t.nro_quote}  sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="item"      label="Items"         sort={sort} dir={dir} onSort={onSort} className="text-center" />
                  <SortableHeader col="total"     label="Total $us"     sort={sort} dir={dir} onSort={onSort} className="text-right" />
                  <SortableHeader col="order"     label={t.nro_pedido}  sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="quotedate" label={t.quote_date}  sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="orderdate" label={t.date_order}  sort={sort} dir={dir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((o, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className={`${tdClass} font-semibold text-primary`}>{o.nroCotizacion}</td>
                    <td className={`${tdClass} text-center`}>{o.nroItems}</td>
                    <td className={`${tdClass} text-right font-medium`}>{customFormat(o.totalSus)}</td>
                    <td className={tdClass}>{o.nroPedido || '—'}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecCotizacion ?? '—'}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecOrden ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && view === 'grid' && items.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((o, i) => (
            <div key={i} className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-bold text-primary">#{o.nroCotizacion}</span>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5">
                  {t.completed ?? 'Completado'}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                {[
                  ['Items',         o.nroItems],
                  ['Total $us',     customFormat(o.totalSus)],
                  [t.nro_pedido,    o.nroPedido || '—'],
                  [t.quote_date,    o.fecCotizacion ?? '—'],
                  [t.date_order,    o.fecOrden ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && total > pageSize && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={Math.ceil(total / pageSize)}
            value={page}
            onChange={onPageChange}
            size="sm"
            radius="xl"
          />
        </div>
      )}
    </>
  );
}
