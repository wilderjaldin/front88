'use client';
import React, { useEffect } from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarLugEntrega';

const ComponentProformaForm = ({ company = {}, proforma = {}, token = '', setProforma }) => {

  const t = useTranslation();


  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { delivery_place: proforma.delivery_place, legends_proforma: proforma.legends_proforma } });

  useEffect(() => {
    reset({ delivery_place: proforma.delivery_place, legends_proforma: proforma.legends_proforma })
  }, [proforma]);

  
  const onSubmit = async (data) => {
    try {
      const res = await axios.post(url, { LugEntrega: data.delivery_place, LeyendaProforma: data.legends_proforma, ValToken: token });
      if (res.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.proforma_success_save,
          confirmButtonText: t.close
        }).then(r => {
          setProforma({
            delivery_place: data.delivery_place, 
            legends_proforma: data.legends_proforma
          });
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

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full sm:w-1/2 m-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="delivery_place">{t.delivery_place}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("delivery_place", { required: { value: true, message: t.required_field } })} aria-invalid={errors.delivery_place ? "true" : "false"} placeholder={t.enter_delivery_place} className="form-input placeholder:" />
                {errors.delivery_place && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.delivery_place?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nit">{t.legends_proforma}</label>
              <div className="relative flex-1">
                <textarea {...register("legends_proforma", { required: false })} rows={6} className='form-textarea'></textarea>
              </div>
            </div>
          </div>
          <div className="my-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="submit" className="btn btn-success">
                {t.btn_save_proforma}
              </button>
            </div>
          </div>
        </form>
      </div>

    </>
  );
};

export default ComponentProformaForm;
