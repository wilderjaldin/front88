'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import DivideQuantity from "@/app/admin/purchase-order/divide-quantity";
import MailForm from "@/app/admin/purchase-order/MailForm";
import ChangeSupplier from "@/app/admin/purchase-order/change-supplier";
import BtnPrintProforma from "@/components/BtnPrintProforma";
import dynamic from 'next/dynamic';
const PdfViewerOrder = dynamic(() => import('@/app/admin/purchase-order/PdfViewerOrder'), { ssr: false });

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { customFormat } from '@/app/lib/format';
import Modal from '@/components/modal';
import { useRouter } from 'next/navigation';

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title) => Swal.fire({
  html: `<div style="display:flex;align-items:center;gap:8px;padding:0">${ICON_CHECK}<p style="color:#fff;font-size:13px;font-weight:600;margin:0;line-height:1.3;text-align:left">${title}</p></div>`,
  backdrop: false, position: 'top-end', padding: '10px 14px', background: '#16a34a', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const url_generate      = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/GenerarOrdCompra';
const url_validate      = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/ValidarOpcionPrv';
const url_update_order  = 'ordenescompra/actualizar';
const url_print_proforma = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/BorradorOrdenCompra';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`text-xs font-semibold ${accent ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>{value || '—'}</span>
  </div>
);

const PurchaseOrderDetails = ({ CadNroOrden, token, t, order, setOrder, items, setItems, contact, setReload, bloqueado = false }) => {
  const router = useRouter();

  const [show_modal,         setShowModal]       = useState(false);
  const [modal_title,        setModalTitle]       = useState('');
  const [modal_content,      setModalContent]     = useState(null);
  const [modal_size,         setModalSize]        = useState('w-full max-w-5xl');
  const [show_close_button,  setShowCloseModal]   = useState(true);
  const [bk_items,           setBackupItems]      = useState(items);
  const [selected,           setSelected]         = useState([]);
  const [isSelect,           setIsSelect]         = useState(false);
  const [updating,           setUpdating]         = useState(false);

  const { register, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: { others: customFormat(order.MtoOtros), shipping: customFormat(order.MtoShipping) },
  });

  const toggleSelect = (item) =>
    setSelected(prev => prev.includes(item) ? prev.filter(i => i.NroOrden !== item.NroOrden) : [...prev, item]);

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

  const divideQuantity = async () => {
    let isDivisible = true;
    selected.map((i, index) => {
      const quantity = Number(getValues(`items.${index}.quantity_purchased`));
      if (quantity == 1 && i.CantFaltante == 1) isDivisible = false;
    });
    if (!isDivisible) {
      Swal.fire({ title: t.error, text: t.not_disisible, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }
    if (selected[0]?.isDivide == 1) {
      Swal.fire({ title: t.error, text: `${t.has_already_been_divided}`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }
    const valid = await validate(selected[0].NroParteCompra);
    if (valid) {
      setModalTitle(t.divide_quantity); setModalSize('w-full max-w-xl'); setShowCloseModal(true);
      setModalContent(<DivideQuantity close={() => setShowModal(false)} t={t} item={selected[0]} items={items} setItems={setItems} />);
      setShowModal(true);
    }
  };

  const validate = async (NroParte) => {
    try {
      const rs = await axios.post(url_validate, { NroParte, ValToken: token });
      if (rs.data.estado == 'Ok') return true;
      Swal.fire({ title: t.error, text: `${t.empty_suppliers}`, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return false;
    } catch (_) {}
  };

  const changeSupplier = async () => {
    const valid = await validate(selected[0].NroParteCompra);
    if (valid) {
      setModalTitle(t.change_supplier); setModalSize('w-full max-w-5xl'); setShowCloseModal(true);
      setModalContent(<ChangeSupplier setReload={setReload} setSelectedItems={setSelected} CadNroOrden={CadNroOrden} close={() => setShowModal(false)} t={t} token={token} item={selected[0]} items={items} setItems={setItems} />);
      setShowModal(true);
    }
  };

  const showEmails = (order_id) => {
    setModalTitle(''); setModalSize('w-full max-w-3xl'); setShowCloseModal(false);
    setModalContent(<MailForm close={() => updateList()} print={print} t={t} token={token} order={order} order_id={order_id} />);
    setShowModal(true);
  };

  const print = (order_id) => {
    setShowModal(true); setModalSize('w-full max-w-2xl'); setShowCloseModal(false);
    let o = { NroOrdenCompra: order_id };
    setTimeout(() => {
      setModalContent(<PdfViewerOrder order={o} token={token} onClose={() => { setShowModal(false); showEmails(order_id); }} />);
    }, 300);
  };

  const updateList = () => window.location.reload();

  const generateOrder = async () => {
    try {
      let data_send = [];
      let CadOrdenCompra = [];
      selected.forEach(i => CadOrdenCompra.push(i.NroOrden));
      const CadNroOrden = [...new Set(CadOrdenCompra)].join(',');
      let different_quantities = false;
      const data = getValues();

      selected.forEach(i => {
        const itemIndex = items.findIndex(item => item.CodItem === i.CodItem);
        if (itemIndex === -1) return;
        const CantComprada = getValues(`items.${itemIndex}.quantity_purchased`);
        data_send.push({
          NomPrv: order.NomPrv, CadNroOrden, NumOrdCompra: 0,
          MtoShipping: data.shipping, MtoOtros: data.others,
          CodRepuesto: i.CodRepuesto, CodItem: i.CodItem, NroOrden: i.NroOrden,
          NroParteCliente: i.NroParteCliente, NroParteCompra: i.NroParteCompra,
          Descripcion: i.Descripcion, CantFaltante: i.CantFaltante, CantComprada,
          CostoSistema: i.CostoSistema, CostoReal: i.CostoReal,
          OrigenCompra: i.OrigenCompra, ValToken: token,
        });
        if (CantComprada < i.CantFaltante) different_quantities = true;
      });

      if (different_quantities) {
        Swal.fire({ title: t.error, text: t.different_quantities_purchase_order, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      const rs = await axios.post(url_generate, data_send);
      if (rs.data.estado === 'Ok') print(rs.data.dato);
    } catch (error) { console.error(error); }
  };

  const resetOrder = () => {
    setItems(bk_items);
    setSelected([]);
    setValue('others', order.MtoOtros);
    setValue('shipping', order.MtoShipping);
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
          codItem:       item.CodItem,
          nroCotizacion: item.NroOrden,
          costoReal:     getValues(`items.${index}.real_cost`) || 0,
        })),
      };
      const rs = await axiosClient.put(url_update_order, payload);
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
            <InfoRow label="País Proveedor"       value={order.NomPaisProveedor} />
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

      {/* Barra de acciones (solo cuando no hay OC existente) */}
      {!isExisting && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            disabled={isSelect || bloqueado}
            onClick={changeSupplier}
            className="h-9 flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.change_of_supplier}
          </button>
          <button
            disabled={isSelect || bloqueado}
            onClick={resetOrder}
            className="h-9 flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            {t.undo_changes}
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
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
                  <td className={tdClass}>{item.Descripcion}</td>
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
              <>
                <BtnPrintProforma
                  selected={selected}
                  disabled={isSelect || bloqueado}
                  token={token}
                  order={order}
                  t={t}
                  className="h-9 flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  disabled={isSelect || bloqueado}
                  onClick={generateOrder}
                  className="h-9 flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t.generate_purchase_order}
                </button>
              </>
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
