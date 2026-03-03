'use client';
import React from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/AdicionarTipoDocumento';

const DocumentTypeForm = ({ action_cancel, setDocTypes, token }) => {


  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: '' } });

  const onSubmit = async (data) => {

    try {

      const rs = await axios.post(url, { CodRegistro: data.code, Descripcion: data.name, ValToken: token });

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.doc_type_save,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          action_cancel();
          const options = rs.data.dato
            .filter((o) => o.CodDoc !== 0)
            .map((o) => ({
              value: o.CodDoc,
              label: o.DesDoc
            }));
          setDocTypes(options);
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.doc_type_save_error,
          showConfirmButton: false,
          timer: 1500
        });
      }

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.doc_type_save_error_server,
        showConfirmButton: false,
        timer: 1500
      });

    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="code">{t.doc_type_code}</label>
          <div className="relative flex-1">
            <input
              type="text"
              autoComplete="OFF"
              aria-invalid={errors.code ? "true" : "false"}
              className="form-input"
              maxLength={2}
              {...register("code", {
                required: {
                  value: true,
                  message: t.required_field,
                },
                maxLength: {
                  value: 2,
                  message: t.max_2_characters, // ejemplo: "Máximo 3 caracteres"
                },
                pattern: {
                  value: /^[A-Za-z]+$/,
                  message: t.only_letters, // ejemplo: "Solo se permiten letras"
                },
                setValueAs: (value) => value?.toUpperCase(),
              })}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
              }}
            />
            {errors.code && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.code?.message?.toString()}</span>}
          </div>
        </div>

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="name">{t.doc_type}</label>
          <div className="relative flex-1">
            <input
              type="text"
              autoComplete="OFF"
              aria-invalid={errors.name ? "true" : "false"}
              className="form-input"
              {...register("name", {
                required: {
                  value: true,
                  message: t.required_field,
                },
                maxLength: {
                  value: 15,
                  message: t.max_15_characters, 
                },
                pattern: {
                  value: /^[A-Za-z\s]+$/,
                  message: t.only_letters, // permite espacios
                },
                setValueAs: (value) => value?.toUpperCase(),
              })}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase();
              }}
            />
            {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
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

export default DocumentTypeForm;
