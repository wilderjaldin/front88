"use client";
import ComponentsAuthResetPasswordForm from '@/components/auth/components-auth-reset-password-form';
import AuthBackground from '@/components/auth/auth-background';
import React from 'react';
import { useTranslation } from "@/app/locales";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const Password = () => {
  const t = useTranslation();
  useDynamicTitle(`${t.password_reset}`);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: '#0c1222' }}
    >
      <AuthBackground />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[440px] bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 28px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.10)' }}
      >
        <div className="px-10 pt-10 pb-6 flex justify-center">
          <img src="/assets/images/logo.png" alt="logo" className="w-full max-w-[260px] object-contain" />
        </div>

        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        <div className="px-10 pb-10 pt-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t.password_reset}</h1>
            <p className="text-sm text-slate-500 mt-1">{t.password_reset_description}</p>
          </div>
          <ComponentsAuthResetPasswordForm />
        </div>
      </div>

      <p className="relative z-10 mt-8 text-xs text-slate-600">
        © {new Date().getFullYear()} — Sistema de Gestión Daxparts
      </p>
    </div>
  );
};

export default Password;
