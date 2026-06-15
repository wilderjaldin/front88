"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Swal from 'sweetalert2';
import { Pagination } from '@mantine/core';
import IconListCheck from "@/components/icon/icon-list-check";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconSearch from "@/components/icon/icon-search";
import IconPlusCircle from "@/components/icon/icon-plus-circle";
import BtnPrintQuote from "@/components/BtnPrintQuote";
import { customFormat } from '@/app/lib/format';
import { PERMISSIONS } from '@/constants/permissions';

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

export default function Quotes({
  token, customer_id, items = [], loading = false, t, hasPermission = () => false,
  page = 1, total = 0, pageSize = 20, onPageChange,
  sort = '', dir = 'asc', onSort,
  search = '', onSearch,
}) {
  const router = useRouter();

  const [view,     setView]     = useState('list');
  const [inputVal, setInputVal] = useState(search);

  useEffect(() => { setInputVal(search); }, [search]);

  const submitSearch = () => onSearch?.(inputVal);

  const addQuote = () => {
    const ICON_Q = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    Swal.fire({
      html: `<div style="padding:12px 0 6px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_Q}</div>
        <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t.question_do_you_have_the_codes}</h2>
      </div>`,
      showCancelButton: true,
      confirmButtonText: t.yes ?? 'Sí',
      cancelButtonText: t.no ?? 'No',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#ef4444',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes`);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes-without-code`);
      }
    });
  };

  const batch = () => router.push(`/admin/revision/quotes?customer=${customer_id}&option=batch`);

  const getRoute   = (q) => q.catCotizacion === 'NR' ? 'quotes' : 'quotes-without-code';
  const formatDate = (iso) => iso?.split('T')[0] ?? '';

  const estadoBadge = (estado) => {
    if (estado === 'COTIZADO') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (estado === 'COMPRADO') return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-3 pr-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.quotes}{' '}
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

          {hasPermission(PERMISSIONS.CREAR_COTIZACION) && (
            <>
              <button type="button" onClick={batch}
                className="h-9 flex items-center gap-1.5 rounded-lg border border-primary/40 px-4 text-primary text-sm font-medium hover:bg-primary/5 transition">
                {t.enter_codes_in_batch}
              </button>
              <button type="button" onClick={addQuote}
                className="h-9 flex items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-sm font-medium hover:bg-primary/90 transition shadow-sm">
                <IconPlusCircle className="h-4 w-4" />
                {t.new_quote}
              </button>
            </>
          )}
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

      {/* Vista lista */}
      {!loading && view === 'list' && items.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-3">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-10`} />
                  <SortableHeader col="quote"     label={t.nro_quote}  sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="item"      label="Items"         sort={sort} dir={dir} onSort={onSort} className="text-center" />
                  <SortableHeader col="total"     label="Total $us"     sort={sort} dir={dir} onSort={onSort} className="text-right" />
                  <SortableHeader col="order"     label={t.nro_pedido}  sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="status"    label={t.condition}   sort={sort} dir={dir} onSort={onSort} />
                  <SortableHeader col="quotedate" label={t.quote_date}  sort={sort} dir={dir} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((q, i) => {
                  const isSC = q.catCotizacion !== 'NR';
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className={tdClass}>
                        <BtnPrintQuote order={{ NroOrden: q.nroCotizacion }} token={token}
                          className="h-7 w-7 flex items-center justify-center rounded bg-sky-50 text-sky-600 hover:bg-sky-100 transition" />
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/revision/quotes?customer=${customer_id}&option=${getRoute(q)}&id=${q.nroCotizacion}`}
                            className="font-semibold text-primary hover:underline">
                            {q.nroCotizacion}
                          </Link>
                          {isSC
                            ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 leading-none">SC</span>
                            : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">NR</span>
                          }
                        </div>
                      </td>
                      <td className={`${tdClass} text-center`}>{q.nroItems}</td>
                      <td className={`${tdClass} text-right font-medium`}>{customFormat(q.totalSus)}</td>
                      <td className={tdClass}>{q.nroPedido || '—'}</td>
                      <td className={tdClass}>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoBadge(q.estado)}`}>
                          {q.estado}
                        </span>
                      </td>
                      <td className={`${tdClass} text-gray-400`}>{formatDate(q.fecCotizacion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista grid */}
      {!loading && view === 'grid' && items.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((q, i) => (
            <div key={i} className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <Link href={`/admin/revision/quotes?customer=${customer_id}&option=${getRoute(q)}&id=${q.nroCotizacion}`}
                  className="text-sm font-bold text-primary hover:underline">
                  #{q.nroCotizacion}
                </Link>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoBadge(q.estado)}`}>
                  {q.estado}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                {[
                  ['Items',            q.nroItems],
                  ['Total $us',        customFormat(q.totalSus)],
                  [t.nro_pedido,       q.nroPedido || '—'],
                  [t.quote_date,       formatDate(q.fecCotizacion)],
                  [t.type ?? 'Tipo',   q.catCotizacion],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{val}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <BtnPrintQuote order={{ NroOrden: q.nroCotizacion }} token={token}
                  className="h-7 w-7 flex items-center justify-center rounded bg-sky-50 text-sky-600 hover:bg-sky-100 transition" />
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
