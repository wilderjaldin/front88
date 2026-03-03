'use client';
import React from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import axios from 'axios'
import Swal from 'sweetalert2'
const url_save = process.env.NEXT_PUBLIC_API_URL + 'empresa/AdicionarTipoMoneda'

const CurrencyForm = ({ action_cancel, token }) => {


  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: '' } });

  const onSubmit = async (data) => {
    try {
      const rs = await axios.post(url_save, { CodRegistro: data.code, Descripcion: data.name, Simbolo: data.symbol, ValToken: token });

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.the_currency_save,
          showConfirmButton: false,
          timer: 1500
        }).then( async (r) => {
          await saveCurrencies(rs.data.dato);
          action_cancel();
          
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.the_currency_save_error,
          showConfirmButton: false,
          timer: 1500
        });
      }

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.the_currency_save_error_server,
        showConfirmButton: false,
        timer: 1500
      });

    }
  }

  const saveCurrencies = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodMoneda != '') {
        array.push({ value: d.CodMoneda, label: d.DesMoneda });
      }
    }


    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "currencies.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="code">{t.currency_code}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("code", { required: { value: true, message: t.required_field } })} aria-invalid={errors.code ? "true" : "false"} placeholder={t.enter_code} className="form-input placeholder:" />
            {errors.code && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.code?.message?.toString()}</span>}
          </div>
        </div>

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="name">{t.currency_name}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} className="form-input placeholder:" />
            {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
          </div>
        </div>

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="symbol">{t.currency_symbol}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("symbol", { required: { value: true, message: t.required_field } })} aria-invalid={errors.symbol ? "true" : "false"} placeholder={t.enter_symbol} className="form-input placeholder:" />
            {errors.symbol && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.symbol?.message?.toString()}</span>}
          </div>
        </div>


        <div className="mb-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
              {t.btn_cancel}
            </button>

            <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
              {t.btn_save}
            </button>

          </div>
        </div>

      </form>

    </>
  );
};

export default CurrencyForm;
