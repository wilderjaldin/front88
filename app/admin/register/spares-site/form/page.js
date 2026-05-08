'use client';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Select from 'react-select';
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import SelectBrand from '@/components/select-brand';
import Link from 'next/link';

// ── Estilos react-select ───────────────────────────────────────────────────────
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--select-bg, #fff)',
    borderColor: state.isFocused
      ? '#4361ee'
      : state.selectProps.error
        ? '#f87171'
        : 'var(--select-border, #e0e6ed)',
    borderRadius: '0.5rem',
    minHeight: '42px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(67,97,238,0.12)' : 'none',
    transition: 'border-color .15s, box-shadow .15s',
    '&:hover': { borderColor: '#4361ee' },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--select-bg, #fff)',
    border: '1px solid var(--select-border, #e0e6ed)',
    borderRadius: '0.5rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    zIndex: 50,
    overflow: 'hidden',
  }),
  menuList: (base) => ({ ...base, padding: '4px' }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? 'rgba(67,97,238,0.08)' : 'transparent',
    color: state.isSelected ? '#fff' : 'inherit',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '7px 10px',
  }),
  singleValue:        (base) => ({ ...base, color: 'inherit', fontSize: '0.875rem' }),
  input:              (base) => ({ ...base, color: 'inherit', fontSize: '0.875rem' }),
  placeholder:        (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
  clearIndicator:     (base) => ({ ...base, color: '#9ca3af', padding: '5px', '&:hover': { color: '#e7515a' } }),
  dropdownIndicator:  (base) => ({ ...base, color: '#9ca3af', padding: '5px' }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--select-border, #e0e6ed)' }),
  valueContainer:     (base) => ({ ...base, padding: '2px 12px' }),
};

const URL_CONTROLS = 'repuestossite/controles'; // GET → { marcas: [{value,label}], categorias: [{value,label}] }
const URL_DETAIL   = 'repuestossite/detalle';   // GET ?nroParte=
const URL_SAVE     = 'repuestossite/registrar'; // POST
const URL_UPDATE   = 'repuestossite/editar';    // PUT

// ─────────────────────────────────────────────────────────────────────────────
export default function SparesSiteFormPage() {

  const router        = useRouter();
  const searchParams  = useSearchParams();
  const t             = useTranslation();

  const nroParteParam = searchParams.get('nroParte');
  const isEdit        = !!nroParteParam;

  useDynamicTitle(isEdit ? 'Editar Repuesto Site' : 'Nuevo Repuesto Site');

  const [brands,     setBrands]     = useState([]); // marcas — también usadas por SelectBrand (Aplicación)
  const [categories, setCategories] = useState([]); // categorias → [{ value: 'SC', label: '...' }]
  const [isSaving,   setIsSaving]   = useState(false);

  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nroParte:      '',
      desRepuesto:   '',
      codAplicacion: null,   // { value, label }
      categoria:     null,   // { value: 'SC', label: '...' }
      hCode:         '',
      peso:          '0.00',
      pesoVolumen:   '0.00',
      largo:         '0.00',
      ancho:         '0.00',
      alto:          '0.00',
      blnSeo:        false,
    },
  });

  // ── Helper error inline ───────────────────────────────────────────────────
  const FieldError = ({ name }) =>
    errors[name]
      ? <span className="text-red-500 text-xs mt-1.5 block">{errors[name].message}</span>
      : null;

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      Swal.fire({
        title: t.loading ?? 'Cargando...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // 1. Catálogos — controles devuelve { marcas, categorias }
        const rsControls    = await axiosClient.get(URL_CONTROLS);
        const newBrands     = rsControls.data?.marcas     ?? [];
        const newCategories = rsControls.data?.categorias ?? [];

        setBrands(newBrands);
        setCategories(newCategories);

        // 2. Detalle en edición
        if (isEdit) {
          const rsDetail = await axiosClient.get(URL_DETAIL, { params: { nroParte: nroParteParam } });
          const d = rsDetail.data ?? {};

          // Resolver Aplicación: codAplicacion (número) → objeto { value, label } de marcas
          const bMap = new Map(newBrands.map(b => [Number(b.value), b]));
          const aplicacionObj = d.codAplicacion
            ? bMap.get(Number(d.codAplicacion)) ?? null
            : null;

          // Resolver Categoría: categoria (string "SC") → objeto { value, label } de categorias
          const categoriaObj = d.categoria
            ? newCategories.find(c => c.value === d.categoria) ?? null
            : null;

          reset({
            nroParte:      d.nroParte     ?? '',
            desRepuesto:   d.desRepuesto   ?? '',
            codAplicacion: aplicacionObj,
            categoria:     categoriaObj,
            hCode:         d.hCode?.trim() ?? '',
            peso:          d.peso          ?? '0.00',
            pesoVolumen:   d.pesoVolumen   ?? '0.00',
            largo:         d.largo         ?? '0.00',
            ancho:         d.ancho         ?? '0.00',
            alto:          d.alto          ?? '0.00',
            blnSeo:        !!d.blnSeo,
          });
        }
      } catch {
        // silencioso
      } finally {
        Swal.close();
      }
    };

    init();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const payload = {
        nroParte:      data.nroParte.trim(),
        desRepuesto:   data.desRepuesto.trim(),
        codAplicacion: data.codAplicacion?.value ? parseInt(data.codAplicacion.value) : null,
        categoria:     data.categoria?.value     ?? null,
        hCode:         data.hCode?.trim()        ?? '',
        peso:          Number(data.peso)          || 0,
        pesoVolumen:   Number(data.pesoVolumen)  || 0,
        largo:         Number(data.largo)         || 0,
        ancho:         Number(data.ancho)         || 0,
        alto:          Number(data.alto)          || 0,
        blnSeo:        !!data.blnSeo,
      };

      const method = isEdit ? 'put'      : 'post';
      const url    = isEdit ? URL_UPDATE : URL_SAVE;
      await axiosClient[method](url, payload);

      const Toast = Swal.mixin({
        toast: true, position: 'top-end',
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
      });
      Toast.fire({
        icon:  'success',
        title: isEdit
          ? (t.spare_success_update ?? 'Repuesto actualizado correctamente')
          : (t.spare_success_save   ?? 'Repuesto registrado correctamente'),
      }).then(() => router.push('/admin/register/spares-site'));

    } catch (err) {
      const resData = err?.response?.data ?? {};
      let msg = '';
      if (resData.errors && typeof resData.errors === 'object') {
        msg = Object.values(resData.errors).flat().join('\n');
      } else {
        msg = resData.message ?? err?.message ?? 'Error al guardar';
      }
      Swal.fire({
        title:              t.warning          ?? 'Advertencia',
        text:               msg,
        confirmButtonColor: '#dc2626',
        confirmButtonText:  t.close            ?? 'Cerrar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* CSS vars dark mode */}
      <style>{`
        :root { --select-bg: #fff; --select-border: #e0e6ed; }
        .dark  { --select-bg: #1b2e4b; --select-border: #17263c; }
        .form-input, .form-textarea {
          border-radius: 0.5rem !important;
          min-height: 42px;
          font-size: 0.875rem;
          transition: border-color .15s, box-shadow .15s;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: #4361ee !important;
          box-shadow: 0 0 0 3px rgba(67,97,238,0.12) !important;
        }
        .form-input.input-error { border-color: #f87171 !important; }
        .form-checkbox {
          width: 17px !important; height: 17px !important;
          border-radius: 5px !important; border-color: #d1d5db !important;
          cursor: pointer; transition: all .15s;
        }
        .form-checkbox:checked { background-color: #4361ee !important; border-color: #4361ee !important; }
        .form-checkbox:focus { box-shadow: 0 0 0 3px rgba(67,97,238,0.18) !important; }
        .form-saving { pointer-events: none; opacity: 0.65; }
      `}</style>

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li>Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <Link href="/admin/register/spares-site" className="text-primary hover:underline">
            Repuestos Site
          </Link>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{isEdit ? 'Editar' : 'Nuevo'}</span>
        </li>
      </ul>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => router.push('/admin/register/spares-site')}
          className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300
            dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <IconArrowBackward className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        <div className={`bg-white dark:bg-[#0e1726] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700 p-6 ${isSaving ? 'form-saving' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">

            {/* ── FILA 1 ── */}

            {/* 1. Nro. Parte */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.nro_part ?? 'Nro. Parte'} <span className="text-red-500">*</span>
              </label>
              <input
                tabIndex={1}
                type="text"
                autoComplete="off"
                placeholder="Ej: 3415661"
                disabled={(isEdit) ? true : false}
                {...register('nroParte', {
                  required:  'Campo requerido',
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                })}
                className={`form-input w-full ${errors.nroParte ? 'input-error' : ''}`}
              />
              <FieldError name="nroParte" />
            </div>

            {/* 2. Aplicación */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.application ?? 'Aplicación'}
              </label>
              <SelectBrand
                t={t}
                name="codAplicacion"
                control={control}
                errors={errors}
                setValue={setValue}
                brands={brands}
                current={isEdit ? watch('codAplicacion') : null}
                required={false}
                placeholder="Buscar aplicación..."
                tabIndex={2}
                instanceId="select-aplicacion-spares-site"
                onBrandAdded={({ marcas }) => setBrands(marcas)}
              />
              <FieldError name="codAplicacion" />
            </div>

            {/* 3. Peso */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.weight ?? 'Peso'}
              </label>
              <input
                tabIndex={3}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('peso')}
                className="form-input w-full"
              />
            </div>

            {/* ── FILA 2 ── */}

            {/* 4. Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.description ?? 'Descripción'} <span className="text-red-500">*</span>
              </label>
              <input
                tabIndex={4}
                type="text"
                autoComplete="off"
                placeholder="Descripción del repuesto"
                {...register('desRepuesto', {
                  required:  'Campo requerido',
                  maxLength: { value: 300, message: 'Máximo 300 caracteres' },
                })}
                className={`form-input w-full ${errors.desRepuesto ? 'input-error' : ''}`}
              />
              <FieldError name="desRepuesto" />
            </div>

            {/* 5. Categoría */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.spare_part_type ?? 'Tipo de Repuesto'}
              </label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select
                    tabIndex={5}
                    options={categories}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Tipo de repuesto"
                    isClearable
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
              <FieldError name="categoria" />
            </div>

            {/* 6. Pes. Volumen */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Pes. Volumen
              </label>
              <input
                tabIndex={6}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('pesoVolumen')}
                className="form-input w-full"
              />
            </div>

            {/* ── FILA 3 ── */}

            {/* 7. H Code */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.h_code ?? 'H Code'}
              </label>
              <input
                tabIndex={7}
                type="text"
                autoComplete="off"
                placeholder="H Code"
                {...register('hCode')}
                className="form-input w-full"
              />
            </div>

            {/* 8. Largo */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.long ?? 'Largo'}
              </label>
              <input
                tabIndex={8}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('largo')}
                className="form-input w-full"
              />
            </div>

            {/* 9. Ancho */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.width ?? 'Ancho'}
              </label>
              <input
                tabIndex={9}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('ancho')}
                className="form-input w-full"
              />
            </div>

            {/* ── FILA 4 ── */}

            {/* 10. Alto */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.height ?? 'Alto'}
              </label>
              <input
                tabIndex={10}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('alto')}
                className="form-input w-full"
              />
            </div>

            {/* 11. Habilitado SEO */}
            <div>
              <label className="block text-sm font-medium mb-1.5 invisible select-none">
                &nbsp;
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none h-[42px]">
                <input
                  tabIndex={11}
                  type="checkbox"
                  {...register('blnSeo')}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium">
                  Habilitado para SEO
                </span>
              </label>
            </div>

            {/* col 3 vacía */}
            <div />

          </div>{/* fin grid */}
        </div>{/* fin panel */}

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 mt-5">

          <button
            type="button"
            tabIndex={12}
            disabled={isSaving}
            onClick={() => router.push('/admin/register/spares-site')}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg
              border border-gray-300 dark:border-gray-600
              text-sm font-medium text-gray-600 dark:text-gray-300
              bg-white dark:bg-transparent
              hover:bg-gray-50 dark:hover:bg-gray-800
              hover:border-gray-400 dark:hover:border-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            {t.btn_cancel ?? 'Cancelar'}
          </button>

          <button
            type="submit"
            tabIndex={13}
            disabled={isSaving}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg
              text-sm font-semibold text-white
              bg-primary hover:bg-primary/90
              shadow-md shadow-primary/25
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-150"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving ?? 'Guardando...'}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {isEdit ? (t.btn_update ?? 'Actualizar') : (t.btn_save ?? 'Guardar')}
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}