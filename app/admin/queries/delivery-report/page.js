"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError, swalSuccess } from '@/app/lib/swal';
import Select from 'react-select';
import { Pagination } from '@mantine/core';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnPrintDelivery from "@/app/admin/queries/delivery-report/BtnPrintDelivery";

const URL_CONTROLES = 'entregas/controles';
const URL_ENTREGAS  = 'entregas';
const URL_CANCEL    = 'entregas/anular';

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
  const token        = useSelector(selectToken);
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // URL como fuente de verdad
  const urlPage    = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const urlSort    = searchParams.get('sort')       ?? 'delivery';
  const urlDir     = searchParams.get('dir')        ?? 'desc';
  const urlCutomer = parseInt(searchParams.get('codcutomer') || '0', 10);
  const urlTo      = parseInt(searchParams.get('to') || '0', 10);

  const [orders,        setOrders]        = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [destinos,      setDestinos]      = useState([]);
  const [total,         setTotal]         = useState(0);
  const [totalPages,    setTotalPages]    = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [seleccionados,  setSeleccionados]  = useState([]);
  const [inputCustomer,  setInputCustomer]  = useState('');

  const lastKeyRef = useRef('');

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { customer: null, destino: null },
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
        if (selCliente || selDestino) {
          reset({ customer: selCliente, destino: selDestino });
        }
      })
      .catch(() => {});
  // Solo al montar — la restauración inicial usa los params del momento del mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = useCallback(async () => {
    const key = `${urlPage}|${urlSort}|${urlDir}|${urlCutomer}|${urlTo}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLoading(true);
    setSeleccionados([]);
    try {
      const rs = await axiosClient.get(URL_ENTREGAS, {
        params: { page: urlPage, sort: urlSort, dir: urlDir, codcutomer: urlCutomer, to: urlTo },
      });
      setOrders(rs.data?.datos ?? []);
      setTotal(rs.data?.total ?? 0);
      setTotalPages(rs.data?.totalPaginas ?? 1);
    } catch {
      swalError('Error', 'No se pudo cargar la lista de entregas.');
    } finally {
      setLoading(false);
    }
  }, [urlPage, urlSort, urlDir, urlCutomer, urlTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const buildParams = (overrides = {}) => {
    const base = {
      page:       urlPage,
      sort:       urlSort,
      dir:        urlDir,
      codcutomer: urlCutomer || undefined,
      to:         urlTo      || undefined,
    };
    const merged = { ...base, ...overrides };
    const p = new URLSearchParams();
    if (merged.page && merged.page > 1)  p.set('page', String(merged.page));
    if (merged.sort !== 'delivery')      p.set('sort', merged.sort);
    if (merged.dir  !== 'desc')          p.set('dir',  merged.dir);
    if (merged.codcutomer)               p.set('codcutomer', String(merged.codcutomer));
    if (merged.to)                       p.set('to',   String(merged.to));
    return p.toString();
  };

  const onSubmit = (data) => {
    const q = buildParams({
      page:       1,
      codcutomer: data.customer?.value ?? 0,
      to:         data.destino?.value  ?? 0,
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
    reset({ customer: null, destino: null });
    setInputCustomer('');
    lastKeyRef.current = '';
    const q = buildParams({ page: 1, codcutomer: 0, to: 0 });
    router.push(`${pathname}${q ? `?${q}` : ''}`);
  };

  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    const q = buildParams({ page: 1, sort: col, dir: newDir });
    lastKeyRef.current = '';
    router.replace(`${pathname}${q ? `?${q}` : ''}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const q = buildParams({ page: newPage });
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
      const payload = { numEntregas: seleccionados.map(o => o.numEntrega) };
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
                  <SortableHeader col="customer"  label={t.customer}      sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="received"  label={t.received_by}   sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="delivered" label={t.delivered_by}  sort={urlSort} dir={urlDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((o, index) => (
                  <tr key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                        <BtnPrintDelivery
                          token={token}
                          t={t}
                          order={o}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        />
                      </div>
                    </td>
                    <td className={`${tdClass} font-semibold text-primary`}>{o.numEntrega}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecEntrega}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.destino}</td>
                    <td className={tdClass}>{o.cliente}</td>
                    <td className={`${tdClass} text-gray-500`}>{o.recibidoPor || '—'}</td>
                    <td className={tdClass}>{o.entregadoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
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
