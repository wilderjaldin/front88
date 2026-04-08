'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatMail';

const ComponentEmailForm = ({ company = {}, mail = {}, token = '', setMail }) => {

  const [check_conection, setCheckConection] = useState(false);
  const t = useTranslation();


  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { port: mail.port, host: mail.host, email: mail.email, password: mail.password } });

  useEffect(() => {
    reset({ port: mail.port, host: mail.host, email: mail.email, password: mail.password });
  }, [mail]);

  const checkMail = () => {
    try {
      if (true) {
        Swal.fire({
          title: t.success,
          text: t.mail_success_check,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        }).then(() => setCheckConection(true));
      } else {
        Swal.fire({
          title: t.error,
          text: t.mail_error_check,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.mail_error_check,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const onSubmit = async (data) => {
    if (check_conection) {
      try {
        const res = await axios.post(url, { Smtp: data.host, Port: data.port, UsuarioMail: data.email, PwdUsuario: data.password, ValToken: token });
        if (res.data.estado == 'OK') {
          Swal.fire({
            title: t.success,
            icon: 'success',
            confirmButtonColor: '#15803d',
            text: t.mail_success_save,
            confirmButtonText: t.close
          }).then(r => {
            setMail({
              port: data.port,
              host: data.host,
              email: data.email,
              password: data.password
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
          text: t.mail_error_save,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } else {
      Swal.fire({
        title: t.info,
        text: t.mail_isnt_check,
        icon: 'info',
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
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="port">{t.port}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("port", { required: { value: true, message: t.required_field } })} aria-invalid={errors.port ? "true" : "false"} placeholder={t.enter_port} className="form-input placeholder:" />
                {errors.port && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.port?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="host">{t.host}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("host", { required: { value: true, message: t.required_field } })} aria-invalid={errors.host ? "true" : "false"} placeholder={t.enter_host} className="form-input placeholder:" />
                {errors.host && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.host?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email">{t.email}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("email", { required: { value: true, message: t.required_field } })} aria-invalid={errors.email ? "true" : "false"} placeholder={t.enter_email} className="form-input placeholder:" />
                {errors.email && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.email?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="password">{t.password}</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("password", { required: { value: true, message: t.required_field } })} aria-invalid={errors.password ? "true" : "false"} placeholder={t.enter_password} className="form-input placeholder:" />
                {errors.password && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.password?.message?.toString()}</span>}

              </div>
            </div>





          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" onClick={() => checkMail()} className="btn btn-primary">
                {t.btn_check}
              </button>
              <button type="submit" className="btn btn-success" disabled={!check_conection}>
                {t.btn_save}
              </button>


            </div>
          </div>

        </form>


      </div>

    </>
  );
};

export default ComponentEmailForm;
