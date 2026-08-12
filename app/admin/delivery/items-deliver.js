'use client';
import React, { useEffect, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import Select from 'react-select';
import DatePicker from "react-date-picker";
import IconSave from '@/components/icon/icon-save';
import BtnPrintDelivery from "./BtnPrintDelivery";

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

const ItemsToDelivery = ({ token, t, customer, users, currencies, transports, payment_conditions, items = [], saveDelivery }) => {

  const {
    register,
    setValue,
    getValues,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (currencies.length > 0) {
      setValue("currency", currencies[0]);
    }
  }, [currencies, setValue]);
  useEffect(() => {
    if (transports.length > 0) {
      setValue("transport", transports[0]);
    }
  }, [transports, setValue]);
  useEffect(() => {
    if (payment_conditions.length > 0) {
      setValue("payment_condition", payment_conditions[1]);
    }
  }, [payment_conditions, setValue]);

  const handleChange = (value, field) => {
    setValue(field, (value?.value) ?? null);
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();
    return `${mes}/${dia}/${año}`;
  };

  const handleSave = () => {
    let data = getValues();

    let data_send = [];
    items.map(i => {
      data_send.push(
        {
          CodCliente: customer.CodCliente,
          CodRecibidoPor: data.received_by,
          CodEntregadoPor: data.delivered_by,
          CodVendedor: data.seller,
          CodTipTransporte: data.transport.value,
          CodCondPago: data.payment_condition.value,
          CodMoneda: data.currency.value,
          LugEntrega: data.delivery_location,
          Fecha: formatearFecha(data.date),
          NroEmbalaje: i.NroEmbalaje,
          NroOrden: i.NroOrden,
          CodItem: i.CodItem,
          CodRepuesto: i.CodRepuesto,
          NroParte: i.NroParte,
          Descripcion: i.Descripcion,
          Cantidad: i.Cantidad,
          Origen: i.Origen,
          HCode: i.HCode,
          Material: i.Material,
          Presentacion: i.Presentacion,
          ValToken: token
        }

      );
    });
    saveDelivery(data_send);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3" onSubmit={handleSubmit(handleSave)}>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="received_by">{t.received_by}</label>
            <input tabIndex={1} type='text' autoComplete='off' {...register("received_by", { required: { value: true, message: t.required_field } })} className="form-input h-[38px] text-xs w-full" />
            {errors.received_by && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.received_by?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="date">{t.date}</label>
            <Controller
              control={control}
              name="date"
              defaultValue={new Date()}
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
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="delivered_by">{t.delivered_by}</label>
            <Select
              isClearable
              tabIndex={2}
              options={users}
              {...register('delivered_by', { required: { value: true, message: t.required_select } })}
              onChange={(event) => handleChange(event, 'delivered_by')}
              id="delivered_by"
              instanceId="delivered_by"
              menuPosition={'fixed'}
              menuShouldScrollIntoView={false}
              styles={selectStyles}
              placeholder={t.select_option} />
            {errors.delivered_by && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.delivered_by?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="currency">{t.currency}</label>
            <Controller
              name="currency"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <Select
                  {...field}
                  isClearable
                  tabIndex={3}
                  options={currencies}
                  styles={selectStyles}
                  placeholder={t.select_option}
                />
              )}
            />
            {errors.currency && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.currency?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="seller">{t.seller}</label>
            <Select
              isClearable
              tabIndex={4}
              options={users}
              {...register('seller', { required: { value: true, message: t.required_select } })}
              onChange={(event) => handleChange(event, 'seller')}
              id="seller"
              instanceId="seller"
              menuPosition={'fixed'}
              menuShouldScrollIntoView={false}
              styles={selectStyles}
              placeholder={t.select_option} />
            {errors.seller && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.seller?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="transport">{t.transport}</label>
            <Controller
              name="transport"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <Select
                  {...field}
                  isClearable
                  tabIndex={5}
                  options={transports}
                  styles={selectStyles}
                  placeholder={t.select_option}
                />
              )}
            />
            {errors.transport && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.transport?.message?.toString()}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="delivery_location">{t.delivery_place}</label>
            <input tabIndex={6} type='text' autoComplete='off' {...register("delivery_location", { required: false })} className="form-input h-[38px] text-xs w-full" />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="payment_condition">{t.payment_conditions}</label>
            <Controller
              name="payment_condition"
              control={control}
              rules={{ required: { value: true, message: t.required_select } }}
              render={({ field }) => (
                <Select
                  {...field}
                  isClearable
                  tabIndex={7}
                  options={payment_conditions}
                  styles={selectStyles}
                  placeholder={t.select_option}
                />
              )}
            />
            {errors.payment_condition && <span className='text-red-400 text-xs mt-1 block' role="alert">{errors.payment_condition?.message?.toString()}</span>}
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={items.length === 0}
          onClick={handleSubmit(handleSave)}
          type="button"
          className="btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {t.save_dispatch}
        </button>
        <BtnPrintDelivery
          disabled={items.length === 0}
          token={token}
          t={t}
          items={items}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 text-sm font-semibold bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
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
