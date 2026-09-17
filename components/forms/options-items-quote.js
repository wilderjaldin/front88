'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios'
import IconPlus from '../icon/icon-plus';
import { customFormat } from '@/app/lib/format';
import IconCheck from '../icon/icon-check';
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import axiosClient from '@/app/lib/axiosClient';

const IconSwap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4"/>
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
  </svg>
);

const url_add_item = 'cotizaciondetalle/adicionar-item';
const url_add_item_confirmed = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/AdicionarItem';

const mapCotizacion = (c) => ({
  NroOrden:       c.nroCotizacion,
  NroItems:       c.nroItems,
  NroPedido:      c.nroPedido      ?? '',
  MarcaEquipo:    c.marcaEquipo    ?? '',
  MarcaMotor:     c.marcaMotor     ?? '',
  ModeloEquipo:   c.modeloEquipo   ?? '',
  NroSerieEquipo: c.nroSerieEquipo ?? '',
  AnioEquipo:     c.anioEquipo     ?? '',
  ModeloMotor:    c.modeloMotor    ?? '',
  NroSerieMotor:  c.nroSerieMotor  ?? '',
  FleteInterno:   c.mtoFlete       ?? 0,
  MostrarCodigo:  c.mostrarCodigo  ?? 0,
  TotalPeso:      c.totPeso        ?? 0,
  Total:          c.totalSus       ?? 0,
  TipoCambio:     c.tipCambio      ?? 0,
  TipMoneda:      c.tipMoneda      ?? '',
  NotaCliente:    c.notCliente     ?? '',
  NotaUsuario:    c.notUsuario     ?? '',
  TotRepuestos:   c.totRepuestos   ?? 0,
  Descuento:      c.mtoDescuento   ?? 0,
  MtoIva:         c.mtoIva         ?? 0,
});

const mapDetalle = (detalle) => (detalle ?? []).map(d => ({
  CodItem:      d.codItem,
  CodRepuesto:  d.codRepuesto,
  NroParte:     d.nroParte      ?? '',
  Cantidad:     d.cant          ?? 0,
  DesRepuesto:  d.descripcion   ?? '',
  Marca:        d.marca         ?? '',
  Aplicacion:   d.aplicacion    ?? '',
  TipoRepuesto: d.tipoRepuesto  ?? '',
  Precio:       d.preUniSus     ?? 0,
  Total:        d.totSus        ?? 0,
  Peso:         d.peso          ?? 0,
  TiEntrega:    d.desTieEntrega ?? '',
  Indicador:    d.indicador     ?? '',
  Estado:       d.estado        ?? '',
  DiasVigencia: d.diasVigencia  ?? '',
  ParPrecio:    d.parPrecio     ?? false,
}));

