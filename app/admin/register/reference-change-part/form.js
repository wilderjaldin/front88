'use client';
import React, { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm, SubmitHandler } from "react-hook-form"
import IconSave from '@/components/icon/icon-save';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import Select from 'react-select';
import { current } from '@reduxjs/toolkit';

const Form = ({ t, token, brands, action_cancel, handleSave }) => {


  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm();

  const onChangeSelect = (select, field) => {
    setValue(field, (select?.value) ?? 0);
  }

  const onSave = (data) => {
    let send = {
      NroParteOriginal: data.nro_part,
      NroParteCambio: data.reference,
      CodMarcaOriginal: data.application_part,
      CodMarcaCambio: data.application_reference,
      UltimoCambio: (data.last_change) ? 1 : 0,
    }
    handleSave(send);
  }
  return (
    <form action="" onSubmit={handleSubmit(onSave)}>
      <fieldset className="space-y-4">

        <div className="grid grid-cols-1 sm:flex justify-between gap-2 border p-4">
          <div className="w-1/2 relative">
            <label htmlFor="">{ t.nro_part }</label>
            <input type={'text'} autoComplete='OFF' {...register("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_part ? "true" : "false"} placeholder={ t.nro_part } className="form-input placeholder:" />
            {errors.nro_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_part?.message?.toString()}</span>}
          </div>
          <div className="w-1/2 relative">
            <label htmlFor="">{t.application}</label>
            <Select isClearable={true}
              isSearchable={true}
              id="application_part"
              instanceId={`application_part`}
              menuPosition={'fixed'}
              menuShouldScrollIntoView={false}
              placeholder={t.select_option}
              {...register("application_part", { required: { value: true, message: t.required_select } })}
              className='w-full'
              options={brands}
              onChange={(select) => onChangeSelect(select, 'application_part')} />
            {errors.application_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.application_part?.message?.toString()}</span>}
          </div>

        </div>

        <div className="grid grid-cols-1 sm:flex justify-between gap-5 border p-4">
          <div className="w-1/2 relative">
            <label htmlFor="">{ t.reference }/{ t.change }</label>
            <input type={'text'} autoComplete='OFF' {...register("reference", { required: { value: true, message: t.required_field } })} aria-invalid={errors.reference ? "true" : "false"} placeholder={`${ t.reference }/${t.change}`} className="form-input placeholder:" />
            {errors.reference && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.reference?.message?.toString()}</span>}
          </div>
          <div className="w-1/2 relative">
            <label htmlFor="">{t.application}</label>
            <Select isClearable={true}
              isSearchable={true}
              id="application_reference"
              instanceId={`application_reference`}
              menuPosition={'fixed'}
              menuShouldScrollIntoView={false}
              placeholder={t.select_option}
              {...register("application_reference", { required: { value: true, message: t.required_select } })}
              className='w-full'
              options={brands}
              onChange={(select) => onChangeSelect(select, 'application_reference')} />
            {errors.application_reference && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.application_reference?.message?.toString()}</span>}
          </div>

        </div>

        <div className="flex justify-between">
          <label className="block text-gray-500 font-bold">
            <input {...register("last_change")} type="checkbox" className="leading-loose text-pink-600" />
            <span className="py-2 text-sm text-gray-600 leading-snug"> { t.last_change } </span></label>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => action_cancel()} type="button" className="btn btn-dark">
            {t.btn_cancel}
          </button>

          <button type="submit" className="btn btn-success">
            {t.btn_save}
          </button>

        </div>


      </fieldset>
    </form>
  );
};

export default Form;
