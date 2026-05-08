"use client";
import { useEffect } from "react";
import { useTranslation } from "./locales";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';
import AuthBackground from '@/components/auth/auth-background';

export default function Home() {
  const t     = useTranslation();
  const token  = useSelector(selectToken);
  const router = useRouter();

  useEffect(() => {
    if (token) router.push('/admin/dashboard');
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%)' }}
    >
      <AuthBackground />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(100,116,139,0.14), 0 0 0 1px rgba(245,158,11,0.14), 0 4px 20px rgba(245,158,11,0.05)',
        }}
      >
        {/* Logo — fondo blanco garantiza visibilidad */}
        <div className="px-10 pt-10 pb-6 flex justify-center">
          <img src="/assets/images/logo.png" alt="logo" className="w-full max-w-[260px] object-contain" />
        </div>

        {/* Franja ámbar */}
        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* Formulario */}
        <div className="px-10 pb-10 pt-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t.sign_in}</h1>
            <p className="text-sm text-slate-500 mt-1">{t.sign_in_description}</p>
          </div>
          {!token && <ComponentsAuthLoginForm />}
        </div>
      </div>

      <p className="relative z-10 mt-8 text-xs text-slate-400">
        © {new Date().getFullYear()} — Sistema de Gestión Daxparts
      </p>
    </div>
  );
}
