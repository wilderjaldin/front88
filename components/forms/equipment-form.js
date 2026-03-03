'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'
import Select from 'react-select';

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatMail';

const EquipmentForm = ({ company = {}, mail = {}, t, setMail, brands, showModal, setDataEquipment }) => {

  const [select, setSelect] = useState(null);


  const {
    register, getValues, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onChangeSelectBrand = (value) => {
    setSelect(value);
    setValue('brand', (value.value) ?? null)
  }

  const next = () => {
    showModal('engine');
    setDataEquipment(getValues(), select);
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full  m-auto" onSubmit={handleSubmit(next)}>
          <div className="space-y-4">
                <h3 className='font-bold text-center'>{ t.equipment_data }</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select isSearchable
                      id="brand-select"
                      instanceId="brand-select"
                      menuPosition={'fixed'}
                      menuShouldScrollIntoView={false}
                      placeholder={t.select_option} 
                      {...register("brand", { required: false })} className='w-full form-select-sm' options={brands} onChange={onChangeSelectBrand} />
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_model">Modelo</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("equipment_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_model ? "true" : "false"} placeholder={t.enter_equipment_model} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_serie">Nro. Serie</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("equipment_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.equipment_serie ? "true" : "false"} placeholder={t.enter_equipment_serie} className="form-input form-input-sm placeholder:" />
                    {errors.equipment_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" onClick={() => next()} className="btn btn-success" >
                Continuar
              </button>


            </div>
          </div>

        </form>


      </div>

    </>
  );
};

export default EquipmentForm;