function TypeBadge({ label, muted = false }) {
  return (
    <span className={`text-xs ${muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
      {label}
    </span>
  );
}

function SectionLabel({ label }) {
  return (
    <tr>
      <td colSpan={10} className="px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
            {label}
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
      </td>
    </tr>
  );
}

const OptionsItemsQuote = ({ confirmed = false, close, options, customer, data, token, t, order, setItems, setOrder, updateInputs, item_select = [], changePrice = false, onAdded, cambioParte }) => {

  const router = useRouter();
  const locale = useSelector(getLocale);

  const hasSelection = !!item_select?.CodRepuesto;

  // Bloquea los botones +/cambiar mientras hay una request en curso — sin
  // esto, un doble click alcanzaba a disparar dos veces la misma acción
  // antes de que la primera respuesta cerrara el modal, duplicando el
  // registro. El popup central usa el mismo patrón que el resto del flujo
  // de cotización (Swal + showLoading, se cierra con Swal.close()).
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showLoadingPopup = (message) => {
    Swal.fire({
      html: message,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const addItem = async (item) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showLoadingPopup(t.adding_item ?? 'Agregando ítem...');
    const data_add = {
      CodRepuesto:   item.CodRepuesto,
      NroParte:      data.nro_part      ?? '',
      CodCliente:    customer.CodCliente,
      NroCotizacion: order.NroOrden || 0,
      Cantidad:      data.quantity,
      Posicion:      data.position || 0,
      NroPedido:     data.nro_order     ?? '',
      Marca:         (data.equipment_brand?.label) ?? '',
      Modelo:        data.equipment_model ?? '',
      NroSerie:      data.equipment_serie ?? '',
      Anio:          data.equipment_year  ?? '',
      MarcaMo:       (data.engine_brand?.label) ?? '',
      ModeloMo:      data.engine_model    ?? '',
      NroSerieMo:    data.engine_serie    ?? '',
      NotCliente:    order.NotaCliente    ?? '',
      NotUsuario:    order.NotaUsuario    ?? '',
      NroParteCambio: cambioParte ?? '',
    };
    try {
      const rs = await axiosClient.post(url_add_item, data_add);
      const { cotizacion, detalle } = rs.data;
      const updatedOrder = mapCotizacion(cotizacion);
      const updatedItems = mapDetalle(detalle);
      setOrder(updatedOrder);
      setItems(updatedItems);
      updateInputs(updatedItems);
      Swal.close();
      if (updatedOrder.NroOrden) {
        router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${updatedOrder.NroOrden}`);
      }
      onAdded?.();
      close();
    } catch (error) {
      Swal.close();
    } finally {
      setIsSubmitting(false);
    }
  }

  const addItemConfirmed = async (item) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showLoadingPopup(t.adding_item ?? 'Agregando ítem...');
    const data_add = {
      Idioma: locale,
      NroOrden: order.NroOrden,
      CodItem: (item_select.CodItem) || 0,
      CodCliente: customer.CodCliente,
      Cantidad: data.quantity,
      CodRepuestoSelect: 1,
      CodRepuestoActual: 1,
      NroParteCliente: item.NroParte,
      CambiaPrecio: 0,
      ValToken: token
    }
    try {
      const rs = await axios.post(url_add_item_confirmed, data_add);
      Swal.close();
      if (rs.data.estado == 'OK') {
        setOrder(rs.data.dato2[0]);
        setItems(rs.data.dato3);
        updateInputs(rs.data.dato3);
        onAdded?.();
        close();
      }
    } catch (error) {
      Swal.close();
    } finally {
      setIsSubmitting(false);
    }
  }

  const changeItemConfirmed = async (item) => {
    if (!changePrice || isSubmitting) return;
    setIsSubmitting(true);
    Swal.fire({
      text: t.question_update_cofirmed_order,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.accept,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (!result.isConfirmed) { setIsSubmitting(false); return; }
      let CambiaPrecio = 0;
      await Swal.fire({
        title: t.question_do_you_want_the_current_sale_price,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#15803d',
        confirmButtonText: t.yes,
        cancelButtonText: t.no,
        reverseButtons: true
      }).then(r => { if (r.isConfirmed) CambiaPrecio = 1; });

      showLoadingPopup(t.changing_item ?? 'Cambiando repuesto...');
      try {
        const rs = await axios.post(url_add_item_confirmed, {
          Idioma: locale, NroOrden: order.NroOrden, CodItem: (item_select.CodItem) || 0,
          CodCliente: customer.CodCliente, Cantidad: data.quantity,
          CodRepuestoSelect: item.CodRepuesto, CodRepuestoActual: item.CodRepuesto,
          NroParteCliente: item.NroParte, CambiaPrecio, ValToken: token
        });
        Swal.close();
        if (rs.data.estado == 'OK') {
          setItems(rs.data.dato3);
          updateInputs(rs.data.dato3);
          onAdded?.();
          close();
        }
      } catch (error) {
        Swal.close();
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  const changeItem = async (o) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    showLoadingPopup(t.changing_item ?? 'Cambiando repuesto...');
    try {
      const rs = await axiosClient.post(url_add_item, {
        CodRepuesto:   o.CodRepuesto,
        NroParte:      data.nro_part           ?? '',
        CodItem:       item_select.CodItem,
        CodCliente:    customer.CodCliente,
        NroCotizacion: order.NroOrden || 0,
        Cantidad:      data.quantity,
        Posicion:      data.position || 0,
        NroPedido:     data.nro_order           ?? '',
        Marca:         data.equipment_brand?.label ?? '',
        Modelo:        data.equipment_model       ?? '',
        NroSerie:      data.equipment_serie       ?? '',
        Anio:          data.equipment_year        ?? '',
        MarcaMo:       data.engine_brand?.label   ?? '',
        ModeloMo:      data.engine_model          ?? '',
        NroSerieMo:    data.engine_serie          ?? '',
        NotCliente:    order.NotaCliente          ?? '',
        NotUsuario:    order.NotaUsuario          ?? '',
        NroParteCambio: cambioParte ?? '',
      });
      const { cotizacion, detalle } = rs.data;
      const mapped = mapCotizacion(cotizacion);
      const updatedOrder = {
        ...mapped,
        NroPedido:      mapped.NroPedido      || order.NroPedido,
        MarcaEquipo:    mapped.MarcaEquipo    || order.MarcaEquipo,
        MarcaMotor:     mapped.MarcaMotor     || order.MarcaMotor,
        ModeloEquipo:   mapped.ModeloEquipo   || order.ModeloEquipo,
        NroSerieEquipo: mapped.NroSerieEquipo || order.NroSerieEquipo,
        AnioEquipo:     mapped.AnioEquipo     || order.AnioEquipo,
        ModeloMotor:    mapped.ModeloMotor    || order.ModeloMotor,
        NroSerieMotor:  mapped.NroSerieMotor  || order.NroSerieMotor,
      };
      const updatedItems = mapDetalle(detalle);
      setOrder(updatedOrder);
      setItems(updatedItems);
      updateInputs(updatedItems);
      Swal.close();
      onAdded?.();
      close();
    } catch (error) {
      Swal.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = (o) => confirmed
    ? (changePrice ? changeItemConfirmed(o) : addItemConfirmed(o))
    : (hasSelection ? changeItem(o) : addItem(o));

  const locals  = options.filter(o => o.esLocal);
  const imports = options.filter(o => !o.esLocal);
  const hasBoth = locals.length > 0 && imports.length > 0;

  // table-fixed + un % de ancho fijo por columna: así nunca se desborda el
  // modal (nada de whitespace-nowrap — todo el texto debe poder partirse en
  // más de una línea, incluso palabras largas sin espacios).
  const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 py-2.5 text-left break-words bg-gray-50 dark:bg-gray-800";
  const tdClass = "px-2 py-2.5 text-xs text-gray-700 dark:text-gray-300 break-words";
  // Fila del ítem actual (con el check) — texto gris para dejarla claramente
  // en segundo plano frente a las opciones que sí se pueden elegir.
  const mutedTdClass = "px-2 py-2.5 text-xs text-gray-400 dark:text-gray-500 break-words";

  const renderRows = (rows) => rows.map((o, index) => {

    const isSelected = item_select?.CodRepuesto && item_select.CodRepuesto == o.CodRepuesto;
    const cellClass = isSelected ? mutedTdClass : tdClass;
    return (
      <tr key={index} className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${isSelected ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}>
        <td className="px-2 py-2 text-center" style={{ width: '5%' }}>
          {isSelected ? (
            <span className="inline-flex h-7 w-7 items-center justify-center">
              <IconCheck className="h-3.5 w-3.5 fill-gray-400 dark:fill-gray-500" />
            </span>
          ) : hasSelection ? (
            <button
              onClick={() => handleAdd(o)}
              type="button"
              title={t.change ?? 'Cambiar'}
              disabled={isSubmitting}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconSwap />
            </button>
          ) : (
            <button
              onClick={() => handleAdd(o)}
              type="button"
              disabled={isSubmitting}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </td>


        <td className={cellClass}><TypeBadge label={o.TipRepuesto} muted={isSelected} /></td>
        <td className={cellClass}>{o.DesRepuesto}</td>
        <td className={cellClass}>{o.Aplicacion}</td>
        <td className={`${cellClass} font-medium`}>{o.Marca}</td>
        <td className={cellClass}>{o.Proveedor}</td>
        <td className={cellClass}>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isSelected
              ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {o.Estado}
          </span>
        </td>
        <td className={`${cellClass} text-right font-semibold ${isSelected ? '' : 'text-gray-900 dark:text-gray-100'}`}>
          {customFormat(o.Precio)}
        </td>
        <td className={cellClass}>{o.DesTieEntrega}</td>
        <td className={`${cellClass} text-right tabular-nums`}>{o.DiasVigencia}</td>
      </tr>
    );
  });

  return (
    <>
      <table className="w-full table-fixed border-collapse bg-white dark:bg-gray-900 text-sm">
        <thead>
          <tr>
            <th className={thClass} style={{ width: '5%' }}></th>
            <th className={thClass} style={{ width: '9%' }}>{t.spare_part_type}</th>
            <th className={thClass} style={{ width: '22%' }}>{t.description}</th>
            <th className={thClass} style={{ width: '10%' }}>{t.application}</th>
            <th className={thClass} style={{ width: '10%' }}>{t.brand}</th>
            <th className={thClass} style={{ width: '13%' }}>{t.supplier}</th>
            <th className={thClass} style={{ width: '8%' }}>{t.status}</th>
            <th className={`${thClass} text-right`} style={{ width: '9%' }}>{t.price_unit}</th>
            <th className={thClass} style={{ width: '8%' }}>{t.delivery_time}</th>
            <th className={`${thClass} text-right`} style={{ width: '6%' }}>{t.days_of_validity}</th>
          </tr>
        </thead>
        <tbody>
          {hasBoth ? (
            <>
              <SectionLabel label={t.local ?? 'Local'} />
              {renderRows(locals)}
              <SectionLabel label={t.import ?? 'Importación'} />
              {renderRows(imports)}
            </>
          ) : (
            renderRows(options)
          )}
        </tbody>
      </table>
    </>
  );
};

export default OptionsItemsQuote;
