'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import SelectBrand from '@/components/select-brand';
import SpareFiles from '../SpareFiles';

const URL_CONTROLS = 'repuestos/controles?incluirEstados=true';
const URL_DETAIL   = 'repuestos/detalle';
const URL_SAVE     = 'repuestos/registrar';
const URL_UPDATE   = 'repuestos/editar';

const ASYNC_LIMIT     = 20;
const ASYNC_MIN_CHARS = 2;

// ── Estilos react-select mejorados, compatibles con dark mode ─────────────────
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
    backgroundColor: state.isSelected
      ? '#4361ee'
      : state.isFocused
        ? 'rgba(67,97,238,0.08)'
        : 'transparent',
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

// ─────────────────────────────────────────────────────────────────────────────
export default function SpareFormPage() {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();

  const id     = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const isEdit = !!id;

  useDynamicTitle(isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto');

  const [brands,      setBrands]      = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [types,       setTypes]       = useState([]);
  const [status,      setStatus]      = useState([]);
  const [units,       setUnits]       = useState([]);
  const [status_code, setStatusCode]  = useState([]);
  const [isSaving,    setIsSaving]    = useState(false);

  const [tempToken] = useState(() => crypto.randomUUID());

  // ── AsyncSelect helpers ───────────────────────────────────────────────────
  const filterOpts = (options, input) => {
    const term = input.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return options
      .filter(o => o.label.toLowerCase().includes(term))
      .slice(0, ASYNC_LIMIT);
  };

  const loadSuppliers = useCallback(
    (input, cb) => cb(filterOpts(suppliers, input)), [suppliers]
  );

  const noOptsMsg = ({ inputValue }) =>
    inputValue.length < ASYNC_MIN_CHARS
      ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
      : 'Sin resultados';

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nroParte:               '',
      desRepuesto:            '',
      codPrv:                 null,
      codAplicacion:          null,
      codMarca:               null,
      tipRepuesto:            null,
      estado:                 { value: 'NU', label: 'NUEVO' },
      estNroParte:            { value: 'VA', label: 'VALIDO' },
      peso:                   '0.00',
      costo:                  '0.00',
      canMin:                 1,
      uniMed:                 { value: 'UNI', label: 'UNIDAD' },
      blnPedEspecialSinFecha: false,
      blnPedidoEspecial:      false,
      canDias:                0,
    }
  });

  const watchPedido = watch('blnPedidoEspecial');

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
        const rsControls = await axiosClient.get(URL_CONTROLS);

        const newBrands     = rsControls.data.marcas        ?? [];
        const newSuppliers  = rsControls.data.proveedores   ?? [];
        const newTypes      = rsControls.data.tiposRepuesto ?? [];
        const newStatus     = rsControls.data.estados       ?? [];
        const newUnits      = rsControls.data.unidades      ?? [];
        const newStatusCode = rsControls.data.estado_codigo ?? [];

        setBrands(newBrands);
        setSuppliers(newSuppliers);
        setTypes(newTypes);
        setStatus(newStatus);
        setUnits(newUnits);
        setStatusCode(newStatusCode);

        if (isEdit) {
          const rsDetail = await axiosClient.get(`${URL_DETAIL}/${id}`);
          const d = rsDetail.data;

          const bMap = new Map(newBrands.map(b    => [Number(b.value), b]));
          const sMap = new Map(newSuppliers.map(s => [Number(s.value), s]));

          reset({
            nroParte:               d.nroParte    ?? '',
            desRepuesto:            d.desRepuesto ?? '',
            codPrv:                 sMap.get(Number(d.codPrv))       ?? null,
            codAplicacion:          bMap.get(Number(d.codAplicacion)) ?? null,
            codMarca:               bMap.get(Number(d.codMarca))      ?? null,
            tipRepuesto:            newTypes.find(o      => o.value.trim() === d.tipRepuesto?.trim()) ?? null,
            estado:                 newStatus.find(o     => o.value.trim() === d.estado?.trim())      ?? null,
            uniMed:                 newUnits.find(o      => o.value.trim() === d.uniMed?.trim())      ?? null,
            estNroParte:            newStatusCode.find(o => o.value === d.estNroParte)                ?? null,
            peso:                   d.peso   ?? '0.00',
            costo:                  d.costo  ?? '0.00',
            canMin:                 d.canMin ?? 1,
            blnPedEspecialSinFecha: !!d.blnPedEspecialSinFecha,
            blnPedidoEspecial:      !!d.blnPedidoEspecial,
            canDias:                d.canDias ?? 0,
          });
        }
      } catch (err) {
        // manejar error silenciosamente o mostrar toast
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
        ...(isEdit && { codRepuesto: id }),
        ...(!isEdit && { tempToken }),
        nroParte:               data.nroParte.trim(),
        desRepuesto:            data.desRepuesto.trim(),
        codPrv:                 data.codPrv?.value        ? parseInt(data.codPrv.value)        : null,
        codAplicacion:          data.codAplicacion?.value ? parseInt(data.codAplicacion.value) : null,
        codMarca:               data.codMarca?.value      ? parseInt(data.codMarca.value)      : null,
        tipRepuesto:            data.tipRepuesto?.value   || null,
        estado:                 data.estado?.value        ?? null,
        estNroParte:            data.estNroParte?.value   ?? 'AC',
        peso:                   Number(data.peso)         || 0,
        costo:                  Number(data.costo)        || 0,
        canMin:                 Number(data.canMin)       || 1,
        uniMed:                 data.uniMed?.value        ?? 'UNI',
        blnPedEspecialSinFecha: data.blnPedEspecialSinFecha ? true : false,
        blnPedidoEspecial:      data.blnPedidoEspecial    ? true : false,
        canDias:                data.blnPedidoEspecial ? (Number(data.canDias) || null) : null,
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
        title: isEdit ? 'Repuesto actualizado correctamente' : 'Repuesto registrado correctamente',
      }).then(() => router.push('/admin/register/spares'));

    } catch (err) {
      const resData = err?.response?.data ?? {};
      let msg = '';
      if (resData.errors && typeof resData.errors === 'object') {
        msg = Object.values(resData.errors).flat().join('\n');
      } else {
        msg = resData.message ?? err?.message ?? 'Error al guardar';
      }
      Swal.fire({
        title:              t.warning           ?? 'Advertencia',
        text:               msg,
        icon:               'warning',
        confirmButtonColor: '#dc2626',
        confirmButtonText:  t.close             ?? 'Cerrar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helper error inline ───────────────────────────────────────────────────
  const FieldError = ({ name }) =>
    errors[name]
      ? <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors[name].message}
        </span>
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* CSS vars react-select dark mode + overrides de input */}
      <style>{`
        :root { --select-bg: #fff; --select-border: #e0e6ed; }
        .dark  { --select-bg: #1b2e4b; --select-border: #17263c; }

        /* Inputs y textareas: radio consistente con los select */
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
        .form-input.input-error {
          border-color: #f87171 !important;
        }

        /* Checkbox: más moderno */
        .form-checkbox {
          width: 17px !important;
          height: 17px !important;
          border-radius: 5px !important;
          border-color: #d1d5db !important;
          cursor: pointer;
          transition: all .15s;
        }
        .form-checkbox:checked {
          background-color: #4361ee !important;
          border-color: #4361ee !important;
        }
        .form-checkbox:focus {
          box-shadow: 0 0 0 3px rgba(67,97,238,0.18) !important;
        }

        /* Bloqueo visual del form mientras se guarda */
        .form-saving {
          pointer-events: none;
          opacity: 0.65;
        }
      `}</style>

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-500">
          <button
            type="button"
            className="hover:text-primary transition"
            onClick={() => router.push('/admin/register/spares')}
          >
            Repuestos
          </button>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          {isEdit ? 'Editar' : 'Nuevo'}
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
          onClick={() => router.push('/admin/register/spares')}
          className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300
            dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition"
        >
          <IconArrowBackward className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* ── Formulario ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Panel: fondo blanco, borde sutil, sombra suave */}
        <div className={`
          bg-white dark:bg-[#0e1726]
          border border-gray-200 dark:border-gray-700
          rounded-xl shadow-sm
          p-6
          ${isSaving ? 'form-saving' : ''}
        `}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">

            {/* ── FILA 1 ──────────────────────────────────────────────────── */}

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
                {...register('nroParte', {
                  required:  'Campo requerido',
                  maxLength: { value: 25, message: 'Máximo 25 caracteres' },
                })}
                className={`form-input w-full ${errors.nroParte ? 'input-error' : ''}`}
              />
              <FieldError name="nroParte" />
            </div>

            {/* 2. Aplicación */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.application ?? 'Aplicación'} <span className="text-red-500">*</span>
              </label>
              <SelectBrand
                t={t}
                name="codAplicacion"
                control={control}
                errors={errors}
                setValue={setValue}
                brands={brands}
                current={isEdit ? watch('codAplicacion') : null}
                required="Seleccione una aplicación"
                placeholder="Buscar aplicación..."
                tabIndex={2}
                instanceId="select-aplicacion"
                onBrandAdded={({ marcas }) => setBrands(marcas)}
              />
              <FieldError name="codAplicacion" />
            </div>

            {/* 3. Peso */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.weight ?? 'Peso (lb)'}
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

            {/* ── FILA 2 ──────────────────────────────────────────────────── */}

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

            {/* 5. Tipo de Repuesto */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.spare_part_type ?? 'Tipo de Repuesto'} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tipRepuesto"
                control={control}
                rules={{ required: 'Seleccione un tipo de repuesto' }}
                render={({ field }) => (
                  <Select
                    tabIndex={5}
                    options={types}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Tipo de repuesto"
                    isClearable
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                    error={!!errors.tipRepuesto}
                  />
                )}
              />
              <FieldError name="tipRepuesto" />
            </div>

            {/* 6. Costo */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.cost ?? 'Costo'}
              </label>
              <input
                tabIndex={6}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('costo')}
                className="form-input w-full"
              />
            </div>

            {/* ── FILA 3 ──────────────────────────────────────────────────── */}

            {/* 7. Proveedor */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.supplier ?? 'Proveedor'} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="codPrv"
                control={control}
                rules={{ required: 'Seleccione un proveedor' }}
                render={({ field }) => (
                  <AsyncSelect
                    tabIndex={7}
                    loadOptions={loadSuppliers}
                    defaultOptions={false}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Buscar proveedor..."
                    noOptionsMessage={noOptsMsg}
                    isClearable
                    cacheOptions
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                    error={!!errors.codPrv}
                  />
                )}
              />
              <FieldError name="codPrv" />
            </div>

            {/* 8. Marca */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.brand ?? 'Marca'} <span className="text-red-500">*</span>
              </label>
              <SelectBrand
                t={t}
                name="codMarca"
                control={control}
                errors={errors}
                setValue={setValue}
                brands={brands}
                current={isEdit ? watch('codMarca') : null}
                required="Seleccione una marca"
                placeholder="Buscar marca..."
                tabIndex={8}
                instanceId="select-marca"
                onBrandAdded={({ marcas }) => setBrands(marcas)}
              />
              <FieldError name="codMarca" />
            </div>

            {/* 9. Cant. Mínima + Unidad */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t.min_quantity ?? 'Cant. Mínima'}
                  </label>
                  <input
                    tabIndex={9}
                    type="number"
                    min="0"
                    placeholder="1"
                    {...register('canMin')}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t.unit ?? 'Unidad'} <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="uniMed"
                    control={control}
                    rules={{ required: 'Requerido' }}
                    render={({ field }) => (
                      <Select
                        tabIndex={10}
                        options={units}
                        value={field.value}
                        onChange={(s) => field.onChange(s ?? null)}
                        placeholder={t.unit}
                        classNamePrefix="select"
                        styles={selectStyles}
                        className="w-full"
                        error={!!errors.uniMed}
                      />
                    )}
                  />
                  <FieldError name="uniMed" />
                </div>
              </div>
            </div>

            {/* ── FILA 4 ──────────────────────────────────────────────────── */}

            {/* 10. Estado */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.status ?? 'Estado'} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="estado"
                control={control}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <Select
                    tabIndex={11}
                    options={status}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Seleccionar..."
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                    error={!!errors.estado}
                  />
                )}
              />
              <FieldError name="estado" />
            </div>

            {/* 11. Estado Código */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.status_code ?? 'Estado Código'}
              </label>
              <Controller
                name="estNroParte"
                control={control}
                render={({ field }) => (
                  <Select
                    tabIndex={12}
                    options={status_code}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Seleccionar..."
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* col 3 vacía — fila 4 */}
            <div />

            {/* ── FILA 5 — Pedido Especial ────────────────────────────────── */}

            {/* 12. Pedido especial sin fecha */}
            <div>
              <label className="block text-sm font-medium mb-1.5 invisible select-none">
                &nbsp;
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none h-[42px]">
                <input
                  tabIndex={13}
                  type="checkbox"
                  {...register('blnPedEspecialSinFecha')}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium">
                  {t.order_special_without_date ?? 'Pedido especial sin Fecha'}
                </span>
              </label>
            </div>

            {/* 13. Pedido especial + días */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t.special_order ?? 'Pedido especial'}
              </label>
              <div className="flex">
                <div className="flex items-center px-3
                  bg-white dark:bg-[#1b2e4b]
                  border border-r-0 border-white-light dark:border-[#17263c]
                  rounded-l-lg">
                  <input
                    tabIndex={14}
                    type="checkbox"
                    {...register('blnPedidoEspecial')}
                    className="form-checkbox"
                  />
                </div>
                <input
                  tabIndex={15}
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={0}
                  placeholder="0"
                  disabled={!watchPedido}
                  {...register('canDias')}
                  className="form-input ltr:rounded-l-none rtl:rounded-r-none flex-1
                    disabled:pointer-events-none disabled:bg-[#f3f4f6] disabled:opacity-60
                    dark:disabled:bg-[#1b2e4b] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* col 3 vacía — fila 5 */}
            <div />

          </div>{/* fin grid */}
        </div>{/* fin panel */}

        {/* ── Archivos: imágenes y documentos ───────────────────────────────── */}
        <div className="mt-5">
          <SpareFiles
            mode={isEdit ? 'edit' : 'new'}
            codRepuesto={isEdit ? id : null}
            tempToken={!isEdit ? tempToken : null}
          />
        </div>

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 mt-5">

          {/* Botón Cancelar */}
          <button
            type="button"
            tabIndex={18}
            disabled={isSaving}
            onClick={() => router.push('/admin/register/spares')}
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

          {/* Botón Guardar/Actualizar */}
          <button
            type="submit"
            tabIndex={19}
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