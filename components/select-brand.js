// components/select-brand.js
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import { Controller } from 'react-hook-form';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';

// ─── Endpoint ────────────────────────────────────────────────────────────────
const URL_BRANDS     = 'marcas/listado';   // GET → [{ value, label }]
const URL_BRAND_SAVE = 'marcas/registrar'; // POST { nomMarca } → { marca: { value, label }, marcas: [...] }
const URL_BRAND_UPD  = 'marcas/editar';   // PUT  { codMarca, nomMarca } → igual

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

// ─── BrandForm (interna — sigue patrón CONTEXT.md) ───────────────────────────
function BrandForm({ t, brand = null, onCancel, onSaved }) {
  const [nomMarca, setNomMarca]   = useState(brand?.label ?? '');
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);

  const isEdit = !!brand?.value;

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // evita que el submit burbujee al form padre (repuestos)
    const trimmed = nomMarca.trim().toUpperCase();

    if (!trimmed) {
      setError(t.required_field);
      return;
    }
    if (trimmed.length > 50) {
      setError(t.max_50_characters);
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await axiosClient.put(URL_BRAND_UPD, {
          codMarca: brand.value,
          nomMarca: trimmed,
        });
      } else {
        res = await axiosClient.post(URL_BRAND_SAVE, { nomMarca: trimmed });
      }

      const Toast = Swal.mixin({
        toast: true, position: 'top-end',
        showConfirmButton: false, timer: 3000, timerProgressBar: true,
      });
      Toast.fire({ icon: 'success', title: t.brand_save_success });

      // La API devuelve { marca: { value, label }, marcas: [...] }
      onSaved?.({ newBrand: res.data?.marca, marcas: res.data?.marcas ?? [] });
    } catch (err) {
      const data = err?.response?.data ?? {};
      if (data.errors && typeof data.errors === 'object') {
        const msgs = Object.values(data.errors).flat().join('\n');
        Swal.fire({ title: t.warning, text: msgs, icon: 'warning', confirmButtonText: t.accept });
      } else {
        const msg = data.message ?? data.mensaje ?? t.brand_save_error_server;
        Swal.fire({ title: t.error, text: msg, icon: 'error', confirmButtonText: t.accept });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.brand}<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          autoFocus
          value={nomMarca}
          onChange={(e) => { setNomMarca(e.target.value); setError(''); }}
          className={`form-input w-full mt-1 ${error ? 'error' : ''}`}
          placeholder={t.add_brand ?? 'Nombre de la marca'}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.btn_cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
        >
          {loading
            ? <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving ?? 'Guardando...'}
              </span>
            : t.btn_save}
        </button>
      </div>
    </form>
  );
}

// ─── SelectBrand ─────────────────────────────────────────────────────────────
/**
 * Props
 * ─────
 * t              → objeto de traducciones (useTranslation)
 * control        → react-hook-form control
 * errors         → react-hook-form errors
 * setValue       → react-hook-form setValue
 * name           → nombre del campo en el form  (default: 'codMarca')
 * required       → mensaje de validación        (default: t.required_select)
 * placeholder    → texto del placeholder
 * current        → { value, label } para preseleccionar al editar
 * brands         → [{ value, label }] lista precargada (opcional — si se omite,
 *                  el componente la carga desde la API con cada keystroke)
 * onBrandAdded   → callback({ newBrand, marcas }) — el padre puede actualizar
 *                  su propio estado de marcas si lo necesita
 * tabIndex       → tabIndex del AsyncSelect
 * show_add       → mostrar o no el botón [+]  (default: true)
 * instanceId     → para múltiples selects en la misma página
 * className      → clase extra para el contenedor AsyncSelect
 * isDisabled     → deshabilitar el select
 */
