'use client';
import React from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/AdicionarCondPago';

const ConditionForm = ({ action_cancel, setConditions, token }) => {


  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { condition: '' } });

  const onSubmit = async (data) => {

    try {

      const rs = await axios.post(url, { CondPago: data.condition, ValToken: token });

      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.terms_of_payment_save,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          action_cancel();
          let options_conditions = [];
          rs.data.dato.map((o) => {
            options_conditions.push({ value: o.CodCondPago, label: o.DesCondPago })
          });
          setConditions(options_conditions)
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.terms_of_payment_save_error,
          showConfirmButton: false,
          timer: 1500
        });
      }

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.terms_of_payment_save_error_server,
        showConfirmButton: false,
        timer: 1500
      });

    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-1/3 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="condition">{t.terms_of_payment}</label>
          <div className="relative flex-1">
            <input
              type="text"
              autoComplete="OFF"
              aria-invalid={errors.condition ? "true" : "false"}
              className="form-input"
              {...register("condition", {
                required: {
                  value: true,
                  message: t.required_field,
                },
                setValueAs: (value) => value?.toUpperCase()
              })}
              onInput={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors.condition && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.condition?.message?.toString()}</span>}
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

export default ConditionForm;
