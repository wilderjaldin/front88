'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess } from '@/app/lib/swal';
import { registerUpper } from '@/app/lib/uppercaseField';
import { useTranslation } from '@/app/locales';
import Select from '@/components/ui/Select';

const ESTADO_OPTIONS = (t) => [
  { value: 'AC', label: t.active   ?? 'Activa' },
  { value: 'IN', label: t.inactive ?? 'Inactiva' },
];

// Crea o edita una marca — un solo componente para ambos casos, igual que
// SupplierForm/CustomerForm (marca=null → alta, marca={...} → edición).
export default function BrandForm({ marca, onCancel, onSaved }) {
  const t = useTranslation();
  const isEditing = !!marca?.codMarca;

  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      nomMarca:  marca?.nomMarca  ?? '',
      codEstado: marca?.codEstado ?? 'AC',
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEditing) {
        await axiosClient.put('marcas/editar', {
          codMarca:  marca.codMarca,
          nomMarca:  data.nomMarca.trim(),
          codEstado: data.codEstado,
        });
        swalSuccess(t.brand_success_save ?? 'La marca se actualizó correctamente');
      } else {
        await axiosClient.post('marcas/registrar', { nomMarca: data.nomMarca.trim() });
        swalSuccess(t.brand_success_save ?? 'La marca fue registrada correctamente');
      }
      onSaved?.();
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.message ?? (t.brand_error_save ?? 'Ocurrió un error al guardar la marca'), t.close);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {t.brand_name ?? 'Nombre de la marca'}
        </label>
        <input
          type="text"
          autoFocus
          {...registerUpper(register, 'nomMarca', {
            required: t.required_field,
            minLength: { value: 2, message: (t.min_n_characters ?? 'Mínimo {n} caracteres').replace('{n}', 2) },
            maxLength: { value: 50, message: (t.max_n_characters ?? 'Máximo {n} caracteres').replace('{n}', 50) },
          })}
          className={`form-input w-full ${errors.nomMarca ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
        />
        {errors.nomMarca && (
          <span className="text-red-500 text-xs mt-1 block">{errors.nomMarca.message}</span>
        )}
      </div>

      {/* Estado — solo al editar; una marca nueva siempre nace Activa */}
      {isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t.status}
          </label>
          <Controller
            name="codEstado"
            control={control}
            render={({ field }) => (
              <Select
                isClearable={false}
                options={ESTADO_OPTIONS(t)}
                value={ESTADO_OPTIONS(t).find(o => o.value === field.value) ?? null}
                onChange={opt => field.onChange(opt.value)}
              />
            )}
          />
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 items-center rounded-lg px-4 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          {t.btn_cancel ?? 'Cancelar'}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex h-9 items-center rounded-lg px-4 text-sm bg-primary text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (t.saving ?? 'Guardando…') : (t.btn_save ?? 'Guardar')}
        </button>
      </div>
    </form>
  );
}
