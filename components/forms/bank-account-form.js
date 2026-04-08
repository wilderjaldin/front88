'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Select from 'react-select';
import SelectCurrency from '@/components/select-currency'
import { useOptionsSelect } from '@/app/options'

import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatBancos';

const ComponentBankAccountsForm = ({ company = {}, bank = {}, token = '', cancel, updateList, currencies_options }) => {

  const t = useTranslation();

  let currency = currencies_options.find((key) => key.label === bank.currency) || null;
  const [current, setCurrentCurrency] = useState(currency);
  const {
    register, reset, setValue,
    handleSubmit, control,
    formState: { errors },
  } = useForm({ defaultValues: { sigla: bank.sigla, name: bank.name, swift: bank.swift, number: bank.number } });

  useEffect(() => {
    if (!bank?.currency || !currencies_options?.length) return;

    const selected = currencies_options.find(
      opt => opt.label === bank.currency
    );

    if (selected) {
      setValue('commercial_currency', selected.value);
    }
  }, [bank, currencies_options, setValue]);

  const onSubmit = async (data) => {

    try {
      const data_bank = {
        IdBanco: (bank.id) ?? 0,
        Sigla: data.sigla,
        CodMoneda: data.commercial_currency,
        DesBanco: data.name,
        NumCuenta: data.number,
        ExtCuenta: data.swift,
        ValToken: token
      };
      const res = await axios.post(url, data_bank);

      if (res.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.proforma_success_save,
          confirmButtonText: t.close
        }).then((r) => {
          let currency_select = currencies_options.find((key) => key.value === data.commercial_currency) || null;
          data_bank.Moneda = (currency_select) ? currency_select.label : '';
          data_bank.IdBanco = res.data.dato;
          updateList(data_bank);
        });
      } else {
        Swal.fire({
          title: t.error,
          text: res.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }



    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.proforma_error_save,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }

  }

  const handleChangeCurrency = (value) => {
    setValue('currency', ((value.value) ?? null));
    setCurrentCurrency(value ?? {})
  };

  return (
    <>
      <div className=''>
        <h2 className='text-lg font-semibold dark:text-white-light text-center mb-4'>{(bank.name) ? t.edit_bank : t.add_bank} {bank.name}</h2>
        <form className="w-full sm:w-1/2 m-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="sigla">Sigla</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("sigla", { required: { value: true, message: t.required_field } })} aria-invalid={errors.sigla ? "true" : "false"} placeholder={t.enter_sigla} className={`form-input ${errors.sigla ? "error" : ""}`} />
                {errors.sigla && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.sigla?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="name">{t.bank_name}</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.enter_bank_name} className={`form-input ${errors.name ? "error" : ""}`} />
                {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="swift">Routing/Swift</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("swift", { required: false })} aria-invalid={errors.swift ? "true" : "false"} placeholder={t.enter_routing_swift} className={`form-input`} />
                {errors.swift && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.swift?.message?.toString()}</span>}
              </div>
            </div>


            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="currency">{t.currency}</label>
              <div className="w-full flex-1">
                <SelectCurrency t={t} token={token} control={control} onChange={handleChangeCurrency} current_currency={current} register={register} errors={errors} ></SelectCurrency>
              </div>
            </div>



            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="number">{t.account_number}</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("number", { required: { value: true, message: t.required_field } })} aria-invalid={errors.number ? "true" : "false"} placeholder={t.enter_account_number} className={`form-input ${errors.number ? "error" : ""}`} />
                {errors.number && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.number?.message?.toString()}</span>}
              </div>
            </div>
          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={cancel} className="btn btn-dark">
                {t.btn_cancel}
              </button>
              <button type="submit" className="btn btn-success">
                {t.btn_save}
              </button>
            </div>
          </div>
        </form>
      </div>

    </>
  );
};

export default ComponentBankAccountsForm;
