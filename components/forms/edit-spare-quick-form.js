'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { registerUpper } from '@/app/lib/uppercaseField';
import { swalSuccess, swalError } from '@/app/lib/swal';
import axiosClient from '@/app/lib/axiosClient';
import IconSave from '@/components/icon/icon-save';

const URL_EDIT = 'cotizaciondetalle/repuesto/edicion-rapida';

// Edición rápida desde "Resumen del Repuesto" — a propósito solo estos 3 campos
// (el resto del repuesto se edita en /admin/register/spares/form).
//
// Un solo request: edita el repuesto en el catálogo Y recalcula la cotización
// que lo tiene como ítem, en el mismo golpe (mismo shape que actualizar-item/
// buscar-parte: { cotizacion, detalle }). Por eso necesita nroCotizacion —
// este endpoint solo vive dentro del flujo de cotizaciones, no es de uso
// general del módulo de Repuestos.
const EditSpareQuickForm = ({ t, codRepuesto, nroCotizacion, data, onCancel, onSaved, onQuoteUpdated }) => {
  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      desRepuesto: data?.desRepuesto ?? '',
      peso:        data?.peso        ?? 0,
      costo:       data?.costo       ?? 0,
    },
  });

  const onSubmit = async (formData) => {
    const summary = {
      desRepuesto: formData.desRepuesto.trim(),
      peso:        Number(formData.peso)  || 0,
      costo:       Number(formData.costo) || 0,
    };
    try {
      const rs = await axiosClient.put(URL_EDIT, { codRepuesto, nroCotizacion, ...summary });
      swalSuccess(t.save_data_success ?? 'Los datos fueron guardados correctamente');
      // La respuesta no repite desRepuesto/peso/costo del repuesto en sí (trae
      // la cotización completa, no el catálogo) — el resumen se actualiza con
      // lo que se acaba de guardar, que es exactamente eso.
      onSaved?.(summary);
      if (rs.data?.cotizacion && rs.data?.detalle) {
        onQuoteUpdated?.({ cotizacion: rs.data.cotizacion, detalle: rs.data.detalle });
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = status === 409
        ? (t.quote_outdated ?? 'La cotización está desactualizada. Actualízala antes de continuar.')
        : status === 401
          ? (t.session_expired ?? 'Tu sesión expiró. Vuelve a iniciar sesión.')
          : status === 400
            ? (t.invalid_data ?? 'Datos inválidos.')
            : (err?.response?.data?.mensaje ?? t.save_data_error);
      swalError(t.error, message, t.close);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div>
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
          {t.description ?? 'Descripción'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          {...registerUpper(register, 'desRepuesto', {
            required:  t.required_field ?? 'Campo requerido',
            maxLength: { value: 300, message: (t.max_n_characters ?? 'Máximo {n} caracteres').replace('{n}', 300) },
          })}
          className={`form-input w-full text-sm ${errors.desRepuesto ? 'error' : ''}`}
        />
        {errors.desRepuesto && (
          <span className="text-red-400 text-xs mt-1 block">{errors.desRepuesto.message}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            {t.weight ?? 'Peso'} (lb)
          </label>
          <input type="number" step="any" min="0" {...register('peso')} className="form-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
            {t.cost ?? 'Costo'}
          </label>
          <input type="number" step="any" min="0" {...register('costo')} className="form-input w-full text-sm" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          {t.btn_cancel ?? 'Cancelar'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <IconSave className="h-4 w-4" />
          {t.btn_save ?? 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default EditSpareQuickForm;
