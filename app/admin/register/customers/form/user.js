'use client';
// app/admin/register/customers/form/user.js
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';

// ── Endpoint ───────────────────────────────────────────────────────────────────
// POST /api/clientes/{id}/usuarios/guardar
// Body: { codUsuCliente, nomUsuario, logCliente, claCliente, confirmarClave }
// codUsuCliente=0 → nuevo | >0 → editar
// Returns: UsuarioClienteListadoDto[]
//   → [{ codUsuCliente, nomUsuario, logCliente, codEstado, fecRegistra, fecModifica }]
const URL_GUARDAR = (codCliente) => `/clientes/${codCliente}/usuarios/guardar`;

// ── Props ──────────────────────────────────────────────────────────────────────
// cuenta   → UsuarioClienteListadoDto | null  (null = nueva cuenta)
// cliente  → { codCliente }
// onCancel → cierra el modal
// onSaved  → (nuevaLista: UsuarioClienteListadoDto[]) actualiza el padre
const UserForm = ({ cuenta = null, cliente, onCancel, onSaved }) => {
  const t      = useTranslation();
  const isEdit = !!cuenta?.codUsuCliente;

  const [showClave,    setShowClave]    = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // Genera contraseña alfanumérica de 6 caracteres
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('claCliente',     pwd);
    setValue('confirmarClave', pwd);
    setShowClave(true);
    setShowConfirm(true);
  };

  const {
    register, handleSubmit, watch, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nomUsuario:     cuenta?.nomUsuario  ?? '',
      logCliente:     cuenta?.logCliente  ?? '',
      claCliente:     '',
      confirmarClave: '',
    },
  });

  // Precarga al cambiar de cuenta (apertura modal editar → nuevo → editar)
  useEffect(() => {
    reset({
      nomUsuario:     cuenta?.nomUsuario ?? '',
      logCliente:     cuenta?.logCliente ?? '',
      claCliente:     '',
      confirmarClave: '',
    });
  }, [cuenta]);

  const watchClave = watch('claCliente');

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const res = await axiosClient.post(URL_GUARDAR(cliente.codCliente), {
        codUsuCliente:  cuenta?.codUsuCliente ?? 0,
        nomUsuario:     data.nomUsuario.trim(),
        logCliente:     data.logCliente.trim().toLowerCase(),
        claCliente:     data.claCliente     || null,  // null → backend no cambia la clave
        confirmarClave: data.confirmarClave || null,
      });

      Swal.fire({
        title: t.success, icon: 'success',
        confirmButtonColor: '#15803d',
        text: isEdit ? t.record_updated : t.contact_success_save,
        confirmButtonText: t.close,
      }).then(() => onSaved?.(res.data ?? []));

    } catch (err) {
      const status   = err?.response?.status;
      const data     = err?.response?.data ?? {};

      if (status === 400) {
        // Errores de validación ASP.NET: { errors: { Field: ["msg"] } }
        if (data.errors && typeof data.errors === 'object') {
          const msgs = Object.values(data.errors).flat().join('\n');
          Swal.fire({ title: t.warning, text: msgs, icon: 'warning',
            confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        } else {
          // Error de negocio simple: { message: "..." }
          const msg = data.message ?? data.mensaje ?? t.save_data_error;
          Swal.fire({ title: t.warning, text: msg, icon: 'warning',
            confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        }
      } else {
        Swal.fire({ title: t.error, text: t.customer_error_server, icon: 'error',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Nombre de usuario ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.name ?? 'Nombre de usuario'}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          placeholder="Ej: OSCAR CARVAJAL"
          {...register('nomUsuario', {
            required: { value: true, message: t.required_field },
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
          className={`form-input w-full ${errors.nomUsuario ? 'error' : ''}`}
        />
        {errors.nomUsuario && <p className="text-red-400 text-xs mt-1">{errors.nomUsuario.message}</p>}
      </div>

      {/* ── Login (correo) ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Login (correo)
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="email"
          autoComplete="off"
          placeholder="correo@empresa.com"
          {...register('logCliente', {
            required: { value: true, message: t.required_field },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t.invalid_email ?? 'Correo inválido',
            },
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
          className={`form-input w-full ${errors.logCliente ? 'error' : ''}`}
        />
        {errors.logCliente && <p className="text-red-400 text-xs mt-1">{errors.logCliente.message}</p>}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      {/* ── Contraseña ────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.password ?? 'Contraseña'}
            {!isEdit && <span className="text-red-500 ml-0.5">*</span>}
            {isEdit && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                (vacío = sin cambios)
              </span>
            )}
          </label>
          {/* Botón generar contraseña */}
          <button
            type="button"
            onClick={generatePassword}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80
                       font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
            Generar
          </button>
        </div>
        <div className="relative">
          <input
            type={showClave ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={isEdit ? '••••••••' : t.enter_password ?? 'Ingresa contraseña'}
            {...register('claCliente', {
              required: { value: !isEdit, message: t.required_field },
              validate: v => {
                if (!v) return true;
                if (v.length < 6) return 'Mínimo 6 caracteres';
                return true;
              },
            })}
            className={`form-input w-full pr-10 ${errors.claCliente ? 'error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowClave(p => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {showClave ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        {errors.claCliente && <p className="text-red-400 text-xs mt-1">{errors.claCliente.message}</p>}
      </div>

      {/* ── Confirmar contraseña ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.repit_password ?? 'Confirmar contraseña'}
          {!isEdit && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={isEdit ? '••••••••' : t.enter_password ?? 'Repite la contraseña'}
            {...register('confirmarClave', {
              required: { value: !isEdit, message: t.required_field },
              validate: v => {
                if (!watchClave && !v) return true;
                if (v !== watchClave) return t.passwords_dont_match ?? 'Las contraseñas no coinciden';
                return true;
              },
            })}
            className={`form-input w-full pr-10 ${errors.confirmarClave ? 'error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(p => !p)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            {showConfirm ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmarClave && <p className="text-red-400 text-xs mt-1">{errors.confirmarClave.message}</p>}
      </div>

      {/* ── Botones ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed">
          {t.btn_cancel}
        </button>
        <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Guardando...
            </span>
          ) : isEdit ? t.btn_update : t.btn_save}
        </button>
      </div>
    </div>
  );
};

export default UserForm;