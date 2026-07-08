'use client';
import { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconBackSpace from '@/components/icon/icon-backspace';
import Link from 'next/link';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const QuotesIdentify = ({ t, data, assignOrder }) => {
  const [selected, setSelected] = useState([]);
  const [filter,   setFilter]   = useState('');
  const [page,     setPage]     = useState(1);

  useEffect(() => { setSelected([]); setPage(1); }, [data]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return data;
    const f = filter.trim().toLowerCase();
    return data.filter(item =>
      (item.nomCliente      ?? '').toLowerCase().includes(f) ||
      (item.nroCotizacion?.toString() ?? '').includes(f) ||
      (item.nomMarca        ?? '').toLowerCase().includes(f)
    );
  }, [data, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData   = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.quotes_with_codes_to_identify}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>
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

      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          onClick={() => assignOrder(selected)}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.assign}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M3 12h18"/></svg>
        </button>
        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

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
                <th className={thClass}>{t.nro_quote}</th>
                <th className={thClass}>{t.created_by ?? 'Creado por'}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.country ?? 'País'}</th>
                <th className={thClass}>Asignado a</th>
                <th className={thClass}>{t.brand}</th>
                <th className={`${thClass} text-center`}>{t.days}</th>
                <th className={thClass}>{t.quote_date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
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
                  <td className={tdClass}>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/queries/spare-parts-identified/quotes?customer=${o.codCliente}&id=${o.nroCotizacion}`}
                    >
                      {o.nroCotizacion}
                    </Link>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      o.creadoPor === 1
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {o.creadoPor === 1 ? 'Cliente' : 'Usuario'}
                    </span>
                  </td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={tdClass}>
                    {o.codPais ? (
                      <div className="inline-flex items-center gap-1.5">
                        <img src={`/assets/flags/${o.codPais.toLowerCase()}.svg`} alt={o.nomPais} className="h-3.5 w-5 rounded-sm object-cover shrink-0" />
                        <span>{o.nomPais}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className={`${tdClass} text-gray-500`}>{o.nomUsuario}</td>
                  <td className={tdClass}>{o.nomMarca}</td>
                  <td className={`${tdClass} text-center`}>{o.dias ?? 0}</td>
                  <td className={tdClass}>{o.feCotizacion}</td>
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
  );
};

export default QuotesIdentify;
