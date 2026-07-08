'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import axios from 'axios';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import Link from 'next/link';
import IconSearch from '@/components/icon/icon-search';
import IconBackSpace from '@/components/icon/icon-backspace';

const url_search    = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/BuscarListaSinAsignar';
const URL_SAVE_APPS = 'repuestosporcotizar/guardar-aplicacion';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";


const ItemsUnassigned = ({ token, t, data, assignOrder }) => {
  const [selected, setSelected] = useState([]);
  const [filter,   setFilter]   = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [records,  setRecords]  = useState(data);

  const { register, getValues, setValue } = useForm();

  useEffect(() => { setRecords(data); setSelected([]); setPage(1); }, [data]);

  useEffect(() => {
    records.forEach(o => setValue(`app.${o.codRegistro}`, o.nomMarca ?? ''));
  }, [records]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return records;
    const f = filter.trim().toLowerCase();
    return records.filter(item =>
      (item.nomCliente      ?? '').toLowerCase().includes(f) ||
      (item.nroCotizacion?.toString() ?? '').includes(f) ||
      (item.nroParte        ?? '').toLowerCase().includes(f) ||
      (item.nomMarca        ?? '').toLowerCase().includes(f)
    );
  }, [records, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData   = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const rs = await axios.post(url_search, { NroParte: search.trim(), IndiceOrdenar: 0, ValToken: token });
      if (rs.data.estado === 'OK') {
        setRecords((rs.data.dato ?? []).map((o, i) => ({ ...o, id: i })));
        setPage(1);
      }
    } catch {}
  };

  const handleSaveAplication = async () => {
    const payload = pageData.map(o => ({
      CodRegistro:   o.codRegistro,
      NomAplicacion: getValues(`app.${o.codRegistro}`) ?? '',
    }));
    try {
      const rs = await axiosClient.put(URL_SAVE_APPS, payload);
      swalSuccess(rs.data?.mensaje ?? t.save_apps_quote_success);
      setSelected([]);
    } catch (err) {
      const msg = err?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', msg ?? t.save_apps_quote_error_server);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.unassigned_quote_items}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Búsqueda por nro parte (API) */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t.nro_part}
              className="h-10 w-44 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => { setSearch(''); setRecords(data); }} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
                <IconBackSpace className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/40 transition"
            title={t.search}
          >
            <IconSearch className="h-4 w-4" />
          </button>

          {/* Filtro local */}
          <div className="relative">
            <input
              type="text"
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1); }}
              placeholder={t.filter}
              className="h-10 w-44 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {filter && (
              <button onClick={() => setFilter('')} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
                <IconBackSpace className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          onClick={() => assignOrder(selected)}
          disabled={selected.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.assign}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M3 12h18"/></svg>
        </button>
        <button
          onClick={handleSaveAplication}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {t.save_application}
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
                <th className={thClass}>{t.nro_order}</th>
                <th className={thClass}>Creado Por</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={`${thClass} text-center`}>{t.amount}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.country}</th>
                <th className={thClass}>Asignado a</th>
                <th className={thClass}>{t.application}</th>
                <th className={`${thClass} text-center`}>Días</th>
                <th className={thClass}>F. Cotiza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
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
                      href={`/admin/revision/quotes?customer=${o.codCliente}&option=quotes&id=${o.nroCotizacion}`}
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
                  <td className={`${tdClass} font-medium`}>{o.nroParte}</td>
                  <td className={`${tdClass} text-center`}>{o.cantidad}</td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={`${tdClass} text-center`}>{o.pais}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.nomUsuario}</td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`app.${o.codRegistro}`)}
                      className="h-7 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                      {o.dias ?? 0}
                  </td>
                  <td className={`${tdClass} text-center`}>{o.fechaRegistra}</td>
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

export default ItemsUnassigned;
