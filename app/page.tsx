"use client";
import { useEffect } from "react";
import { useTranslation } from "./locales";
import { useSelector } from 'react-redux';
import { selectToken, selectUser } from '@/store/authSlice';
import { IRootState } from '@/store/theme';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';
import AuthBackground from '@/components/auth/auth-background';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

export default function Home() {
  const t     = useTranslation();
  const token  = useSelector(selectToken);
  const user   = useSelector(selectUser);
  const isDark = useSelector((state: IRootState) => state.themeConfig.isDarkMode);
  const router = useRouter();
  const searchParams = useSearchParams();

  // "Añadir cuenta" reusa este mismo login, pero con la sesión actual todavía
  // activa — no debe redirigir a dashboard ni ocultar el formulario solo
  // porque ya hay un token (eso es lo normal fuera de este modo).
  const addAccountMode = searchParams.get('addAccount') === '1';

  useEffect(() => {
    if (token && !addAccountMode) router.push('/admin/dashboard');
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #060818 0%, #0e1726 100%)'
          : 'linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%)',
      }}
    >
      <AuthBackground />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[440px] rounded-2xl overflow-hidden"
        style={{
          background: isDark ? '#0e1726' : '#ffffff',
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.16), 0 4px 20px rgba(245,158,11,0.05)'
            : '0 20px 60px rgba(100,116,139,0.14), 0 0 0 1px rgba(245,158,11,0.14), 0 4px 20px rgba(245,158,11,0.05)',
        }}
      >
        {/* Logo */}
        <div className="px-10 pt-10 pb-6 flex justify-center">
          <img
            src={isDark ? '/assets/images/logo_white.png' : '/assets/images/logo.png'}
            alt="logo"
            className="w-full max-w-[260px] object-contain"
          />
        </div>

        {/* Franja ámbar */}
        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* Formulario */}
        <div className="px-10 pb-10 pt-7">
          {addAccountMode ? (
            <>
              <Link href="/admin/dashboard"
                className="no-load inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition mb-4">
                <IconArrowBackward className="h-3.5 w-3.5" />
                {t.btn_cancel ?? 'Cancelar'}
              </Link>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                  {t.add_account ?? 'Añadir cuenta'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  {user?.name
                    ? (t.add_account_description ?? 'Tu sesión actual ({name}) se mantiene activa.').replace('{name}', user.name)
                    : (t.sign_in_description ?? '')}
                </p>
              </div>
              <ComponentsAuthLoginForm addAccountMode />
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.sign_in}</h1>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{t.sign_in_description}</p>
              </div>
              {!token && <ComponentsAuthLoginForm />}
            </>
          )}
        </div>
      </div>

      <p className="relative z-10 mt-8 text-xs text-slate-400 dark:text-gray-500">
        © {new Date().getFullYear()} — Sistema de Gestión Daxparts
      </p>
    </div>
  );
}
