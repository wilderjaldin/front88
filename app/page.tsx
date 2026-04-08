"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "./locales";
import Link from "next/link";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';


export default function Home() {
  const t = useTranslation();
  const token = useSelector(selectToken);
  const router = useRouter();
  useEffect(() => {
    if (token) {
      router.push('/admin/dashboard');
      return;
    }
  }, []);

  return (
    <div>
      <div className="absolute inset-0">
        <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
      </div>


      <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
        <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
        <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
        <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
        <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
        <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
          <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50">
            <div className="absolute end-6 top-6">

            </div>
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">{t.sign_in}</h1>
                <p className="text-base font-bold leading-normal text-white-dark">{t.sign_in_description}</p>
              </div>
              <div className="basis-2/5 flex flex-wrap items-center justify-center gap-2">
                <img className="inline w-full sm:w-3/4 m-auto" src="/assets/images/logo.png" alt="logo" />
              </div>
              { (!token) && <ComponentsAuthLoginForm /> }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
