'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import IconSave from '@/components/icon/icon-save';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function UserSettings() {
  const user = useSelector(selectUser);
  const t    = useTranslation();

  useDynamicTitle('Configuraciones');

  // ── Nombre ──────────────────────────────────────────────────────────────────
  const {
    register: regName,
    handleSubmit: submitName,
    formState: { errors: errName, isSubmitting: savingName },
  } = useForm({ defaultValues: { nomUsuario: user?.name ?? '' } });

  const onSaveName = async (data) => {
    // TODO: call API when endpoint is ready
    Toast.fire({ icon: 'info', title: 'Endpoint pendiente de implementación' });
  };

  // ── Contraseña ───────────────────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: submitPwd,
    watch,
    reset: resetPwd,
    formState: { errors: errPwd, isSubmitting: savingPwd },
  } = useForm({ defaultValues: { claActual: '', claNew: '', claConfirm: '' } });

  const newPwd = watch('claNew');

  const onSavePwd = async (data) => {
    // TODO: call API when endpoint is ready
    Toast.fire({ icon: 'info', title: 'Endpoint pendiente de implementación' });
    resetPwd();
  };

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{t.settings}</h1>
        <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
      </div>

      {/* Información de cuenta */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Usuario</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.login ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-1">{user?.rol ?? '—'}</p>
      </div>

      {/* Cambiar nombre */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre</h2>
          <p className="text-xs text-gray-400 mt-0.5">Modifica el nombre que aparece en el sistema.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...regName('nomUsuario', {
              required: t.required_field,
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
            className="form-input w-full"
            placeholder="Nombre completo"
          />
          {errName.nomUsuario && (
            <p className="text-xs text-red-500">{errName.nomUsuario.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submitName(onSaveName)}
            disabled={savingName}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
          >
            {savingName ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.updating}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {t.btn_save}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.password}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Cambia tu contraseña de acceso.</p>
        </div>

        <div className="space-y-4">

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña actual <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...regPwd('claActual', { required: t.required_field })}
              className="form-input w-full"
              placeholder="••••••••"
            />
            {errPwd.claActual && (
              <p className="text-xs text-red-500">{errPwd.claActual.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...regPwd('claNew', {
                required: t.required_field,
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              className="form-input w-full"
              placeholder="••••••••"
            />
            {errPwd.claNew && (
              <p className="text-xs text-red-500">{errPwd.claNew.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repetir contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              {...regPwd('claConfirm', {
                required: t.required_field,
                validate: (v) => v === newPwd || t.passwords_dont_match,
              })}
              className="form-input w-full"
              placeholder="••••••••"
            />
            {errPwd.claConfirm && (
              <p className="text-xs text-red-500">{errPwd.claConfirm.message}</p>
            )}
          </div>

        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submitPwd(onSavePwd)}
            disabled={savingPwd}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
          >
            {savingPwd ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.updating}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {t.btn_reset_password}
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
