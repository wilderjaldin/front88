'use client';
import IconMail from '@/components/icon/icon-mail';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from "@/app/locales";
import { useForm } from "react-hook-form";
import axios from 'axios';
import Swal from 'sweetalert2';
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
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: t.forgot_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Cerrar'
        }).then(() => setIsLoading(false));
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: t.forgot_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Cerrar'
      }).then(() => setIsLoading(false));
    }
  };

  return (
    <>
      {isLoading && <Loading />}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="Email" className="block text-sm font-semibold text-slate-600 mb-1.5">
            {t.email}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 pointer-events-none">
              <IconMail fill={true} />
            </span>
            <input
              type="email"
              autoComplete="OFF"
              defaultValue=""
              {...register("email", { required: { value: true, message: t.required_field } })}
              aria-invalid={errors.email ? "true" : "false"}
              placeholder={t.enter_email}
              className={`form-input w-full ps-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.email && (
              <span className="text-red-500 text-xs mt-1 block" role="alert">
                {errors.email?.message?.toString()}
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-bold uppercase tracking-widest transition-colors duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
        >
          {t.btn_recover}
        </button>

        <div className="flex justify-center pt-1">
          <Link href="/" className="text-sm text-slate-500 hover:text-amber-600 transition-colors font-medium">
            {t.go_to_login}
          </Link>
        </div>
      </form>
    </>
  );
};

export default ComponentsAuthForgotPasswordForm;
