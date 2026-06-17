'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import { customFormat } from '@/app/lib/format';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconFile from '../icon/icon-file';
import IconTrashLines from '../icon/icon-trash-lines';
import IconPencil from '../icon/icon-pencil';
import BtnPrintQuote from '@/components/BtnPrintQuote';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const URL_MARCAS           = 'cotizaciones/marcas';
const URL_PROVEEDORES      = 'cotizaciones/proveedores';
const URL_CALC_PRICE       = 'cotizaciondetallema/calcular-precio-itemcotma';
const URL_ADD_ITEM         = 'cotizaciondetallema/adicionar-itemcotma';
const URL_EDIT_ITEM        = (nro, item) => `cotizaciondetallema/editar-itemcotma/${nro}/${item}`;
const URL_DELETE_ITEMS     = 'cotizaciondetallema/eliminar-itemcotma';
const URL_UPDATE_QUANTITY  = 'cotizaciondetallema/mod-cantidadcotma';
const URL_GET_SEGUIMIENTO  = 'usuarios/seguimiento';
const URL_SAVE_SEGUIMIENTO = 'cotizaciondetalle/registrar-seguimiento';
const URL_UPDATE_NOTE      = 'cotizaciondetalle/guardar-notas';
const URL_UPDATE_HEADER    = 'cotizaciondetallema/actualizar-cotma';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_ERR   = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_Q     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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

const inputCls = "h-8 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-gray-300 placeholder:text-[10px]";

const asyncStyles = {
  control:        (b) => ({ ...b, minHeight: '32px', fontSize: '12px', borderColor: '#d1d5db' }),
  valueContainer: (b) => ({ ...b, padding: '0 8px' }),
};

const FieldLabel = ({ children }) => (
  <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide">{children}</span>
);

const mapCotizacion = (c) => ({
  NroOrden:       c.nroCotizacion,
  NroPedido:      c.nroPedido           ?? '',
  NroItems:       c.nroItems            ?? 0,
  TotalPeso:      c.totPeso             ?? 0,
  Total:          c.totalSus            ?? 0,
  FleteInterno:   c.mtoFleteUs          ?? 0,
  MtoIva:         c.mtoIva              ?? 0,
  Descuento:      c.mtoDescuento        ?? 0,
  TotRepuestos:   c.totRepuestos        ?? 0,
  NotaCliente:    c.notCliente          ?? '',
  NotaUsuario:    c.notUsuario          ?? '',
  // cabecera equipo — API manual usa marca/modelo/anio/nroVin
  MarcaEquipo:    c.marcaEquipo ?? c.marca   ?? '',
  ModeloEquipo:   c.modeloEquipo ?? c.modelo ?? '',
  AnioEquipo:     c.anioEquipo  ?? c.anio    ?? '',
  NroSerieEquipo: c.nroSerieEquipo ?? c.nroVin ?? '',
});

const mapDetalle = (detalle = []) => detalle.map(d => ({
  CodItem:     d.codItem,
  CodRepuesto: d.codRepuesto  ?? 0,
  NroParte:    d.nroParte     ?? '',
  Cantidad:    d.cant         ?? 0,
  DesRepuesto: d.desRepuesto ?? d.descripcion ?? '',
  Precio:      d.preUniSus   ?? 0,
  Total:       d.totSus       ?? 0,
  TiEntrega:   d.desTieEntrega ?? '',
  // campos disponibles solo en getOrder/detalle completo
  Marca:       d.marca        ?? '',
  Aplicacion:  d.aplicacion   ?? '',
  Peso:        d.peso         ?? 0,
}));

