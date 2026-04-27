'use client';
// components/forms/add-equipment-customer-form.js
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';

// POST /api/clientes/{id}/equipos/guardar
// Body (MarcaEquipoClienteSaveDto):
//   { codRegistro, codMarca, nomMarca, modelo, anio, serie,
//     codMarcaMotor, nomMarcaMotor, modeloMotor, serieMotor }
// codRegistro=0 → nuevo, >0 → editar
// Returns: MarcaEquipoClienteListadoDto[]
//   → [{ codRegistro, codMarca, nomMarca, modelo, anio, serie,
//         codMarcaMotor, nomMarcaMotor, modeloMotor, serieMotor, codEstado }]
const URL_GUARDAR = (codCliente) => `/clientes/${codCliente}/equipos/guardar`;

// AsyncSelect: NO carga miles de opciones en el DOM.
// Solo busca cuando el usuario escribe 2+ caracteres.
// El filtrado se hace sobre marcas[] en memoria — sin llamadas a la API.
const makeBrandLoader = (marcas) => (inputValue, callback) => {
  if (!inputValue || inputValue.length < 2) { callback([]); return; }
  const q = inputValue.toLowerCase();
  callback(marcas.filter(m => m.label.toLowerCase().includes(q)));
};

// Subcomponente reutilizable para ambos selects de marca
const BrandSelect = ({ name, control, errors, marcas, t, instanceId }) => {
  const loadOptions = React.useMemo(() => makeBrandLoader(marcas), [marcas]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t.brand}<span className="text-red-500 ml-0.5">*</span>
      </label>
      <div className={errors[name] ? 'react-select-error' : ''}>
        <Controller
          name={name}
          control={control}
          rules={{ required: { value: true, message: t.required_select } }}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              loadOptions={loadOptions}
              defaultOptions={false}
              isClearable
              cacheOptions
              placeholder="Escribe al menos 2 caracteres..."
              instanceId={instanceId}
              menuPosition="fixed"
              classNamePrefix="select"
              menuShouldScrollIntoView={false}
              noOptionsMessage={({ inputValue }) =>
                !inputValue || inputValue.length < 2
                  ? 'Escribe al menos 2 caracteres para buscar'
                  : 'Sin resultados'
              }
            />
          )}
        />
      </div>
      {errors[name] && <p className="text-red-400 text-xs">{errors[name].message}</p>}
    </div>
  );
};

// Props:
//   equipment → MarcaEquipoClienteListadoDto | null  (null = nuevo)
//   marcas    → [{ value, label }] todas las marcas — viene de attachments.marcas
//   cliente   → { codCliente }
//   onCancel  → cierra el modal
//   onSaved   → (nuevaLista: MarcaEquipoClienteListadoDto[]) actualiza el padre
const AddEquipmentCustomerForm = ({ equipment = null, marcas = [], cliente, onCancel, onSaved }) => {
  const t = useTranslation();
  const isEdit = !!equipment?.codRegistro;

  // En edición: construir { value, label } directamente desde el DTO.
  // nomMarca/nomMarcaMotor ya vienen en el objeto — no hay que buscar en la lista.
  // Esto evita el useEffect+reset y el find sobre miles de registros.
  const brandObj       = isEdit && equipment.codMarca
    ? { value: equipment.codMarca,      label: equipment.nomMarca      ?? '' }
    : null;
  const engineBrandObj = isEdit && equipment.codMarcaMotor
    ? { value: equipment.codMarcaMotor, label: equipment.nomMarcaMotor ?? '' }
    : null;

  const {
    register, control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      brand:       brandObj,
      modelo:      equipment?.modelo        ?? '',
      anio:        equipment?.anio          ?? '',
      serie:       equipment?.serie         ?? '',
      engineBrand: engineBrandObj,
      modeloMotor: equipment?.modeloMotor   ?? '',
      serieMotor:  equipment?.serieMotor    ?? '',
    },
  });

  const onSubmit = async (data) => {
    try {
      // MarcaEquipoClienteSaveDto — el backend normaliza a uppercase
      const payload = {
        codRegistro:   equipment?.codRegistro ?? 0,
        codMarca:      data.brand?.value       ?? null,
        nomMarca:      data.brand?.label       ?? null,
        modelo:        data.modelo?.trim()     || null,
        anio:          data.anio?.trim()       || null,
        serie:         data.serie?.trim()      || null,
        codMarcaMotor: data.engineBrand?.value ?? null,
        nomMarcaMotor: data.engineBrand?.label ?? null,
        modeloMotor:   data.modeloMotor?.trim()|| null,
        serieMotor:    data.serieMotor?.trim() || null,
      };

      const res = await axiosClient.post(URL_GUARDAR(cliente.codCliente), payload);

      Swal.fire({ title: t.success, icon: 'success', confirmButtonColor: '#15803d',
        text: isEdit ? t.record_updated : t.equipment_add_save,
        confirmButtonText: t.close,
      }).then(() => onSaved?.(res.data ?? []));

    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.mensaje;
      Swal.fire({ title: t.error, text: msg ?? t.brand_error_delete_server, icon: 'error',
        confirmButtonColor: '#dc2626', confirmButtonText: t.close });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* ── Datos del Equipo ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="h-3 w-1 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              {t.equipment_data}
            </h3>
          </div>

          <BrandSelect name="brand" control={control} errors={errors}
            marcas={marcas} t={t} instanceId="equip-brand-select" />

          {/* Modelo equipo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.model}<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input type="text" autoComplete="off"
              placeholder={t.enter_equipment_model ?? 'Ej: 320D'}
              {...register('modelo', { required: { value: true, message: t.required_field } })}
              className={`form-input w-full ${errors.modelo ? 'error' : ''}`}
            />
            {errors.modelo && <p className="text-red-400 text-xs mt-1">{errors.modelo.message}</p>}
          </div>

          {/* Año */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.year}
            </label>
            <input type="text" autoComplete="off" placeholder="Ej: 2018"
              {...register('anio', {
                pattern: { value: /^\d{4}$/, message: 'Año inválido (ej: 2018)' },
              })}
              className={`form-input w-full ${errors.anio ? 'error' : ''}`}
            />
            {errors.anio && <p className="text-red-400 text-xs mt-1">{errors.anio.message}</p>}
          </div>

          {/* Serie equipo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.serie}
            </label>
            <input type="text" autoComplete="off"
              placeholder={t.enter_equipment_serie ?? 'Nro. de serie'}
              {...register('serie')}
              className="form-input w-full"
            />
          </div>
        </div>

        {/* ── Datos del Motor ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="h-3 w-1 rounded-full bg-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              {t.engine_data}
            </h3>
          </div>

          <BrandSelect name="engineBrand" control={control} errors={errors}
            marcas={marcas} t={t} instanceId="engine-brand-select" />

          {/* Modelo motor */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.model}<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input type="text" autoComplete="off"
              placeholder={t.enter_engine_model ?? 'Ej: C9'}
              {...register('modeloMotor', { required: { value: true, message: t.required_field } })}
              className={`form-input w-full ${errors.modeloMotor ? 'error' : ''}`}
            />
            {errors.modeloMotor && <p className="text-red-400 text-xs mt-1">{errors.modeloMotor.message}</p>}
          </div>

          {/* Serie motor */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.serie}
            </label>
            <input type="text" autoComplete="off"
              placeholder={t.enter_engine_serie ?? 'Nro. de serie motor'}
              {...register('serieMotor')}
              className="form-input w-full"
            />
          </div>
        </div>

      </div>

      {/* ── Botones ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed">
          {t.btn_cancel}
        </button>
        <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]">
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

export default AddEquipmentCustomerForm;