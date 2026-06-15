'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import Select from 'react-select';
import IconTrashLines from '../icon/icon-trash-lines';
import IconPlusCircle from '../icon/icon-plus-circle';
import IconInfoCircle from '../icon/icon-info-circle';
import EquipmentForm from '@/components/forms/equipment-form'
import EngineForm from '@/components/forms/engine-form'
import Modal from '@/components/modal';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient'
import Swal from 'sweetalert2'

const URL_SAVE_QUOTE   = 'cotizacion/registrar-sin-codigo';
const URL_UPDATE_QUOTE = (id) => `cotizacion/registrar-sin-codigo/${id}`;
const URL_GET_QUOTE    = (id) => `cotizacion/sin-codigo/${id}`;
const URL_GET_SEGUIMIENTO  = 'usuarios/seguimiento';
const URL_SAVE_SEGUIMIENTO = 'cotizacion/registrar-seguimiento';
const URL_MARCAS     = 'cotizacion/marcas';


const QuoteWithoutCodeForm = ({ _customer_, t, _order_ = [], _items_ }) => {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const order_id     = searchParams.get('id');

  const [order, setOrder] = useState(_order_)
  const [customer, setCustomer] = useState(_customer_);
  const [brands, setBrands] = useState([]);
  const _initRows = (_items_ && _items_.length > 0)
    ? _items_
    : [1,2,3,4,5].map(i => ({ CodItem: i, Cantidad: 1, DesRepuesto: '' }));
  const [current_row, setCurrentRow] = useState((_items_?.length > 0) ? _items_.length + 1 : 6);
  const [items, setItems] = useState(_initRows);
  const [disabled, setDisabled] = useState((order.NroOrden) ? false : true);

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_type,  setModalType]  = useState('');
  const [modal_size,  setModalSize]  = useState('w-full max-w-5xl');
  const [select_equipment, setSelectEquipment] = useState(null);
  const [select_engine, setSelectEngine] = useState(null);

  const [options_share,         setOptionsShare]        = useState([]);
  const [select_share,          setSelectShare]         = useState(null);
  const [seguimientoNombre,     setSeguimientoNombre]   = useState(null);
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [quoteData,     setQuoteData]    = useState(null);

  useEffect(() => {
    axiosClient.get(URL_MARCAS)
      .then(rs => {
        const raw = Array.isArray(rs.data)
          ? rs.data
          : (rs.data.marcas ?? rs.data.dato1 ?? rs.data.data ?? []);
        const mapped = raw
          .filter(m => m != null)
          .map(m => ({
            value: m.value  ?? m.CodMarca  ?? m.codMarca,
            label: m.label  ?? m.NomMarca  ?? m.nomMarca,
          }))
          .filter(m => m.value != null && m.label != null);
        setBrands(mapped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOrder(_order_);
    if (_order_.NroOrden) {
      setShowModal(false);
      setDisabled(false);
      let _select = () => {
        return brands.filter((b) => {
          return b.label == _order_.MarcaEquipo;
        })[0];
      };
      setSelectEquipment(_select);
      setValue('nro_order', _order_.NroPedido)
      setValue('equipment_model', _order_.ModeloEquipo);
      setValue('equipment_serie', _order_.NroSerieEquipo);
      setValue('equipment_year',  _order_.AnioEquipo ?? '');

      setSelectEngine(() => {
        return brands.filter((b) => {
          return b.label == _order_.MarcaMotor;
        })[0];
      });
      setValue('engine_model', _order_.ModeloMotor);
      setValue('engine_serie', _order_.NroSerieMotor);
      setValue('note', (_order_.NotaCliente) ?? "");

    }
  }, [_order_]);

  useEffect(() => {
    setCustomer(_customer_)
  }, [_customer_]);

  useEffect(() => {
    if (_items_?.length > 0) {
      setItems(_items_);
      setCurrentRow(_items_.length + 1);
    }
  }, [_items_]);

  // Carga cotización existente cuando la URL trae ?id=...
  useEffect(() => {
    if (!order_id) return;
    axiosClient.get(URL_GET_QUOTE(order_id)).then(rs => {
      const { cotizacion, detalle, seguimiento } = rs.data;
      setQuoteData(cotizacion);
      setOrder({ NroOrden: cotizacion.nroCotizacion, NroItems: cotizacion.nroItems });
      setDisabled(false);
      setValue('nro_order',        cotizacion.nroPedido      ?? '');
      setValue('equipment_model',  cotizacion.modeloEquipo   ?? '');
      setValue('equipment_serie',  cotizacion.nroSerieEquipo ?? '');
      setValue('equipment_year',   cotizacion.anioEquipo     ?? '');
      setValue('engine_model',     cotizacion.modeloMotor    ?? '');
      setValue('engine_serie',     cotizacion.nroSerieMotor  ?? '');
      setValue('note',             cotizacion.nota           ?? cotizacion.notaCliente ?? '');
      const rows = detalle.map((d, i) => ({ CodItem: i + 1, Cantidad: d.cantidad, DesRepuesto: d.descripcion }));
      setItems(rows);
      setCurrentRow(rows.length + 1);
      rows.forEach(r => {
        setValue(`data[${r.CodItem}][amount]`,       r.Cantidad);
        setValue(`data[${r.CodItem}][description]`,  r.DesRepuesto);
      });
      if (seguimiento?.nomUsuario) {
        setSeguimientoNombre(seguimiento.nomUsuario);
        setAllDisabledTracking(true);
      }
    }).catch(() => {});
  }, [order_id]);

  // Resuelve los selects de marca una vez que brands y quoteData estén disponibles
  useEffect(() => {
    if (!quoteData || brands.length === 0) return;
    setSelectEquipment(brands.find(b => b.label === quoteData.marcaEquipo) ?? null);
    setSelectEngine(brands.find(b => b.label === quoteData.marcaMotor)    ?? null);
  }, [brands, quoteData]);

  // Carga usuarios para "Compartir con" solo cuando no hay seguimiento registrado
  useEffect(() => {
    if (!order.NroOrden || all_disabled_tracking) return;
    axiosClient.get(URL_GET_SEGUIMIENTO)
      .then(rs => {
        const raw = Array.isArray(rs.data) ? rs.data : (rs.data.data ?? rs.data.usuarios ?? []);
        setOptionsShare(raw.map(u => ({ value: u.codUsuario ?? u.CodUsuario, label: u.nomUsuario ?? u.NomUsuario })));
      })
      .catch(() => {});
  }, [order.NroOrden, all_disabled_tracking]);

  const {
    register,
    handleSubmit, setValue, getValues, unregister,
    formState: { errors },
  } = useForm();

  useEffect(() => {

    if (disabled && !order.NroOrden && !order_id) {
      showModal('equipment');
    }
  }, []);

  const generateInitRows = () => {
    let _rows = [];
    for (let i = 1; i <= 5; i++) {
      _rows.push({ CodItem: i, Cantidad: 1, DesRepuesto: "" });
    }
    setItems(_rows);
    setCurrentRow(6);
  }


  const setDataEquipment = (data, select_brand) => {
    setValue('equipment_model', data.equipment_model);
    setValue('equipment_serie', data.equipment_serie);
    setValue('equipment_brand', (select_brand?.value) ?? null);
    setSelectEquipment(select_brand)
  }

  const setDataEngine = (data, select_brand) => {
    setValue('engine_model', data.engine_model);
    setValue('engine_serie', data.engine_serie);
    setValue('engine_brand', (select_brand?.value) ?? null);
    setSelectEngine(select_brand);
    setDisabled(false);
  }
  const onChangeSelectEquipmentBrand = (value) => {
    setValue('equipment_brand', (value.value) ?? null);
    setSelectEquipment(value);
  }
  const onChangeSelectEngineBrand = (value) => {
    setValue('engine_brand', (value.value) ?? null)
    setSelectEngine(value);
  }

  const showModal = (type) => {
    setModalSize('w-full max-w-lg');
    setModalTitle(type === 'equipment' ? t.equipment_data : t.engine_data);
    setModalType(type);
    setShowModal(true);
  }




  const addRow = () => {

    setItems([...items, { CodItem: (current_row), Cantidad: 1, DesRepuesto: '' }])
    setCurrentRow(current_row + 1);
  }

  const deleteRow = (row) => {
    let _rows = items.filter((r, index) => {
      return row.CodItem != r.CodItem
    });
    setItems(_rows);
    unregister(`data[${row.CodItem}][amount]`);
    unregister(`data[${row.CodItem}][description]`);
  }



  const handleChangeOptionShare = (select) => {
    setValue('share_with_customer', select?.value ?? 0);
    setSelectShare(select ?? null);
  }

  const apply = async () => {
    const shared_user = getValues('share_with_customer') ?? null;
    try {
      await axiosClient.post(URL_SAVE_SEGUIMIENTO, {
        NroCotizacion:        order.NroOrden,
        codUsuarioCompartido: shared_user ?? 0,
        notaUsuario:          getValues('note') ?? '',
      });
      Swal.fire({ position: 'top-end', icon: 'success', title: t.tracking_option_success ?? 'Seguimiento registrado', showConfirmButton: false, timer: 1500 });
      setSeguimientoNombre(select_share?.label ?? null);
      setAllDisabledTracking(true);
    } catch (error) {
      const status = error.response?.status;
      const msg = status === 404
        ? (t.quote_not_found ?? 'Cotización no encontrada')
        : (error.response?.data?.message ?? t.error);
      Swal.fire({ title: t.error, text: msg, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
    }
  }

  const quote = async () => {

    if (!select_engine?.label && !select_equipment?.label) {
      Swal.fire({ title: t.info, text: t.we_need_more_data_quote, icon: 'info', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }

    const data = getValues();

    if (items.length === 0) {
      Swal.fire({ title: t.info, text: t.items_empty_quote, icon: 'info', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }

    const detalle = [];
    for (let i = 0; i < items.length; i++) {
      const pos    = i + 1;
      const codItem  = items[i].CodItem;
      const amount   = getValues(`data[${codItem}][amount]`);
      const description = getValues(`data[${codItem}][description]`);
      if (amount == undefined || Number(amount) < 1) {
        Swal.fire({ title: t.info, text: `${t.the_quantity_item} #${pos} ${t.must_be_greater}`, icon: 'info', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      if (!description) {
        Swal.fire({ title: t.info, text: `${t.the_description_item} #${pos} ${t.cannot_be_empty}`, icon: 'info', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      detalle.push({ Cantidad: Number(amount), Descripcion: description });
    }

    const payload = {
      NroOrden:       order.NroOrden  ?? 0,
      CodCliente:     customer.CodCliente,
      NroPedido:      data.nro_order  ?? '',
      MarcaEquipo:    select_equipment?.label ?? '',
      ModeloEquipo:   data.equipment_model    ?? '',
      NroSerieEquipo: data.equipment_serie    ?? '',
      AnioEquipo:     data.equipment_year     ?? '',
      MarcaMotor:     select_engine?.label    ?? '',
      ModeloMotor:    data.engine_model       ?? '',
      NroSerieMotor:  data.engine_serie       ?? '',
      Nota:           data.note               ?? '',
      Detalle:        detalle,
    };

    try {
      const rs = order.NroOrden
        ? await axiosClient.put(URL_UPDATE_QUOTE(order.NroOrden), payload)
        : await axiosClient.post(URL_SAVE_QUOTE, payload);

      const isUpdate = !!order.NroOrden;
      Swal.fire({
        title: isUpdate
          ? `${t.quote_updated ?? 'Cotización actualizada'} #${rs.data.nroCotizacion}`
          : `${t.your_quote_number} #${rs.data.nroCotizacion}`,
        html: isUpdate
          ? `<p>${t.quote_updated_success ?? 'Los datos han sido actualizados correctamente.'}</p>`
          : `<p>${t.we_are_in_the_process_of_identifying}</p>${t.we_will_send_you_a_message}<p></p>`,
        icon: 'success',
        confirmButtonColor: '#15803d',
        confirmButtonText: t.close
      }).then(() => {
        router.push(`/admin/revision/orders-process?customer=${customer.CodCliente}&option=quotes`);
      });
    } catch (error) {
      const msg = error.response?.data?.message ?? error.response?.data?.title ?? t.update_quote_error;
      Swal.fire({
        title: t.error,
        html: `<strong>"${msg}"</strong>`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0 text-right pr-3";
  const inputClass = "h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-gray-800";
  const thClass    = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
  const tdClass    = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

  return (
    <>
      <form>
        <div className="space-y-3">

          {/* Banner */}
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary dark:bg-primary/10">
            <IconInfoCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{t.help_with_information}</span>
          </div>

          {/* Nro. Pedido + info cotización */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{t.nro_pedido}</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={disabled}
                    autoComplete="off"
                    {...register("nro_order", { required: { value: true, message: t.required_field } })}
                    placeholder={t.enter_nro_order}
                    className={`h-8 w-full sm:w-72 rounded-lg border-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-gray-800 bg-white dark:bg-gray-900 ${errors.nro_order ? 'border-red-400' : 'border-gray-400 dark:border-gray-500'}`}
                  />
                  {errors.nro_order && (
                    <span className="absolute top-full left-0 mt-0.5 text-[10px] text-red-500 whitespace-nowrap">{errors.nro_order?.message?.toString()}</span>
                  )}
                </div>
              </div>
              {order.NroOrden && (
                <div className="flex items-center gap-6 text-sm ml-auto">
                  <span className="text-gray-500">{t.nro_quote}:
                    <span className="ml-1.5 font-bold text-primary text-base">{order.NroOrden}</span>
                  </span>
                  <span className="text-gray-500">{t.nro_items}:
                    <span className="ml-1.5 font-bold text-primary text-base">{order.NroItems}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Equipo + Motor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Equipo */}
            <div className="panel overflow-hidden border border-blue-200 dark:border-blue-900 p-0">
              <div className="px-4 py-2 border-b border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-900/20">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t.equipment_data}</p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.brand}</label>
                  <div className="flex-1">
                    <Select
                      options={brands}
                      value={select_equipment}
                      onChange={onChangeSelectEquipmentBrand}
                      isDisabled={disabled}
                      placeholder={t.select_option}
                      instanceId="main-equipment-brand"
                      menuPosition="fixed"
                      filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                      noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? (t.type_to_search ?? 'Escribe al menos 2 caracteres') : (t.no_options ?? 'Sin opciones')}
                      styles={{ control: b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '36px' }) }}
                    />
                    {errors.equipment_brand && <span className="text-red-400 text-xs mt-1 block">{errors.equipment_brand?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.model}</label>
                  <input type="text" disabled={disabled} autoComplete="off" {...register("equipment_model")} placeholder={t.enter_equipment_model} className={inputClass} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.equipment_serie}</label>
                  <input type="text" disabled={disabled} autoComplete="off" {...register("equipment_serie")} placeholder={t.enter_equipment_serie} className={inputClass} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.year}</label>
                  <input type="text" disabled={disabled} autoComplete="off" {...register("equipment_year")} placeholder={t.enter_equipment_year} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Motor */}
            <div className="panel overflow-hidden border border-violet-200 dark:border-violet-900 p-0">
              <div className="px-4 py-2 border-b border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-900/20">
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t.engine_data}</p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.brand}</label>
                  <div className="flex-1">
                    <Select
                      value={select_engine}
                      isDisabled={disabled}
                      placeholder={t.select_option}
                      options={brands}
                      onChange={onChangeSelectEngineBrand}
                      instanceId="main-engine-brand"
                      menuPosition="fixed"
                      filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
                      noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? (t.type_to_search ?? 'Escribe al menos 2 caracteres') : (t.no_options ?? 'Sin opciones')}
                      styles={{ control: b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '36px' }) }}
                    />
                    {errors.engine_brand && <span className="text-red-400 text-xs mt-1 block">{errors.engine_brand?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.model}</label>
                  <input type="text" disabled={disabled} autoComplete="off" {...register("engine_model")} placeholder={t.enter_engine_model} className={inputClass} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={labelClass}>{t.engine_serie}</label>
                  <input type="text" disabled={disabled} autoComplete="off" {...register("engine_serie")} placeholder={t.enter_engine_serie} className={inputClass} />
                </div>
              </div>
            </div>

          </div>

          {/* Nota + Tracking (columnas) */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className={`grid ${order.NroOrden ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700' : 'grid-cols-1'}`}>

              {/* Nota */}
              <div className="flex items-center gap-2 px-3 py-3">
                <label className={labelClass}>{t.note}</label>
                <input type="text" autoComplete="off" {...register("note")} placeholder={t.enter_note} className={inputClass} />
              </div>

              {/* Tracking */}
              {order.NroOrden && (
                <div className="flex items-center gap-2 px-4 py-3">
                  <label className="text-xs text-gray-500 shrink-0">{t.share_with}</label>
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
                          {...register('share_with_customer', { required: false })}
                          isSearchable
                          instanceId="share-select"
                          menuPosition="fixed"
                          onChange={handleChangeOptionShare}
                          menuShouldScrollIntoView={false}
                          placeholder={t.select_option}
                          styles={{
                            control:             b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px', borderRadius: '0.5rem 0 0 0.5rem', borderRight: 'none' }),
                            valueContainer:      b => ({ ...b, padding: '0 8px' }),
                            indicatorsContainer: b => ({ ...b, height: '36px' }),
                            menu:                b => ({ ...b, minWidth: '280px' }),
                          }}
                        />
                      </div>
                      <button
                        onClick={() => apply()}
                        type="button"
                        className="h-9 shrink-0 px-4 rounded-r-lg border border-l-0 border-gray-300 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition"
                      >
                        {t.apply}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── TABLA DE ITEMS ─────────────────────────────────────────── */}
          {items && (
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">

              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.part_description}</p>
                  <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
                </div>
                <button
                  onClick={() => addRow()}
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/40 px-3 text-primary text-xs font-medium hover:bg-primary/5 transition"
                >
                  <IconPlusCircle className="h-3.5 w-3.5" />
                  {t.btn_add}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={`${thClass} w-12 text-center`}>Nro.</th>
                      <th className={`${thClass} w-28`}>{t.amount}</th>
                      <th className={thClass}>{t.part_description}</th>
                      <th className={`${thClass} w-10`}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((r, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className={`${tdClass} text-center text-gray-400`}>{index + 1}</td>
                        <td className={tdClass}>
                          <input
                            step="any"
                            type="number"
                            defaultValue={r.Cantidad}
                            autoComplete="off"
                            {...register(`data[${r.CodItem}][amount]`)}
                            className="h-8 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        </td>
                        <td className={tdClass}>
                          <input
                            type="text"
                            defaultValue={r.DesRepuesto}
                            autoComplete="off"
                            {...register(`data[${r.CodItem}][description]`)}
                            className="h-8 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        </td>
                        <td className={tdClass}>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => deleteRow(r)}
                              title={t.delete}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            >
                              <IconTrashLines className="h-3.5 w-3.5 text-red-500" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center px-4 py-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => quote()}
                  className="flex h-10 items-center gap-2 rounded-lg bg-primary px-8 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
                >
                  {order.NroOrden ? (t.update ?? 'Actualizar') : t.btn_quote}
                </button>
              </div>

            </div>
          )}

        </div>
      </form>

      <Modal show_close_button={false} size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title}>
        {modal_type === 'equipment' && (
          <EquipmentForm t={t} brands={brands} setDataEquipment={setDataEquipment} setSelectEquipment={setSelectEquipment} showModal={showModal} />
        )}
        {modal_type === 'engine' && (
          <EngineForm t={t} brands={brands} setDataEngine={setDataEngine} showModal={showModal} close={() => setShowModal(false)} />
        )}
      </Modal>
    </>
  );
};

export default QuoteWithoutCodeForm;
