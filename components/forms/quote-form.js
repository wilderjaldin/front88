'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import IconFile from '../icon/icon-file';
import IconX from '../icon/icon-x';
import IconMail from '../icon/icon-mail';
import IconAttachment from '../icon/icon-attachment';
import IconDiscount from '../icon/icon-discount';
import Modal from '@/components/modal';
import OptionsItemsQuote from '@/components/forms/options-items-quote'
import DiscountForm from "@/components/forms/discount-form"
import AttachQuoteForm from "@/components/forms/attach-quote-form"
import QuoteBatchFormMini from "@/components/forms/quote-batch-form-mini"
import MessageQuoteForm from "@/components/forms/message-quote"
import PriceParametersForm from "@/components/forms/price-parameters-form"
import NotFoundPartForm from "@/components/forms/not-found-part-form"
import CostSummary from "@/components/cost-summary"
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import IconTrashLines from '../icon/icon-trash-lines';
import IconCheck from '../icon/icon-check';
import IconRefresh from '../icon/icon-refresh';
import TableReference from "@/app/admin/revision/quotes/table-reference"
//import PdfViewer from "@/app/admin/revision/quotes/PdfViewer"
import BtnPrintQuote from "@/components/BtnPrintQuote"
import IconDirection from '../icon/icon-direction';
import axiosClient from '@/app/lib/axiosClient';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const IconBatch = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const URL_SEARCH = 'cotizaciondetalle/buscar-parte';
const URL_UPDATE_QUANTITY = 'cotizaciondetalle/modificar-cantidad';
const URL_UPDATE_NOTE = 'cotizaciondetalle/guardar-notas';
const URL_UPDATE_QUOTE = 'cotizaciondetalle/actualizar-datos';
const URL_DELETE_ITEM_QUOTE = 'cotizaciondetalle/eliminar-item';
const URL_UPDATE_PREFERENCE = 'cotizaciondetalle/cambiar-preferencia';
const URL_SAVE_FREIGHT = 'cotizaciondetalle/modificar-flete-interno';
const URL_DELETE_FREIGHT = 'cotizaciondetalle/distribuir-flete-interno';
const URL_MORE_QUOTE = 'cotizaciondetalle/veropciones';
const URL_CLONE_QUOTE = 'cotizaciondetalle/dupcotizacion';
const URL_VALIDATE_QUOTE = 'cotizaciondetalle/valnroparte';
const URL_PRICE_PARAMETERS = 'cotizaciondetalle/mostrar-parametro-precio';
const URL_UPDATE_ITEM = 'cotizaciondetalle/actualizar-item';
const URL_SEARCH_REFERENCE = 'referenciasCruzadas/buscar';
const URL_CHANGE_REPORT = 'cotizaciondetalle/mostrar-codigo';
const URL_MARCAS           = 'cotizacion/marcas';
const URL_GET_SEGUIMIENTO  = 'usuarios/seguimiento';
const URL_SAVE_SEGUIMIENTO = 'cotizaciondetalle/registrar-seguimiento';
const URL_REORDER          = 'cotizaciondetalle/ordenar-detalle';

const ICON_CHECK     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X         = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_QUESTION  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title, msg = '') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    ${msg ? `<p style="color:#94a3b8;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.08em">${msg}</p>` : ''}
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

const swalConfirm = (title, msg = '', { confirmText = 'Sí', cancelText = 'Cancelar', confirmColor = '#4f46e5' } = {}) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_QUESTION}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 ${msg ? '10px' : '0'};line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showCancelButton: true,
  confirmButtonText: confirmText,
  cancelButtonText: cancelText,
  confirmButtonColor: confirmColor,
  reverseButtons: true,
});

const ICON_INFO = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2.5"/><path d="M12 8h.01M12 12v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const swalInfo = (title, msg = '', confirmText = 'Entendido') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(245,158,11,0.3)">${ICON_INFO}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#f59e0b',
});

const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true,
  confirmButtonText: confirmText,
  confirmButtonColor: '#ef4444',
});

function SortableRow({ id, index, children, className }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr
      ref={setNodeRef}
      className={className}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: isDragging ? 'var(--color-primary-light, #eff6ff)' : undefined,
      }}
    >
      <td className="px-1.5 py-2 w-9 text-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none group/drag"
          tabIndex={-1}
          title="Arrastrar para reordenar"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full
            bg-slate-100 dark:bg-slate-700
            text-[10px] font-bold text-slate-400 dark:text-slate-400
            group-hover/drag:bg-primary/15 group-hover/drag:text-primary
            group-active/drag:scale-95
            transition-all select-none">
            {index}
          </span>
        </button>
      </td>
      {children}
    </tr>
  );
}

