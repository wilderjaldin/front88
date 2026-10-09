"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import Select from '@/components/ui/Select';
import AsyncSelect from '@/components/ui/AsyncSelect';
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError, swalSuccess } from '@/app/lib/swal';
import Link from "next/link";
import { useTranslation } from "@/app/locales";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { customFormat } from '@/app/lib/format';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnPrintQuote from "@/components/BtnPrintQuote";
import IconSearchFilled from "@/components/icon/icon-search-filled";
import IconX from "@/components/icon/icon-x";
import Settings from "./settings";

// El menú se saca del flujo normal con un portal a <body> — mismo patrón que
// clientes/proveedores/representantes, para que no quede tapado por nada local.
const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const URL_PROCESO   = 'ordenesenproceso/proceso';
const URL_CONTROLES = 'ordenesenproceso/proceso/controles';
const URL_DELIVERED    = 'ordenesenproceso/entregado';
const URL_CANCEL_ORDER = 'ordenesenproceso/anular';

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

const daysBadge = (days) => {
  if (days < 7)  return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  if (days < 30) return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
};

export default function OrdersProcess() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  const option      = searchParams.get("option") || "";
  const customer_id = searchParams.get("customer");

  const urlSort     = searchParams.get("sort")     ?? '';
  const urlDir      = searchParams.get("dir")      ?? 'asc';
  const urlTerm     = searchParams.get("term")     ?? '';
  const urlEstado   = searchParams.get("estado")   ?? '';
  const urlCliente  = searchParams.get("codCliente") ?? '';

  const [customer, setCustomer] = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  // Scroll infinito: 'loading' es solo la carga inicial/de filtros (reemplaza la
  // tabla); 'loadingMore' es el aviso de abajo mientras se anexa la siguiente página.
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted,   setExhausted]   = useState(false);
  const [selected, setSelected] = useState([]);
  const [estados,  setEstados]  = useState([]);
  const [clientes, setClientes] = useState([]);

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: { term: urlTerm, estado: urlEstado || null, codCliente: null },
  });

  const termValue = watch('term');

  // Cargar controles una sola vez
  useEffect(() => {
    axiosClient.get(URL_CONTROLES).then(rs => {
      setEstados(rs.data.estados   ?? []);
      setClientes(rs.data.clientes ?? []);
    }).catch(() => {});
  }, []);

  // Cuando llegan los clientes, resolver el codCliente de la URL en el form
  useEffect(() => {
    if (clientes.length === 0) return;
    reset(prev => ({
      ...prev,
      codCliente: urlCliente
        ? clientes.find(c => String(c.value) === String(urlCliente)) ?? null
        : prev.codCliente,
    }));
  }, [clientes.length]);

  // Sincronizar form cuando la URL cambia (botón atrás)
  useEffect(() => {
    reset(prev => ({
      ...prev,
      term:   urlTerm,
      estado: urlEstado || null,
      codCliente: urlCliente
        ? clientes.find(c => String(c.value) === String(urlCliente)) ?? prev.codCliente
        : null,
    }));
  }, [urlTerm, urlEstado, urlCliente]);

  // AsyncSelect: filtra en memoria a partir de 2 caracteres
  const filterOpts = (opts, inputValue) => {
    const term = inputValue.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return opts.filter(o => o.label.toLowerCase().includes(term)).slice(0, ASYNC_LIMIT);
  };

  const loadClientes = useCallback(
    (inputValue, callback) => callback(filterOpts(clientes, inputValue)),
    [clientes]
  );

  useEffect(() => { if (option === "") setCustomer(null); }, [option]);

  const lastKeyRef     = useRef('');
  const pageRef        = useRef(1);
  const reqRef         = useRef(0);   // descarta respuestas de filtros/orden ya obsoletos
  const loadingMoreRef = useRef(false);
  const sentinelRef    = useRef(null);

  const buildParams = useCallback((page) => {
    const params = { page, term: urlTerm };
    if (urlSort)    { params.sort = urlSort; params.dir = urlDir; }
    if (urlEstado)    params.codEstado  = urlEstado;
    if (urlCliente)   params.codCliente = urlCliente;
    return params;
  }, [urlSort, urlDir, urlTerm, urlEstado, urlCliente]);

  // Primera página: se dispara al cambiar filtros u ordenamiento (la página ya no vive en la URL).
  const fetchOrders = useCallback(async () => {
    const key = `${urlSort}|${urlDir}|${urlTerm}|${urlEstado}|${urlCliente}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    const reqId = ++reqRef.current;
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setExhausted(false);
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_PROCESO, { params: buildParams(1) });
      if (reqId !== reqRef.current) return;
      setOrders(rs.data.datos ?? rs.data.Datos ?? []);
      setTotal(rs.data.total  ?? rs.data.Total  ?? 0);
      setSelected([]);
    } catch {}
    finally { if (reqId === reqRef.current) setLoading(false); }
  }, [urlSort, urlDir, urlTerm, urlEstado, urlCliente, buildParams]);

  useEffect(() => {
    if (!customer_id) fetchOrders();
  }, [customer_id, fetchOrders]);

  // Siguientes páginas: se anexan a la lista (sin duplicar) y conservan la selección.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const reqId    = reqRef.current;
    const nextPage = pageRef.current + 1;
    try {
      const rs   = await axiosClient.get(URL_PROCESO, { params: buildParams(nextPage) });
      if (reqId !== reqRef.current) return;
      const rows = rs.data.datos ?? rs.data.Datos ?? [];
      pageRef.current = nextPage;
      setTotal(rs.data.total ?? rs.data.Total ?? total);
      if (rows.length === 0) { setExhausted(true); return; }
      setOrders(prev => {
        const seen = new Set(prev.map(o => o.nroCotizacion));
        return [...prev, ...rows.filter(o => !seen.has(o.nroCotizacion))];
      });
    } catch {
      setExhausted(true); // evita reintentar en bucle si el endpoint falla
    }
    finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildParams, total]);

  const hasMore = !exhausted && orders.length < total;

  // Centinela al final de la tabla: al acercarse al viewport carga la siguiente página.
  // Depende de orders.length para re-observar tras cada carga (si el contenido sigue
  // sin llenar la pantalla, dispara otra).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore, orders.length]);

  const applyFilter = ({ term, estado, codCliente }) => {
    const params = new URLSearchParams();
    const t2 = term?.trim() ?? '';
    if (t2)          params.set("term",       t2);
    if (estado)      params.set("estado",     estado);
    if (codCliente)  params.set("codCliente", String(codCliente.value));
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilter = () => {
    reset({ term: '', estado: null, codCliente: null });
    lastKeyRef.current = '';
    router.push(pathname);
  };

  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", col);
    params.set("dir", newDir);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleSeleccion = (order) => {
    setSelected(prev =>
      prev.some(o => o.nroCotizacion === order.nroCotizacion)
        ? prev.filter(o => o.nroCotizacion !== order.nroCotizacion)
        : [...prev, order]
    );
  };
  const toggleTodos = () => setSelected(selected.length === orders.length ? [] : [...orders]);

  // Aplica la lista actualizada que devuelven entregado/anular directo, sin
  // volver a pedirla — mismo shape que ordenesenproceso/proceso (datos/total).
  const applyUpdatedList = (data) => {
    setOrders(data?.datos ?? data?.Datos ?? []);
    setTotal(data?.total  ?? data?.Total  ?? total);
    setSelected([]);
    pageRef.current = 1;
    setExhausted(false);
  };

  const delivered = async () => {
    const result = await swalConfirm(t.question_deliver_order, '', { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#15803d' });
    if (!result.isConfirmed) return;
    try {
      const data_send = selected.map(o => ({ NroCotizacion: o.nroCotizacion }));
      const rs = await axiosClient.post(URL_DELIVERED, data_send);
      // El backend puede responder 200 con la lista actualizada, o 200 con
      // {mensaje, errores} cuando ninguna cotización pudo marcarse como entregada.
      if (rs.data?.errores) {
        swalError(rs.data.mensaje ?? t.error, rs.data.errores.map(e => e.mensaje).join('\n'), t.close);
      } else {
        applyUpdatedList(rs.data);
        swalSuccess(t.order_delivered_success);
      }
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  };

  const cancelOrder = async () => {
    const result = await swalConfirm(t.question_cancel_order, '', { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#dc2626' });
    if (!result.isConfirmed) return;
    try {
      const data_send = selected.map(o => ({ NroCotizacion: o.nroCotizacion }));
      const rs = await axiosClient.post(URL_CANCEL_ORDER, data_send);
      applyUpdatedList(rs.data);
      swalSuccess(t.order_cancelled_success);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  };

  useDynamicTitle(`${customer ? t.orders_in_process + ' | ' + customer.label : t.revision} | ${t.orders_in_process}`);

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.revision}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {customer_id
            ? <Link href="/admin/revision/orders-process" className="text-primary hover:underline">{t.orders_in_process}</Link>
            : t.orders_in_process
          }
        </li>
        {customer && (
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span
              title={customer.NomPais || undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
            >
              {customer.CodPais && (
                <img
                  src={`/assets/flags/${customer.CodPais.toLowerCase()}.svg`}
                  alt={customer.NomPais}
                  className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                />
              )}
              {customer.label}
            </span>
          </li>
        )}
      </ul>

      {!customer_id && (
        <>
          {/* Header: título + filtros */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            {/* Título */}
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {t.orders_in_process} <span className="font-normal text-gray-400">({total})</span>
              </h1>
              <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
            </div>

            {/* Filtros — mismo patrón que clientes/proveedores/representantes:
                un solo grupo pegado a la derecha, dentro de una caja con borde. */}
            <form
              onSubmit={handleSubmit(applyFilter)}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm ml-auto"
            >
              {/* Estado */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.condition}</span>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <Select
                      isClearable
                      options={estados}
                      value={estados.find(o => o.value === field.value) ?? null}
                      onChange={opt => field.onChange(opt?.value ?? null)}
                      placeholder={t.all}
                      menuPortalTarget={portalTarget}
                      styles={{ control: (b) => ({ ...b, minWidth: '150px', width: '150px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                    />
                  )}
                />
              </div>

              {/* Cliente (AsyncSelect, filtra desde 2 chars) */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.customer}</span>
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
                      placeholder={`${t.search}...`}
                      noOptionsMessage={({ inputValue }) =>
                        inputValue.length < ASYNC_MIN_CHARS
                          ? `Ingresa ${ASYNC_MIN_CHARS} caracteres`
                          : t.no_results ?? 'Sin resultados'
                      }
                      menuPortalTarget={portalTarget}
                      styles={{ control: (b) => ({ ...b, minWidth: '440px', width: '440px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                    />
                  )}
                />
              </div>

              {/* Buscar — mismo "pill" que SearchFilter (input + x + lupa adosada) */}
              <div className="flex items-stretch h-9 w-64 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder={t.search}
                    {...register("term")}
                    className="w-full h-full px-3 pe-7 text-sm bg-transparent border-0 focus:outline-none"
                  />
                  {termValue && (
                    <button
                      type="button"
                      onClick={() => reset(prev => ({ ...prev, term: '' }))}
                      className="absolute inset-y-0 end-1.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-10 shrink-0 bg-primary text-white hover:bg-primary/90 transition"
                  title={t.search}
                >
                  <IconSearchFilled className="h-4 w-4" />
                </button>
              </div>

              {/* Limpiar */}
              <button
                type="button"
                onClick={clearFilter}
                className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t.btn_clear ?? 'Limpiar'}
              </button>
            </form>
          </div>

          {/* Barra de acciones */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
            <button
              type="button"
              onClick={delivered}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-50 text-green-600 text-xs font-semibold
                hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40
                disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              {t.delivered}
            </button>
            <button
              type="button"
              onClick={cancelOrder}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold
                hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40
                disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              {t.cancel_order}
            </button>
            {selected.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {selected.length} {t.selected ?? 'seleccionado(s)'}
              </span>
            )}
          </div>

          {/* Tabla */}
          {loading && (
            <div className="flex items-center justify-center py-14">
              <span className="text-sm text-gray-400 animate-pulse">{t.searching}</span>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="flex items-center justify-center py-14">
              <p className="text-sm text-gray-400">{t.quotes_empty}</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white dark:bg-gray-900">
                  <thead>
                    <tr>
                      <th className={`${thClass} w-10`}>
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={orders.length > 0 && selected.length === orders.length}
                          onChange={toggleTodos}
                        />
                      </th>
                      <th className={`${thClass} w-8`} />
                      <SortableHeader col="client"    label={t.customer}          sort={urlSort} dir={urlDir} onSort={handleSort} />
                      <SortableHeader col="quote"     label={t.nro_order}         sort={urlSort} dir={urlDir} onSort={handleSort} className="text-center" />
                      <th className={thClass}>{t.city}</th>
                      <SortableHeader col="status"    label={t.condition}         sort={urlSort} dir={urlDir} onSort={handleSort} />
                      <SortableHeader col="total"     label="Total $us"           sort={urlSort} dir={urlDir} onSort={handleSort} className="text-right" />
                      <SortableHeader col="days"      label={t.days_process}      sort={urlSort} dir={urlDir} onSort={handleSort} className="text-center" />
                      <SortableHeader col="orderdate" label={t.date_order}        sort={urlSort} dir={urlDir} onSort={handleSort} />
                      <SortableHeader col="modified"  label={t.date_update_order} sort={urlSort} dir={urlDir} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {orders.map((o, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          selected.some(s => s.nroCotizacion === o.nroCotizacion)
                            ? 'bg-primary/5 dark:bg-primary/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <td className={`${tdClass} text-center`}>
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={selected.some(s => s.nroCotizacion === o.nroCotizacion)}
                            onChange={() => toggleSeleccion(o)}
                          />
                        </td>
                        <td className={tdClass}>
                          <BtnPrintQuote order={{ NroOrden: o.nroCotizacion }} token={token}
                            className="h-7 w-7 flex items-center justify-center rounded bg-sky-50 text-sky-600 hover:bg-sky-100 transition" />
                        </td>
                        <td className={`${tdClass} font-medium`}>
                          <button
                            type="button"
                            onClick={() => router.push(`?customer=${o.codCliente}&option=quotes`)}
                            className="text-left hover:text-primary hover:underline transition-colors"
                          >
                            {o.nomCliente}
                          </button>
                        </td>
                        <td className={`${tdClass} text-center`}>
                          {o.estado !== "DESPACHADO"
                            ? <Link
                                href={`/admin/revision/quotes?customer=${o.codCliente}&option=confirmed-quote&id=${o.nroCotizacion}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {o.nroCotizacion}
                              </Link>
                            : <span className="text-gray-400">{o.nroCotizacion}</span>
                          }
                        </td>
                        <td className={`${tdClass} text-gray-500`}>{o.nomCiudad}</td>
                        <td className={tdClass}>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {o.estado}
                          </span>
                        </td>
                        <td className={`${tdClass} text-right font-medium`}>{customFormat(o.totalSus)}</td>
                        <td className={`${tdClass} text-center`}>
                          {o.canDias ?? 0}
                        </td>
                        <td className={`${tdClass} text-gray-400`}>{o.fecOrden}</td>
                        <td className={`${tdClass} text-gray-400`}>{o.fecModifica}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div ref={sentinelRef} className="flex items-center justify-center py-6 text-xs text-gray-400">
              {loadingMore
                ? <span className="animate-pulse">{t.searching}</span>
                : !hasMore && total > 0 && <span>{orders.length} / {total}</span>}
            </div>
          )}
        </>
      )}

      {customer_id && (
        <Settings
          customer_id={customer_id}
          setCustomer={setCustomer}
          onCustomerLoaded={(c) => setCustomer({
            value:   customer_id,
            label:   c.nomCliente ?? c.NomCliente ?? '',
            CodPais: c.codPais    ?? c.CodPais    ?? '',
            NomPais: c.nomPais    ?? c.NomPais    ?? '',
          })}
          token={token}
          t={t}
        />
      )}
    </>
  );
}
