'use client';
import React from 'react';
import { useForm } from "react-hook-form";
import SelectBrand from '@/components/select-brand';
import IconSave from '@/components/icon/icon-save';

const Form = ({ t, brands = [], action_cancel, handleSave }) => {

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  // async + await: isSubmitting queda en true mientras dura la request, así el
  // botón Guardar se bloquea y no se puede registrar dos veces con doble click.
  const onSave = async (data) => {
    await handleSave({
      NroParteOriginal: data.nro_part,
      NroParteCambio:   data.reference,
      CodMarcaOriginal: data.application_part?.value ?? 0,
      CodMarcaCambio:   data.application_reference?.value ?? 0,
      UltimoCambio:     data.last_change ? 1 : 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <fieldset className="space-y-4">

        <div className="grid grid-cols-2 gap-4 border p-4 rounded bg-blue-50/60 dark:bg-blue-900/20">
          <div>
            <label className="block text-sm font-medium mb-1">{t.nro_part}</label>
            <input
              type="text"
              autoComplete="OFF"
              {...register("nro_part", { required: { value: true, message: t.required_field } })}
              placeholder={t.nro_part}
              className="form-input w-full"
            />
            {errors.nro_part && (
              <span className="text-red-400 text-xs mt-1 block">{errors.nro_part.message?.toString()}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.application}</label>
            <SelectBrand
              t={t}
              control={control}
              errors={errors}
              setValue={setValue}
              name="application_part"
              required={t.required_select}
              instanceId="application_part"
              brands={brands}
              placeholder={t.search_brand_ph}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border p-4 rounded bg-violet-50/60 dark:bg-violet-900/20">
          <div>
            <label className="block text-sm font-medium mb-1">{t.reference}/{t.change}</label>
            <input
              type="text"
              autoComplete="OFF"
              {...register("reference", { required: { value: true, message: t.required_field } })}
              placeholder={`${t.reference}/${t.change}`}
              className="form-input w-full"
            />
            {errors.reference && (
              <span className="text-red-400 text-xs mt-1 block">{errors.reference.message?.toString()}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.application}</label>
            <SelectBrand
              t={t}
              control={control}
              errors={errors}
              setValue={setValue}
              name="application_reference"
              required={t.required_select}
              instanceId="application_reference"
              brands={brands}
              placeholder={t.search_brand_ph}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input {...register("last_change")} type="checkbox" className="form-checkbox" />
            {t.last_change}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={action_cancel}
            disabled={isSubmitting}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5
              text-sm text-gray-700 hover:bg-gray-50 transition
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t.btn_cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5
              text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <IconSave className="h-4 w-4" />}
            {t.btn_save}
          </button>
        </div>

      </fieldset>
    </form>
  );
};

export default Form;
