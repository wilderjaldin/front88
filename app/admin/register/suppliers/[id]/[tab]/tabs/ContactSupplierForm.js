'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';

const URL_SAVE = (codPrv) => `/proveedores/${codPrv}/contactos/guardar`;

export default function ContactForm({ contacto = null, proveedor, onCancel, onSaved }) {
  const t      = useTranslation();
  const isEdit = !!contacto?.codRegistro;

  const {
    register, reset, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nomContacto:   '',
      nomCargo:      '',
      email1:        '',
      email2:        '',
      numTelefono1:  '',
      numTelefono2:  '',
      numTelefono3:  '',
      blnFijar:      false,
    },
  });

  useEffect(() => {
    reset({
      nomContacto:  contacto?.nomContacto  ?? '',
      nomCargo:     contacto?.nomCargo     ?? '',
      email1:       contacto?.email1       ?? '',
      email2:       contacto?.email2       ?? '',
      numTelefono1: contacto?.numTelefono1 ?? '',
      numTelefono2: contacto?.numTelefono2 ?? '',
      numTelefono3: contacto?.numTelefono3 ?? '',
      blnFijar:     contacto?.blnFijar     ?? false,
    });
  }, [contacto]);

  const onSubmit = async (data) => {
    const payload = {
      codRegistro:  contacto?.codRegistro ?? 0,
      codPrv:       proveedor.codPrv,
      nomContacto:  data.nomContacto.trim(),
      nomCargo:     data.nomCargo?.trim()     ?? '',
      email1:       data.email1?.trim()       ?? '',
      email2:       data.email2?.trim()       ?? '',
      numTelefono1: data.numTelefono1?.trim() ?? '',
      numTelefono2: data.numTelefono2?.trim() ?? '',
      numTelefono3: data.numTelefono3?.trim() ?? '',
      blnFijar:     data.blnFijar             ?? false,
    };

    try {
      const res = await axiosClient.post(URL_SAVE(proveedor.codPrv), payload);
      Swal.fire({
        title: t.success, icon: 'success',
        confirmButtonColor: '#15803d',
        text: isEdit ? t.contact_update_save : t.contact_success_save,
        confirmButtonText: t.close,
      }).then(() => onSaved?.(res.data ?? []));
    } catch (err) {
      const status  = err?.response?.status;
      const apiData = err?.response?.data ?? {};
      if (status === 400) {
        if (apiData.errors && typeof apiData.errors === 'object') {
          const msgs = Object.values(apiData.errors).flat().join('\n');
          Swal.fire({ title: t.warning, text: msgs, icon: 'warning', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        } else {
          const msg = apiData.message ?? apiData.mensaje ?? t.save_data_error;
          Swal.fire({ title: t.warning, text: msg, icon: 'warning', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        }
      } else {
        Swal.fire({ title: t.error, text: t.contact_error_server, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    }
  };

  return (
    <div className="space-y-4">

      {/* Nombre */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.contact_name}<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text" autoComplete="off"
          {...register('nomContacto', { required: { value: true, message: t.required_field } })}
          className={`form-input w-full ${errors.nomContacto ? 'error' : ''}`}
        />
        {errors.nomContacto && <p className="text-red-400 text-xs mt-1">{errors.nomContacto.message}</p>}
      </div>

      {/* Cargo */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.position}
        </label>
        <input type="text" autoComplete="off" {...register('nomCargo')} className="form-input w-full" />
      </div>

      {/* Emails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email 1</label>
          <input
            type="email" autoComplete="off"
            {...register('email1', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.invalid_email } })}
            className={`form-input w-full ${errors.email1 ? 'error' : ''}`}
          />
          {errors.email1 && <p className="text-red-400 text-xs mt-1">{errors.email1.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email 2</label>
          <input
            type="email" autoComplete="off"
            {...register('email2', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.invalid_email } })}
            className={`form-input w-full ${errors.email2 ? 'error' : ''}`}
          />
          {errors.email2 && <p className="text-red-400 text-xs mt-1">{errors.email2.message}</p>}
        </div>
      </div>

      {/* Teléfonos */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.phones}</label>
        <div className="grid grid-cols-3 gap-2">
          <input type="text" autoComplete="off" placeholder="Teléfono 1" {...register('numTelefono1')} className="form-input w-full" />
          <input type="text" autoComplete="off" placeholder="Teléfono 2" {...register('numTelefono2')} className="form-input w-full" />
          <input type="text" autoComplete="off" placeholder="Teléfono 3" {...register('numTelefono3')} className="form-input w-full" />
        </div>
      </div>

      {/* Fijar como predeterminado */}
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input type="checkbox" {...register('blnFijar')} className="form-checkbox" />
        {t.set_default}
      </label>

      {/* Botones */}
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
              {t.saving_data}
            </span>
          ) : isEdit ? t.btn_update_contact : t.btn_register_contact}
        </button>
      </div>
    </div>
  );
}