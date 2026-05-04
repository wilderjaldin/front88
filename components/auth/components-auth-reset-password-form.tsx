'use client';
import IconMail from '@/components/icon/icon-mail';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from "@/app/locales";
import { useForm } from "react-hook-form";
import IconLockDots from '../icon/icon-lock-dots';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axios from 'axios';
import Swal from 'sweetalert2';
import Loading from '@/components/layouts/loading';

const url_verify   = process.env.NEXT_PUBLIC_API_URL + 'sesion/VerificarCodigo';
const url_password = process.env.NEXT_PUBLIC_API_URL + 'sesion/RestableceContrasena';

const EyeOpen = () => (
  <svg className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
    <path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z" />
  </svg>
);
const EyeClosed = () => (
  <svg className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
    <path fill="currentColor" d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z" />
  </svg>
);

const ComponentsAuthResetPasswordForm = () => {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();
  const token        = useSelector(selectToken);
  const [isValid,      setIsValid]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const code = searchParams.get("code") || "";

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { password: '', new_password: '' } });

  useEffect(() => {
    onInit();
  }, []);

  const onInit = async () => {
    try {
      const res = await axios.post(url_verify, { CodGenerado: code });
      if (res.data.estado == 'OK') {
        setIsValid(true);
      } else if (res.data.estado == "ERROR") {
        Swal.fire({
          title: t.error,
          text: t.code_password_incorrect,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        }).then(() => router.push('/'));
      }
    } catch (error) {}
  };

  const onSubmit = async (data: any) => {
    try {
      const rs = await axios.post(url_password, { CodGenerado: code, Contrasena: data.password });
      if (rs.data.estado == "OK") {
        Swal.fire({
          title: t.success,
          text: t.password_change_success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        }).then(() => router.push('/'));
      } else {
        Swal.fire({
          title: t.error,
          text: t.password_change_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.password_change_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  };

  return (
    <>
      {!isValid ? null : (
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>

          <div>
            <label htmlFor="Password" className="block text-sm font-semibold text-slate-600 mb-1.5">
              {t.password}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 pointer-events-none">
                <IconLockDots fill={true} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="Password"
                autoComplete="new-password"
                defaultValue=""
                {...register("password", { required: { value: true, message: t.required_field } })}
                placeholder={t.enter_password}
                className={`form-input w-full ps-10 pe-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-amber-600 transition-colors"
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-500 text-xs mt-1 block" role="alert">
                {errors.password?.message?.toString()}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-semibold text-slate-600 mb-1.5">
              {t.repit_password}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 pointer-events-none">
                <IconLockDots fill={true} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="new_password"
                autoComplete="new-password"
                defaultValue=""
                {...register("new_password", {
                  required: { value: true, message: t.required_field },
                  validate: (value) => {
                    const { password } = getValues();
                    return password === value;
                  }
                })}
                placeholder={t.enter_password}
                className={`form-input w-full ps-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 ${errors.new_password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              />
            </div>
            {errors.new_password && (
              <span className="text-red-500 text-xs mt-1 block" role="alert">
                {errors.new_password?.message?.toString()}
              </span>
            )}
            {errors.new_password?.type === 'validate' && (
              <span className="text-red-500 text-xs mt-1 block" role="alert">
                {t.passwords_dont_match}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-bold uppercase tracking-widest transition-colors duration-200 shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
          >
            {t.btn_reset_password}
          </button>

          <div className="flex justify-center pt-1">
            <Link href="/" className="text-sm text-slate-500 hover:text-amber-600 transition-colors font-medium">
              {t.go_to_login}
            </Link>
          </div>

        </form>
      )}
    </>
  );
};

export default ComponentsAuthResetPasswordForm;
