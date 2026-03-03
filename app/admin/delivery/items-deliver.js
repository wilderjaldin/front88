'use client';
import React, { useEffect, useState } from 'react';


import { Controller, useForm } from 'react-hook-form';


import Select from 'react-select';
import DatePicker from "react-date-picker";
import BtnPrintDelivery from "./BtnPrintDelivery";

import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

const ItemsToDelivery = ({ token, t, customer, users, currencies, transports, payment_conditions, items = [], saveDelivery }) => {


  const [value, onChange] = useState(new Date());
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
    <div className="">
      <div className=''>
        <form className="space-y-5" onSubmit={handleSubmit(handleSave)}>
          <fieldset>
            <legend></legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className='space-y-4'>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="received_by">{ t.received_by }</label>
                  <div className="relative flex-1">
                    <input tabIndex={7} type='text' autoComplete='OFF' {...register("received_by", { required: { value: true, message: t.required_field } })} placeholder={t.login.enter_email} className="form-input placeholder:" />
                    {errors.received_by && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.received_by?.message?.toString()}</span>}
                  </div>

                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="delivered_by">{ t.delivered_by }</label>
                  <div className="relative flex-1">
                    <Select
                      isClearable
                      tabIndex={3}
                      options={users}
                      {...register('delivered_by', { required: { value: true, message: t.required_select } })}
                      onChange={(event) => handleChange(event, 'delivered_by')}
                      id="delivered_by"
                      instanceId={`delivered_by`}
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                      placeholder={t.select_option} className='w-full' />
                    {errors.delivered_by && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.delivered_by?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="seller">{ t.seller }</label>
                  <div className="relative flex-1">
                    <Select
                      isClearable
                      tabIndex={5}
                      options={users}
                      {...register('seller', { required: { value: true, message: t.required_select } })}
                      onChange={(event) => handleChange(event, 'seller')}
                      id="seller"
                      placeholder={t.select_option} className='w-full' />
                    {errors.seller && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.seller?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="delivery_location">{ t.delivery_place }</label>
                  <div className="relative flex-1">
                    <input tabIndex={7} type='text' autoComplete='OFF' {...register("delivery_location", { required: false })} placeholder={t.login.enter_email} className="form-input placeholder:" />
                  </div>
                </div>

              </div>

              <div className='space-y-4'>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="date">{ t.date }</label>
                  <div className="relative flex-1">
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
                          className="form-input"
                        />
                      )}
                    />

                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="currency">{ t.currency }</label>
                  <div className="relative flex-1">
                    <Controller
                      name="currency"
                      control={control}
                      rules={{ required: { value: true, message: t.required_select } }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isClearable
                          tabIndex={4}
                          options={currencies}
                          placeholder={t.select_option}
                          className="w-full"
                        />
                      )}
                    />
                    {errors.currency && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.currency?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="transport">{ t.transport }</label>
                  <div className="relative flex-1">
                    <Controller
                      name="transport"
                      control={control}
                      rules={{ required: { value: true, message: t.required_select } }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isClearable
                          tabIndex={4}
                          options={transports}
                          placeholder={t.select_option}
                          className="w-full"
                        />
                      )}
                    />

                    {errors.transport && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.transport?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="payment_condition">{ t.payment_conditions }</label>
                  <div className="relative flex-1">

                    <Controller
                      name="payment_condition"
                      control={control}
                      rules={{ required: { value: true, message: t.required_select } }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isClearable
                          tabIndex={4}
                          options={payment_conditions}
                          placeholder={t.select_option}
                          className="w-full"
                        />
                      )}
                    />
                    {errors.payment_condition && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.payment_condition?.message?.toString()}</span>}
                  </div>
                </div>

              </div>

            </div>
          </fieldset>

        </form>
        <div className='table-responsive mt-8'>
          <div className="flex flex-wrap items-center justify-start gap-2">
            <button disabled={(items.length > 0) ? false : true} onClick={handleSubmit(handleSave)} type="button" className="btn enabled:btn-success disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
              { t.save_dispatch }
            </button>
            <BtnPrintDelivery disabled={(items.length > 0) ? false : true} token={token} t={t} items={items}></BtnPrintDelivery>
          </div>
          <table className="table-hover">
            <thead>
              <tr>
                <th>{ t.nro_order }</th>
                <th>{ t.customer }</th>
                <th>{ t.nro_part }</th>
                <th>{ t.description }</th>
                <th>{ t.amount }</th>
                <th>Origen</th>
                <th>{ t.h_code }</th>
                <th>Material</th>
                <th>{ t.presentation }</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, index) => {
                return (
                  <tr key={index}>
                    <td>{i.NroOrden}</td>
                    <td>{i.NomCliente}</td>
                    <td>{i.NroParte}</td>
                    <td>{i.Descripcion}</td>
                    <td>{i.Cantidad}</td>
                    <td>{i.Origen}</td>
                    <td>{i.HCode}</td>
                    <td>{i.Material}</td>
                    <td>{i.Presentacion}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ItemsToDelivery;