export default function QuoteManualForm({ t, _customer_, _order_ = [], _items_, _tracking_ }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [marcas,      setMarcas]      = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [items,       setItems]       = useState([]);
  const [order,       setOrder]       = useState((_order_?.NroOrden) ? _order_ : null);
  const [customer,    setCustomer]    = useState(_customer_);
  const [calcResult,  setCalcResult]  = useState(null);
  const [editingItem, setEditingItem] = useState(null); // null = nuevo, number = CodItem editando
  const [seleccionados, setSeleccionados] = useState([]);
  const [headerEditing, setHeaderEditing] = useState(false);

  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [seguimientoNombre,     setSeguimientoNombre]   = useState(null);
  const [options_share,         setOptionsShare]        = useState([]);
  const [select_share,          setSelectShare]         = useState(null);

  const hasItemsWithoutPrice = items.some(item => !item.Precio || item.Precio === 0);

  // Form 1: cabecera de cotización (NroPedido, Marca, Modelo, Año, NroVin)
  const { register: regH, getValues: getH, setValue: setH } = useForm();

  // Form notas
  const {
    register: regN,
    handleSubmit: submitN,
    reset: resetN,
  } = useForm();

  // Form 2: ingreso/edición de ítem
  const {
    register: regI,
    control:  ctrlI,
    handleSubmit: submitI,
    reset: resetI,
    setValue: setI,
    watch: watchI,
    formState: { errors: errorsI },
  } = useForm({ defaultValues: { Cantidad: 1 } });

  const calcSnapshotRef = useRef(null);
  const watchedCosto      = watchI('Costo');
  const watchedPeso       = watchI('Peso');
  const watchedFlete      = watchI('Flete');
  const watchedPorUtilidad = watchI('PorUtilidad');

  useEffect(() => {
    if (!calcResult || !calcSnapshotRef.current) return;
    const snap = calcSnapshotRef.current;
    const changed =
      String(watchedCosto ?? '')       !== String(snap.Costo ?? '') ||
      String(watchedPeso ?? '')        !== String(snap.Peso ?? '') ||
      String(watchedFlete ?? '')       !== String(snap.Flete ?? '') ||
      String(watchedPorUtilidad ?? '') !== String(snap.PorUtilidad ?? '');
    if (changed) setCalcResult(null);
  }, [watchedCosto, watchedPeso, watchedFlete, watchedPorUtilidad]);

  // Cargar catálogos
  useEffect(() => {
    axiosClient.get(URL_MARCAS)
      .then(rs => setMarcas(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
    axiosClient.get(URL_PROVEEDORES)
      .then(rs => setProveedores(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
  }, []);

  const loadMarcaOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(marcas.filter(m => m.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [marcas]);

  const loadProveedorOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(proveedores.filter(p => p.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [proveedores]);

  // Pre-poblar cabecera al cargar order
  useEffect(() => {
    if (!order) return;
    setH('nro_pedido', order.NroPedido      ?? '');
    setH('marca',      order.MarcaEquipo    ?? '');
    setH('modelo',     order.ModeloEquipo   ?? '');
    setH('anio',       order.AnioEquipo     ?? '');
    setH('nro_vin',    order.NroSerieEquipo ?? '');
  }, [order]);

  useEffect(() => { if (_order_?.NroOrden) setOrder(_order_); }, [_order_]);
  useEffect(() => { setCustomer(_customer_); }, [_customer_]);
  useEffect(() => {
    if (Array.isArray(_items_) && _items_.length) {
      setItems(_items_);
      updateInputs(_items_);
    }
  }, [_items_]);

  useEffect(() => {
    if (_tracking_?.nomUsuario) {
      setSeguimientoNombre(_tracking_.nomUsuario);
      setAllDisabledTracking(true);
    }
  }, [_tracking_]);

  useEffect(() => {
    if (!order?.NroOrden || all_disabled_tracking) return;
    axiosClient.get(URL_GET_SEGUIMIENTO)
      .then(rs => {
        const raw = Array.isArray(rs.data) ? rs.data : (rs.data.data ?? rs.data.usuarios ?? []);
        setOptionsShare(raw.map(u => ({ value: u.codUsuario ?? u.CodUsuario, label: u.nomUsuario ?? u.NomUsuario })));
      })
      .catch(() => {});
  }, [order?.NroOrden, all_disabled_tracking]);

  const updateInputs = (list) => list.forEach((p, i) => setH(`tbl_items.${i}.Cantidad`, p.Cantidad));

  // Calcular precio
  const handleCalcPrice = async (data) => {
    const costo  = parseFloat(data.Costo)       || 0;
    const peso   = parseFloat(data.Peso)         || 0;
    const flete  = parseFloat(data.Flete)        || 0;
    const util   = parseFloat(data.PorUtilidad)  || 0;
    if (!customer?.CodCliente || costo <= 0 || peso <= 0 || flete <= 0 || util <= 0) {
      swalError('Costo, Peso, Flete y Utilidad % son requeridos');
      return;
    }
    try {
      const rs = await axiosClient.post(URL_CALC_PRICE, {
        CodCliente:  customer.CodCliente,
        Costo:       costo,
        Peso:        peso,
        CostoFlete:       flete,
        PorUtilidad: util,
      });
      if (rs.data.pesoFlete !== undefined) {
        setCalcResult({ ...rs.data, costo: rs.data.costo ?? costo });
        calcSnapshotRef.current = { Costo: costo, Peso: peso, Flete: flete, PorUtilidad: util };
        if (rs.data.nroParte) setI('NroParte', rs.data.nroParte);
      }
    } catch {}
  };

  // Adicionar / actualizar ítem
  const handleAddItem = async (data) => {
    if (!calcResult) {
      swalError(t.calculate_price_first ?? 'Primero calcula el precio del ítem');
      return;
    }
    Swal.fire({
      html: t.saving ?? 'Guardando...',
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const h = getH();
      const rs = await axiosClient.post(URL_ADD_ITEM, {
        NroCotizacion: order?.NroOrden   ?? 0,
        CodItem:       editingItem        ?? 0,
        CodCliente:    customer?.CodCliente,
        NroPedido:     h.nro_pedido      ?? '',
        MarcaEq:       h.marca           ?? '',
        ModeloEq:      h.modelo          ?? '',
        Anio:          h.anio            ?? '',
        NroVin:        h.nro_vin         ?? '',
        NroParte:      data.NroParte,
        Cantidad:      data.Cantidad,
        Descripcion:   data.Descripcion  ?? '',
        Costo:         parseFloat(data.Costo)       || 0,
        CostoInc:      calcResult.costoInc           ?? 0,
        Peso:          parseFloat(data.Peso)         || 0,
        CostoPeso:     parseFloat(data.Flete)        ?? 0,
        Tentrega:      data.TEntrega                 ?? '',
        CodPrv:        data.Proveedor?.value          ?? 0,
        CodAplicacion: data.Aplicacion?.value         ?? 0,
        FleteItem:     calcResult.pesoFlete           ?? 0,
        AduanaItem:    calcResult.aduana              ?? 0,
        PorUtilidad:   parseFloat(data.PorUtilidad)  || 0,
        MtoUtilidad:   calcResult.mtoUtilidad         ?? 0,
        PreUniSus:     calcResult.precio              ?? 0,
      });
      Swal.close();
      if (rs.data.cotizacion) {
        const newOrder = mapCotizacion(rs.data.cotizacion);
        const newItems = mapDetalle(rs.data.detalle);
        setOrder(newOrder);
        setItems(newItems);
        updateInputs(newItems);
        setCalcResult(null);
        setEditingItem(null);
        setSeleccionados([]);
        resetI({
          NroParte: '', Cantidad: 1, Descripcion: '',
          Costo: '', Peso: '', Flete: '', TEntrega: '', PorUtilidad: '',
          Proveedor: null, Aplicacion: null,
        });
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', String(rs.data.cotizacion.nroCotizacion));
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch { Swal.close(); }
  };

  // Cargar ítem para editar
  const handleEditItem = async (item) => {
    if (!order?.NroOrden) return;
    try {
      const rs = await axiosClient.get(URL_EDIT_ITEM(order.NroOrden, item.CodItem));
      const d = rs.data;
      setEditingItem(d.codItem);
      setCalcResult({
        costo:       d.costo        ?? 0,
        pesoFlete:   d.mtoFleteItem ?? 0,
        aduana:      d.mtoAduanaItem ?? 0,
        costoInc:    (d.costo ?? 0) + (d.mtoFleteItem ?? 0) + (d.mtoAduanaItem ?? 0),
        mtoUtilidad: d.mtoUtilidad  ?? 0,
        precio:      d.preUniSus    ?? 0,
      });
      calcSnapshotRef.current = {
        Costo: d.costo ?? 0, Peso: d.peso ?? 0,
        Flete: d.mtoCostoPeso ?? 0, PorUtilidad: d.porUtilidad ?? 0,
      };
      resetI({
        NroParte:    d.nroParte      ?? '',
        Cantidad:    d.cant          ?? 1,
        Descripcion: d.desRepuesto   ?? '',
        Costo:       d.costo         ?? 0,
        Peso:        d.peso          ?? 0,
        Flete:       d.mtoCostoPeso  ?? 0,
        TEntrega:    d.desTieEntrega ?? '',
        PorUtilidad: d.porUtilidad   ?? 0,
        Proveedor:   proveedores.find(p => Number(p.value) === Number(d.codPrv))  ?? null,
        Aplicacion:  marcas.find(m => Number(m.value) === Number(d.codMarca))     ?? null,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Eliminar ítems seleccionados
  const handleDeleteItems = async () => {
    if (seleccionados.length === 0) return;
    Swal.fire({
      html: `<div style="padding:12px 0 6px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_Q}</div>
        <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${t.question_delete_items ?? '¿Eliminar los ítems seleccionados?'}</h2>
      </div>`,
      showCancelButton: true,
      confirmButtonText: t.yes ?? 'Sí',
      cancelButtonText:  t.btn_cancel ?? 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor:  '#6b7280',
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.delete(URL_DELETE_ITEMS, {
          data: {
            NroCotizacion: order.NroOrden,
            Items: seleccionados.map(i => ({ CodItem: i.CodItem })),
          },
        });
        if (rs.data.cotizacion) {
          setOrder(prev => ({ ...prev, ...mapCotizacion(rs.data.cotizacion) }));
        }
        const newItems = mapDetalle(rs.data.detalle ?? rs.data ?? []);
        setItems(newItems);
        updateInputs(newItems);
        setSeleccionados([]);
      } catch {}
    });
  };

  // Cambiar cantidad
  const handleQuantityBlur = async (item, newQty) => {
    if (isNaN(newQty) || newQty <= 0 || newQty === item.Cantidad) return;
    try {
      const rs = await axiosClient.put(URL_UPDATE_QUANTITY, {
        CodCliente:    customer?.CodCliente,
        NroCotizacion: order.NroOrden,
        CodItem:       item.CodItem,
        Cantidad:      newQty,
      });
      if (rs.data.cotizacion) {
        setOrder(prev => ({ ...prev, ...mapCotizacion(rs.data.cotizacion) }));
        const newItems = mapDetalle(rs.data.detalle);
        setItems(newItems);
        updateInputs(newItems);
      }
    } catch {}
  };

  // Guardar notas
  const onSaveNote = async (data) => {
    try {
      await axiosClient.post(URL_UPDATE_NOTE, {
        NroCotizacion: order.NroOrden,
        NotaUsuario:   data.note_user,
        NotaCliente:   data.note_customer,
      });
      swalSuccess(t.save_note_quote_success ?? 'Las notas fueron actualizadas correctamente');
    } catch {
      swalError(t.save_note_quote_error ?? 'Ocurrio un error al actualizar las notas');
    }
  };

  // Cancelar edición de cabecera
  const handleCancelHeaderEdit = () => {
    setH('nro_pedido', order?.NroPedido      ?? '');
    setH('marca',      order?.MarcaEquipo    ?? '');
    setH('modelo',     order?.ModeloEquipo   ?? '');
    setH('anio',       order?.AnioEquipo     ?? '');
    setH('nro_vin',    order?.NroSerieEquipo ?? '');
    setHeaderEditing(false);
  };

  // Actualizar cabecera (endpoint en construcción)
  const handleUpdateHeader = async () => {
    const h = getH();
    try {
      const rs = await axiosClient.put(URL_UPDATE_HEADER, {
        NroCotizacion: order.NroOrden,
        NroPedido:     h.nro_pedido ?? '',
        MarcaEq:       h.marca      ?? '',
        ModeloEq:      h.modelo     ?? '',
        Anio:          h.anio       ?? '',
        NroVin:        h.nro_vin    ?? '',
      });
      if (rs.data.cotizacion) {
        setOrder(prev => ({ ...prev, ...mapCotizacion(rs.data.cotizacion) }));
      }
      setHeaderEditing(false);
      swalSuccess(t.update_header_success ?? 'Los datos fueron actualizados correctamente');
    } catch {
      swalError(t.update_header_error ?? 'Ocurrió un error al actualizar los datos');
    }
  };

  // Seguimiento
  const apply = async () => {
    if (!select_share) return;
    try {
      await axiosClient.post(URL_SAVE_SEGUIMIENTO, {
        NroCotizacion:        order.NroOrden,
        codUsuarioCompartido: select_share.value,
        notaUsuario:          '',
      });
      setSeguimientoNombre(select_share.label);
      setAllDisabledTracking(true);
      swalSuccess(t.tracking_option_success ?? 'Seguimiento registrado');
    } catch {}
  };

  // Comprar
  const buyQuote = () => {
    if (hasItemsWithoutPrice) {
      swalError(t.quote_without_price ?? 'Por favor verifica que los precios sean mayores a 0');
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('option', 'buy');
    params.set('step', 'verify');
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Nueva cotización
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
        setCalcResult(null);
        setEditingItem(null);
        setSeleccionados([]);
        calcSnapshotRef.current = null;
        resetI({
          NroParte: '', Cantidad: 1, Descripcion: '',
          Costo: '', Peso: '', Flete: '', TEntrega: '', PorUtilidad: '',
          Proveedor: null, Aplicacion: null,
        });
        resetN({ note_customer: '', note_user: '' });
        ['nro_pedido','marca','modelo','anio','nro_vin'].forEach(k => setH(k, ''));
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        router.replace(`${pathname}?${params.toString()}`);
      }
    });
  };

  const toggleSeleccion = (item) =>
    setSeleccionados(prev => prev.some(i => i.CodItem === item.CodItem)
      ? prev.filter(i => i.CodItem !== item.CodItem)
      : [...prev, item]);

  const toggleTodos = () =>
    setSeleccionados(seleccionados.length === items.length ? [] : [...items]);

  const isEditing = editingItem !== null;

  return (
    <div className="space-y-5">

      {/* ── FILA SUPERIOR: cabecera + resumen ──────────────────────── */}
      <div className="grid grid-cols-4 items-start gap-5">

        {/* Panel: Datos de la Cotización (3/4) */}
        <div className="col-span-3 panel relative group border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {order?.NroOrden && !headerEditing && (
            <button type="button" onClick={() => setHeaderEditing(true)}
              title={t.edit ?? 'Editar'}
              className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-lg
                bg-amber-50 text-amber-500 hover:bg-amber-100 transition opacity-0 group-hover:opacity-100
                dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30">
              <IconPencil className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="grid grid-cols-5 gap-3">
            {[
              ['nro_pedido', t.nro_pedido ?? 'Nro. Pedido', order?.NroPedido],
              ['marca',      t.brand      ?? 'Marca',       order?.MarcaEquipo],
              ['modelo',     t.model      ?? 'Modelo',      order?.ModeloEquipo],
              ['anio',       t.year       ?? 'Año',         order?.AnioEquipo],
              ['nro_vin',    'Nro. VIN',                    order?.NroSerieEquipo],
            ].map(([name, label, savedValue]) => {
              const readOnly = order?.NroOrden && !headerEditing;
              return (
                <div key={name} className="flex flex-col gap-1">
                  <FieldLabel>{label}</FieldLabel>
                  {readOnly ? (
                    <span className="h-8 flex items-center px-3 text-xs text-gray-700 dark:text-gray-300 truncate">
                      {savedValue || '—'}
                    </span>
                  ) : (
                    <input type="text" {...regH(name)} className={inputCls} />
                  )}
                </div>
              );
            })}
          </div>
          {order?.NroOrden && headerEditing && (
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={handleCancelHeaderEdit}
                className="h-8 px-4 rounded-lg border border-gray-300 dark:border-gray-600
                  text-xs text-gray-600 dark:text-gray-400 font-medium
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {t.btn_cancel ?? 'Cancelar'}
              </button>
              <button type="button" onClick={handleUpdateHeader}
                className="h-8 px-4 rounded-lg bg-amber-500 text-white text-xs font-medium
                  shadow-sm hover:bg-amber-600 transition">
                {t.btn_update ?? 'Actualizar'}
              </button>
            </div>
          )}
        </div>

        {/* Panel: Resumen (1/4) */}
        <div className="panel border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700 mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t.nro_quote ?? 'Nro. Cotización'}:
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5
              text-xs font-bold text-primary tabular-nums">
              {order?.NroOrden ?? '---'}
            </span>
          </div>
          <InfoRow label={t.nro_items       ?? 'Nro. de Ítems'}        value={order?.NroItems   != null ? order.NroItems : undefined} />
          <InfoRow label={t.total_weight_lb ?? 'Peso Total (lb)'}      value={order?.NroItems   != null ? customFormat(order?.TotalPeso    ?? 0) : undefined} />
          <InfoRow label={t.tax             ?? 'Impuesto'}             value={order?.NroItems   != null ? customFormat(order?.MtoIva       ?? 0) : undefined} />
          <InfoRow label={t.quote_total     ?? 'Total Cotización $us.'} value={order?.NroItems  != null ? customFormat(order?.Total        ?? 0) : undefined} bold />

          {/* Seguimiento */}
          {order?.NroOrden && (
            <div className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide mb-1.5">
                {t.share_with ?? 'Compartir con'}
              </p>
              {all_disabled_tracking ? (
                <span className="flex items-center h-8 rounded-lg border border-primary/30 bg-primary/5
                  px-3 text-xs font-medium text-primary truncate">
                  {seguimientoNombre ?? '—'}
                </span>
              ) : (
                <div className="flex gap-0">
                  <div className="flex-1 min-w-0">
                    <Select
                      options={options_share}
                      value={select_share}
                      isClearable isSearchable
                      menuPosition="fixed"
                      placeholder={t.select_option ?? 'Selecciona...'}
                      onChange={(sel) => setSelectShare(sel ?? null)}
                      styles={{
                        control:             b => ({ ...b, minHeight: '32px', height: '32px', fontSize: '12px', borderRadius: '0.5rem 0 0 0.5rem', borderRight: 'none' }),
                        valueContainer:      b => ({ ...b, padding: '0 8px' }),
                        indicatorsContainer: b => ({ ...b, height: '32px' }),
                      }}
                    />
                  </div>
                  <button type="button" onClick={apply} disabled={!select_share}
                    className="h-8 shrink-0 px-3 rounded-r-lg border border-l-0 border-gray-300
                      bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20
                      transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {t.apply ?? 'Aplicar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── INGRESO / EDICIÓN DE ÍTEM ────────────────────────────── */}
      <div className={`panel border p-4 space-y-3 ${isEditing
        ? 'border-amber-300 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-900/10'
        : 'border-gray-200 dark:border-gray-700'}`}>

        {/* Header del panel */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-px ${isEditing ? 'bg-amber-300/60' : 'bg-primary/30'}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${isEditing ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
            {isEditing ? (t.editing_item ?? `Editando`) : (t.add_item ?? 'Ingresar Ítem')}
          </span>
          <div className={`flex-1 h-px ${isEditing ? 'bg-amber-300/60' : 'bg-primary/30'}`} />
        </div>

        {/* Fila 1: NroParte | Cantidad | Descripción */}
        <div className="grid grid-cols-8 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <FieldLabel>{t.nro_part ?? 'Nro. Parte'}</FieldLabel>
            <input type="text" autoComplete="off" {...regI('NroParte')} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>{t.qty ?? 'Cantidad'}</FieldLabel>
            <input type="number" step="any" min="1"
              {...regI('Cantidad', { valueAsNumber: true })}
              className={inputCls}
            />
          </div>
          <div className="col-span-5 flex flex-col gap-1">
            <FieldLabel>{t.description ?? 'Descripción'}</FieldLabel>
            <input type="text" autoComplete="off" {...regI('Descripcion')} className={inputCls} />
          </div>
        </div>

        {/* Fila 2: Costo | Peso | T.Entrega | Proveedor | Aplicación | $/Kg | Utilidad% */}
        <div className="grid grid-cols-7 gap-3">
          {[
            ['Costo', t.cost   ?? 'Costo'],
            ['Peso',  t.weight ?? 'Peso'],
          ].map(([name, label]) => (
            <div key={name} className="flex flex-col gap-1">
              <FieldLabel>
                {label} <span className="text-red-400">*</span>
              </FieldLabel>
              <input type="number" step="any" min="0"
                {...regI(name, { required: true, min: 0.001, valueAsNumber: true })}
                className={`${inputCls} ${errorsI[name] ? 'border-red-400 focus:ring-red-200' : ''}`}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <FieldLabel>{t.t_delivery ?? 'T. Entrega'}</FieldLabel>
            <input type="text" autoComplete="off" {...regI('TEntrega')} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>{t.supplier ?? 'Proveedor'}</FieldLabel>
            <Controller name="Proveedor" control={ctrlI}
              render={({ field }) => (
                <AsyncSelect
                  loadOptions={loadProveedorOptions} defaultOptions={false} cacheOptions isClearable
                  placeholder="..." menuPosition="fixed"
                  noOptionsMessage={({ inputValue }) =>
                    (inputValue?.trim().length ?? 0) < ASYNC_MIN ? `${ASYNC_MIN}+ chars` : 'Sin resultados'
                  }
                  value={field.value ?? null} onChange={opt => field.onChange(opt ?? null)}
                  styles={asyncStyles}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>{t.application ?? 'Aplicación'}</FieldLabel>
            <Controller name="Aplicacion" control={ctrlI}
              render={({ field }) => (
                <AsyncSelect
                  loadOptions={loadMarcaOptions} defaultOptions={false} cacheOptions isClearable
                  placeholder="..." menuPosition="fixed"
                  noOptionsMessage={({ inputValue }) =>
                    (inputValue?.trim().length ?? 0) < ASYNC_MIN ? `${ASYNC_MIN}+ chars` : 'Sin resultados'
                  }
                  value={field.value ?? null} onChange={opt => field.onChange(opt ?? null)}
                  styles={asyncStyles}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>
              {t.cost_per_kg ?? '$/Kg'} <span className="text-red-400">*</span>
            </FieldLabel>
            <input type="number" step="any" min="0"
              {...regI('Flete', { required: true, min: 0.001, valueAsNumber: true })}
              className={`${inputCls} ${errorsI.Flete ? 'border-red-400 focus:ring-red-200' : ''}`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>
              {t.profit_pct ?? 'Utilidad %'} <span className="text-red-400">*</span>
            </FieldLabel>
            <input type="number" step="any" min="0"
              {...regI('PorUtilidad', { required: true, min: 0.001, valueAsNumber: true })}
              className={`${inputCls} ${errorsI.PorUtilidad ? 'border-red-400 focus:ring-red-200' : ''}`}
            />
          </div>
        </div>

        {/* Fila 3: Resultado del cálculo (solo lectura) */}
        <div className="grid grid-cols-6 gap-3">
          {[
            [t.cost              ?? 'Costo',       calcResult?.costo       ?? 0],
            [t.freight            ?? 'Flete',       calcResult?.pesoFlete   ?? 0],
            [t.customs            ?? 'Aduana',      calcResult?.aduana      ?? 0],
            [t.cost_dpp           ?? 'Costo DPP',   calcResult?.costoInc    ?? 0],
            [t.profit             ?? 'Utilidad',    calcResult?.mtoUtilidad ?? 0],
            [t.sale_price         ?? 'Precio Venta', calcResult?.precio     ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <FieldLabel>{label}</FieldLabel>
              <input type="text" disabled readOnly tabIndex={-1}
                value={customFormat(value)}
                className="h-8 w-full rounded-lg border border-amber-200 dark:border-amber-700/50
                  bg-amber-50 dark:bg-amber-900/10 px-3 text-xs text-right tabular-nums font-semibold
                  text-gray-700 dark:text-gray-300 cursor-not-allowed"
              />
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-1">
          {isEditing && (
            <button type="button" onClick={() => { setEditingItem(null); resetI({ Cantidad: 1 }); setCalcResult(null); }}
              className="h-8 px-4 rounded-lg border border-gray-300 dark:border-gray-600
                text-xs text-gray-600 dark:text-gray-400 font-medium
                hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              {t.btn_cancel ?? 'Cancelar'}
            </button>
          )}
          <button type="button" onClick={submitI(handleCalcPrice)}
            className="h-8 px-4 rounded-lg border border-gray-300 dark:border-gray-600
              text-xs text-gray-600 dark:text-gray-400 font-medium
              hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t.calculate_price ?? 'Calcular Precio'}
          </button>
          <button type="button" onClick={submitI(handleAddItem)} disabled={!calcResult}
            className={`h-8 px-4 rounded-lg text-white text-xs font-medium shadow-sm transition
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isEditing
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-primary hover:bg-primary/90'}`}>
            {isEditing ? (t.update_item ?? 'Actualizar Ítem') : (t.add_item ?? 'Adicionar Ítem')}
          </button>
        </div>
      </div>

      {/* ── TOOLBAR + TABLA ──────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button type="button" onClick={newQuote} title={t.btn_new ?? 'Nuevo'}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition">
              <IconFile className="h-4 w-4" />
            </button>
            <BtnPrintQuote order={order}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600" />
            <button type="button" onClick={handleDeleteItems}
              disabled={seleccionados.length === 0}
              title={t.delete ?? 'Eliminar seleccionados'}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition disabled:opacity-30 disabled:cursor-not-allowed dark:bg-red-900/20 dark:hover:bg-red-900/30">
              <IconTrashLines className="h-4 w-4" />
            </button>
            <div className="flex-1" />
            <button type="button" onClick={buyQuote} disabled={hasItemsWithoutPrice}
              className="h-8 rounded-lg bg-green-600 px-4 text-white text-[11px] font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {t.buy ?? 'Comprar'}
            </button>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-10 text-center`}>
                    <input type="checkbox" className="form-checkbox border-gray-400 rounded"
                      checked={seleccionados.length === items.length && items.length > 0}
                      onChange={toggleTodos} />
                  </th>
                  <th className={`${thClass} w-8 text-center`}>{t.item ?? 'Item'}</th>
                  <th className={`${thClass} w-24`}>{t.qty ?? 'Cant.'}</th>
                  <th className={thClass}>{t.nro_part ?? 'Nro. Parte'}</th>
                  <th className={thClass}>{t.description ?? 'Descripción'}</th>
                  <th className={`${thClass} text-right`}>{t.price_unit_us ?? 'Precio Unit. $us.*'}</th>
                  <th className={`${thClass} text-right`}>{t.total_us ?? 'Total $us.'}</th>
                  <th className={thClass}>{t.t_delivery_2 ?? 'T. Entrega**'}</th>
                  <th className={`${thClass} w-8`} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, index) => (
                  <tr key={item.CodItem}
                    className={`transition ${editingItem === item.CodItem
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <td className={`${tdClass} text-center`}>
                      <input type="checkbox" className="form-checkbox border-gray-400 rounded"
                        checked={seleccionados.some(i => i.CodItem === item.CodItem)}
                        onChange={() => toggleSeleccion(item)} />
                    </td>
                    <td className={`${tdClass} text-center font-medium text-gray-400`}>{index + 1}</td>
                    <td className={tdClass}>
                      <input step="any" type="number"
                        {...regH(`tbl_items.${index}.Cantidad`, { valueAsNumber: true })}
                        onBlur={(e) => handleQuantityBlur(item, +e.target.value)}
                        className="h-8 w-20 rounded-lg border border-gray-200 dark:border-gray-600
                          bg-white dark:bg-gray-900 px-2 text-xs text-center
                          focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap font-medium`}>{item.NroParte}</td>
                    <td className={tdClass}>{item.DesRepuesto}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{customFormat(item.Precio)}</td>
                    <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(item.Total)}</td>
                    <td className={tdClass}>{item.TiEntrega}</td>
                    <td className={`${tdClass} text-center`}>
                      <button type="button" onClick={() => handleEditItem(item)}
                        title={t.edit ?? 'Editar'}
                        className="h-7 w-7 flex items-center justify-center rounded-lg
                          bg-amber-50 text-amber-500 hover:bg-amber-100 transition
                          dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30">
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTAS + RESUMEN FINANCIERO ──────────────────────────── */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Notas */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.notes ?? 'Notas'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <button type="button" onClick={submitN(onSaveNote)}
                className="h-9 rounded-lg bg-slate-300 px-4 text-gray-600 text-xs font-medium hover:bg-slate-500 hover:text-white transition shadow-sm">
                {t.btn_save ?? 'Guardar'}
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t.note_to_customer ?? 'Nota a cliente'}</label>
                <textarea defaultValue={order?.NotaCliente} {...regN("note_customer")} rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t.note_to_user ?? 'Nota a Usuario'}</label>
                <textarea defaultValue={order?.NotaUsuario} {...regN("note_user")} rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="pt-1 space-y-0.5">
                <p className="text-[11px] leading-snug text-gray-400 dark:text-gray-500">{t.note_inventory_disclaimer}</p>
                <p className="text-[11px] leading-snug text-gray-400 dark:text-gray-500">{t.note_delivery_disclaimer}</p>
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.summary ?? 'Resumen'}</p>
              <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
            </div>
            <div className="p-4 space-y-0">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">{t.total_spare_parts ?? 'Total Repuestos'}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order?.TotRepuestos)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">{t.shipping_handling ?? 'Shipping & Handling $us.'}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order?.FleteInterno)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">{t.discount ?? 'Descuento'}</span>
                <span className="text-sm font-semibold text-red-500">{order?.Descuento ? `- ${customFormat(order.Descuento)}` : '0.00'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">{t.tax ?? 'Mto. Iva'}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order?.MtoIva)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total $us</span>
                <span className="text-base font-bold text-primary">{customFormat(order?.Total)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
