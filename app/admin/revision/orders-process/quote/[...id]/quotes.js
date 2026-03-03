"use client";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import React, { useState } from 'react';
import Swal from 'sweetalert2'


const QuotesInit = () => {

  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: 'btn btn-success ltr:mr-3 rtl:ml-3',
            denyButton: 'btn btn-primary ltr:mr-3 rtl:ml-3',
            cancelButton: 'btn btn-outline-dark ltr:mr-3 rtl:ml-3',
            popup: 'sweet-alerts',
        },
        buttonsStyling: false,
    });

  const onSubmit = async (data) => {

  }

  const doQuote = () => {
    swalWithBootstrapButtons.fire({
      title: t.question_do_you_have_the_codes,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "SI",
      cancelButtonText: "Cancelar",
      denyButtonText: `NO`,
      reverseButtons: true
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        Swal.fire("Saved!", "", "success");
      } else if (result.isDenied) {
        Swal.fire("Changes are not saved", "", "info");
      }
    });
  }

  return (
    <>

      <div className="panel shadow-lg bg-gray-200 mt-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => doQuote() } className="!bg-success text-white !outline-none flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-4 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]">{ t.new_quote }</button>
              <button type="button" className="!bg-success text-white !outline-none flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-4 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]">{ t.enter_codes_in_batch }</button>
            </div>
          </div>
          <div>
            <form className="" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="status">{t.nro_quote}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' defaultValue='' {...register('nro_quote', { required: false })} placeholder={t.login.enter_whatsApp} className="form-input placeholder:" />
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="customer">{ t.nro_pedido }</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' defaultValue='' {...register('nro_order', { required: false })} placeholder={t.login.enter_whatsApp} className="form-input placeholder:" />
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone"></label>
                  <div className="relative flex-1">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="form-checkbox bg-white" value={1} {...register('all', { required: false })} />
                        <span className="">{ t.show_all }</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="my-5">

                <div className="flex flex-wrap items-center justify-center gap-2">

                  <button type="submit" className="btn btn-success">
                    { t.btn_search }
                  </button>
                </div>
              </div>
            </form>
          </div>


        </div>
      </div>

    </>
  );
};

export default QuotesInit;