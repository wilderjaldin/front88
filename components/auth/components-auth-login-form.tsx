'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconUser from '@/components/icon/icon-user';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { setAuth } from '@/store/authSlice';

const URL_LOGIN = process.env.NEXT_PUBLIC_API_URL + 'usuarios/login';

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

const ComponentsAuthLoginForm = () => {
  const router   = useRouter();
  const dispatch = useDispatch();
  const t        = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '', rememberme: false },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await axios.post(URL_LOGIN, {
        LogUsuario: data.username,
        PwdUsuario: data.password,
        RememberMe: data.rememberme,
      });

      dispatch(setAuth({
        token:       res.data.token,
        user:        res.data.user,
        permissions: res.data.permissions,
      }));

      Swal.fire({
        title:              `${t.welcome} ${res.data.user.name}`,
        icon:               'success',
        confirmButtonColor: '#15803d',
        confirmButtonText:  t.btn_close,
      }).then(() => router.push('/admin/dashboard'));

    } catch (error: any) {
      Swal.fire('Error', error.response?.status === 401 ? t.login_incorrect : t.error_server, 'error');
      setIsLoading(false);
    }
  };

  useDynamicTitle(`${t.login?.title ?? 'Sign In'}`);

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>

      {/* Usuario */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">
          {t.username}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400 pointer-events-none">
            <IconUser fill={true} />
          </span>
          <input
            type="text"
            autoComplete="off"
            placeholder={t.enter_username}
            {...register("username", { required: { value: true, message: t.required_field } })}
            className={`form-input ps-10 w-full bg-white/70 border-gray-200
              focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200
              placeholder:text-gray-400 text-gray-800
              ${errors.username ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
        </div>
        {errors.username && (
          <span className="text-red-500 text-xs mt-1 block">{errors.username.message?.toString()}</span>
        )}
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">
          {t.password}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-gray-400 pointer-events-none">
            <IconLockDots fill={true} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t.enter_password}
            {...register("password", { required: { value: true, message: t.required_field } })}
            className={`form-input ps-10 pe-10 w-full bg-white/70 border-gray-200
              focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200
              placeholder:text-gray-400 text-gray-800
              ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-amber-600 transition"
          >
            {showPassword ? <EyeClosed /> : <EyeOpen />}
          </button>
        </div>
        {errors.password && (
          <span className="text-red-500 text-xs mt-1 block">{errors.password.message?.toString()}</span>
        )}
      </div>

      {/* Recordarme + olvidé */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("rememberme")}
            className="form-checkbox rounded text-amber-600"
            style={{ accentColor: '#d97706' }}
          />
          <span className="text-sm text-gray-500">{t.remember}</span>
        </label>
        <Link href="/forgot"
          className="text-sm text-gray-500 hover:text-amber-700 border-b border-transparent hover:border-amber-500 transition">
          {t.forgot}
        </Link>
      </div>

      {/* Botón — negro sólido igual al original */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-lg text-white text-sm font-bold uppercase tracking-widest
                   transition-all duration-200 mt-2
                   disabled:opacity-65 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => !isLoading && ((e.target as HTMLElement).style.boxShadow = '0 6px 28px rgba(0,0,0,0.4)')}
        onMouseLeave={e => ((e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)')}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {t.loading ?? 'Cargando...'}
          </span>
        ) : t.btn_sign_in}
      </button>

    </form>
  );
};

export default ComponentsAuthLoginForm;