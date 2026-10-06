"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError, swalSuccess } from '@/app/lib/swal';
import Select from '@/components/ui/Select';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnImprimir from "@/app/admin/document-delivery/BtnImprimir";
import IconTruck from "@/components/icon/icon-truck";
import IconClipboardText from "@/components/icon/icon-clipboard-text";
import { downloadShippingReport } from "@/app/lib/embalajeReports";
import Modal from "@/components/modal";
const DeliveryCostSummary = dynamic(() => import('@/components/delivery-cost-summary'), { ssr: false });

const URL_CONTROLES = 'entregas/controles';
const URL_ENTREGAS  = 'entregas';
const URL_CANCEL    = 'entregas/anular-despacho';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

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

export default function DeliveryReport() {
  const t            = useTranslation();
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // URL como fuente de verdad — la página ya no vive acá (scroll infinito la maneja sola).
  const urlSort    = searchParams.get('sort')       ?? 'delivery';
  const urlDir     = searchParams.get('dir')        ?? 'desc';
  const urlCutomer = parseInt(searchParams.get('codcutomer') || '0', 10);
  const urlTo      = parseInt(searchParams.get('to') || '0', 10);
  const urlTerm    = searchParams.get('term') ?? '';

  const [orders,        setOrders]        = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [destinos,      setDestinos]      = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(false);
  // Scroll infinito: 'loading' es solo la carga inicial/de filtros (reemplaza la
  // tabla); 'loadingMore' es el aviso de abajo mientras se anexa la siguiente página.
  const [loadingMore, setLoadingMore] = useState(false);
  const [exhausted,   setExhausted]   = useState(false);
  const [seleccionados,  setSeleccionados]  = useState([]);
  const [inputCustomer,  setInputCustomer]  = useState('');
  // Reporte "Envío": va por Núm. Entrega (numEntrega), no por Núm. Embalaje.
  // numEntrega en descarga, para deshabilitar solo ese botón mientras pide el PDF.
  const [downloadingShipping, setDownloadingShipping] = useState(null);

  // Modal "Resumen de Costos" por entrega — backend todavía no expone el reporte.
  const [showModal,   setShowModal]   = useState(false);
  const [modalEntrega, setModalEntrega] = useState(null);

  const openCostSummary = (numEntrega) => {
    setModalEntrega(numEntrega);
    setShowModal(true);
  };

  const handleDownloadShipping = async (numEntrega) => {
    setDownloadingShipping(numEntrega);
    try {
      await downloadShippingReport(numEntrega);
    } catch (error) {
      // Distingue 404 (endpoint todavía no implementado en el backend para
      // este embalaje) del resto de errores.
      const message = error?.response?.status === 404
        ? (t.shipping_report_unavailable ?? 'El reporte de Envío todavía no está disponible.')
        : (t.save_data_error ?? 'Ocurrió un error. Por favor, inténtalo nuevamente');
      swalError(t.error, message, t.close);
    } finally {
      setDownloadingShipping(null);
    }
  };

  const lastKeyRef     = useRef('');
  const pageRef        = useRef(1);
  const reqRef         = useRef(0);   // descarta respuestas de filtros/orden ya obsoletos
  const loadingMoreRef = useRef(false);
  const sentinelRef    = useRef(null);

  const { control, handleSubmit, reset, register } = useForm({
    defaultValues: { customer: null, destino: null, term: '' },
  });

  // Cargar controles y restaurar Selects desde URL
  useEffect(() => {
    axiosClient.get(URL_CONTROLES)
      .then(rs => {
        const { clientes = [], destinos = [] } = rs.data ?? {};
        setCustomers(clientes);
        setDestinos(destinos);

        // Restaurar selecciones desde URL params
        const selCliente = urlCutomer ? clientes.find(c => String(c.value) === String(urlCutomer)) ?? null : null;
        const selDestino = urlTo      ? destinos.find(d => String(d.value) === String(urlTo))      ?? null : null;
        if (selCliente || selDestino || urlTerm) {
          reset({ customer: selCliente, destino: selDestino, term: urlTerm });
        }
      })
      .catch(() => {});
  // Solo al montar — la restauración inicial usa los params del momento del mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildFetchParams = useCallback((page) => ({
    page, sort: urlSort, dir: urlDir,
    codcutomer: urlCutomer || undefined,
    to:         urlTo      || undefined,
    term:       urlTerm    || undefined,
  }), [urlSort, urlDir, urlCutomer, urlTo, urlTerm]);

  // Primera página: se dispara al cambiar filtros u ordenamiento (la página ya no vive en la URL).
  const fetchOrders = useCallback(async () => {
    const key = `${urlSort}|${urlDir}|${urlCutomer}|${urlTo}|${urlTerm}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    const reqId = ++reqRef.current;
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setLoadingMore(false);
    setExhausted(false);
    setLoading(true);
    setSeleccionados([]);
    try {
      const rs = await axiosClient.get(URL_ENTREGAS, { params: buildFetchParams(1) });
      if (reqId !== reqRef.current) return;
      setOrders(rs.data?.datos ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {
      swalError('Error', 'No se pudo cargar la lista de entregas.');
    } finally {
      if (reqId === reqRef.current) setLoading(false);
    }
  }, [urlSort, urlDir, urlCutomer, urlTo, urlTerm, buildFetchParams]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Siguientes páginas: se anexan a la lista (sin duplicar) y conservan la selección.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const reqId    = reqRef.current;
    const nextPage = pageRef.current + 1;
    try {
      const rs   = await axiosClient.get(URL_ENTREGAS, { params: buildFetchParams(nextPage) });
      if (reqId !== reqRef.current) return;
      const rows = rs.data?.datos ?? [];
      pageRef.current = nextPage;
      setTotal(rs.data?.total ?? total);
      if (rows.length === 0) { setExhausted(true); return; }
      setOrders(prev => {
        const seen = new Set(prev.map(o => o.numEntrega));
        return [...prev, ...rows.filter(o => !seen.has(o.numEntrega))];
      });
    } catch {
      setExhausted(true); // evita reintentar en bucle si el endpoint falla
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildFetchParams, total]);

  const hasMore = !exhausted && orders.length < total;

  // Centinela al final de la tabla: al acercarse al viewport carga la siguiente página.
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

  const buildParams = (overrides = {}) => {
    const base = {
      sort:       urlSort,
      dir:        urlDir,
      codcutomer: urlCutomer || undefined,
      to:         urlTo      || undefined,
      term:       urlTerm    || undefined,
    };
    const merged = { ...base, ...overrides };
    const p = new URLSearchParams();
    if (merged.sort !== 'delivery')      p.set('sort', merged.sort);
    if (merged.dir  !== 'desc')          p.set('dir',  merged.dir);
    if (merged.codcutomer)               p.set('codcutomer', String(merged.codcutomer));
    if (merged.to)                       p.set('to',   String(merged.to));
    if (merged.term)                     p.set('term', String(merged.term));
    return p.toString();
  };

  const onSubmit = (data) => {
    const q = buildParams({
      codcutomer: data.customer?.value ?? 0,
      to:         data.destino?.value  ?? 0,
      term:       data.term?.trim() || '',
    });
    lastKeyRef.current = '';
    router.push(`${pathname}${q ? `?${q}` : ''}`);
  };

  const getCustomerOptions = () => {
    if (inputCustomer.length < 2) return [];
    const lower = inputCustomer.toLowerCase();
    return customers.filter(c => c.label.toLowerCase().includes(lower));
  };

  const clearFilters = () => {
    reset({ customer: null, destino: null, term: '' });
    setInputCustomer('');
    lastKeyRef.current = '';
    const q = buildParams({ codcutomer: 0, to: 0, term: '' });
    router.push(`${pathname}${q ? `?${q}` : ''}`);
  };

  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    const q = buildParams({ sort: col, dir: newDir });
    lastKeyRef.current = '';
    router.replace(`${pathname}${q ? `?${q}` : ''}`, { scroll: false });
  };

  const toggleSeleccion = (order) =>
    setSeleccionados(prev =>
      prev.includes(order) ? prev.filter(i => i !== order) : [...prev, order]
    );

  const toggleTodos = () =>
    setSeleccionados(seleccionados.length === orders.length ? [] : [...orders]);

  const handleCancelDelivery = async () => {
    const { isConfirmed } = await swalConfirm(
      t.question_cancel_delivery,
      '',
      { confirmText: t.yes, cancelText: t.close }
    );
    if (!isConfirmed) return;
    try {
      const payload = seleccionados.map(o => ({ numEntrega: o.numEntrega }));
      const rs = await axiosClient.post(URL_CANCEL, payload);
      setSeleccionados([]);
      lastKeyRef.current = '';
      await fetchOrders();
      swalSuccess(rs.data?.mensaje ?? t.delivery_was_cancel);
    } catch {
      swalError('Error', 'No se pudo anular la entrega.');
    }
  };

  useDynamicTitle(`${t.query} | ${t.delivery_report}`);

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.delivery_report}
        </li>
      </ul>

      {/* Header: título + filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">

        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.delivery_report}{' '}
            <span className="font-normal text-gray-400">({total.toLocaleString()})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-2">

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.delivery_number ?? 'Núm. Entrega'}</span>
            <input
              type="text"
              {...register('term')}
              placeholder={t.delivery_number_ph ?? 'Buscar...'}
              className="h-10 w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.customer}</span>
            <div className="w-80">
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    options={getCustomerOptions()}
                    inputValue={inputCustomer}
                    onInputChange={(v, { action }) => { if (action === 'input-change') setInputCustomer(v); }}
                    onChange={(val) => { field.onChange(val); setInputCustomer(''); }}
                    filterOption={null}
                    noOptionsMessage={() => inputCustomer.length < 2 ? 'Escriba al menos 2 caracteres...' : 'Sin resultados'}
                    placeholder={t.select_option}
                    instanceId="select-customer"
                    classNamePrefix="react-select"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Destino</span>
            <div className="w-64">
              <Controller
                name="destino"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    options={destinos}
                    placeholder={t.select_option}
                    instanceId="select-destino"
                    classNamePrefix="react-select"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                )}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex h-10 items-center gap-1.5 rounded-lg px-3 bg-primary/20 text-primary hover:bg-primary/40 transition text-sm"
          >
            {t.btn_search ?? 'Buscar'}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t.btn_clear ?? 'Limpiar'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-14">
          <span className="text-sm text-gray-400 animate-pulse">{t.searching ?? 'Buscando...'}</span>
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="flex items-center justify-center py-14">
          <p className="text-sm text-gray-400">{t.empty_results ?? 'Sin resultados'}</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && orders.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              disabled={seleccionados.length === 0}
              onClick={handleCancelDelivery}
              type="button"
              className="h-8 inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition
                enabled:bg-red-50 enabled:text-red-600 enabled:hover:bg-red-100
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                dark:enabled:bg-red-900/20 dark:enabled:text-red-400
                dark:disabled:bg-gray-700 dark:disabled:text-gray-600"
            >
              {t.cancel_delivery}
              {seleccionados.length > 0 && (
                <span className="bg-red-500 text-white rounded-full h-4 min-w-[1rem] px-1 text-[10px] flex items-center justify-center">
                  {seleccionados.length}
                </span>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-20`}>
                    <label className="cursor-pointer flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="form-checkbox border border-gray-400"
                        checked={seleccionados.length === orders.length}
                        onChange={toggleTodos}
                      />
                    </label>
                  </th>
                  <SortableHeader col="delivery"  label={t.nro_delivery}  sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="date"      label={t.date}          sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="to"        label={t.to_customer}   sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="received"  label={t.received_by}   sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="delivered" label={t.delivered_by}  sort={urlSort} dir={urlDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((o, index) => (
                  <tr key={index} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${o.esCopia ? 'bg-sky-50/60 dark:bg-sky-900/10' : ''}`}>
                    <td className={tdClass}>
                      <div className="flex items-center justify-center gap-1.5">
                        <label className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox border border-gray-400"
                            checked={seleccionados.includes(o)}
                            onChange={() => toggleSeleccion(o)}
                          />
                        </label>
                        <BtnImprimir
                          t={t}
                          row={{ NumEmbalaje: o.nroEmbalaje, NumDespacho: o.numEntrega, CodPais: o.codPais }}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        />
                        {/* Reporte de Envío — va por Núm. Entrega, no por Núm. Embalaje */}
                        <button
                          type="button"
                          title={t.shipping_report ?? 'Reporte de Envío'}
                          disabled={downloadingShipping === o.numEntrega}
                          onClick={() => handleDownloadShipping(o.numEntrega)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingShipping === o.numEntrega
                            ? <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                            : <IconTruck className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          title={t.cost_summary ?? 'Resumen Costo'}
                          onClick={() => openCostSummary(o.numEntrega)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <IconClipboardText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/queries/delivery-report/${o.numEntrega}`} className="font-semibold text-primary hover:underline">
                          {o.numEntrega}
                        </Link>
                        {o.esCopia && (
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            {t.copy ?? 'Copia'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecEntrega}</td>
                    <td className={tdClass}>
                      {/* codCliente != 0 → entrega a cliente (bandera + nombre cliente).
                          codCliente == 0 → entrega de MI a Representante (solo destino, sin bandera). */}
                      <div className="flex items-center gap-2">
                        {o.codCliente ? (
                          <>
                            {o.codPais && (
                              <img
                                src={`/assets/flags/${o.codPais.toLowerCase()}.svg`}
                                alt={o.codPais}
                                className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                              />
                            )}
                            <span>{o.cliente}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">{o.destino}</span>
                        )}
                      </div>
                    </td>
                    <td className={`${tdClass} text-gray-500`}>{o.recibidoPor || '—'}</td>
                    <td className={tdClass}>{o.entregadoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scroll infinito: centinela que dispara la siguiente página al acercarse. */}
      {!loading && orders.length > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6 text-xs text-gray-400">
          {loadingMore
            ? <span className="animate-pulse">{t.searching ?? 'Buscando...'}</span>
            : !hasMore && total > 0 && <span>{orders.length} / {total}</span>}
        </div>
      )}

      <Modal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={t.cost_summary ?? 'Resumen Costo'}
        size="w-full max-w-6xl"
        content={modalEntrega && <DeliveryCostSummary close={() => setShowModal(false)} t={t} numEntrega={modalEntrega} />}
      />
    </>
  );
}
