'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import Swal from 'sweetalert2';
import axios from 'axios';
import Link from 'next/link';
import IconSearch from '@/components/icon/icon-search';
import IconBackSpace from '@/components/icon/icon-backspace';

const url_search    = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/BuscarListaSinAsignar';
const url_save_apps = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarAplicacion';

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
      CodRegistro: o.codRegistro,
      NomMarca:    getValues(`app.${o.codRegistro}`),
      ValToken:    token,
    }));
    try {
      const rs = await axios.post(url_save_apps, payload);
      if (rs.data.estado === 'OK') {
        Swal.fire({ position: 'top-end', icon: 'success', title: t.save_apps_quote_success, showConfirmButton: false, timer: 1500 });
      } else {
        Swal.fire({ position: 'top-end', icon: 'error', title: t.save_apps_quote_error, showConfirmButton: false, timer: 1500 });
      }
    } catch {
      Swal.fire({ position: 'top-end', icon: 'error', title: t.save_apps_quote_error_server, showConfirmButton: false, timer: 1500 });
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
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => assignOrder(selected)}
          disabled={selected.length === 0}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t.assign} →
        </button>
        <button
          onClick={handleSaveAplication}
          className="h-9 px-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition dark:border-gray-600 dark:bg-transparent dark:text-gray-300"
        >
          {t.save_application}
        </button>
        {selected.length > 0 && (
          <span className="text-xs font-medium text-primary ml-1">
            {selected.length} {t.selected ?? 'seleccionado(s)'}
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
