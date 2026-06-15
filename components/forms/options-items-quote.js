'use client';
import React from 'react';
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

function TypeBadge({ label }) {
  return (
    <span className="text-xs text-gray-600 dark:text-gray-400">
      {label}
    </span>
  );
}

function SectionLabel({ label }) {
  return (
    <tr>
      <td colSpan={9} className="px-4 pt-4 pb-1">
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

const OptionsItemsQuote = ({ confirmed = false, close, options, customer, data, token, t, order, setItems, setOrder, updateInputs, item_select = [], changePrice = false }) => {

  const router = useRouter();
  const locale = useSelector(getLocale);

  const hasSelection = !!item_select?.CodRepuesto;

  const addItem = async (item) => {
    const data_add = {
      CodRepuesto:   item.CodRepuesto,
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
    };
    try {
      const rs = await axiosClient.post(url_add_item, data_add);
      const { cotizacion, detalle } = rs.data;
      const updatedOrder = mapCotizacion(cotizacion);
      const updatedItems = mapDetalle(detalle);
      setOrder(updatedOrder);
      setItems(updatedItems);
      updateInputs(updatedItems);
      if (updatedOrder.NroOrden) {
        router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${updatedOrder.NroOrden}`);
      }
      close();
    } catch (error) {}
  }

  const addItemConfirmed = async (item) => {
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
      if (rs.data.estado == 'OK') {
        setOrder(rs.data.dato2[0]);
        setItems(rs.data.dato3);
        updateInputs(rs.data.dato3);
        close();
      }
    } catch (error) {}
  }

  const changeItemConfirmed = async (item) => {
    if (!changePrice) return;
    Swal.fire({
      text: t.question_update_cofirmed_order,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.accept,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (!result.isConfirmed) return;
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

      try {
        const rs = await axios.post(url_add_item_confirmed, {
          Idioma: locale, NroOrden: order.NroOrden, CodItem: (item_select.CodItem) || 0,
          CodCliente: customer.CodCliente, Cantidad: data.quantity,
          CodRepuestoSelect: item.CodRepuesto, CodRepuestoActual: item.CodRepuesto,
          NroParteCliente: item.NroParte, CambiaPrecio, ValToken: token
        });
        if (rs.data.estado == 'OK') {
          setItems(rs.data.dato3);
          updateInputs(rs.data.dato3);
          close();
        }
      } catch (error) {}
    });
  }

  const changeItem = async (o) => {
    try {
      const rs = await axiosClient.post(url_add_item, {
        CodRepuesto:   o.CodRepuesto,
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
      close();
    } catch (error) {}
  };

  const handleAdd = (o) => confirmed
    ? (changePrice ? changeItemConfirmed(o) : addItemConfirmed(o))
    : (hasSelection ? changeItem(o) : addItem(o));

  const locals  = options.filter(o => o.esLocal);
  const imports = options.filter(o => !o.esLocal);
  const hasBoth = locals.length > 0 && imports.length > 0;

  const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-3 py-2.5 text-left whitespace-nowrap bg-gray-50 dark:bg-gray-800";
  const tdClass = "px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300";

  const renderRows = (rows) => rows.map((o, index) => {

    const isSelected = item_select?.CodRepuesto && item_select.CodRepuesto == o.CodRepuesto;
    return (
      <tr key={index} className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${isSelected ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}>
        <td className="px-3 py-2 w-12 text-center">
          {isSelected ? (
            <span className="inline-flex h-7 w-7 items-center justify-center">
              <IconCheck className="h-3.5 w-3.5 fill-gray-400 dark:fill-gray-500" />
            </span>
          ) : hasSelection ? (
            <button
              onClick={() => handleAdd(o)}
              type="button"
              title={t.change ?? 'Cambiar'}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition"
            >
              <IconSwap />
            </button>
          ) : (
            <button
              onClick={() => handleAdd(o)}
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </td>

        
        <td className={tdClass}><TypeBadge label={o.TipRepuesto} /></td>
        <td className={tdClass}>{o.Aplicacion}</td>
        <td className={`${tdClass} font-medium`}>{o.Marca}</td>
        <td className={tdClass}>{o.Proveedor}</td>
        <td className={tdClass}>
          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
            {o.Estado}
          </span>
        </td>
        <td className={`${tdClass} text-right font-semibold text-gray-900 dark:text-gray-100`}>
          {customFormat(o.Precio)}
        </td>
        <td className={tdClass}>{o.DesTieEntrega}</td>
        <td className={`${tdClass} text-right tabular-nums`}>{o.DiasVigencia}</td>
      </tr>
    );
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm">
        <thead>
          <tr>
            <th className={`${thClass} w-12`}></th>
            <th className={thClass}>{t.spare_part_type}</th>
            <th className={thClass}>{t.application}</th>
            <th className={thClass}>{t.brand}</th>
            <th className={thClass}>{t.supplier}</th>
            <th className={thClass}>{t.status}</th>
            <th className={`${thClass} text-right`}>{t.price_unit}</th>
            <th className={thClass}>{t.delivery_time}</th>
            <th className={`${thClass} text-right`}>{t.days_of_validity}</th>
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
    </div>
  );
};

export default OptionsItemsQuote;
