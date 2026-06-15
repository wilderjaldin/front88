"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import axiosClient from '@/app/lib/axiosClient';
import axios from 'axios';
import Swal from 'sweetalert2';
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { Pagination } from '@mantine/core';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconSearch from "@/components/icon/icon-search";
import IconBackSpace from "@/components/icon/icon-backspace";

const URL_ORDERS    = 'cotizaciones/ordenes-realizadas';
const URL_CONTROLES = 'cotizaciones/proceso/controles';
const URL_VERIFY    = process.env.NEXT_PUBLIC_API_URL + 'cotrealizadas/VerifCotizacion';

const PAGE_SIZE      = 20;
const ASYNC_MIN_CHARS = 2;
const ASYNC_LIMIT     = 20;

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

export default function OrdersPlaced() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  // URL params — fuente de verdad
  const urlPage    = Math.max(1, parseInt(searchParams.get("page")       || "1", 10));
  const urlSort    = searchParams.get("sort")       ?? '';
  const urlDir     = searchParams.get("dir")        ?? 'desc';
  const urlTerm    = searchParams.get("term")       ?? '';
  const urlEstado  = searchParams.get("estado")     ?? '';
  const urlCliente = searchParams.get("codCliente") ?? '';

  const [orders,    setOrders]    = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [estados,   setEstados]   = useState([]);
  const [clientes,  setClientes]  = useState([]);

  const lastKeyRef = useRef('');

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { nroOrden: urlTerm, estado: urlEstado || null, codCliente: null },
  });

  // Catálogos (carga una vez)
  useEffect(() => {
    axiosClient.get(URL_CONTROLES).then(rs => {
      setEstados(rs.data.estados   ?? []);
      setClientes(rs.data.clientes ?? []);
    }).catch(() => {});
  }, []);

  // Resolver codCliente de URL cuando carga el catálogo
  useEffect(() => {
    if (clientes.length === 0) return;
    reset(prev => ({
      ...prev,
      codCliente: urlCliente
        ? clientes.find(c => String(c.value) === String(urlCliente)) ?? null
        : prev.codCliente,
    }));
  }, [clientes.length]);

  // Sincronizar form cuando cambia la URL (botón atrás)
  useEffect(() => {
    reset(prev => ({
      ...prev,
      nroOrden: urlTerm,
      estado:   urlEstado || null,
      codCliente: urlCliente
        ? clientes.find(c => String(c.value) === String(urlCliente)) ?? prev.codCliente
        : null,
    }));
  }, [urlTerm, urlEstado, urlCliente]);

  // AsyncSelect: filtra en memoria a partir de ASYNC_MIN_CHARS caracteres
  const filterOpts = (opts, inputValue) => {
    const term = inputValue.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return opts.filter(o => o.label.toLowerCase().includes(term)).slice(0, ASYNC_LIMIT);
  };

  const loadClientes = useCallback(
    (inputValue, callback) => callback(filterOpts(clientes, inputValue)),
    [clientes]
  );

  // Fetch server-side
  const fetchOrders = useCallback(async () => {
    const key = `${urlPage}|${urlSort}|${urlDir}|${urlTerm}|${urlEstado}|${urlCliente}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLoading(true);
    try {
      const params = { page: urlPage };
      if (urlSort)    { params.sort = urlSort; params.dir = urlDir; }
      if (urlTerm)      params.nroOrden   = urlTerm;
      if (urlEstado)    params.codEstado  = urlEstado;
      if (urlCliente)   params.codCliente = urlCliente;
      const rs = await axiosClient.get(URL_ORDERS, { params });
      setOrders(rs.data.Datos  ?? rs.data.datos  ?? []);
      setTotal( rs.data.Total  ?? rs.data.total  ?? 0);
    } catch {} finally { setLoading(false); }
  }, [urlPage, urlSort, urlDir, urlTerm, urlEstado, urlCliente]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const applyFilter = ({ nroOrden, estado, codCliente }) => {
    const params = new URLSearchParams();
    const nro = nroOrden?.toString().trim();
    if (nro)         params.set("term",       nro);
    if (estado)      params.set("estado",     estado);
    if (codCliente)  params.set("codCliente", String(codCliente.value));
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilter = () => {
    reset({ nroOrden: '', estado: null, codCliente: null });
    lastKeyRef.current = '';
    router.push(pathname);
  };

  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); params.set("sort", col); params.set("dir", newDir);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set("page", String(newPage)); else params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const verify = (o) => {
    Swal.fire({
      title: t.verifying,
      showConfirmButton: false,
      timer: 1000,
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); },
    }).then(async () => {
      try {
        await axios.post(URL_VERIFY, { NroOrden: o.nroCotizacion, ValToken: token });
        const tab = o.tipCot === 'NR' ? 'quotes' : 'quotes-without-code';
        router.push(`/admin/revision/quotes?customer=${o.codCliente}&option=${tab}&id=${o.nroCotizacion}`);
      } catch {}
    });
  };

  const hasFilters = urlTerm || urlEstado || urlCliente;

  useDynamicTitle(`${t.query} | ${t.orders_done}`);

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.orders_done}
        </li>
      </ul>

      {/* Header: título + filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.orders_done} <span className="font-normal text-gray-400">({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <form
          onSubmit={handleSubmit(applyFilter)}
          className="flex flex-wrap items-center gap-2"
        >
          {/* Estado */}
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Select
                isClearable
                options={estados}
                value={estados.find(o => o.value === field.value) ?? null}
                onChange={opt => field.onChange(opt?.value ?? null)}
                placeholder={t.condition}
                styles={{ control: (base) => ({ ...base, minWidth: '150px', height: '40px' }) }}
              />
            )}
          />

          {/* Cliente (AsyncSelect, filtra desde 2 chars) */}
          <Controller
            name="codCliente"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                loadOptions={loadClientes}
                defaultOptions={false}
                value={field.value}
                onChange={opt => field.onChange(opt ?? null)}
                isClearable
                placeholder={t.customer}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < ASYNC_MIN_CHARS
                    ? `Ingresa ${ASYNC_MIN_CHARS} caracteres`
                    : t.no_results ?? 'Sin resultados'
                }
                styles={{ control: (base) => ({ ...base, minWidth: '200px', height: '40px' }) }}
              />
            )}
          />

          {/* Nro. Orden */}
          <input
            type="number"
            placeholder="Nro. Orden"
            {...register("nroOrden")}
            className="h-10 w-36 rounded-lg border border-gray-300 dark:border-gray-700
              bg-white dark:bg-gray-900 px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Lupa (submit) */}
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-lg
              bg-primary/20 text-primary hover:bg-primary/40 transition"
            title={t.search}
          >
            <IconSearch className="h-4 w-4" />
          </button>

          {/* Limpiar */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilter}
              className="flex h-10 items-center justify-center rounded-lg px-2
                bg-gray-200 text-gray-700 hover:bg-gray-300 transition
                dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title={t.btn_clear}
            >
              <IconBackSpace className="h-4 w-4 mr-1.5" />
              {t.btn_clear}
            </button>
          )}
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-14">
          <span className="text-sm text-gray-400 animate-pulse">{t.searching}</span>
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="flex items-center justify-center py-14">
          <p className="text-sm text-gray-400">{t.empty_results}</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && orders.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <SortableHeader col="client"    label={t.customer}   sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="quote"     label={t.nro_quote}  sort={urlSort} dir={urlDir} onSort={handleSort} className="text-center" />
                  <SortableHeader col="item"      label={t.nro_items}  sort={urlSort} dir={urlDir} onSort={handleSort} className="text-center" />
                  <SortableHeader col="total"     label="Total $us"    sort={urlSort} dir={urlDir} onSort={handleSort} className="text-right" />
                  <SortableHeader col="city"      label={t.city}       sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="status"    label={t.condition}  sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="quotedate" label={t.quote_date} sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="orderdate" label={t.date_order} sort={urlSort} dir={urlDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((o, i) => (
                  <tr key={i} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={`${tdClass} font-medium`}>{o.nomCliente}</td>
                    <td className={`${tdClass} text-center`}>
                      <button
                        onClick={() => verify(o)}
                        title={t.see_details}
                        className="font-semibold text-primary hover:underline"
                      >
                        {o.nroCotizacion}
                      </button>
                    </td>
                    <td className={`${tdClass} text-center`}>{o.nroItems}</td>
                    <td className={`${tdClass} text-right font-medium`}>{customFormat(o.totalSus)}</td>
                    <td className={`${tdClass} text-gray-500`}>{o.nomCiudad}</td>
                    <td className={tdClass}>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {o.estado}
                      </span>
                    </td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecCotizacion}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecOrden}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && total > PAGE_SIZE && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={Math.ceil(total / PAGE_SIZE)}
            value={urlPage}
            onChange={handlePageChange}
            size="sm"
            radius="xl"
          />
        </div>
      )}
    </>
  );
}
