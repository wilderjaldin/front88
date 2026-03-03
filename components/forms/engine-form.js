'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'
import Select from 'react-select';

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatMail';

const EngineForm = ({ close, mail = {}, token = '', t, setMail, brands, showModal, setDataEngine }) => {

  const [select, setSelect] = useState(null);


  const {
    register, setValue, getValues,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { port: mail.port, host: mail.host, email: mail.email, password: mail.password } });


  const onChangeSelectBrand = (value) => {
    setSelect(value);
    setValue('brand', (value.value) ?? null)
  }

  const prev = () => {
    showModal('equipment');
  }

  const next = () => {
    showModal('engine');
    setDataEngine(getValues(), select);
    close();
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full  m-auto" onSubmit={handleSubmit(next)}>
          <div className="space-y-4">
                <h3 className='font-bold text-center'>{ t.engine_data }</h3>

                <div className="flex items-center sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end">{t.brand}</label>
                  <div className="relative flex-1">
                    <Select tabIndex="2" placeholder={t.select_option} {...register("brand", { required: { value: true, message: t.required_select } })} className='w-full form-select-sm' options={brands} onChange={onChangeSelectBrand} />
                  </div>
                  <div className='block'>
                    {errors.brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
                  </div>

                </div>


                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_model">{ t.model }</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("engine_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_model ? "true" : "false"} placeholder={t.enter_engine_model} className="form-input form-input-sm placeholder:" />
                    {errors.engine_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_model?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_serie">{ t.engine_serie }</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("engine_serie", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_serie ? "true" : "false"} placeholder={t.enter_engine_serie} className="form-input form-input-sm placeholder:" />
                    {errors.engine_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_serie?.message?.toString()}</span>}
                  </div>
                </div>

              </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" onClick={() => prev()} className="btn btn-primary">
                { t.prev }
              </button>
              <button type="button" onClick={() => next() } className="btn btn-success" >
                { t.next }
              </button>


            </div>
          </div>

        </form>


      </div>

    </>
  );
};

export default EngineForm;
