'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import Modal from '@/components/modal';
import { customFormat } from '@/app/lib/format';
import { useDebounce } from 'use-debounce';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { useOptionsSelect } from '@/app/options';
import IconFile from '../icon/icon-file';
import IconPrinter from '../icon/icon-printer';
import IconInfoCircle from '../icon/icon-info-circle';
import Link from 'next/link';

const url_search          = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/BuscarItemLote';
const url_update_quantity = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarCantidad';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const ICON_Q = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_ERR = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const QuoteBatchForm = ({ t, token, _customer_, _order_ = [], _items_, _tracking_ }) => {

  const locale   = useSelector(getLocale);
  const brands   = useOptionsSelect('brands') || [];

  const [items,      setItems]     = useState([]);
  const [order,      setOrder]     = useState((_order_?.length) ? _order_ : null);
  const [customer,   setCustomer]  = useState(_customer_);
  const [showModal,  setShowModal] = useState(false);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm();

  const loadBrandOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(brands.filter(b => b.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [brands]);

  useEffect(() => { setOrder(_order_); },    [_order_]);
  useEffect(() => { setCustomer(_customer_); }, [_customer_]);
  useEffect(() => { updateInputs(items); },  [items]);

  const updateInputs = (list) => list.forEach((p, i) => setValue(`items.${i}.Cantidad`, p.Cantidad));

  const watchedItems   = useWatch({ control, name: 'items' });
  const [debouncedItems] = useDebounce(watchedItems, 800);

  useEffect(() => {
    if (!debouncedItems) return;
    debouncedItems.forEach(async (item, index) => {
      const original = items[index];
      if (!original || item.Cantidad === original.Cantidad) return;
      try {
        const rs = await axios.post(url_update_quantity, {
          Idioma: locale, NroOrden: order.NroOrden,
          CodItem: original.CodItem, Cantidad: item.Cantidad, ValToken: token,
        });
        if (rs.data.estado === 'OK') {
          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);
          updateInputs(rs.data.dato2);
        }
      } catch {}
    });
  }, [debouncedItems]);

  const onSearch = async (data) => {
    if (!data.brand) {
      Swal.fire({
        html: `<div style="padding:12px 0 6px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_ERR}</div>
          <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t.required_select_app ?? 'Selecciona una aplicación'}</h2>
        </div>`,
        confirmButtonText: t.close ?? 'Cerrar',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const normalized = data.batch
      .replace(/\t+/g, ' ').replace(/\s+/g, ' ').replace(/\r\n|\r|\n/g, ' ').trim();

    Swal.fire({
      html: t.searching ?? 'Buscando...',
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const rs = await axios.post(url_search, {
        Idioma:      locale,
        NroOrden:    order?.NroOrden ?? 0,
        CodCliente:  customer.CodCliente,
        NroPedido:   data.nro_order ?? '',
        MarcaEquipo: data.brand.label,
        NroParte:    normalized,
        ValToken:    token,
      });
      Swal.close();
      if (rs.data.estado === 'OK') {
        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
      }
    } catch { Swal.close(); }
  };

  const newQuote = () => {
    Swal.fire({
      html: `<div style="padding:12px 0 6px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_Q}</div>
        <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t.question_create_new_quote}</h2>
      </div>`,
      showCancelButton: true,
      confirmButtonText: t.yes ?? 'Sí',
      cancelButtonText:  t.btn_cancel ?? 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor:  '#6b7280',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        setOrder(null);
        setItems([]);
        setValue('batch', '');
        setValue('brand', null);
        setValue('nro_order', '');
      }
    });
  };

  const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-left whitespace-nowrap";
  const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

  const SummaryRow = ({ label, value, highlight }) => (
    <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── FORMULARIO ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Col 1 — Entrada de datos */}
        <div className="panel border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              {t.batch_codes ?? 'Códigos en lote'}
            </p>
            <textarea
              rows={10}
              {...register('batch', { required: { value: true, message: t.required_field } })}
              placeholder="01643-32780&#10;19M7824&#10;001811A"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900
                px-3 py-2 text-sm font-mono resize-none
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.batch && (
              <span className="text-red-400 text-xs mt-0.5 block">{errors.batch.message?.toString()}</span>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <IconInfoCircle className="h-3.5 w-3.5" />
              {t.how_to_copy_items ?? '¿Cómo copiar los ítems?'}
            </button>
          </div>

          {/* Aplicación */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.application} <span className="text-red-400">*</span>
            </label>
            <Controller
              name="brand"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <AsyncSelect
                  loadOptions={loadBrandOptions}
                  defaultOptions={false}
                  cacheOptions
                  isClearable
                  placeholder={t.select ?? 'Seleccionar'}
                  menuPosition="fixed"
                  menuShouldScrollIntoView={false}
                  noOptionsMessage={({ inputValue }) =>
                    (inputValue?.trim().length ?? 0) < ASYNC_MIN
                      ? `Ingresa ${ASYNC_MIN} caracteres`
                      : (t.no_results ?? 'Sin resultados')
                  }
                  value={field.value ?? null}
                  onChange={opt => field.onChange(opt ?? null)}
                  styles={{
                    control: (base) => ({ ...base, minHeight: '36px', fontSize: '13px' }),
                    valueContainer: (base) => ({ ...base, padding: '0 10px' }),
                  }}
                />
              )}
            />
            {errors.brand && (
              <span className="text-red-400 text-xs">{errors.brand.message?.toString()}</span>
            )}
          </div>

          {/* Nro. Pedido */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.nro_pedido ?? 'Nro. Pedido'}</label>
            <input
              type="text"
              autoComplete="off"
              {...register('nro_order')}
              placeholder={t.enter_nro_order ?? 'Ingresa Nro. Pedido'}
              className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-900 px-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit(onSearch)}
            className="w-full flex h-9 items-center justify-center rounded-lg bg-primary
              text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
          >
            {t.search ?? 'Buscar'}
          </button>
        </div>

        {/* Col 2+3 — Resumen de cotización */}
        <div className="md:col-span-2">
          {order?.NroOrden ? (
            <div className="panel border border-gray-200 dark:border-gray-700 p-5 h-full space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t.nro_quote ?? 'Nro. Cotización'}
                  </p>
                  <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1
                  text-base font-bold text-primary tabular-nums">
                  {order.NroOrden}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <SummaryRow label={t.nro_pedido   ?? 'Nro. Pedido'}    value={order.NroPedido    || '—'} />
                  <SummaryRow label={t.total_weight_lb ?? 'Peso total (lb)'} value={customFormat(order.TotalPeso ?? 0)} />
                  <SummaryRow label={t.quote_total   ?? 'Total'}          value={customFormat(order.Total ?? 0)} highlight />
                </div>
                <div>
                  <SummaryRow label={t.nro_items        ?? 'Ítems'}       value={order.NroItems     ?? 0} />
                  <SummaryRow label={t.total_spare_parts ?? 'Repuestos'}   value={order.TotRepuestos ?? 0} />
                  <SummaryRow label={t.freight          ?? 'Flete'}        value={customFormat(order.FleteInterno ?? 0)} />
                  <SummaryRow label={t.exchange_rate    ?? 'Tipo de cambio'} value={order.TipoCambio ?? '—'} />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href={`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${order.NroOrden}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t.go_to_quote ?? 'Ir a cotización'} →
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel border border-dashed border-gray-300 dark:border-gray-600 p-8 h-full
              flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <IconFile className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {t.batch_no_quote ?? 'Ingresa los códigos y busca para generar una cotización'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── TABLA DE ÍTEMS ────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t.items ?? 'Ítems'}{' '}
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {items.length}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={newQuote}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3
                  text-xs text-gray-600 hover:bg-gray-50 transition
                  dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <IconFile className="h-3.5 w-3.5" />
                {t.btn_new ?? 'Nueva'}
              </button>
              <button
                type="button"
                disabled
                className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3
                  text-xs text-gray-400 cursor-not-allowed
                  dark:border-gray-700 dark:bg-gray-800"
              >
                <IconPrinter className="h-3.5 w-3.5" />
                {t.btn_print ?? 'Imprimir'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={`${thClass} w-10 text-center`}>Item</th>
                  <th className={`${thClass} text-center`}>{t.qty ?? 'Cant.'}</th>
                  <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                  <th className={thClass}>{t.description ?? 'Descripción'}</th>
                  <th className={thClass}>{t.spare_part_type ?? 'Tipo'}</th>
                  <th className={thClass}>{t.application ?? 'Aplicación'}</th>
                  <th className={thClass}>{t.supplier ?? 'Proveedor'} / {t.brand ?? 'Marca'}</th>
                  <th className={`${thClass} text-right`}>{t.price_unit ?? 'P. Unit.'}</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>{t.t_delivery ?? 'T. Entrega'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, index) => (
                  <tr key={index} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className={`${tdClass} text-center font-medium text-gray-500`}>{item.CodItem}</td>
                    <td className={`${tdClass} text-center`}>
                      <input
                        step="any"
                        type="number"
                        {...register(`items.${index}.Cantidad`, { valueAsNumber: true })}
                        className="h-8 w-20 rounded-lg border border-gray-300 dark:border-gray-600
                          bg-white dark:bg-gray-900 px-2 text-center text-sm
                          focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                    <td className={`${tdClass} font-medium`}>{item.NroParte}</td>
                    <td className={tdClass}>{item.DesRepuesto}</td>
                    <td className={tdClass}>
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700
                        px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        {item.TipoRepuesto}
                      </span>
                    </td>
                    <td className={tdClass}>{item.Aplicacion}</td>
                    <td className={tdClass}>{item.Marca}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{customFormat(item.Precio)}</td>
                    <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(item.Total)}</td>
                    <td className={`${tdClass} text-gray-500`}>{item.TiEntrega}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL AYUDA ───────────────────────────────────────────────────── */}
      <Modal
        size="w-full max-w-3xl"
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={showModal}
        title={t.how_to_copy_items ?? '¿Cómo copiar los ítems?'}
        content={
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium">{t.help_quote_batch_title}</p>
            <p>{t.help_quote_batch_steps}</p>
            <p>{t.help_quote_batch_step1}</p>
            <p>{t.help_quote_batch_step2}</p>
            <img src="/assets/images/help-quote.jpg" alt="ayuda cotización lote" className="w-full rounded-lg mt-2" />
          </div>
        }
      />
    </div>
  );
};

export default QuoteBatchForm;
