'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Select from 'react-select';
import SelectTrading from '@/components/select-trading';

import axios from 'axios'
import Swal from 'sweetalert2'
const url_save = process.env.NEXT_PUBLIC_API_URL + 'cliente/ModificarCondComercialesCliente';

const ComponentTradingForm = ({ setCurrentCondition, current_seller, setCurrentSeller, customer = [], conditions, sellers, setConditions, loadConditions, setLoadConditions, updateCustomerTradding, token }) => {

  const t = useTranslation();
  const [show_labels, setShowLabels] = useState(false)
  const {
    register, reset, setValue, control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { condition: customer.CodConPago, seller: customer.CodVendedor, utility: customer.PorUtilidad } });

  useEffect(() => {

    reset({ condition: customer.CodConPago, seller: customer.CodVendedor, utility: customer.PorUtilidad });
  }, [customer]);


  const onSubmit = async (data) => {

    try {
      let data_condition = { CodCliente: customer.IdCliente, CodConPago: data.condition, CodVendedor: data.seller, PorUtilidad: data.utility, ValToken: token }


      const rs = await axios.post(url_save, data_condition);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.trading_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          updateCustomerTradding(data);
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.trading_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {

    }

  }

  const changeCondition = (value) => {
    if (value) {
      setValue('condition', value.value);
      //setCurrentCondition(value.value);
      setCurrentCondition(Object.keys(conditions).find((key) => conditions[key].value.toUpperCase() === value.value.toUpperCase()) || null);
    } else {
      setCurrentCondition(null);
    }
  }


  const changeSeller = (value) => {
    if (value) {
      setValue('seller', value.value);
      setCurrentSeller(Object.keys(sellers).find((key) => sellers[key].value === value.value) || null)
    } else {
      setCurrentSeller(null)
      setValue('seller', null);
    }
  }

  return (
    <>
      <div className=''>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-10">
            <div className='space-y-4'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="condition">{t.terms_of_payment}</label>
                <div className="relative flex-1">

                  
                  <SelectTrading t={t} token={token} control={control} errors={errors} options={conditions} setConditions={setConditions}></SelectTrading>

                

                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="seller">{t.assigned_seller}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(customer.CodVendedor) ?? '\xa0'}</label>
                    :
                    <>
                      <Select
                        {...register('seller')}
                        options={sellers}
                        onChange={changeSeller}
                        value={(current_seller != null) ? (sellers[current_seller]) : null}
                        placeholder={t.select_option}
                        className='w-full' />
                      {errors.seller && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.seller?.message?.toString()}</span>}
                    </>
                  }

                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="select_utility">% {t.utility}</label>
                <div className="relative flex-1">
                  <input type='text' autoComplete='OFF' defaultValue='' {...register("utility", { required: { value: true, message: t.required_field } })} aria-invalid={errors.utility ? "true" : "false"} placeholder={t.login.enter_utility} className={`form-input w-full flex-1 ${errors.utility ? "error" : ""}`} />
                  {errors.utility && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.utility?.message?.toString()}</span>}
                </div>
              </div>


            </div>


          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">


              <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                {t.btn_save}
              </button>

            </div>
          </div>

        </form>
      </div>

    </>
  );
};

export default ComponentTradingForm;
