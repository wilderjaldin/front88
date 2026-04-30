'use client';
// components/forms/add-brand-customer-form.js
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';

// POST /api/clientes/{id}/marcas/agregar
// Body:    { codMarca: int }
// Returns: MarcaClienteListadoDto[] → [{ codRegistro, codMarca, nomMarca, codEstado }]
const URL_AGR_MARCA = (codCliente) => `/clientes/${codCliente}/marcas/agregar`;

// Sin texto → muestra todo (el valor seleccionado queda visible)
// 1 carácter → oculta (espera el 2do)
// 2+ caracteres → filtra normalmente
const filterFromSecondChar = (option, inputValue) => {
  if (!inputValue) return true;
  if (inputValue.length < 2) return false;
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
};

// Props:
//   marcasCliente → MarcaClienteListadoDto[] ya asignadas (validación local duplicado)
//   marcas        → [{ value, label }] todas las marcas — viene de attachments.marcas
//                   (cargadas en /anexos, NO se hace otro GET aquí)
//   cliente       → { codCliente }
//   onCancel      → cierra el modal
//   onSaved       → (nuevaLista: MarcaClienteListadoDto[]) actualiza el padre
const AddBrandCustomerForm = ({ marcasCliente = [], marcas = [], cliente, onCancel, onSaved }) => {
  const t = useTranslation();

  const {
    control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { brand: null } });

  const onSubmit = async (data) => {
    const selected = data.brand;

    // Validación local duplicado
    const exists = marcasCliente.some(m => m.codMarca === selected.value);
    if (exists) {
      Swal.fire({ title: t.warning, text: t.brand_exist_error, icon: 'warning',
        confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }

    try {
      const res = await axiosClient.post(URL_AGR_MARCA(cliente.codCliente), {
        codMarca: selected.value,
      });

      Swal.fire({ title: t.success, icon: 'success', confirmButtonColor: '#15803d',
        text: t.brand_add_save, confirmButtonText: t.close,
      }).then(() => onSaved?.(res.data ?? []));

    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message ?? err?.response?.data?.mensaje;
      if (status === 400 && msg) {
        Swal.fire({ title: t.warning, text: msg, icon: 'warning',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      } else {
        Swal.fire({ title: t.error, text: t.brand_save_error_server, icon: 'error',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.brand}<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className={errors.brand ? 'react-select-error' : ''}>
          <Controller
            name="brand"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                options={marcas}
                isSearchable isClearable
                placeholder="Escribe al menos 2 caracteres..."
                instanceId="brand-form-select"
                menuPosition="fixed"
                classNamePrefix="select"
                menuShouldScrollIntoView={false}
                filterOption={filterFromSecondChar}
                noOptionsMessage={({ inputValue }) =>
                  !inputValue || inputValue.length < 2
                    ? 'Escribe al menos 2 caracteres para buscar'
                    : 'Sin resultados'
                }
              />
            )}
          />
        </div>
        {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
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
          ) : t.btn_save}
        </button>
      </div>
    </div>
  );
};

export default AddBrandCustomerForm;