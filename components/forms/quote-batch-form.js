'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import Modal from '@/components/modal';
import OptionsItemsQuote from '@/components/forms/options-items-quote';
import { customFormat } from '@/app/lib/format';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconFile from '../icon/icon-file';
import IconInfoCircle from '../icon/icon-info-circle';
import BtnPrintQuote from '@/components/BtnPrintQuote';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const URL_MARCAS          = 'cotizaciones/marcas';
const URL_SEARCH          = 'cotizaciondetalle/buscar-parte-lote';
const URL_UPDATE_QUOTE    = 'cotizaciondetalle/actualizar-datos';
const URL_UPDATE_QUANTITY = 'cotizaciondetalle/modificar-cantidad';
const URL_MORE_QUOTE      = 'cotizaciondetalle/veropciones';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_ERR   = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_Q     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_INFO  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2.5"/><path d="M12 8h.01M12 12v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const swalSuccess = (title) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const swalError = (title) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_ERR}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  confirmButtonText: 'Cerrar', confirmButtonColor: '#ef4444',
});

const swalInfo = (title, msg = '', confirmText = 'Entendido') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(245,158,11,0.3)">${ICON_INFO}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#f59e0b',
});

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

const InfoRow = ({ label, value, bold }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    {value !== undefined && value !== '' && (
      <span className={`text-xs tabular-nums ${bold ? 'font-bold text-gray-800 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
        {value}
      </span>
    )}
  </div>
);

const FieldRow = ({ label, children }) => (
  <div className="flex items-center gap-2">
    <label className="text-xs text-gray-500 dark:text-gray-400 text-right shrink-0 w-20">{label}</label>
    <div className="flex-1">{children}</div>
  </div>
);

const inputCls = "h-8 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:uppercase placeholder:text-gray-300 placeholder:text-[10px]";

const selectStyles = {
  control: (base) => ({ ...base, minHeight: '32px', fontSize: '12px', borderColor: '#d1d5db' }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
};

const QuoteBatchForm = ({ t, _customer_, _order_ = [], _items_ }) => {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [marcas,    setMarcas]    = useState([]);
  const [items,     setItems]     = useState([]);
  const [order,     setOrder]     = useState((_order_?.NroOrden) ? _order_ : null);
  const [customer,  setCustomer]  = useState(_customer_);
  const [showModal, setShowModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsModalContent, setOptionsModalContent] = useState(null);

  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm();

  // Cargar marcas
  useEffect(() => {
    axiosClient.get(URL_MARCAS)
      .then(rs => setMarcas(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
  }, []);

  const loadMarcaOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(marcas.filter(m => m.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [marcas]);

  // Pre-poblar form cuando llegan datos de la cotización
  useEffect(() => {
    if (!order) return;
    setValue('nro_order',       order.NroPedido      ?? '');
    setValue('equipment_model', order.ModeloEquipo   ?? '');
    setValue('equipment_serie', order.NroSerieEquipo ?? '');
    setValue('equipment_year',  order.AnioEquipo     ?? '');
    setValue('engine_model',    order.ModeloMotor    ?? '');
    setValue('engine_serie',    order.NroSerieMotor  ?? '');
    if (marcas.length) {
      setValue('equipment_brand', marcas.find(m => m.label === order.MarcaEquipo) ?? null);
      setValue('engine_brand',    marcas.find(m => m.label === order.MarcaMotor)  ?? null);
    }
  }, [order, marcas]);

  useEffect(() => { if (_order_?.NroOrden) setOrder(_order_); }, [_order_]);
  useEffect(() => { setCustomer(_customer_); }, [_customer_]);
  useEffect(() => { if (Array.isArray(_items_) && _items_.length) setItems(_items_); }, [_items_]);
  useEffect(() => { updateInputs(items); }, [items]);

  const updateInputs = (list) => list.forEach((p, i) => setValue(`items.${i}.Cantidad`, p.Cantidad));

  const handleQuantityBlur = async (item, newQty) => {
    if (isNaN(newQty) || newQty <= 0 || newQty === item.Cantidad) return;
    try {
      const rs = await axiosClient.put(URL_UPDATE_QUANTITY, {
        NroCotizacion: order.NroOrden,
        CodItem:       item.CodItem,
        Cantidad:      newQty,
      });
      const { cotizacion, detalle } = rs.data;
      setOrder(prev => ({
        ...prev,
        Total:        cotizacion.totalSus     ?? 0,
        TotRepuestos: cotizacion.totRepuestos ?? 0,
        TotalPeso:    cotizacion.totPeso      ?? 0,
        MtoIva:       cotizacion.mtoIva       ?? 0,
        FleteInterno: cotizacion.mtoFlete     ?? 0,
        TipoCambio:   cotizacion.tipCambio    ?? 0,
        NroItems:     cotizacion.nroItems,
      }));
      const newItems = mapDetalle(detalle);
      setItems(newItems);
      updateInputs(newItems);
    } catch {}
  };

  const showMore = async (item) => {
    try {
      const rs = await axiosClient.post(URL_MORE_QUOTE, {
        NroCotizacion: order.NroOrden,
        CodCliente:    customer.CodCliente,
        NroParte:      item.NroParte,
        Cantidad:      item.Cantidad,
      });

      const { resultado: _res2, opcionesLocales, opcionesImportacion, mensaje } = rs.data;
      const resultado = String(_res2 ?? '').replace(/"/g, '').trim().toLowerCase();

      if (resultado === 'no_encontrado') {
        swalInfo(t.spare_part_not_found ?? 'Repuesto no encontrado', mensaje ?? '', t.close ?? 'Cerrar');
        return;
      }

      const mapOpt = (o) => ({
        CodRepuesto:   o.codRepuesto,
        NroParte:      o.nroParte,
        TipRepuesto:   o.nomTipRepuesto,
        Aplicacion:    o.nomAplicacion,
        Marca:         o.nomMarca,
        Proveedor:     o.nomPrv,
        Estado:        o.nomEstado,
        Precio:        o.precioUnitario,
        DesTieEntrega: o.desTiempoEntrega,
        DiasVigencia:  o.diasVigencia,
        esLocal:       o.esLocal,
      });

      const options = [
        ...(opcionesLocales     ?? []).map(mapOpt),
        ...(opcionesImportacion ?? []).map(mapOpt),
      ];
      if (!options.length) return;

      const data = getValues();
      data.quantity = item.Cantidad;
      data.position = item.CodItem;

      setOptionsModalContent(
        <OptionsItemsQuote
          close={() => setShowOptionsModal(false)}
          updateInputs={updateInputs}
          setItems={setItems}
          setOrder={setOrder}
          options={options}
          customer={customer}
          order={order}
          item_select={item}
          t={t}
          data={data}
        />
      );
      setShowOptionsModal(true);
    } catch {}
  };

  const mapCotizacion = (c) => ({
    NroOrden:       c.nroCotizacion,
    NroPedido:      c.nroPedido     ?? '',
    NroItems:       c.nroItems      ?? 0,
    TotalPeso:      c.totPeso       ?? 0,
    Total:          c.totalSus      ?? 0,
    TotRepuestos:   c.totRepuestos  ?? 0,
    FleteInterno:   c.mtoFlete      ?? 0,
    TipoCambio:     c.tipCambio     ?? 0,
    MtoIva:         c.mtoIva        ?? 0,
    MarcaEquipo:    c.marca         ?? '',
    ModeloEquipo:   c.modelo        ?? '',
    AnioEquipo:     c.anio          ?? '',
    NroSerieEquipo: c.nroSerie      ?? '',
    MarcaMotor:     c.marcaMo       ?? '',
    ModeloMotor:    c.modeloMo      ?? '',
    NroSerieMotor:  c.nroSerieMo    ?? '',
  });

  const mapDetalle = (detalle = []) => detalle.map(d => ({
    CodItem:      d.codItem,
    CodRepuesto:  d.codRepuesto,
    NroParte:     d.nroParte      ?? '',
    Cantidad:     d.cant          ?? 0,
    DesRepuesto:  d.descripcion   ?? '',
    Marca:        d.marca         ?? '',
    Aplicacion:   d.aplicacion    ?? '',
    TipoRepuesto: d.tipoRepuesto  ?? '',
    DiasVigencia: d.diasVigencia  ?? '',
    Precio:       d.preUniSus     ?? 0,
    Total:        d.totSus        ?? 0,
    Peso:         d.peso          ?? 0,
    TiEntrega:    d.desTieEntrega ?? '',
    Indicador:    d.indicador     ?? '',
    Estado:       d.estado        ?? '',
    ParPrecio:    d.parPrecio     ?? false,
  }));

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

    const LINE_RE = /^(\S+)\s+(\d+)$/;
    const nonEmpty = data.batch.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (nonEmpty.length === 0) {
      swalError(t.required_items ?? 'Ingresa al menos un ítem en el área de texto');
      return;
    }

    const invalid = nonEmpty.filter(l => !LINE_RE.test(l));
    if (invalid.length > 0) {
      Swal.fire({
        html: `<div style="padding:12px 0 6px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_ERR}</div>
          <h2 style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 10px">Formato incorrecto</h2>
          <p style="color:#64748b;font-size:12px;margin:0 0 8px">Cada línea debe ser: <b>NroParte Cantidad</b></p>
          <div style="text-align:left;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;max-height:120px;overflow-y:auto">
            ${invalid.map(l => `<code style="display:block;font-size:11px;color:#dc2626;line-height:1.8">${l}</code>`).join('')}
          </div>
        </div>`,
        confirmButtonText: t.close ?? 'Cerrar',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const items = nonEmpty.map(l => {
      const [, NroParte, cant] = LINE_RE.exec(l);
      return { NroParte, Cantidad: parseInt(cant, 10) };
    });

    Swal.fire({
      html: t.searching ?? 'Buscando...',
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const rs = await axiosClient.post(URL_SEARCH, {
        NroCotizacion:  order?.NroOrden    ?? 0,
        CodCliente:     customer?.CodCliente,
        NroPedido:      data.nro_order     ?? '',
        MarcaNroParte:  data.brand.label,
        MarcaEq:        data.equipment_brand?.label ?? '',
        ModeloEq:       data.equipment_model        ?? '',
        NroSerieEq:     data.equipment_serie        ?? '',
        AnioEq:         data.equipment_year         ?? '',
        MarcaMo:        data.engine_brand?.label    ?? '',
        ModeloMo:       data.engine_model           ?? '',
        NroSerieMo:     data.engine_serie           ?? '',
        Items:          items,
      });
      Swal.close();
      if (rs.data.resultado === 'ok') {
        setOrder(mapCotizacion(rs.data.cotizacion));
        setItems(mapDetalle(rs.data.detalle));
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', String(rs.data.cotizacion.nroCotizacion));
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch { Swal.close(); }
  };

  const handleUpdate = async () => {
    if (!order?.NroOrden) return;
    const data = getValues();
    try {
      await axiosClient.put(URL_UPDATE_QUOTE, {
        NroCotizacion:  order.NroOrden,
        NroPedido:      data.nro_order        ?? '',
        MarcaEquipo:    data.equipment_brand?.label ?? '',
        ModeloEquipo:   data.equipment_model  ?? '',
        AnioEquipo:     data.equipment_year   ?? '',
        NroSerieEquipo: data.equipment_serie  ?? '',
        MarcaMotor:     data.engine_brand?.label    ?? '',
        ModeloMotor:    data.engine_model     ?? '',
        NroSerieMotor:  data.engine_serie     ?? '',
      });
      swalSuccess(t.update_quote_success ?? 'Cotización actualizada');
    } catch {}
  };

  const newQuote = () => {
    Swal.fire({
      html: `<div style="padding:12px 0 6px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_Q}</div>
        <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t.question_create_new_quote ?? '¿Crear nueva cotización?'}</h2>
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
        setValue('equipment_brand', null);
        setValue('equipment_model', '');
        setValue('equipment_serie', '');
        setValue('equipment_year', '');
        setValue('engine_brand', null);
        setValue('engine_model', '');
        setValue('engine_serie', '');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        router.replace(`${pathname}?${params.toString()}`);
      }
    });
  };

  return (
    <div className="space-y-5">

      {/* ── LAYOUT PRINCIPAL: [1] | [2] | [1] ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">

        {/* Col 1 — Entrada */}
        <div className="panel border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <textarea
            rows={10}
            {...register('batch', { required: { value: true, message: t.required_field } })}
            placeholder={"01643-32780 2\n19M7824 1\n001811A 3"}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900
              px-3 py-2 text-sm font-mono resize-none
              focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.batch && (
            <span className="text-red-400 text-xs block -mt-2">{errors.batch.message?.toString()}</span>
          )}

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <IconInfoCircle className="h-3.5 w-3.5" />
            {t.how_to_copy_items ?? '¿Cómo copiar los ítems?'}
          </button>

          <div className="space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              {t.application ?? 'Aplicación'}:
            </label>
            <Controller
              name="brand"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <AsyncSelect
                  loadOptions={loadMarcaOptions}
                  defaultOptions={false}
                  cacheOptions
                  isClearable
                  placeholder={t.select_option ?? 'Selecciona una opción'}
                  menuPosition="fixed"
                  menuShouldScrollIntoView={false}
                  noOptionsMessage={({ inputValue }) =>
                    (inputValue?.trim().length ?? 0) < ASYNC_MIN
                      ? `Ingresa ${ASYNC_MIN} caracteres`
                      : (t.no_results ?? 'Sin resultados')
                  }
                  value={field.value ?? null}
                  onChange={opt => field.onChange(opt ?? null)}
                  styles={selectStyles}
                />
              )}
            />
            {errors.brand && (
              <span className="text-red-400 text-xs">{errors.brand.message?.toString()}</span>
            )}
          </div>

          {order?.NroOrden && (
            <Link
              href={`/admin/revision/quotes?customer=${customer?.CodCliente}&option=quotes&id=${order.NroOrden}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t.go_to_quote ?? 'Ir a cotización'} →
            </Link>
          )}

          <button
            type="button"
            onClick={handleSubmit(onSearch)}
            className="w-full flex h-9 items-center justify-center rounded-lg bg-primary
              text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
          >
            {t.search ?? 'Buscar'}
          </button>
        </div>

        {/* Col 2 — Panel central AMPLIADO (col-span-2) */}
        <div className="md:col-span-2 panel border border-gray-200 dark:border-gray-700 p-4 space-y-1.5">

          {/* Resumen cotización */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.nro_quote ?? 'Nro. Cotización'}:
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5
              text-xs font-bold text-primary tabular-nums">
              {order?.NroOrden ?? '---'}
            </span>
          </div>
          <InfoRow label={`${t.nro_pedido ?? 'Nro. Pedido'}:`}            value={order?.NroPedido || '---'} />
          <InfoRow label={`${t.total_weight_lb ?? 'Peso Total (lb)'}:`}   value={customFormat(order?.TotalPeso ?? 0)} bold />
          

          {/* ── Datos de la Cotización ── */}
          <div className="pt-4 mt-4 dark:border-gray-700 space-y-2">

            <FieldRow label={t.nro_pedido ?? 'Nro. Pedido'}>
              <input type="text" autoComplete="off" {...register('nro_order')} className={inputCls} />
            </FieldRow>

            <div className="grid grid-cols-2 gap-4">

              {/* DATOS DEL EQUIPO */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-primary/30" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">
                    {t.equipment_data ?? 'Datos del Equipo'}
                  </span>
                  <div className="flex-1 h-px bg-primary/30" />
                </div>
                <FieldRow label={t.brand ?? 'Marca'}>
                  <Controller name="equipment_brand" control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        loadOptions={loadMarcaOptions} defaultOptions={false} cacheOptions isClearable
                        placeholder={t.select ?? 'Seleccionar'} menuPosition="fixed"
                        noOptionsMessage={({ inputValue }) =>
                          (inputValue?.trim().length ?? 0) < ASYNC_MIN ? `Ingresa ${ASYNC_MIN} caracteres` : (t.no_results ?? 'Sin resultados')
                        }
                        value={field.value ?? null} onChange={opt => field.onChange(opt ?? null)} styles={selectStyles}
                      />
                    )}
                  />
                </FieldRow>
                <FieldRow label={t.model ?? 'Modelo'}>
                  <input type="text" autoComplete="off" {...register('equipment_model')}
                    placeholder={t.enter_equipment_model ?? 'INGRESA EL MODELO EQUIPO'} className={inputCls} />
                </FieldRow>
                <FieldRow label={t.equipment_serie ?? 'Nro. Serie Equipo'}>
                  <input type="text" autoComplete="off" {...register('equipment_serie')}
                    placeholder={t.enter_equipment_serie ?? 'INGRESA EL NRO. SERIE EQUIPO'} className={inputCls} />
                </FieldRow>
                <FieldRow label={t.year ?? 'Año'}>
                  <input type="text" autoComplete="off" {...register('equipment_year')} className={inputCls} />
                </FieldRow>
              </div>

              {/* DATOS DEL MOTOR */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-violet-400/50" />
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest whitespace-nowrap">
                    {t.engine_data ?? 'Datos del Motor'}
                  </span>
                  <div className="flex-1 h-px bg-violet-400/50" />
                </div>
                <FieldRow label={t.brand ?? 'Marca'}>
                  <Controller name="engine_brand" control={control}
                    render={({ field }) => (
                      <AsyncSelect
                        loadOptions={loadMarcaOptions} defaultOptions={false} cacheOptions isClearable
                        placeholder={t.select ?? 'Seleccionar'} menuPosition="fixed"
                        noOptionsMessage={({ inputValue }) =>
                          (inputValue?.trim().length ?? 0) < ASYNC_MIN ? `Ingresa ${ASYNC_MIN} caracteres` : (t.no_results ?? 'Sin resultados')
                        }
                        value={field.value ?? null} onChange={opt => field.onChange(opt ?? null)} styles={selectStyles}
                      />
                    )}
                  />
                </FieldRow>
                <FieldRow label={t.model ?? 'Modelo'}>
                  <input type="text" autoComplete="off" {...register('engine_model')}
                    placeholder={t.enter_engine_model ?? 'INGRESA EL MODELO MOTOR'} className={inputCls} />
                </FieldRow>
                <FieldRow label={t.engine_serie ?? 'Nro. Serie Motor'}>
                  <input type="text" autoComplete="off" {...register('engine_serie')}
                    placeholder={t.enter_engine_serie ?? 'INGRESA EL NRO. SERIE MOTOR'} className={inputCls} />
                </FieldRow>
              </div>

            </div>
          </div>
        </div>{/* /panel central col-span-2 */}

        {/* Col 3 — Resumen costos (estrecho) */}
        <div className="panel border border-gray-200 dark:border-gray-700 p-5">
          <InfoRow
            label={t.nro_items ?? 'Nro. de Items'}
            value={order?.NroItems != null ? order.NroItems : undefined}
          />
          <InfoRow
            label={t.total_spare_parts ?? 'Total Repuestos'}
            value={order?.NroItems != null ? customFormat(order?.TotRepuestos ?? 0) : undefined}
          />
          <InfoRow
            label={t.freight ?? 'Flete Interno'}
            value={order?.NroItems != null ? customFormat(order?.FleteInterno ?? 0) : undefined}
          />
          <InfoRow
            label={t.tax ?? 'Impuesto'}
            value={order?.NroItems != null ? customFormat(order?.MtoIva ?? 0) : undefined}
          />
          <InfoRow
            label={t.exchange_rate ?? 'Tipo de cambio'}
            value={order?.NroItems != null ? (order?.TipoCambio ?? 0) : undefined}
          />
          <InfoRow label={`${t.quote_total ?? 'Total Cotización $us.'}:`} value={customFormat(order?.Total ?? 0)} bold />
        </div>

      </div>{/* /grid cols-4 */}

      {/* ── TOOLBAR + TABLA DE ÍTEMS ─────────────────────────────────── */}
      {items.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={newQuote} title={t.btn_new ?? 'Nuevo'}
                className="h-8 px-2 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition">
                <IconFile className="h-4 w-4" /><span className='ml-2'>{t.btn_new ?? 'Nuevo'}</span>
              </button>              
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-8 text-center`}>#</th>
                  <th className={`${thClass} w-24`}>{t.qty ?? 'Cant.'}</th>
                  <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                  <th className={thClass}>{t.description ?? 'Descripción'}</th>
                  <th className={`${thClass} text-right`}>{t.weight_unit ?? 'Peso Unit.'}</th>
                  <th className={thClass}>{t.spare_part_type ?? 'Tipo Repuesto'}</th>
                  <th className={thClass}>{t.application ?? 'Aplicación'}</th>
                  <th className={thClass}>{t.brand ?? 'Marca'}</th>
                  <th className={`${thClass} text-right`}>{t.price_unit ?? 'Precio Unit.'}</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>{t.indicator ?? 'Indicador'}</th>
                  <th className={thClass}>{t.t_delivery ?? 'T. Entrega'}</th>
                  <th className={`${thClass} text-right`}>{t.days_of_validity ?? 'Días Vigencia'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, index) => (
                  <tr key={index}
                    className={`transition ${item.ParPrecio
                      ? 'bg-amber-50 dark:bg-amber-900/15 hover:bg-amber-100/70 dark:hover:bg-amber-900/25'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <td className={`${tdClass} text-center font-medium text-gray-400`}>{index + 1}</td>
                    <td className={tdClass}>
                      <input
                        step="any" type="number"
                        {...register(`items.${index}.Cantidad`, { valueAsNumber: true })}
                        onBlur={(e) => handleQuantityBlur(item, +e.target.value)}
                        className="h-8 w-20 rounded-lg border border-gray-200 dark:border-gray-600
                          bg-white dark:bg-gray-900 px-2 text-xs text-center
                          focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap font-medium`}>{item.NroParte}</td>
                    <td className={tdClass}>{item.DesRepuesto}</td>
                    <td className={`${tdClass} text-right`}>{customFormat(item.Peso)}</td>
                    <td className={tdClass}>{item.TipoRepuesto}</td>
                    <td className={tdClass}>{item.Aplicacion}</td>
                    <td className={tdClass}>{item.Marca}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{customFormat(item.Precio)}</td>
                    <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(item.Total)}</td>
                    <td className={tdClass}>
                      {item.Indicador && (
                        <button onClick={() => showMore(item)} type="button"
                          className="text-xs text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/5 transition">
                          {t.see_more ?? 'Ver más'}
                        </button>
                      )}
                    </td>
                    <td className={tdClass}>{item.TiEntrega}</td>
                    <td className={`${tdClass} text-right`}>{item.DiasVigencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.some(i => i.ParPrecio) && (
            <div className="flex items-center gap-2 px-4 pt-2 pb-3">
              <span className="inline-block h-3 w-5 rounded-sm bg-amber-200 dark:bg-amber-700/50 border border-amber-300 dark:border-amber-600 shrink-0" />
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {t.par_precio_legend ?? 'Con parámetro de precio'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL AYUDA ─────────────────────────────────────────────── */}
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

      {/* ── MODAL OPCIONES DE REPUESTO ──────────────────────────────── */}
      <Modal
        size="w-full max-w-5xl"
        closeModal={() => setShowOptionsModal(false)}
        openModal={() => setShowOptionsModal(true)}
        showModal={showOptionsModal}
        title=""
        content={optionsModalContent}
      />
    </div>
  );
};

export default QuoteBatchForm;
