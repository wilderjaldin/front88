'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import DivideQuantity from "@/app/admin/purchase-order/divide-quantity";
import MailForm from "@/app/admin/purchase-order/MailForm";
import ChangeSupplier from "@/app/admin/purchase-order/change-supplier";
import dynamic from 'next/dynamic';
const PdfViewerOrder = dynamic(() => import('@/app/admin/purchase-order/PdfViewerOrder'), { ssr: false });
const PdfViewerPreviewOC = dynamic(() => import('@/app/admin/purchase-order/PdfViewerPreviewOC'), { ssr: false });

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { customFormat } from '@/app/lib/format';
import Modal from '@/components/modal';
import { useRouter } from 'next/navigation';
import IconRepartir from '@/components/icon/icon-repartir';
import { swalError, swalConfirm, swalSuccessModal } from '@/app/lib/swal';

// Endpoints — ordenescompra/*
// URL_GENERATE (generar-oc) se llama desde PdfViewerPreviewOC con el mismo payload que URL_PREVIEW.
const URL_PREVIEW = 'ordenescompra/preview-oc';
const URL_OPCIONES_PROVEEDOR = 'ordenescompra/opciones-proveedor';
const URL_UPDATE_ORDER = 'ordenescompra/actualizar';
const URL_VERIFICAR_REVERSION = (numCorrelativo) => `ordenescompra/dividir-cantidad/${numCorrelativo}/verificar-reversion`;
const URL_REVERTIR_DIVISION = (numCorrelativo) => `ordenescompra/dividir-cantidad/${numCorrelativo}/revertir`;
const URL_RESTABLECER_PROVEEDOR_ORIGINAL = 'ordenescompra/restablecer-proveedor-original';
// Contrato legacy sin confirmar todavía para modernizar.
const URL_PRINT_PROFORMA = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/BorradorOrdenCompra';

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title) => Swal.fire({
  html: `<div style="display:flex;align-items:center;gap:8px;padding:0">${ICON_CHECK}<p style="color:#fff;font-size:13px;font-weight:600;margin:0;line-height:1.3;text-align:left">${title}</p></div>`,
  backdrop: false, position: 'top-end', padding: '10px 14px', background: '#16a34a', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const mapDetalleItem = (d) => ({
  CodRepuesto:           d.codRepuesto,
  CodPrv:                d.codProveedor ?? null,
  CodItem:               d.codItem,
  NroOrden:              d.nroCotizacion,
  NroParteCliente:       d.nroParte,
  NroParteCompra:        d.nroParteCompra,
  Descripcion:           d.desRepuesto,
  NomPrv:                d.razSoc ?? '',
  CantFaltante:          d.canFaltante,
  CantComprada:          d.canComprada,
  CostoSistema:          d.costo,
  CostoReal:             d.costoReal,
  Total:                 d.total,
  OrigenCompra:          d.origenCompra ?? '',
  isDivide:              d.isDivide ?? 0,
  EsDividido:            d.esDividido ?? false,
  NumCorrelativo:        d.numCorrelativo ?? null,
  PuedeDividirCantidad:  d.puedeDividirCantidad  ?? true,
  PuedeCambiarProveedor: d.puedeCambiarProveedor ?? true,
  CambioProveedor:       d.cambioProveedor ?? false,
  CodPrvOriginal:        d.codProveedorOriginal ?? null,
  NomPrvOriginal:        d.razSocOriginal ?? '',
});

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`text-xs font-semibold ${accent ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>{value || '—'}</span>
  </div>
);

const IconSwap = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="8" r="3"/>
    <path d="M2 20a6 6 0 0 1 12 0"/>
    <g transform="translate(11,0) scale(0.5)">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </g>
  </svg>
);

const PurchaseOrderDetails = ({ CadNroOrden, token, t, order, setOrder, items, setItems, contact, setReload, onOrderGenerated, bloqueado = false }) => {
  const router = useRouter();

  const [show_modal,         setShowModal]       = useState(false);
  const [modal_title,        setModalTitle]       = useState('');
  const [modal_content,      setModalContent]     = useState(null);
  const [modal_size,         setModalSize]        = useState('w-full max-w-5xl');
  const [show_close_button,  setShowCloseModal]   = useState(true);
  const [selected,           setSelected]         = useState([]);
  const [isSelect,           setIsSelect]         = useState(false);
  const [updating,           setUpdating]         = useState(false);
  const [undoingSupplier,    setUndoingSupplier]  = useState(false);

  const { register, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: { others: customFormat(order.MtoOtros), shipping: customFormat(order.MtoShipping) },
  });

  const toggleSelect = (item) =>
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const toggleAll = () =>
    setSelected(selected.length === items.length ? [] : items.map(d => d));

  useEffect(() => {
    setIsSelect(selected.length === 0);
  }, [selected]);

  useEffect(() => {
    items.map((i, index) => {
      setValue(`items.${index}.quantity_purchased`, i.CantComprada);
      setValue(`items.${index}.real_cost`, customFormat(i.CostoReal));
    });
  }, [items]);

  const divideQuantity = (item) => {
    const itemIndex = items.findIndex(i => i.CodItem === item.CodItem);
    const quantity = Number(getValues(`items.${itemIndex}.quantity_purchased`));
    if (quantity == 1 && item.CantFaltante == 1) {
      Swal.fire({ title: t.error, text: t.not_disisible, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }
    if (item?.isDivide == 1 || item?.EsDividido || item?.NumCorrelativo != null) {
      Swal.fire({ title: t.error, text: `${t.has_already_been_divided}`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }
    // La disponibilidad de otros proveedores la resuelve el propio modal contra
    // proveedores-disponibles (con su propio estado vacío) — no hace falta un
    // chequeo previo contra opciones-proveedor.
    setModalTitle(t.divide_quantity); setModalSize('w-full max-w-5xl'); setShowCloseModal(true);
    setModalContent(<DivideQuantity close={() => setShowModal(false)} t={t} item={item} setItems={setItems} order={order} CadNroOrden={CadNroOrden} setReload={setReload} />);
    setShowModal(true);
  };

  const undoDivideQuantity = async (item) => {
    if (!item.NumCorrelativo) return;
    try {
      const rs = await axiosClient.get(URL_VERIFICAR_REVERSION(item.NumCorrelativo));
      const info = rs.data;

      if (!info?.puedeRevertir) {
        swalError(t.error ?? 'Error', info?.motivo ?? (t.undo_divide_not_allowed ?? 'Esta división no se puede revertir.'), t.close ?? 'Cerrar');
        return;
      }

      const result = await swalConfirm(
        t.question_undo_divide_quantity ?? '¿Deshacer esta división?',
        `${info.canCambiada} × ${info.desRepuesto} (${info.nroParteCompra}) — ${info.razSocDestino} → ${info.razSocOriginal}`,
        { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#dc2626' }
      );
      if (!result.isConfirmed) return;

      const cadNroCotizacion = (CadNroOrden ?? '')
        .toString()
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !Number.isNaN(n));

      const rsRevert = await axiosClient.post(URL_REVERTIR_DIVISION(item.NumCorrelativo), {
        nomPrv:           order?.NomPrv,
        cadNroCotizacion,
      });

      setItems((rsRevert.data?.detalle ?? []).map(mapDetalleItem));
      setReload();
      swalSuccess(t.undo_divide_quantity_success ?? 'División revertida correctamente');
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? (t.undo_divide_error ?? 'No se pudo revertir la división.'), t.close ?? 'Cerrar');
    }
  };

  const validate = async (item) => {
    try {
      const data = {
        nroParte:       item.NroParteCliente,
        nroParteCompra: item.NroParteCompra,
      };
      if (item?.CodPrv) data.codProveedorActual = item.CodPrv;

      const rs = await axiosClient.post(URL_OPCIONES_PROVEEDOR, data);
      const total = (rs.data?.actual ? 1 : 0) + (rs.data?.otros?.length ?? 0);
      if (total > 0) return true;
      Swal.fire({ title: t.error, text: `${t.empty_suppliers}`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return false;
    } catch (_) {
      return false;
    }
  };

  const changeSupplier = async (item) => {
    const valid = await validate(item);
    if (valid) {
      setModalTitle(t.change_supplier); setModalSize('w-full max-w-5xl'); setShowCloseModal(true);
      setModalContent(<ChangeSupplier setReload={setReload} setSelectedItems={setSelected} CadNroOrden={CadNroOrden} close={() => setShowModal(false)} t={t} token={token} item={item} items={items} setItems={setItems} order={order} />);
      setShowModal(true);
    }
  };

  const showEmails = (order_id) => {
    setModalTitle(t.mail_supplier_title ?? 'Mail a Proveedor'); setModalSize('w-full max-w-3xl'); setShowCloseModal(false);
    setModalContent(<MailForm close={() => updateList(order_id)} print={print} t={t} token={token} order={order} order_id={order_id} />);
    setShowModal(true);
  };

  const print = (order_id) => {
    setModalTitle(t.purchase_order_generated ?? 'Orden de Compra Generada'); setModalSize('w-full max-w-5xl'); setShowCloseModal(false);
    setShowModal(true);
    let o = { NroOrdenCompra: order_id };
    setTimeout(() => {
      setModalContent(
        <PdfViewerOrder
          order={o}
          token={token}
          payload={buildOrderPayload()}
          onSendMessage={() => { setShowModal(false); showEmails(order_id); }}
          onClose={() => updateList(order_id)}
        />
      );
    }, 300);
  };

  // Cierre del paso final (enviar/no enviar mensaje, o "Cerrar" directo desde el PDF
  // de la OC generada) — siempre confirma que el proceso de compra terminó, con el
  // número de OC como referencia para el usuario.
  const updateList = (orderId) => {
    setShowModal(false);
    swalSuccessModal(
      t.the_purchase_order_was_generated,
      orderId
        ? `${t.nro_purchase_order ?? 'Nro. Orden de Compra'}: #${orderId}${order?.NomPrv ? ` — ${order.NomPrv}` : ''}`
        : ''
    );
    setReload?.();
    setOrder();
  };

  // Payload reconstruible en cualquier momento a partir del estado actual del form
  // — lo usan tanto la Vista Previa como la vista de "Orden de Compra Generada"
  // (esta última para poder descargar el Excel sin depender de un valor que solo
  // viviría en memoria durante la llamada a generateOrder).
  const buildOrderPayload = () => {
    const data = getValues();
    const Items = selected.map(i => {
      // Referencia exacta (no por CodItem): un ítem dividido genera varias filas
      // con el mismo CodItem pero distinto proveedor/costo, así que buscar por
      // CodItem siempre encontraría la primera y arrastraría su cantidad a todas.
      const itemIndex = items.indexOf(i);
      if (itemIndex === -1) return null;
      const canComprada = getValues(`items.${itemIndex}.quantity_purchased`);
      const costoReal = getValues(`items.${itemIndex}.real_cost`) || i.CostoReal;
      return {
        codRepuesto: i.CodRepuesto,
        codItem: i.CodItem,
        nroCotizacion: i.NroOrden,
        nroParte: i.NroParteCliente,
        nroParteCompra: i.NroParteCompra,
        desRepuesto: i.Descripcion,
        canFaltante: i.CantFaltante,
        canComprada,
        costo: i.CostoSistema,
        costoReal,
        origenCompra: i.OrigenCompra,
        costoSis: i.CostoSistema,
        costoInc: costoReal,
      };
    }).filter(Boolean);

    return { NomPrv: order.NomPrv, MtoOtros: data.others, MtoShipping: data.shipping, Items };
  };

  // Vista previa en PDF de la OC — mismo payload que URL_GENERATE, con costoReal/costoInc
  // tomados del input "Costo Real" de cada fila en vez del valor original del sistema.
  const generateOrder = async () => {
    try {
      const different_quantities = selected.some(i => {
        const itemIndex = items.indexOf(i);
        if (itemIndex === -1) return false;
        return getValues(`items.${itemIndex}.quantity_purchased`) < i.CantFaltante;
      });

      if (different_quantities) {
        Swal.fire({ title: t.error, text: t.different_quantities_purchase_order, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }

      const payload = buildOrderPayload();

      const res = await axiosClient.post(URL_PREVIEW, payload, { responseType: 'blob' });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const pdfBlobUrl = URL.createObjectURL(blob);

      setModalTitle(t.purchase_order_preview ?? 'Vista Previa OC'); setModalSize('w-full max-w-5xl'); setShowCloseModal(false);
      setModalContent(
        <PdfViewerPreviewOC
          t={t}
          pdfBlobUrl={pdfBlobUrl}
          payload={payload}
          onClose={() => setShowModal(false)}
          onGenerated={(order_id) => print(order_id)}
          onOrderGenerated={onOrderGenerated}
        />
      );
      setShowModal(true);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? t.error, t.close ?? 'Cerrar');
    }
  };

  const undoChangeProveedor = async () => {
    const changedItems = items.filter(i => i.CambioProveedor);
    if (changedItems.length === 0) return;

    const original = changedItems[0];
    const result = await swalConfirm(
      t.question_undo_change_supplier ?? '¿Volver al proveedor original?',
      `${original.NomPrvOriginal || '—'} ← ${order.NomPrv}`,
      { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#dc2626' }
    );
    if (!result.isConfirmed) return;

    const cadNroCotizacion = (CadNroOrden || String(original.NroOrden ?? ''))
      .toString()
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !Number.isNaN(n));

    setUndoingSupplier(true);
    try {
      let lastRs = null;
      for (const item of changedItems) {
        lastRs = await axiosClient.post(URL_RESTABLECER_PROVEEDOR_ORIGINAL, {
          nroCotizacion:    item.NroOrden,
          codItem:          item.CodItem,
          nomPrv:           order?.NomPrv,
          cadNroCotizacion,
        });
      }
      if (lastRs) setItems((lastRs.data?.detalle ?? []).map(mapDetalleItem));
      setReload?.();
      swalSuccess(t.undo_change_supplier_success ?? 'Proveedor original restaurado');
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? (t.undo_change_supplier_error ?? 'No se pudo revertir el proveedor.'), t.close ?? 'Cerrar');
    } finally {
      setUndoingSupplier(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = {
        numOrdenCompra: order.NroOrden,
        mtoShipping:    getValues('shipping') || 0,
        mtoOtros:       getValues('others')   || 0,
        items: items.map((item, index) => ({
          codRepuesto:   item.CodRepuesto,
          codProveedor:  item.CodPrv ?? null,
          codItem:       item.CodItem,
          nroCotizacion: item.NroOrden,
          costoReal:     getValues(`items.${index}.real_cost`) || 0,
          origenCompra:  item.OrigenCompra ?? '',
        })),
      };
      const rs = await axiosClient.put(URL_UPDATE_ORDER, payload);
      if (rs.status === 200) {
        swalSuccess(t.record_updated);
      }
    } catch (error) {
      const status = error?.response?.status;
      const body   = error?.response?.data;
      if (status === 400) {
        Swal.fire({ title: t.error, text: body?.mensaje ?? '', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      } else if (status === 403) {
        Swal.fire({ title: t.error, text: 'No tienes permisos para modificar esta orden de compra.', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      } else if (status === 500) {
        Swal.fire({ title: body?.mensaje ?? t.error, text: body?.detalle ?? '', icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    } finally {
      setUpdating(false);
    }
  };

  const isExisting = !!order.NroOrden;
  const inputCls = `h-8 w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed`;
  const cambioProveedorItem = items.find(i => i.CambioProveedor);

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query ?? 'Consulta'}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          <button onClick={setOrder} className="text-primary hover:underline">
            {t.purchase_orders ?? 'Órdenes de Compra'}
          </button>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            OC #{order.NroOrden} · {order.NomPrv}
          </span>
        </li>
      </ul>

      {/* Título + botón volver */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              OC #{order.NroOrden}
            </h1>
            {bloqueado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Recepcionada
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{order.NomPrv}</p>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>
        <button
          onClick={setOrder}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t.back}
        </button>
      </div>

      {/* Encabezado */}
      <div className="panel p-0 mt-2 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
          {/* Datos OC */}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Orden de Compra</p>
            <InfoRow label={t.nro_purchase_order} value={order.NroOrden} accent />
            <InfoRow label={t.supplier}           value={order.NomPrv} />
            {cambioProveedorItem && (
              <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t.original_supplier ?? 'Proveedor Original'}</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {cambioProveedorItem.NomPrvOriginal || '—'}
                  </span>
                  {!isExisting && (
                    <button
                      type="button"
                      disabled={bloqueado || undoingSupplier}
                      onClick={undoChangeProveedor}
                      title={t.undo_change_supplier_hint ?? 'Vuelve todos los ítems al proveedor original'}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-red-50 text-red-600 text-[10px] font-semibold hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5"/>
                      </svg>
                      {undoingSupplier ? (t.saving ?? 'Deshaciendo…') : (t.undo_changes ?? 'Deshacer Cambios')}
                    </button>
                  )}
                </div>
              </div>
            )}
            <InfoRow label="País Proveedor"       value={
              order.NomPaisProveedor ? (
                <span className="inline-flex items-center gap-1.5">
                  {order.CodPaisProveedor && (
                    <img src={`/assets/flags/${order.CodPaisProveedor.toLowerCase()}.svg`}
                      alt={order.NomPaisProveedor}
                      className="h-3.5 w-5 rounded-sm object-cover shrink-0" />
                  )}
                  {order.NomPaisProveedor}
                </span>
              ) : '—'
            } />
            <InfoRow label="País Destino"         value={
              order.NomPaisDestino ? (
                <span className="inline-flex items-center gap-1.5">
                  {order.CodPaisDestino && (
                    <img src={`/assets/flags/${order.CodPaisDestino.toLowerCase()}.svg`}
                      alt={order.NomPaisDestino}
                      className="h-3.5 w-5 rounded-sm object-cover shrink-0" />
                  )}
                  {order.NomPaisDestino}
                </span>
              ) : '—'
            } />
            <InfoRow label="Nro. Orden"           value={order.NumOrden} />
          </div>
          {/* Contacto */}
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{t.contact ?? 'Contacto'}</p>
            <InfoRow label={t.name_contact} value={contact?.NomContato} />
            <InfoRow label={t.email}        value={contact?.Mail}       />
            <InfoRow label={t.phone}        value={contact?.Telefono}   />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                {!isExisting && <th className={`${thClass} w-16`}></th>}
                <th className={`${thClass} w-10`}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-primary cursor-pointer"
                    checked={selected.length === items.length && items.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className={thClass}>{t.nro_part_customer}</th>
                <th className={thClass}>{t.nro_part_purchase}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.missing_amount}</th>
                <th className={`${thClass} text-center`}>{t.quantity_purchased}</th>
                <th className={`${thClass} text-right`}>{t.system_cost}</th>
                <th className={`${thClass} text-right`}>{t.actual_cost}</th>
                <th className={`${thClass} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, index) => (
                <tr key={index} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected.includes(item) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                  {!isExisting && (
                    <td className={tdClass}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={bloqueado || !item.PuedeCambiarProveedor}
                          onClick={() => changeSupplier(item)}
                          title={!item.PuedeCambiarProveedor ? (t.change_supplier_not_available ?? 'Este ítem no admite cambio de proveedor') : t.change_of_supplier}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <IconSwap className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={bloqueado || !item.PuedeDividirCantidad || item.isDivide == 1 || item.EsDividido || item.NumCorrelativo != null}
                          onClick={() => divideQuantity(item)}
                          title={
                            (item.isDivide == 1 || item.EsDividido || item.NumCorrelativo != null)
                              ? (t.has_already_been_divided ?? 'Este ítem ya fue dividido')
                              : !item.PuedeDividirCantidad
                                ? (t.divide_quantity_not_available ?? 'Este ítem no admite dividir cantidad')
                                : t.divide_quantity
                          }
                          className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <IconRepartir className="h-4 w-4 rotate-180" />
                        </button>
                        {item.NumCorrelativo != null && (
                          <button
                            type="button"
                            disabled={bloqueado}
                            onClick={() => undoDivideQuantity(item)}
                            title={t.undo_divide_quantity ?? 'Deshacer división'}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <IconRepartir className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  <td className={tdClass}>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-primary cursor-pointer"
                      checked={selected.includes(item)}
                      onChange={() => toggleSelect(item)}
                    />
                  </td>
                  <td className={tdClass}>{item.NroParteCliente}</td>
                  <td className={`${tdClass} font-medium text-primary`}>{item.NroParteCompra}</td>
                  <td className={tdClass}>
                    {item.Descripcion}
                    {item.NomPrv && (
                      <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{item.NomPrv}</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-center`}>{item.CantFaltante}</td>
                  <td className={`${tdClass} text-center`}>
                    { item.CantComprada }
                  </td>
                  <td className={`${tdClass} text-right`}>{customFormat(item.CostoSistema)}</td>
                  <td className={`${tdClass} text-right`}>
                    <input
                      type="text"
                      {...register(`items.${index}.real_cost`)}
                      disabled={bloqueado}
                      className={inputCls}
                    />
                  </td>
                  <td className={`${tdClass} text-right font-medium`}>{customFormat(item.Total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="panel mt-4 p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-start justify-between gap-6">

          {/* Botones */}
          <div className="flex flex-wrap items-center gap-2">
            {!isExisting && (
              <button
                disabled={isSelect || bloqueado}
                onClick={generateOrder}
                className="h-9 flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.generate_purchase_order}
              </button>
            )}
            <button
              disabled={!isExisting || bloqueado || updating}
              onClick={handleUpdate}
              className="h-9 flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white px-4 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {t.btn_update}
            </button>
          </div>

          {/* Totales */}
          <div className="flex items-start gap-8">
            {/* Inputs otros/shipping */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-20 text-right">{t.others}</label>
                <input
                  type="text"
                  autoComplete="off"
                  {...register('others')}
                  disabled={bloqueado}
                  className="h-8 w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-20 text-right">Shipping</label>
                <input
                  type="text"
                  autoComplete="off"
                  {...register('shipping')}
                  disabled={bloqueado}
                  className="h-8 w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Sub Total / Total */}
            <div className="space-y-2 min-w-[160px]">
              <div className="flex items-center justify-between gap-6 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-xs text-gray-500">Sub Total</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.MtoSubTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-gray-500">Total Sus.</span>
                <span className="text-base font-bold text-green-600 dark:text-green-400">{customFormat(order.MtoTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show_close_button={show_close_button}
        size={modal_size}
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={modal_title}
        content={modal_content}
      />
    </>
  );
};

export default PurchaseOrderDetails;
