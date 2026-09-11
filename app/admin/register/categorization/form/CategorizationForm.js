"use client";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import axiosClient from "@/app/lib/axiosClient";
import Swal from "sweetalert2";
import { useTranslation } from "@/app/locales";

const URL_BASE = '/categorizaciones';

const filterOption = (option, inputValue) => {
  if (!inputValue || inputValue.length < 2) return false;
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
};

export default function CategorizationForm({ item, controles, onCancel, onSaved }) {
  const isEdit = Boolean(item);
  const t = useTranslation();

  const noOptionsMessage = ({ inputValue }) =>
    !inputValue || inputValue.length < 2
      ? t.type_2_chars_search
      : t.no_results;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { codMarca: null, codAplicacion: null, codCategoria: null, habilitadoSeo: false },
  });

  useEffect(() => {
    if (item) {
      reset({
        codMarca:      item.codMarca,
        codAplicacion: item.codAplicacion,
        codCategoria:  item.codCategoria,
        habilitadoSeo: item.blnSeo,
      });
    } else {
      reset({ codMarca: null, codAplicacion: null, codCategoria: null, habilitadoSeo: false });
    }
  }, [item, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await axiosClient.put(`${URL_BASE}/editar`, { ...data, codRegistro: item.codRegistro });
      } else {
        await axiosClient.post(`${URL_BASE}/registrar`, data);
      }
      onSaved?.();
    } catch (e) {
      Swal.fire({
        title: t.error,
        text: e?.response?.data?.message ?? e?.response?.data?.mensaje ?? t.could_not_save_record,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close,
      });
    }
  };

  const opciones   = controles?.marcas     ?? [];
  const categorias = controles?.categorias ?? [];

  const findOpt = (list, val) =>
    val != null ? (list.find(o => String(o.value) === String(val)) ?? null) : null;

  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1 block";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Marca */}
      <div>
        <label className={labelCls}>{t.brand} <span className="text-red-500">*</span></label>
        <Controller
          name="codMarca"
          control={control}
          rules={{ required: t.required_field }}
          render={({ field }) => (
            <Select
              options={opciones}
              value={findOpt(opciones, field.value)}
              onChange={opt => field.onChange(opt?.value ?? null)}
              onBlur={field.onBlur}
              isClearable
              placeholder={t.search_brand_ph}
              menuPosition="fixed"
              filterOption={filterOption}
              noOptionsMessage={noOptionsMessage}
              classNamePrefix="react-select"
            />
          )}
        />
        {errors.codMarca && <span className={errorCls}>{errors.codMarca.message}</span>}
      </div>

      {/* Aplicación */}
      <div>
        <label className={labelCls}>{t.application} <span className="text-red-500">*</span></label>
        <Controller
          name="codAplicacion"
          control={control}
          rules={{ required: t.required_field }}
          render={({ field }) => (
            <Select
              options={opciones}
              value={findOpt(opciones, field.value)}
              onChange={opt => field.onChange(opt?.value ?? null)}
              onBlur={field.onBlur}
              isClearable
              placeholder={t.search_application_ph}
              menuPosition="fixed"
              filterOption={filterOption}
              noOptionsMessage={noOptionsMessage}
              classNamePrefix="react-select"
            />
          )}
        />
        {errors.codAplicacion && <span className={errorCls}>{errors.codAplicacion.message}</span>}
      </div>

      {/* Categoría */}
      <div>
        <label className={labelCls}>{t.category}</label>
        <Controller
          name="codCategoria"
          control={control}
          render={({ field }) => (
            <Select
              options={categorias}
              value={findOpt(categorias, field.value)}
              onChange={opt => field.onChange(opt?.value ?? null)}
              onBlur={field.onBlur}
              isClearable
              placeholder={t.select_category_ph}
              menuPosition="fixed"
              classNamePrefix="react-select"
            />
          )}
        />
      </div>

      {/* SEO */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" {...register("habilitadoSeo")} className="form-checkbox w-4 h-4" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.enabled_for_seo}
          </span>
        </label>
      </div>

      {/* Botones */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-outline-danger">
          {t.btn_cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-success disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving}
              </span>
            : isEdit ? t.update : t.save
          }
        </button>
      </div>
    </form>
  );
}