const QuoteForm = ({ t, token, _customer_, _order_ = [], _items_, _tracking_ }) => {


  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
  const [items, setItems] = useState(_items_)
  const [order, setOrder] = useState(_order_)
  const [isSelectItems, setIsSelectItems] = useState(false);
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [seguimientoNombre,     setSeguimientoNombre]   = useState(null);
  const [options_share,         setOptionsShare]        = useState([]);
  const [select_share,          setSelectShare]         = useState(null);
  const [customer,  setCustomer]  = useState(_customer_);
  const [brands,    setBrands]    = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItemsWithoutPrice = items.some(item => !item.Precio || item.Precio === 0);

  const tablaRef = useRef(null);
  const locale = useSelector(getLocale);


  const [seleccionados, setSeleccionados] = useState([])

  const toggleSeleccion = (item) => {
    setSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((i) => i.CodItem !== item.CodItem) : [...prev, item]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === items.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(items.map((d) => d))
    }
  }

  const {
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { freight: customFormat(_order_.FleteInterno) } });

  const {
    register: registerSearchQuote,
    getValues: getValuesQuote,
    setValue: setValueQuote,
    setFocus,
    control,
    formState: { errors: errorsSearchQuote },
    handleSubmit: handleSearchQuoteFormSubmit
  } = useForm({
    defaultValues: {
      nro_part: "01643-32780",
      quantity: 3,
      items: items.map(p => ({ Cantidad: 1 }))
    }
  })

  const {
    register: registerNoteQuote,
    getValues: getValuesNoteQuote,
    formState: { errors: errorsNoteQuote },
    handleSubmit: handleSaveNoteQuoteFormSubmit
  } = useForm();

  useEffect(() => {
    setOrder(_order_);
    setValue('freight', customFormat(_order_.FleteInterno));

    setValueQuote('equipment_brand', brands.find(opt => opt.label === (_order_?.MarcaEquipo ?? null)) || null)
    if (!_order_.NroOrden) {
      setAllDisabledTracking(true)
    } else {
      setAllDisabledTracking(false)
    }
  }, [_order_]);

  useEffect(() => {
    setValue('freight', customFormat(order.FleteInterno));
  }, [order]);

  useEffect(() => {
    setCustomer(_customer_)

  }, [_customer_]);

  useEffect(() => {
    if (_tracking_?.nomUsuario) {
      setSeguimientoNombre(_tracking_.nomUsuario);
      setAllDisabledTracking(true);
    }
  }, [_tracking_]);

  useEffect(() => {
    setItems(_items_)
    updateInputs(_items_);
  }, [_items_]);

  useEffect(() => {
    if (seleccionados.length > 0) {
      setIsSelectItems(false)
    } else {
      setIsSelectItems(true);
    }
  }, [seleccionados]);

  useEffect(() => {
    axiosClient.get(URL_MARCAS).then(rs => {
      const raw = Array.isArray(rs.data) ? rs.data : (rs.data.marcas ?? rs.data.dato1 ?? rs.data.data ?? []);
      setBrands(raw.filter(m => m != null).map(m => ({ value: m.value ?? m.CodMarca ?? m.codMarca, label: m.label ?? m.NomMarca ?? m.nomMarca })).filter(m => m.value != null && m.label != null));
    }).catch(() => {});
  }, []);

  const updateInputs = (items) => {

    items.map((p, index) => {
      setValueQuote(`items.${p.CodItem}.Cantidad`, p.Cantidad);
    });
  }

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
        Total:        cotizacion.totalSus      ?? 0,
        TotRepuestos: cotizacion.totRepuestos  ?? 0,
        TotalPeso:    cotizacion.totPeso       ?? 0,
        Descuento:    cotizacion.mtoDescuento  ?? 0,
        MtoIva:       cotizacion.mtoIva        ?? 0,
        FleteInterno: cotizacion.mtoFlete      ?? 0,
        TipoCambio:   cotizacion.tipCambio     ?? 0,
        NroItems:     cotizacion.nroItems,
      }));
      const newItems = mapDetalle(detalle);
      setItems(newItems);
      updateInputs(newItems);
    } catch {}
  };

  useEffect(() => {
    if (!order) return;

    const equipmentBrand = brands.find(opt => opt.label === order?.MarcaEquipo) || null;
    const engineBrand = brands.find(opt => opt.label === order?.MarcaMotor) || null;

    setValueQuote('nro_order', order.NroPedido);
    setValueQuote('equipment_model', order.ModeloEquipo);
    setValueQuote('equipment_serie', order.NroSerieEquipo);
    setValueQuote('equipment_year', order.AnioEquipo);
    setValueQuote('engine_model', order.ModeloMotor);
    setValueQuote('engine_serie', order.NroSerieMotor);

    setValueQuote('equipment_brand', equipmentBrand);
    setValueQuote('engine_brand', engineBrand);

  }, [order, brands]);


  const onSaveNote = async (data) => {
    try {
      await axiosClient.post(URL_UPDATE_NOTE, { NroCotizacion: order.NroOrden, NotaUsuario: data.note_user, NotaCliente: data.note_customer });
      swalSuccess(t.save_note_quote_success);
    } catch (error) {
      swalError(t.error, t.save_note_quote_error, t.close);
    }
  }

  const run = (fn) => async (...args) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { await fn(...args); }
    finally { setIsSubmitting(false); }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await run(handleSearchQuoteFormSubmit(onSearch))();
    }
  };

  const mapCotizacion = (cotizacion) => ({
    NroOrden:       cotizacion.nroCotizacion,
    NroItems:       cotizacion.nroItems,
    NroPedido:      cotizacion.nroPedido                        ?? '',
    MarcaEquipo:    cotizacion.marcaEquipo  ?? cotizacion.marca  ?? '',
    MarcaMotor:     cotizacion.marcaMotor   ?? cotizacion.marcaMo  ?? '',
    ModeloEquipo:   cotizacion.modeloEquipo ?? cotizacion.modelo ?? '',
    NroSerieEquipo: cotizacion.nroSerieEquipo ?? cotizacion.nroSerie ?? '',
    AnioEquipo:     cotizacion.anioEquipo   ?? cotizacion.anio   ?? '',
    ModeloMotor:    cotizacion.modeloMotor  ?? cotizacion.modeloMo ?? '',
    NroSerieMotor:  cotizacion.nroSerieMotor ?? cotizacion.nroSerieMo ?? '',
    FleteInterno:   cotizacion.mtoFlete        ?? 0,
    MostrarCodigo:  cotizacion.mostrarCodigo   ?? 0,
    TotalPeso:      cotizacion.totPeso         ?? 0,
    Total:          cotizacion.totalSus        ?? 0,
    TipoCambio:     cotizacion.tipCambio       ?? 0,
    TipMoneda:      cotizacion.tipMoneda       ?? '',
    NotaCliente:    cotizacion.notCliente      ?? '',
    NotaUsuario:    cotizacion.notUsuario      ?? '',
    TotRepuestos:   cotizacion.totRepuestos    ?? 0,
    Descuento:      cotizacion.mtoDescuento    ?? 0,
    MtoIva:         cotizacion.mtoIva          ?? 0,
  });

  const mapDetalle = (detalle) => (detalle ?? []).map(d => ({
    CodItem:     d.codItem,
    CodRepuesto: d.codRepuesto,
    NroParte:    d.nroParte      ?? '',
    Cantidad:    d.cant          ?? 0,
    DesRepuesto: d.descripcion   ?? '',
    Marca:       d.marca         ?? '',
    Aplicacion:  d.aplicacion    ?? '',
    TipoRepuesto: d.tipoRepuesto ?? '',
    DiasVigencia: d.diasVigencia ?? '',
    Precio:      d.preUniSus     ?? 0,
    Total:       d.totSus        ?? 0,
    Peso:        d.peso          ?? 0,
    TiEntrega:   d.desTieEntrega ?? '',
    Indicador:   d.indicador     ?? '',
    Estado:      d.estado        ?? '',
    ParPrecio:   d.parPrecio     ?? false,
  }));

  const mapOpcion = (o) => ({
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

  const showOptions = (opciones, data) => {
    setModalTitle('');
    setModalSize('w-full max-w-5xl');
    setModalContent(
      <OptionsItemsQuote
        close={() => setShowModal(false)}
        updateInputs={updateInputs}
        setItems={setItems}
        setOrder={setOrder}
        options={opciones}
        customer={customer}
        order={order}
        token={token}
        t={t}
        data={data}
      />
    );
    setShowModal(true);
  };

  const onSearch = async (data) => {

    const data_search = {
      NroParte:      data.nro_part,
      CodCliente:    customer.CodCliente,
      NroCotizacion: order.NroOrden || 0,
      Cantidad:      data.quantity,
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
      const rs = await axiosClient.post(URL_SEARCH, data_search);
      const { resultado: _res, cotizacion, detalle, opcionesLocales, opcionesImportacion } = rs.data;
      const resultado = String(_res ?? '').replace(/"/g, '').trim().toLowerCase();

      if (resultado === 'no_encontrado') {
        const updatedOrder = mapCotizacion(cotizacion);
        const updatedItems = mapDetalle(detalle);
        setOrder(updatedOrder);
        setItems(updatedItems);
        updateInputs(updatedItems);
        setValueQuote('nro_part', '');
        setValueQuote('quantity', '');
        if (updatedOrder.NroOrden) {
          router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${updatedOrder.NroOrden}`);
        }
        setModalTitle(t?.part_not_found ?? 'Parte no encontrada');
        setModalSize('w-full max-w-md');
        setModalContent(
          <NotFoundPartForm
            close={() => setShowModal(false)}
            nroParte={data.nro_part}
            codRegistro={rs.data.codRegistroSC}
            brands={brands}
            t={t}
            onSaved={() => setShowModal(false)}
          />
        );
        setShowModal(true);
        return;
      }

      if (resultado === 'multiples') {
        const opciones = [
          ...(opcionesLocales ?? []),
          ...(opcionesImportacion ?? []),
        ].map(mapOpcion);
        showOptions(opciones, data);
        return;
      }

      // resultado === 'encontrado'
      const updatedOrder = mapCotizacion(cotizacion);
      const updatedItems = mapDetalle(detalle);

      swalSuccess(t.add_item_to_quote_success).then(() => {
        setOrder(updatedOrder);
        setItems(updatedItems);
        if (updatedOrder.NroOrden) {
          router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${updatedOrder.NroOrden}`);
        }
        setValueQuote('nro_part', '');
        setValueQuote('quantity', '');
        updateInputs(updatedItems);
        setFocus("nro_part");
      });

    } catch (error) {

    }
  }

  const updateItem = async () => {
    try {
      const rs = await axiosClient.put(URL_UPDATE_ITEM, {
        NroCotizacion: order.NroOrden,
        Items: seleccionados.map(i => ({ CodItem: i.CodItem, Cantidad: i.Cantidad })),
      });
      const { cotizacion, detalle } = rs.data;
      const updatedOrder = mapCotizacion(cotizacion);
      const updatedItems = mapDetalle(detalle);
      swalSuccess(t.update_item_success).then(() => setSeleccionados([]));
      setOrder(updatedOrder);
      setItems(updatedItems);
      updateInputs(updatedItems);
    } catch (error) {

    }
  }
  const message = () => {
    setModalSize('w-full max-w-6xl');
    setModalTitle('');
    setModalContent(<MessageQuoteForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></MessageQuoteForm>);
    setShowModal(true);
  }

  const discount = () => {
    setModalTitle(t.add_discount ?? 'Agregar Descuento');
    setModalSize('w-full max-w-lg');
    setModalContent(<DiscountForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></DiscountForm>);
    setShowModal(true);
  }
  const attach = () => {
    setModalTitle('');
    setModalSize('w-full max-w-6xl');
    setModalContent(<AttachQuoteForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></AttachQuoteForm>);
    setShowModal(true);
  }

  const addBatch = () => {
    setModalTitle(t.enter_codes_in_batch ?? 'Añadir en Lote');
    setModalSize('w-full max-w-2xl');
    setModalContent(<QuoteBatchFormMini close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} t={t}></QuoteBatchFormMini>);
    setShowModal(true);
  }

  const updateQuote = async () => {
    const data = getValuesQuote();
    try {
      await axiosClient.put(URL_UPDATE_QUOTE, {
        NroCotizacion:  order.NroOrden,
        NroPedido:      data.nro_order        ?? '',
        MarcaEquipo:    (data.equipment_brand?.label) ?? '',
        ModeloEquipo:   data.equipment_model  ?? '',
        AnioEquipo:     data.equipment_year   ?? '',
        NroSerieEquipo: data.equipment_serie  ?? '',
        MarcaMotor:     (data.engine_brand?.label)    ?? '',
        ModeloMotor:    data.engine_model     ?? '',
        NroSerieMotor:  data.engine_serie     ?? '',
      });
      swalSuccess(t.update_quote_success);
    } catch (error) {
      swalError(t.error, t.update_quote_error_server, t.close);
    }
  }

  const newQuote = () => {
    swalConfirm(t.question_create_new_quote, '', { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#15803d' }).then(async (result) => {
      if (result.isConfirmed) {
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.delete("id");
        router.replace(`${pathname}?${nextSearchParams}`);
        setOrder([]);
        setItems([]);
      }
    });


  }

  useEffect(() => {
    if (!order.NroOrden || all_disabled_tracking) return;
    axiosClient.get(URL_GET_SEGUIMIENTO)
      .then(rs => {
        const raw = Array.isArray(rs.data) ? rs.data : (rs.data.data ?? rs.data.usuarios ?? []);
        setOptionsShare(raw.map(u => ({ value: u.codUsuario ?? u.CodUsuario, label: u.nomUsuario ?? u.NomUsuario })));
      })
      .catch(() => {});
  }, [order.NroOrden, all_disabled_tracking]);


  const handleChangePreference = async (select) => {
    try {
      Swal.fire({
        title: t.updating,
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(async () => {
        const rs = await axiosClient.put(URL_UPDATE_PREFERENCE, {
          NroCotizacion:  order.NroOrden,
          TipoPreferencia: select.value,
        });
        const { cotizacion, detalle } = rs.data;
        const updatedOrder = mapCotizacion(cotizacion);
        const updatedItems = mapDetalle(detalle);
        swalSuccess(t.update_preference_success).then(() => {
          setOrder(updatedOrder);
          setItems(updatedItems);
        });
      });
    } catch (error) {
      swalError(t.error, t.update_preference_error_server, t.close);

    }
  }

  const applyFreight = async (mtoFlete, confirmado) => {
    try {
      const rs = await axiosClient.put(URL_SAVE_FREIGHT, {
        NroCotizacion:   order.NroOrden,
        MtoFleteInterno: mtoFlete,
        Confirmado:      confirmado,
      });
      const { resultado, cotizacion, detalle, mensaje } = rs.data;

      if (resultado === 'requiere_confirmacion') {
        swalConfirm(
          mensaje ?? t.question_freight_distributed ?? '¿Deseas restablecer el flete interno?',
          '',
          { confirmText: t.yes ?? 'Sí', cancelText: t.no ?? 'No', confirmColor: '#4f46e5' }
        ).then(async (r) => {
          if (r.isConfirmed) {
            await applyFreight(mtoFlete, true);
          } else {
            setValue('freight', '0');
          }
        });
        return;
      }

      swalSuccess(t.save_freight_success).then(() => {
        setOrder(mapCotizacion(cotizacion));
        setItems(mapDetalle(detalle));
      });
    } catch (error) {
      swalError(t.error, t.save_freight_error_server, t.close);
    }
  };

  const saveFreight = async () => {
    const freight = parseFloat(getValues('freight')) || 0;
    await applyFreight(freight, false);
  }

  const deleteFreight = async () => {
    swalConfirm(t.question_delete_freight, '', { confirmText: t.yes_distribute, cancelText: t.btn_cancel, confirmColor: '#dc2626' }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.put(URL_DELETE_FREIGHT, { NroCotizacion: order.NroOrden });
        const { cotizacion, detalle } = rs.data;
        swalSuccess(t.delete_freight_success).then(() => {
          setOrder(mapCotizacion(cotizacion));
          setItems(mapDetalle(detalle));
        });
      } catch (error) {
        swalError(t.error, t.delete_freight_error_server, t.close);
      }
    });
  }

  const showMore = async (item) => {
    console.log('INI', item)
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
        ...(opcionesLocales   ?? []).map(mapOpt),
        ...(opcionesImportacion ?? []).map(mapOpt),
      ];
      if (!options.length) return;

      let data = getValuesQuote();
      data.nro_part = item.NroParte.replace(/\s+/g, '').replace(/\*/g, '');
      data.quantity = getValuesQuote(`items.${item.CodItem}.Cantidad`);
      data.position = item.CodItem;

      setModalTitle('');
      setModalSize('w-full max-w-5xl');
      setModalContent(<OptionsItemsQuote
        close={() => setShowModal(false)}
        updateInputs={updateInputs}
        setItems={setItems}
        setOrder={setOrder}
        options={options}
        customer={customer}
        order={order}
        token={token}
        item_select={item}
        t={t}
        data={data}
      />);
      setShowModal(true);
    } catch (error) {}
  }

  /*
  const selectItem = (e, item) => {
    if (e.target.checked) {
      setSelectItems(prevArray => [...prevArray, item]);
    } else {

      setSelectItems(() => {
        return select_items.filter((i) => {
          return item.CodItem != i.CodItem;
        });
      });

    }
  }
  */

  const deleteItems = async () => {
    const count = seleccionados.length;
    if (!count) return;

    const title = count === 1
      ? t.question_delete_item   ?? '¿Desea eliminar el item seleccionado?'
      : t.question_delete_items  ?? `¿Desea eliminar los ${count} items seleccionados?`;

    const result = await swalConfirm(title, '', {
      confirmText: t.yes ?? 'Sí',
      cancelText:  t.btn_cancel ?? 'Cancelar',
      confirmColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      const rs = await axiosClient.delete(URL_DELETE_ITEM_QUOTE, {
        data: {
          NroCotizacion: order.NroOrden,
          Items: seleccionados.map(i => ({ CodItem: i.CodItem })),
        }
      });
      const { cotizacion, detalle } = rs.data;
      const updatedOrder = mapCotizacion(cotizacion);
      const updatedItems = mapDetalle(detalle);
      swalSuccess(t.delete_item_success).then(() => setSeleccionados([]));
      setOrder(updatedOrder);
      setItems(updatedItems);
      updateInputs(updatedItems);
    } catch (error) {}
  }

  const priceParameters = async () => {
    try {
      const rs = await axiosClient.get(`${URL_PRICE_PARAMETERS}/${order.NroOrden}`);
      setModalSize('w-full max-w-lg');
      setModalTitle(t.price_parameters ?? 'Parámetro Precio');
      setModalContent(<PriceParametersForm
        close={() => setShowModal(false)}
        updateInputs={updateInputs}
        setItems={setItems}
        setOrder={setOrder}
        customer={customer}
        order={order}
        token={token}
        default_value={rs.data.porUtilidad}
        items={items}
        seleccionados={seleccionados}
        t={t}
        data={[]}
      />);
      setShowModal(true);
    } catch (error) {
      swalError(t.error, t.price_parameters_error ?? 'No se pudo cargar los parámetros', t.close);
    }
  }

  const costSummary = () => {

    setModalTitle('');
    setModalSize('w-full max-w-sm');
    setModalContent(<CostSummary
      close={() => setShowModal(false)}
      order={order}
      token={token}
      t={t}
    ></CostSummary>);
    setShowModal(true);
  }

  const cloneQuote = () => {
    swalConfirm(t.clone_quote, t.question_clone_quote, { confirmText: t.yes, cancelText: t.btn_cancel, confirmColor: '#15803d' }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          html: `<div style="padding:16px 0 8px">
            <p style="color:#475569;font-size:14px;font-weight:500;margin:0">${t.duplicating_quote ?? 'Duplicando cotización...'}</p>
          </div>`,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });
        try {
          const rs = await axiosClient.post(URL_CLONE_QUOTE, { NroCotizacion: order.NroOrden, Idioma: locale });
          const nuevaCotizacion = rs.data?.cotizacion ?? rs.data;
          const nroNuevo = nuevaCotizacion?.nroCotizacion;
          if (nroNuevo) {
            swalSuccess(t.clone_quote_success ?? 'Cotización duplicada').then(() => {
              router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${nroNuevo}`);
            });
          }
        } catch {
          swalError(t.error, t.clone_quote_error ?? 'No se pudo duplicar la cotización', t.close);
        }
      }
    });
  }
  const validateQuote = async (cadNroParte = null, blnForzar = false) => {
    if (!blnForzar && seleccionados.length === 0) {
      swalError(t.error, t.validate_quote_empty_error, t.close);
      return;
    }

    const cadParte = cadNroParte ?? [...new Set(seleccionados.map(i => i.NroParte))].join(',');

    try {
      const rs = await axiosClient.post(URL_VALIDATE_QUOTE, {
        NroCotizacion: order.NroOrden,
        CadNroParte:   cadParte,
        BlnReg:        true,
        BlnForzar:     blnForzar,
      });

      const { resultado, mensaje, cadNroParte: repetidos, esDuplicado } = rs.data;

      if (resultado === 'ok') {
        if (esDuplicado) {
          swalConfirm(mensaje, '', { confirmText: t.yes ?? 'Sí', cancelText: t.no ?? 'No', confirmColor: '#4f46e5' })
            .then(async (r) => {
              if (r.isConfirmed) await validateQuote(repetidos, true);
            });
        } else {
          swalSuccess(mensaje || (t.validate_quote_success ?? 'Enviado a Repuestos por Cotizar'));
          setSeleccionados([]);
        }
      }
    } catch (error) {
      swalError(t.error, t.validate_quote_error_server ?? 'Error al validar', t.close);
    }
  }

  const apply = async () => {
    try {
      await axiosClient.post(URL_SAVE_SEGUIMIENTO, {
        NroCotizacion:        order.NroOrden,
        codUsuarioCompartido: select_share?.value ?? 0,
        notaUsuario:          getValuesNoteQuote('note_user') ?? '',
      });
      setSeguimientoNombre(select_share?.label ?? null);
      setAllDisabledTracking(true);
      swalSuccess(t.tracking_option_success ?? 'Seguimiento registrado');
    } catch (error) {
      const msg = error.response?.status === 404
        ? (t.quote_not_found ?? 'Cotización no encontrada')
        : (error.response?.data?.message ?? t.error);
      swalError(t.error, msg, t.close);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.CodItem === active.id);
    const newIndex = items.findIndex(i => i.CodItem === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    try {
      await axiosClient.post(URL_REORDER, {
        nroCotizacion: order.NroOrden,
        items: reordered.map((item, idx) => ({ codItem: item.CodItem, orden: idx + 1 })),
      });
    } catch {}
  };

  const buyQuote = () => {

    let novalid = [];
    if (items.length > 0) {
      items.map(item => {
        if (item.Precio == 0) {
          novalid.push(item.NroParte);
        }
      })
    }
    if (novalid.length > 0) {
      Swal.fire({
        title: t.error,
        text: `${t.quote_without_price} - [${novalid.join(", ")}]`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('option', 'buy');
    nextSearchParams.set('step', 'verify')
    router.replace(`${pathname}?${nextSearchParams}`);
  }

  const showReference = async (item) => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });



    try {
      const NroParte = (item.NroParte.replace(/\s+/g, "").replace(/\*/g, ""));
      const rs = await axiosClient.get(URL_SEARCH_REFERENCE, { params: { nroParte: NroParte, codDax: '' } });

      const references = (rs.data.referencias ?? []).map(r => ({
        CodRegistro:   r.codRegistro,
        NroParte:      r.nroParte,
        NomAplicacion: r.aplicacion,
        FecRegistra:   r.fecRegistra,
      }));
      const options = (rs.data.repuestos ?? []).map(r => ({
        NroParte:    r.nroParte,
        DesRepuesto: r.descripcion,
        NomPrv:      r.proveedor,
        NomMarca:    r.marca,
        Peso:        r.peso,
        Costo:       r.costo,
        Estado:      '',
      }));

      setShowModal(true);
      setModalSize('w-full max-w-6xl');
      setModalTitle(t.reference_part_change);
      setModalContent(<TableReference brands={brands} NroParte={NroParte} t={t} items={references} options={options} token={token} close={() => setShowModal(false)} quote_id={order.NroOrden} />);
      Swal.close();
    } catch (error) {
      Swal.close();
    }
  }


  const handelChangeShowPart = async (element) => {

    const isChecked = element.target.checked;

    Swal.fire({
      title: t.updating,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axiosClient.post(URL_CHANGE_REPORT, { NroOrden: order.NroOrden, MostrarCodigo: isChecked ? 1 : 0 });
      Swal.close();
      setOrder(prev => ({ ...prev, MostrarCodigo: isChecked ? 1 : 0 }));
      swalSuccess(t.record_updated);
    } catch (error) {
      Swal.close();
    }
  }

  const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 text-right pr-3";
  const inputClass  = "h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const thClass     = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
  const tdClass     = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

  return (
    <>
      {/* ── TOP: Search + Summary ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── LEFT: Search + Quote Data + Report ── */}
        <div className="space-y-4">

          {/* Buscar repuesto */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <form onSubmit={run(handleSearchQuoteFormSubmit(onSearch))}>
              <div className="px-4 pt-4 pb-4 space-y-2.5 bg-white dark:bg-gray-900">

                {/* Nro. Parte + Cantidad + Buscar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input onKeyDown={handleKeyDown} type="text" autoComplete="off"
                      {...registerSearchQuote("nro_part", { required: true })}
                      placeholder={t.enter_nro_part}
                      className={`h-9 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 transition ${errorsSearchQuote.nro_part ? 'border-red-400 dark:border-red-500 focus:ring-red-300/30' : 'border-gray-300 dark:border-gray-700 focus:ring-primary/30'}`} />
                    {errorsSearchQuote.nro_part && (
                      <p className="absolute top-full left-0 mt-0.5 text-[10px] text-red-500 whitespace-nowrap">{t.field_required ?? 'Campo requerido'}</p>
                    )}
                  </div>
                  <div className="relative w-40">
                    <input onKeyDown={handleKeyDown} type="number" min="1" step="1" autoComplete="off"
                      {...registerSearchQuote("quantity", { required: true, min: 1, valueAsNumber: true })}
                      placeholder={t.enter_quantity}
                      className={`h-9 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 transition ${errorsSearchQuote.quantity ? 'border-red-400 dark:border-red-500 focus:ring-red-300/30' : 'border-gray-300 dark:border-gray-700 focus:ring-primary/30'}`} />
                    {errorsSearchQuote.quantity && (
                      <p className="absolute top-full left-0 mt-0.5 text-[10px] text-red-500 whitespace-nowrap">{t.field_required ?? 'Campo requerido'}</p>
                    )}
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="h-9 shrink-0 rounded-lg bg-primary px-5 text-white text-sm font-medium hover:bg-primary/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.btn_search}
                  </button>
                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <button type="button" onClick={run(addBatch)} disabled={isSubmitting}
                    title={t.enter_codes_in_batch ?? 'Añadir en Lote'}
                    className="h-9 shrink-0 flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 text-primary text-sm font-medium hover:bg-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <IconBatch className="h-3.5 w-3.5" />
                    {t.enter_codes_in_batch ?? 'Añadir en Lote'}
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Datos de la cotización */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.quote_data ?? 'Datos de la Cotización'}</p>
              <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
            </div>
            <div className="bg-white dark:bg-gray-900">

              {/* Nro. Pedido */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <label className={labelClass}>{t.nro_pedido}</label>
                <input type="text" autoComplete="off" {...registerSearchQuote("nro_order")} placeholder={t.enter_nro_order} className={`${inputClass} uppercase`}
                  onInput={e => { e.target.value = e.target.value.toUpperCase(); }} />
              </div>

              {/* Equipo + Motor en 2 columnas inline */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-4">

                {/* Cabeceras */}
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-blue-200 dark:bg-blue-800 rounded" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 px-1">{t.equipment_data}</span>
                  <div className="h-px flex-1 bg-blue-200 dark:bg-blue-800 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-violet-200 dark:bg-violet-800 rounded" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 px-1">{t.engine_data}</span>
                  <div className="h-px flex-1 bg-violet-200 dark:bg-violet-800 rounded" />
                </div>

                {/* Marca */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.brand}</label>
                  <div className="flex-1">
                    <Controller name="equipment_brand" control={control} rules={{ required: false }}
                      render={({ field }) => (
                        <Select {...field} isClearable options={brands} placeholder={t.select} instanceId="equipment_brand" menuPosition="fixed" menuShouldScrollIntoView={false}
                          filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                          noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? (t.type_to_search ?? 'Escribe al menos 2 caracteres') : (t.no_options ?? 'Sin opciones')}
                          styles={{ control: b => ({ ...b, minHeight: '32px', height: '32px', fontSize: '12px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '32px' }) }}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.brand}</label>
                  <div className="flex-1">
                    <Controller name="engine_brand" control={control} rules={{ required: false }}
                      render={({ field }) => (
                        <Select {...field} isClearable options={brands} placeholder={t.select} instanceId="engine_brand" menuPosition="fixed" menuShouldScrollIntoView={false}
                          filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                          noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? (t.type_to_search ?? 'Escribe al menos 2 caracteres') : (t.no_options ?? 'Sin opciones')}
                          styles={{ control: b => ({ ...b, minHeight: '32px', height: '32px', fontSize: '12px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '32px' }) }}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Modelo */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.model}</label>
                  <input type="text" autoComplete="off" {...registerSearchQuote("equipment_model")} placeholder={t.enter_equipment_model}
                    onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
                    className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.model}</label>
                  <input type="text" autoComplete="off" {...registerSearchQuote("engine_model")} placeholder={t.enter_engine_model}
                    onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
                    className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {/* Serie */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.equipment_serie ?? 'Serie'}</label>
                  <input type="text" autoComplete="off" {...registerSearchQuote("equipment_serie")} placeholder={t.enter_equipment_serie}
                    onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
                    className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.engine_serie ?? 'Serie'}</label>
                  <input type="text" autoComplete="off" {...registerSearchQuote("engine_serie")} placeholder={t.enter_engine_serie}
                    onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
                    className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                {/* Año / Actualizar */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.year}</label>
                  <input type="text" autoComplete="off" {...registerSearchQuote("equipment_year")} placeholder={t.enter_equipment_year}
                    onInput={e => { e.target.value = e.target.value.toUpperCase(); }}
                    className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 shrink-0" />
                  <div className="flex flex-1 items-center gap-2">
                    {order.NroOrden && customer?.CodPais?.toUpperCase() === 'AR' && (
                      <button type="button"
                        className="h-8 shrink-0 rounded-lg border border-indigo-300 bg-indigo-50 px-3 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition shadow-sm dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40">
                        {t.btn_view_copy ?? 'Ver / Generar Copia'}
                      </button>
                    )}
                    {order.NroOrden && (
                      <button type="button" onClick={run(updateQuote)} disabled={isSubmitting}
                        className="h-8 flex-1 rounded-lg bg-slate-300 px-4 text-gray-600 text-xs font-medium hover:bg-slate-500 hover:text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {t.btn_update}
                      </button>
                    )}                    
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Summary + Tracking ── */}
        <div className="space-y-4">

          {/* Resumen cotización */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="p-4">
              {order.NroOrden ? (
                <div className="space-y-0">
                  {[
                    [t.nro_quote,       <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">{order.NroOrden}</span>],
                    [t.nro_items,       order.NroItems],
                    [t.total_weight_lb, customFormat(order.TotalPeso)],
                    [t.quote_total,     customFormat(order.Total)],
                    [t.exchange_rate,   order.TipoCambio],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">{t.no_order ?? 'Sin cotización activa'}</p>
              )}
            </div>
          </div>

          {/* Seguimiento */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-xs text-gray-500 shrink-0">{t.share_with}</span>
              {all_disabled_tracking ? (
                <span className="h-9 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 text-sm font-medium text-primary dark:border-primary/40 dark:bg-primary/10 truncate">
                  {seguimientoNombre ?? '—'}
                </span>
              ) : (
                <div className="flex min-w-0 flex-1 gap-0">
                  <div className="flex-1 sm:flex-none sm:w-[280px]">
                    <Select
                      options={options_share}
                      value={select_share}
                      isClearable
                      isSearchable
                      instanceId="share-select-quote"
                      menuPosition="fixed"
                      menuShouldScrollIntoView={false}
                      placeholder={t.select_option}
                      onChange={(sel) => setSelectShare(sel ?? null)}
                      styles={{
                        control:             b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px', borderRadius: '0.5rem 0 0 0.5rem', borderRight: 'none' }),
                        valueContainer:      b => ({ ...b, padding: '0 8px' }),
                        indicatorsContainer: b => ({ ...b, height: '36px' }),
                        menu:                b => ({ ...b, minWidth: '280px' }),
                      }}
                    />
                  </div>
                  <button onClick={run(apply)} type="button" disabled={isSubmitting}
                    className="h-9 shrink-0 px-4 rounded-r-lg border border-l-0 border-gray-300 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {t.apply}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mostrar Nro. Parte */}
          {order.NroOrden && (
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t.show_nro_part_in_report ?? '¿Deseas mostrar la columna de Nro. Parte en el reporte?'}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{t.show} {t.nro_part}</span>
                  <label className="relative h-5 w-10 cursor-pointer">
                    <input checked={order.MostrarCodigo === 1} {...register("show_nro_part")} onChange={handelChangeShowPart} type="checkbox" className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0" />
                    <span className="outline_checkbox bg-white block h-full rounded-full border-2 border-gray-400 before:absolute before:bottom-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-gray-400 before:bg-[url(/assets/images/close.svg)] before:bg-center before:bg-no-repeat before:transition-all before:duration-300 peer-checked:border-primary peer-checked:before:left-5 peer-checked:before:bg-primary peer-checked:before:bg-[url(/assets/images/checked.svg)] dark:border-white-dark dark:before:bg-white-dark"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── TOOLBAR + TABLE + NOTAS (solo cuando hay orden) ─────── */}
      {order.NroOrden && (
        <>
          {/* Toolbar + Table */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-4">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

              {/* Acciones sobre ítems */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={run(newQuote)} title={t.btn_new} type="button" disabled={isSubmitting}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <IconFile className="h-4 w-4" />
                </button>
                <button onClick={run(updateItem)} title={t.update} type="button" disabled={isSubmitting || isSelectItems}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed group">
                  <IconRefresh className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <BtnPrintQuote order={order} token={token}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700" />
                <button onClick={run(deleteItems)} title={t.delete} type="button" disabled={isSubmitting || isSelectItems}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <IconTrashLines className="h-4 w-4" />
                </button>
                <button onClick={run(message)} title={t.send_by_message} type="button" disabled={isSubmitting}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <IconMail className="h-4 w-4" />
                </button>
                <button onClick={run(discount)} title={t.add_discount} type="button" disabled={isSubmitting || hasItemsWithoutPrice}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <IconDiscount className="h-4 w-4" />
                </button>
                <button onClick={run(attach)} title={t.attach} type="button" disabled={isSubmitting}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <IconAttachment className="h-4 w-4" />
                </button>
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              {/* Preferencia */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">{t.preference}</span>
                <div className="w-40">
                  <Select
                    options={[{ value: "RE", label: "MAS ECONOMICO" }, { value: "OR", label: "ORIGINAL" }]}
                    isClearable={false} isSearchable={false}
                    instanceId="preference-select"
                    onChange={handleChangePreference}
                    placeholder={t.select_option}
                    styles={{
                      control: b => ({ ...b, minHeight: '32px', height: '32px', fontSize: '12px' }),
                      valueContainer: b => ({ ...b, padding: '0 8px' }),
                      indicatorsContainer: b => ({ ...b, height: '32px' }),
                    }}
                  />
                </div>
              </div>

              <div className="flex-1" />

              {/* Opciones de cotización */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={run(priceParameters)} type="button" disabled={isSubmitting}
                  className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-[11px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.price_parameter}
                </button>
                <button onClick={run(costSummary)} type="button" disabled={isSubmitting}
                  className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-[11px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.cost_summary}
                </button>
                <button onClick={run(cloneQuote)} type="button" disabled={isSubmitting}
                  className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-[11px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.duplicate}
                </button>
                <button onClick={run(() => validateQuote())} type="button" disabled={isSubmitting || isSelectItems}
                  className="h-8 rounded-lg border border-primary/30 bg-primary/5 px-3 text-[11px] text-primary hover:bg-primary/10 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.validate}
                </button>
                <button onClick={run(buyQuote)} type="button" disabled={isSubmitting || hasItemsWithoutPrice}
                  className="h-8 rounded-lg bg-green-600 px-4 text-white text-[11px] font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.buy}
                </button>
              </div>

            </div>

            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <table className="w-full border-collapse bg-white dark:bg-gray-900" ref={tablaRef}>
                  <thead>
                    <tr>
                      <th className={`${thClass} w-8`}></th>
                      <th className={`${thClass} w-10 text-center`}>
                        <input type="checkbox" className="form-checkbox border-gray-400 rounded"
                          checked={seleccionados.length === items.length && items.length > 0}
                          onChange={toggleTodos} />
                      </th>
                      <th className={`${thClass} w-24`}>{t.qty}</th>
                      <th className={thClass}>{t.nro_part}</th>
                      <th className={thClass}>{t.description}</th>
                      <th className={`${thClass} text-right`}>{t.weight_unit}</th>
                      <th className={thClass}>{t.spare_part_type}</th>
                      <th className={thClass}>{t.application}</th>
                      <th className={thClass}>{t.brand}</th>
                      <th className={`${thClass} text-right`}>{t.price_unit}</th>
                      <th className={`${thClass} text-right`}>Total</th>
                      <th className={thClass}>{t.indicator}</th>
                      <th className={thClass}>{t.t_delivery}</th>
                      <th className={`${thClass} text-right`}>{t.days_of_validity}</th>
                    </tr>
                  </thead>
                  <SortableContext items={items.map(i => i.CodItem)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {items.map((item, index) => (
                        <SortableRow key={item.CodItem} id={item.CodItem} index={index + 1} className={`transition ${item.ParPrecio ? 'bg-amber-50 dark:bg-amber-900/15 hover:bg-amber-100/70 dark:hover:bg-amber-900/25' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <td className={`${tdClass} text-center`}>
                            <input type="checkbox" className="form-checkbox border-gray-400 rounded"
                              checked={seleccionados.includes(item)} onChange={() => toggleSeleccion(item)} />
                          </td>
                          <td className={tdClass}>
                            <input step="any" type="number"
                              {...registerSearchQuote(`items.${item.CodItem}.Cantidad`, { valueAsNumber: true })}
                              onBlur={(e) => handleQuantityBlur(item, +e.target.value)}
                              className="h-8 w-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`}>
                            {item.NroParte.includes("*") ? (
                              <button onClick={run(() => showReference(item))} type="button" disabled={isSubmitting}
                                className="text-primary text-xs font-semibold border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {item.NroParte}
                              </button>
                            ) : (
                              <span className="text-xs font-medium">{item.NroParte}</span>
                            )}
                          </td>
                          <td className={tdClass}>{item.DesRepuesto}</td>
                          <td className={`${tdClass} text-right`}>{customFormat(item.Peso)}</td>
                          <td className={tdClass}>{item.TipoRepuesto}</td>
                          <td className={tdClass}>{item.Aplicacion}</td>
                          <td className={tdClass}>{item.Marca}</td>
                          <td className={`${tdClass} text-right`}>{customFormat(item.Precio)}</td>
                          <td className={`${tdClass} text-right font-medium`}>{customFormat(item.Total)}</td>
                          <td className={tdClass}>
                            {item.Indicador && (
                              <button onClick={run(() => showMore(item))} type="button" disabled={isSubmitting}
                                className="text-xs text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {t.see_more}
                              </button>
                            )}
                          </td>
                          <td className={tdClass}>{item.TiEntrega}</td>
                          <td className={`${tdClass} text-right`}>{item.DiasVigencia}</td>
                        </SortableRow>
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>

            {/* Leyenda */}
            {items.some(i => i.ParPrecio) && (
              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="inline-block h-3 w-5 rounded-sm bg-amber-200 dark:bg-amber-700/50 border border-amber-300 dark:border-amber-600 shrink-0" />
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {t.par_precio_legend ?? 'Con parámetro de precio'}
                </span>
              </div>
            )}
          </div>

          {/* Notas + Resumen financiero */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">

            {/* Notas */}
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.notes ?? 'Notas'}</p>
                  <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
                </div>
                <button type="button" onClick={run(handleSaveNoteQuoteFormSubmit(onSaveNote))} disabled={isSubmitting}
                  className="h-9 rounded-lg bg-slate-300 px-4 text-gray-600 text-xs font-medium hover:bg-slate-500 hover:text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {t.btn_save}
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t.note_to_customer}</label>
                  <textarea defaultValue={order.NotaCliente} {...registerNoteQuote("note_customer")} rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{t.note_to_user}</label>
                  <textarea defaultValue={order.NotaUsuario} {...registerNoteQuote("note_user")} rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
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
                  <span className="text-sm text-gray-500">{t.total_spare_parts}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.TotRepuestos)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.freight}</span>
                  <div className="flex items-center gap-1.5">
                    <input {...register("freight")} type="text"
                      className="h-8 w-24 text-right text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <button type="button" onClick={run(saveFreight)} disabled={isSubmitting} title={t.save ?? 'Guardar flete'}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition group disabled:opacity-50 disabled:cursor-not-allowed">
                      <IconCheck className="h-3.5 w-3.5 fill-gray-400 group-hover:fill-green-600 transition" />
                    </button>
                    {order.FleteInterno > 0 && (
                      <button type="button" onClick={run(deleteFreight)} disabled={isSubmitting} title={t.distribute ?? 'Distribuir flete'}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition group disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconDirection className="h-3.5 w-3.5 fill-gray-400 group-hover:fill-sky-600 transition" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.discount}</span>
                  <span className="text-sm font-semibold text-red-500">{order.Descuento ? `- ${customFormat(order.Descuento)}` : '0.00'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.tax}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.MtoIva)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total $us</span>
                  <span className="text-base font-bold text-primary">{customFormat(order.Total)}</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content} />
    </>
  );
};

export default QuoteForm;
