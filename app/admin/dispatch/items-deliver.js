'use client';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Controller, useForm } from 'react-hook-form';

import Select from 'react-select';
import DatePicker from "react-date-picker";
import IconSave from '@/components/icon/icon-save';
import { selectUser } from '@/store/authSlice';

import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    height: '38px',
    fontSize: '0.8rem',
    borderColor: state.isFocused ? '#4361ee' : 'var(--select-border, #e0e6ed)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(67,97,238,0.12)' : 'none',
    '&:hover': { borderColor: '#4361ee' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 10px' }),
  indicatorsContainer: (base) => ({ ...base, height: '38px' }),
  menu: (base) => ({ ...base, fontSize: '0.8rem', zIndex: 30 }),
};

const thClass = "text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-left select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2 py-1.5";

const ItemsToDelivery = ({ t, customer, sellers = [], deliverers = [], items = [], saveDelivery }) => {

  const {
    register,
    setValue,
    getValues,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [saving, setSaving] = useState(false);
  const currentUser = useSelector(selectUser);

  // Si solo hay una opción, se preselecciona (no tiene sentido obligar a elegir
  // el único valor posible). Si hay varias, por defecto el usuario logueado.
  useEffect(() => {
    if (deliverers.length === 0) return;
    if (deliverers.length === 1) { setValue('delivered_by', deliverers[0]); return; }
    if (!currentUser?.id) return;
    const match = deliverers.find(o => String(o.value) === String(currentUser.id));
    if (match) setValue('delivered_by', match);
  }, [deliverers, currentUser, setValue]);

  useEffect(() => {
    if (sellers.length === 0) return;
    if (sellers.length === 1) { setValue('seller', sellers[0]); return; }
    if (!currentUser?.id) return;
    const match = sellers.find(o => String(o.value) === String(currentUser.id));
    if (match) setValue('seller', match);
  }, [sellers, currentUser, setValue]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();
    return `${mes}/${dia}/${año}`;
  };

  const handleSave = async () => {
    let data = getValues();

    let data_send = [];
    items.map(i => {
      data_send.push(
        {
          codCliente: customer.CodCliente,
          codRecibidoPor: data.received_by,
          codEntregadoPor: data.delivered_by?.value,
          codVendedor: data.seller?.value,
          // Transporte/Cond. Pago/Moneda: el form todavía no los pide, se
          // ajusta cuando se agreguen esos campos.
          codTipTransporte: '',
          codCondPago: '',
          codMoneda: '',
          lugEntrega: data.delivery_location,
          fecha: formatearFecha(data.date),
          nroEmbalaje: i.NroEmbalaje,
          nroOrden: i.NroOrden,
          codItem: i.CodItem,
          codRepuesto: i.CodRepuesto,
          nroParte: i.NroParte,
          descripcion: i.Descripcion,
          cantidad: i.Cantidad,
          origen: i.Origen,
          hCode: i.HCode,
          material: i.Material,
          presentacion: i.Presentacion,
        }
      );
    });
    setSaving(true);
    try {
      await saveDelivery(data_send);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3" onSubmit={handleSubmit(handleSave)}>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="received_by">{t.received_by} <span className="text-red-500">*</span></label>
            <input tabIndex={1} type='text' autoComplete='off' {...register("received_by", { required: { value: true, message: t.required_field } })} className="form-input h-[38px] text-xs w-full" />
            {errors.received_by && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.received_by?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="date">{t.date} <span className="text-red-500">*</span></label>
            <Controller
              control={control}
              name="date"
              defaultValue={new Date()}
              rules={{ required: { value: true, message: t.required_field } }}
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  onChange={onChange}
                  value={value}
                  format={"d/MM/y"}
                  locale="es-ES"
                  className="form-input h-[38px] w-full"
                />
              )}
            />
            {errors.date && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.date?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="delivered_by">{t.delivered_by} <span className="text-red-500">*</span></label>
            <Controller
              name="delivered_by"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <Select
                  {...field}
                  isClearable
                  tabIndex={2}
                  options={deliverers}
                  id="delivered_by"
                  instanceId="delivered_by"
                  menuPosition={'fixed'}
                  menuShouldScrollIntoView={false}
                  styles={selectStyles}
                  placeholder={t.select_option}
                />
              )}
            />
            {errors.delivered_by && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.delivered_by?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="seller">{t.seller} <span className="text-red-500">*</span></label>
            <Controller
              name="seller"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <Select
                  {...field}
                  isClearable
                  tabIndex={3}
                  options={sellers}
                  id="seller"
                  instanceId="seller"
                  menuPosition={'fixed'}
                  menuShouldScrollIntoView={false}
                  styles={selectStyles}
                  placeholder={t.select_option}
                />
              )}
            />
            {errors.seller && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.seller?.message?.toString()}</span>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" htmlFor="delivery_location">{t.delivery_place} <span className="text-red-500">*</span></label>
            <input tabIndex={4} type='text' autoComplete='off' {...register("delivery_location", { required: { value: true, message: t.required_field } })} className="form-input h-[38px] text-xs w-full" />
            {errors.delivery_location && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.delivery_location?.message?.toString()}</span>}
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={items.length === 0 || saving}
          onClick={handleSubmit(handleSave)}
          type="button"
          className="btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {saving ? (t.saving ?? 'Guardando…') : t.save_dispatch}
        </button>
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>{t.nro_order}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.amount}</th>
                <th className={thClass}>Origen</th>
                <th className={thClass}>{t.h_code}</th>
                <th className={thClass}>Material</th>
                <th className={thClass}>{t.presentation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-xs text-gray-400">{t.no_matches}</td></tr>
              ) : items.map((i, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className={tdClass}>{i.NroOrden}</td>
                  <td className={tdClass}>{i.NomCliente}</td>
                  <td className={tdClass}>{i.NroParte}</td>
                  <td className={tdClass}>{i.Descripcion}</td>
                  <td className={`${tdClass} text-center`}>{i.Cantidad}</td>
                  <td className={tdClass}>{i.Origen}</td>
                  <td className={tdClass}>{i.HCode}</td>
                  <td className={tdClass}>{i.Material}</td>
                  <td className={tdClass}>{i.Presentacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemsToDelivery;
