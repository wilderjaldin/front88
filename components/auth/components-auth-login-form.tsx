'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Link from 'next/link';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useDispatch, useSelector } from 'react-redux';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { setUser, setAuth, selectToken, selectUser, selectAuth } from '@/store/authSlice';

const url_login = process.env.NEXT_PUBLIC_API_URL + 'usuarios/login';
import Loading from '@/components/layouts/loading';
import IconUser from '../icon/icon-user';

const ComponentsAuthLoginForm = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  //const auth_redux = useSelector(selectToken);

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const token = useSelector(selectToken);
  const t = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { username: '', password: '', rememberme: false } });
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await axios.post(url_login, { LogUsuario: data.username, PwdUsuario: data.password, RememberMe: data.rememberme });

      dispatch(setAuth({
        token: res.data.token,
        user: res.data.user,
        permissions: res.data.permissions
      }));

      Swal.fire({
        title: `${t.welcome} ${res.data.user.name}`,
        icon: 'success',
        confirmButtonColor: '#15803d',
        confirmButtonText: t.btn_close
      }).then(() => {
        router.push('/admin/dashboard');
      })


    } catch (error:any) {

      if (error.response?.status === 401) {
        Swal.fire('Error', t.login_incorrect, 'error');
      } else {
        Swal.fire('Error', t.error_server, 'error');
      }
      setIsLoading(false);

    }
  }

  useDynamicTitle(`${t.login.title}`);

  return (
    <>
      {isLoading && <Loading />}
      <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="Username">{t.username}</label>
          <div className="relative text-white-dark">
            <input type='text' autoComplete='OFF' defaultValue='' {...register("username", { required: { value: true, message: t.required_field } })} aria-invalid={errors.username ? "true" : "false"} placeholder={t.enter_username} className="form-input ps-10 placeholder:text-white-dark" />

            <span className="absolute start-4 top-4.5 -translate-y-1/2">
              <IconUser fill={true} />
            </span>
            {errors.username && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.username?.message?.toString()}</span>}
          </div>
        </div>
        <div>
          <label htmlFor="Password">{t.password}</label>
          <div className="relative text-white-dark">
            <input type={(showPassword) ? 'text' : 'password'} id="Password" autoComplete='new-password' defaultValue='' {...register("password", { required: { value: true, message: t.required_field } })} placeholder={t.enter_password} className="form-input ps-10 placeholder:text-white-dark" />
            <div onClick={() => setShowPassword(!showPassword)} className="cursor-pointer absolute top-2 right-0 pr-3 flex items-center text-sm leading-5">
              {(showPassword) ?
                <svg className="h-6 text-gray-700" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                  <path fill="currentColor"
                    d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z">
                  </path>
                </svg>
                :
                <svg className="h-6 text-gray-700" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                  <path fill="currentColor"
                    d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z">
                  </path>
                </svg>
              }
            </div>
            {errors.password && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.password?.message?.toString()}</span>}
            <span className="absolute start-4 top-4.5 -translate-y-1/2">
              <IconLockDots fill={true} />
            </span>
          </div>
        </div>
        <div className="flex justify-between"><label className="block text-gray-500 font-bold my-4"><input {...register("rememberme")} type="checkbox" className="leading-loose text-pink-600" />
          <span className="py-2 text-sm text-gray-600 leading-snug"> {t.remember} </span></label> <label className="block text-gray-500 font-bold my-4">
            <Link
              href="/forgot"
              className="cursor-pointer tracking-tighter text-black border-b-2 border-gray-200 hover:border-gray-400"><span>{t.forgot}</span></Link></label>
        </div>
        <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
          {t.btn_sign_in}
        </button>
      </form>
    </>
  );
};

export default ComponentsAuthLoginForm;