const SelectBrand = ({
  t,
  control,
  errors        = {},
  setValue,
  name          = 'codMarca',
  required      = true,
  placeholder,
  current       = null,   // { value, label } | null
  brands        = [],     // lista precargada desde el padre
  onBrandAdded,
  tabIndex,
  show_add      = true,
  instanceId    = 'select-brand',
  className     = '',
  isDisabled    = false,
}) => {

  const [showModal,   setShowModal]   = useState(false);
  const [editBrand,   setEditBrand]   = useState(null);   // null → nuevo
  // Lista interna — se sincroniza con la prop brands del padre
  const [localBrands, setLocalBrands] = useState(brands);

  // Sincronizar cuando el padre actualiza brands (ej: tras init del form)
  useEffect(() => { setLocalBrands(brands); }, [brands]);

  // Preseleccionar al editar (si el padre pasa current).
  // Se compara por current.value (primitivo) para no disparar el efecto
  // en cada render cuando el padre recrea el objeto { value, label }.
  const currentValue = current?.value ?? null;
  useEffect(() => {
    if (!current) return;
    setValue(name, current, { shouldValidate: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  // ── Carga desde API si no hay lista precargada ──────────────────────────
  const loadOptions = useCallback(
    async (inputValue) => {
      const term = inputValue?.trim() ?? '';
      if (term.length < ASYNC_MIN) return [];

      // Si hay lista precargada, filtrar localmente (más rápido, sin red)
      if (localBrands.length > 0) {
        const q = term.toLowerCase();
        return localBrands
          .filter(b => b.label.toLowerCase().includes(q))
          .slice(0, ASYNC_MAX);
      }

      // Sin lista precargada → llamar a la API
      try {
        const res = await axiosClient.get(URL_BRANDS, { params: { term, limit: ASYNC_MAX } });
        return res.data ?? [];
      } catch {
        return [];
      }
    },
    [localBrands],
  );

  const noOptionsMessage = ({ inputValue }) =>
    (inputValue?.trim().length ?? 0) < ASYNC_MIN
      ? `Ingresa ${ASYNC_MIN} caracteres para buscar`
      : t.empty_results ?? 'Sin resultados';

  // ── Estilos react-select (igual que page.js) ────────────────────────────
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--select-bg, white)',
      borderColor: state.isFocused ? '#4361ee' : 'var(--select-border, #e0e6ed)',
      boxShadow: 'none',
      borderTopRightRadius: show_add ? 0 : base.borderTopRightRadius,
      borderBottomRightRadius: show_add ? 0 : base.borderBottomRightRadius,
      '&:hover': { borderColor: '#4361ee' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--select-bg, white)',
      border: '1px solid var(--select-border, #e0e6ed)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? '#eaf1ff' : 'transparent',
      color: state.isSelected ? 'white' : 'inherit',
      cursor: 'pointer',
    }),
    singleValue:         (base) => ({ ...base, color: 'inherit' }),
    input:               (base) => ({ ...base, color: 'inherit' }),
    placeholder:         (base) => ({ ...base, color: '#888' }),
    clearIndicator:      (base) => ({ ...base, color: '#888', '&:hover': { color: '#e7515a' } }),
    dropdownIndicator:   (base) => ({ ...base, color: '#888' }),
    indicatorSeparator:  (base) => ({ ...base, backgroundColor: 'var(--select-border, #e0e6ed)' }),
  };

  // ── Tras guardar una marca nueva ────────────────────────────────────────
  const handleBrandSaved = ({ newBrand, marcas }) => {
    setShowModal(false);
    setEditBrand(null);

    // 1. Actualizar lista interna del componente
    if (marcas?.length) setLocalBrands(marcas);

    // 2. Autoseleccionar la marca recien creada en el campo del form
    if (newBrand) {
      setValue(name, newBrand, { shouldValidate: true });
    }


    // Notificar al padre para que actualice su estado si lo necesita
    onBrandAdded?.({ newBrand, marcas });
  };

  return (
    <>
      <div>
        <div className={`flex items-stretch ${errors[name] ? 'react-select-error' : ''}`}>
          <Controller
            name={name}
            control={control}
            rules={required
              ? { required: { value: true, message: typeof required === 'string' ? required : t.required_select } }
              : undefined
            }
            render={({ field }) => (
              <AsyncSelect
                {...field}
                tabIndex={tabIndex}
                loadOptions={loadOptions}
                defaultOptions={false}
                cacheOptions
                isClearable
                isDisabled={isDisabled}
                placeholder={placeholder ?? (localBrands.length
                  ? `Buscar marca (mín. ${ASYNC_MIN} caracteres)...`
                  : 'Buscar marca...'
                )}
                noOptionsMessage={noOptionsMessage}
                instanceId={instanceId}
                classNamePrefix="select"
                className={`flex-1 ${className}`}
                styles={selectStyles}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                value={field.value}
                onChange={(val) => field.onChange(val ?? null)}
              />
            )}
          />

          {show_add && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setEditBrand(null); setShowModal(true); }}
              title={t.add_brand}
              className="flex items-center justify-center px-3 border border-l-0 border-gray-300
                         dark:border-gray-600 rounded-r-lg bg-gray-100 dark:bg-gray-800
                         text-gray-500 dark:text-gray-400 hover:bg-primary hover:border-primary
                         hover:text-white dark:hover:bg-primary dark:hover:border-primary
                         dark:hover:text-white transition-all duration-150 shrink-0 group"
            >
              <IconPlus className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
            </button>
          )}
        </div>

        {errors[name] && (
          <span className="block text-red-400 text-xs mt-1" role="alert">
            {errors[name]?.message?.toString()}
          </span>
        )}
      </div>

      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => { setShowModal(false); setEditBrand(null); }}
        title={editBrand ? t.edit_brand : t.add_brand}
      >
        <BrandForm
          t={t}
          brand={editBrand}
          onCancel={() => { setShowModal(false); setEditBrand(null); }}
          onSaved={handleBrandSaved}
        />
      </Modal>
    </>
  );
};

export default SelectBrand;