'use client';
import IconMail from '@/components/icon/icon-mail';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from "@/app/locales";
import { useForm } from "react-hook-form"

import axios from 'axios'
import Swal from 'sweetalert2'
import Loading from '@/components/layouts/loading';

const url_generate = process.env.NEXT_PUBLIC_API_URL + 'sesion/GenCodigoRestablecer';


const ComponentsAuthForgotPasswordForm = () => {
  const router = useRouter();
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', remember: 0 } });
  const onSubmit = async (data: any) => {
    try {

      const res = await axios.post(url_generate, { NomUsuario: data.email, Lang: "ES" });

      if (res.data.estado == 'OK') {
        Swal.fire({
          title: res.data.mensaje,
          icon: 'success',
          text: res.data.dato,
          confirmButtonColor: '#15803d',
          confirmButtonText: 'Cerrar'
        }).then(() => {
          router.push('/');
        })
      } else {
        Swal.fire({
          title: 'Error',
          text: t.forgot_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Cerrar'
        }).then(() => setIsLoading(false))
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: t.forgot_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Cerrar'
      }).then(() => setIsLoading(false))
    }
  }
  return (
    <>
      {isLoading && <Loading />}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="Email" className="dark:text-white">
            {t.email}
          </label>
          <div className="relative text-white-dark">
            <input type='email' autoComplete='OFF' defaultValue='' {...register("email", { required: { value: true, message: t.required_field } })} aria-invalid={errors.email ? "true" : "false"} placeholder={t.enter_email} className="form-input ps-10 placeholder:text-white-dark" />
            <span className="absolute start-4 top-4.5 -translate-y-1/2">
              <IconMail fill={true} />
            </span>
            {errors.email && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.email?.message?.toString()}</span>}
          </div>
        </div>
        <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
          {t.btn_recover}
        </button>
        <div className="flex justify-end">
          <label className="block text-gray-500 font-bold my-4">
            <Link
              href="/"
              className="cursor-pointer tracking-tighter text-black border-b-2 border-gray-200 hover:border-gray-400"><span>{t.go_to_login}</span></Link></label>
        </div>
      </form>
    </>
  );
};

export default ComponentsAuthForgotPasswordForm;
