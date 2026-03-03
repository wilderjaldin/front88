'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import Select from 'react-select';
import CurrencyForm from '@/components/forms/currency-form';
import SelectCurrency from '@/components/select-currency'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatosFac';

const ComponentBillingForm = ({ company = {}, billing = {}, token = '', setBilling }) => {
  const router = useRouter();
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [show_edit, setShowEdit] = useState(false)
  const [modal_content, setModalContent] = useState(null);
  const t = useTranslation();

  const currencies_options = useOptionsSelect("currencies");
  const [current_currency, setCurrentCurrency] = useState(currencies_options.find((key) => key.value === billing.currency) || null);

  const {
    register, reset, setValue,
    handleSubmit, control,
    formState: { errors },
  } = useForm({ defaultValues: { iva: billing.iva, commercial_currency: billing.commercial_currency, reference_currency: billing.reference_currency, include_iva: billing.include_iva } });

  useEffect(() => {
    setCurrentCurrency(currencies_options.find((key) => key.value === billing.currency) || null);
    reset({ iva: billing.iva, reference_currency: billing.reference_currency, commercial_currency: billing.commercial_currency, include_iva: billing.include_iva });
  }, [billing]);


  const onSubmit = async (data) => {

    try {
      const rs = await axios.post(url, { PorIva: data.iva, IvaEnPrecio: (data.include_iva) ? 1 : 0, Moneda: data.reference_currency, MonedaComerc: data.commercial_currency, ValToken: token });

      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.billing_success_save,
          confirmButtonText: t.close
        }).then(r => {
          setBilling({
            iva: data.iva,
            reference_currency: data.reference_currency,
            commercial_currency: data.commercial_currency,
            include_iva: (data.include_iva) ? 1 : 0
          })
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.billing_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.billing_error_save,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });

    }
  }

  const handleChangeCurrency = (value) => {
    setValue('currency', ((value.value) ?? null));
    setCurrentCurrency(value ?? null);
  };

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full sm:w-1/2 m-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="iva">{t.iva_value}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("iva", { required: { value: true, message: t.required_field } })} aria-invalid={errors.iva ? "true" : "false"} placeholder={t.login.enter_iva} className="form-input placeholder:" />
                {errors.iva && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.iva?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="reference_currency">{t.reference_currency}</label>
              <div className="w-full flex-1">
                <Controller
                  name={'reference_currency'}
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      isClearable
                      isSearchable
                      placeholder={t.select_option}
                      menuPosition="fixed"
                      menuShouldScrollIntoView={false}
                      className="w-full"
                      options={currencies_options}
                      value={currencies_options.find(option => option.value === field.value) || null}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption?.value ?? null);
                      }}
                    />
                  )}
                />
              </div>
              <div className='block'>
                {errors.reference_currency && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.reference_currency?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="currency">{t.commercial_currency}</label>
              <div className="w-full flex-1">
                <SelectCurrency t={t} token={token} control={control} onChange={handleChangeCurrency} current_currency={current_currency} register={register} errors={errors} ></SelectCurrency>
              </div>
            </div>


            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor=""></label>
              <div className="relative flex-1">
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" {...register('include_iva', { required: false })} className="form-checkbox bg-white" />
                    <span className="">{t.include_iva}</span>
                  </label>
                </div>
              </div>
            </div>


          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="submit" className="btn btn-success">
                {t.save_billing}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>

    </>
  );
};

export default ComponentBillingForm;
