"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { Pagination } from '@mantine/core';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconSearch from "@/components/icon/icon-search";
import IconBackSpace from "@/components/icon/icon-backspace";
import IconPencil from "@/components/icon/icon-pencil";
import IconTag from "@/components/icon/icon-tag";
import PrintLabelsModal from "./PrintLabelsModal";
import Modal from "@/components/modal";
import PurchaseOrderDetails from "@/app/admin/purchase-order/purchase-order";
import BtnPrintOrder from "@/components/BtnPrintOrder";
import AccessDenied from "@/components/AccessDenied";
import Swal from 'sweetalert2';

const URL_LIST   = 'ordenescompra/listar';
const URL_DETAIL = 'ordenescompra';

const PAGE_SIZE = 20;

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

export default function PurchaseOrders() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  // URL como fuente de verdad
  const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const urlSort = searchParams.get("sort") ?? '';
  const urlDir  = searchParams.get("dir")  ?? 'desc';
  const urlOc   = searchParams.get("oc")   ?? '';
  const urlCot  = searchParams.get("cot")  ?? '';
  const urlEdit = searchParams.get("edit") ?? '';

  const [orders,     setOrders]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [forbidden,  setForbidden]  = useState(false);
  const [order,         setOrder]        = useState({});
  const [items,         setItems]        = useState([]);
  const [contact,       setContact]      = useState({});
  const [bloqueado,     setBloqueado]    = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [labelsOpen,    setLabelsOpen]    = useState(false);
  const [labelsDetalle, setLabelsDetalle] = useState([]);
  const [labelsNroOC,   setLabelsNroOC]   = useState(null);
  const [labelsLoading, setLabelsLoading] = useState(false);

  const lastKeyRef = useRef('');

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { oc: urlOc, cot: urlCot },
  });

  // Sincronizar form al navegar con atrás/adelante
  useEffect(() => {
    reset({ oc: urlOc, cot: urlCot });
  }, [urlOc, urlCot]);

  const fetchOrders = useCallback(async () => {
    const key = `${urlPage}|${urlSort}|${urlDir}|${urlOc}|${urlCot}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    setLoading(true);
    try {
      const params = { page: urlPage };
      if (urlSort) { params.sort = urlSort; params.dir = urlDir; }
      if (urlOc)   params.oc  = urlOc;
      if (urlCot)  params.cot = urlCot;
      const rs = await axiosClient.get(URL_LIST, { params });
      setOrders(rs.data.datos        ?? []);
      setTotal(rs.data.total         ?? 0);
      setTotalPages(rs.data.totalPaginas ?? 1);
    } catch (err) {
      if (err?.response?.status === 403) setForbidden(true);
    } finally { setLoading(false); }
  }, [urlPage, urlSort, urlDir, urlOc, urlCot]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const applyFilter = ({ oc, cot }) => {
    const params = new URLSearchParams();
    if (oc?.trim())  params.set("oc",  oc.trim());
    if (cot?.trim()) params.set("cot", cot.trim());
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilter = () => {
    reset({ oc: '', cot: '' });
    lastKeyRef.current = '';
    router.push(pathname);
  };

  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("sort", col);
    params.set("dir", newDir);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set("page", String(newPage)); else params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const fetchDetail = useCallback(async (nroOrdenCompra) => {
    setLoadingDetail(true);
    try {
      const rs   = await axiosClient.get(`${URL_DETAIL}/${nroOrdenCompra}`);
      const data = rs.data;
      const enc  = data.encabezado ?? {};
      const con  = data.contacto   ?? {};

      if (!data.editable) {
        setOrder({});
        setItems([]);
        setContact({});
        await Swal.fire({
          icon: 'warning',
          text: 'No puede modificar la Orden de Compra porque fué recepcionada.',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Cerrar',
        });
        const params = new URLSearchParams(window.location.search);
        params.delete('edit');
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        return;
      }

      setBloqueado(data.bloqueado ?? false);
      setOrder({
        NroOrden:         nroOrdenCompra,
        NumOrden:         enc.numOrden,
        NomPrv:           enc.nomPrv,
        CodPrv:           enc.codPrv ?? enc.codProveedor ?? null,
        NomPaisProveedor: enc.nomPaisProveedor,
        CodPaisProveedor: enc.codPaisProveedor,
        CodPaisDestino:   enc.codPais,
        NomPaisDestino:   enc.nomPais,
        MtoShipping:      enc.mtoShipping,
        MtoOtros:         enc.mtoOtros,
        MtoSubTotal:      enc.subTotal,
        MtoTotal:         enc.total,
      });
      setItems((data.detalle ?? []).map(d => ({
        CodRepuesto:     d.codRepuesto,
        CodPrv:          d.codProveedor ?? d.codPrv ?? null,
        CodItem:         d.codItem,
        NroOrden:        d.nroCotizacion,
        NroParteCliente: d.nroParte,
        NroParteCompra:  d.nroParteCompra,
        Descripcion:     d.desRepuesto,
        CantFaltante:    d.canFaltante,
        CantComprada:    d.canComprada,
        CostoSistema:    d.costo,
        CostoReal:       d.costoReal,
        Total:           d.total,
      })));
      setContact({
        NomContato: con.nomContacto,
        Mail:       con.email,
        Telefono:   con.telefono,
      });
    } catch (_) {} finally { setLoadingDetail(false); }
  }, []);

  // Restaurar detalle al refrescar o navegar con el botón atrás del browser
  useEffect(() => {
    if (!urlEdit) return;
    fetchDetail(Number(urlEdit));
  }, [urlEdit, fetchDetail]);

  const handleEdit = (o) => {
    if (!o.editable) {
      Swal.fire({ icon: 'warning', text: 'No puede modificar la Orden de Compra porque fué recepcionada.', confirmButtonColor: '#dc2626', confirmButtonText: 'Cerrar' });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", String(o.nroOrdenCompra));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    setOrder({});
    setItems([]);
    setContact({});
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePrintLabels = async (o) => {
    setLabelsDetalle([]);
    setLabelsNroOC(o.nroOrdenCompra);
    setLabelsOpen(true);
    setLabelsLoading(true);
    try {
      const rs = await axiosClient.get(`${URL_DETAIL}/${o.nroOrdenCompra}`);
      setLabelsDetalle(rs.data.detalle ?? []);
    } catch (_) {} finally { setLabelsLoading(false); }
  };

  const hasFilters = urlOc || urlCot;

  useDynamicTitle(`${t.query} | ${t.purchase_orders}`);

  if (forbidden) return <AccessDenied />;

  if (loadingDetail) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-sm text-gray-400 animate-pulse">{t.loading ?? 'Cargando...'}</span>
      </div>
    );
  }

  if (order.NroOrden) {
    return (
      <PurchaseOrderDetails
        CadNroOrden=""
        token={token}
        t={t}
        order={order}
        setOrder={handleBack}
        items={items}
        setItems={setItems}
        contact={contact}
        bloqueado={bloqueado}
      />
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.purchase_orders}
        </li>
      </ul>

      {/* Header: título + filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">

        {/* Título */}
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.purchase_orders} <span className="font-normal text-gray-400">({total.toLocaleString()})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        {/* Filtros */}
        <form onSubmit={handleSubmit(applyFilter)} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.nro_purchase_order}</span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Nro. OC"
              {...register("oc")}
              className="h-10 w-40 rounded-lg border border-gray-300 dark:border-gray-700
                bg-white dark:bg-gray-900 px-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Nro. Cotización</span>
            <input
              type="text"
              autoComplete="off"
              placeholder="Nro. Cot."
              {...register("cot")}
              className="h-10 w-40 rounded-lg border border-gray-300 dark:border-gray-700
                bg-white dark:bg-gray-900 px-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button type="submit"
            className="flex h-10 items-center gap-1.5 rounded-lg px-3
              bg-primary/20 text-primary hover:bg-primary/40 transition text-sm"
          >
            <IconSearch className="h-4 w-4" />
            {t.search ?? 'Buscar'}
          </button>
          <button type="button" onClick={clearFilter}
            className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <IconBackSpace className="h-4 w-4" />
            {t.btn_clear ?? 'Limpiar'}
          </button>
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
          <p className="text-sm text-gray-400">{t.empty_results ?? 'Sin resultados'}</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && orders.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-20`} />
                  <SortableHeader col="order"    label={t.nro_purchase_order} sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="date"     label={t.date_oc}             sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <SortableHeader col="supplier" label={t.supplier}            sort={urlSort} dir={urlDir} onSort={handleSort} />
                  <th className={thClass}>País Proveedor</th>
                  <th className={thClass}>País Destino</th>
                  <SortableHeader col="total"    label="Total"                 sort={urlSort} dir={urlDir} onSort={handleSort} className="text-right" />
                  <th className={`${thClass} text-right`}>{t.shipping_amount}</th>
                  <th className={`${thClass} text-right`}>{t.others_amount}</th>                  
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((o, i) => (
                  <tr key={i} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(o)}
                          title={t.edit}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${o.editable ? 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary dark:bg-gray-800 dark:text-gray-400' : 'bg-gray-100 text-gray-400 opacity-40 hover:opacity-60 dark:bg-gray-800 dark:text-gray-600'}`}
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintLabels(o)}
                          title="Imprimir etiquetas"
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition dark:bg-gray-800 dark:text-gray-400"
                        >
                          <IconTag className="h-3.5 w-3.5" />
                        </button>
                        <BtnPrintOrder
                          token={token}
                          t={t}
                          order={o}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        />
                      </div>
                    </td>
                    <td className={`${tdClass} font-semibold text-primary`}>{o.nroOrdenCompra}</td>
                    <td className={`${tdClass} text-gray-400`}>{o.fecOrdenCompra}</td>
                    <td className={tdClass}>{o.nomPrv}</td>
                    <td className={`${tdClass} text-gray-500`}>{o.nomPais || '—'}</td>
                    <td className={tdClass}>
                      {o.nomPaisDestino ? (
                        <span className="inline-flex items-center gap-1.5">
                          {o.codPaisDestino && (
                            <img
                              src={`/assets/flags/${o.codPaisDestino.toLowerCase()}.svg`}
                              alt={o.nomPaisDestino}
                              className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                            />
                          )}
                          <span className="text-xs text-gray-500">{o.nomPaisDestino}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className={`${tdClass} text-right font-medium`}>{customFormat(o.total)}</td>
                    <td className={`${tdClass} text-right`}>{customFormat(o.mtoShipping)}</td>
                    <td className={`${tdClass} text-right`}>{customFormat(o.mtoOtros)}</td>                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginado */}
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
      <Modal
        showModal={labelsOpen}
        closeModal={() => setLabelsOpen(false)}
        openModal={() => setLabelsOpen(true)}
        show_close_button={true}
        size="w-full max-w-4xl"
        title="Imprimir Etiquetas"
        content={
          labelsLoading
            ? <p className="text-sm text-gray-400 animate-pulse py-6 text-center">{t.loading ?? 'Cargando...'}</p>
            : <PrintLabelsModal detalle={labelsDetalle} numOrdenCompra={labelsNroOC} />
        }
      />
    </>
  );
}
