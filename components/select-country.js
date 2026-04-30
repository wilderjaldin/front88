// components/select-country.js
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import CountryForm from '@/components/forms/country-form';
import { Controller } from 'react-hook-form';

// Props:
//   options       → [{ value, label }] — lista de países (viene del padre, cargada desde API)
//   control       → react-hook-form control
//   errors        → react-hook-form errors
//   setValue      → react-hook-form setValue
//   onChange      → callback adicional al cambiar (ej: para cargar ciudades)
//   current       → codPais para preseleccionar al editar (ej: 'BO')
//   isLoading     → muestra spinner mientras el padre carga los países
//   show_add      → mostrar o no el botón [+] (default: true)
//   instanceId    → para múltiples selects en la misma página
//   t             → traducciones
//   onCountryAdded → callback para refrescar la lista de países tras agregar uno nuevo
const SelectCountry = ({
  t,
  options      = [],
  control,
  errors       = {},
  setValue,
  onChange,
  current      = '',
  isLoading    = false,
  show_add     = true,
  instanceId   = 'select-country',
  className    = '',
  onCountryAdded,
}) => {
  const [showModal,  setShowModal]  = useState(false);

  // Preseleccionar cuando llegan las opciones (edición)
  useEffect(() => {
    if (!options.length || !current) return;

    const selected = options.find(
      c => c.value?.toUpperCase() === current.toString().toUpperCase()
    );

    if (selected) {
      setValue('country', selected, { shouldValidate: false });
    }
  }, [options, current]);

  const handleAdd = () => {
    setShowModal(true);
  };

  const handleCountrySaved = ({ newCountry, paises }) => {
    setShowModal(false);
    // Notifica al padre con la lista de países actualizada que devolvió la API.
    // El padre simplemente hace setPaises(paises) para refrescar el select.
    onCountryAdded?.({ newCountry, paises });
  };

  return (
    <>
      <div>
        <div className={`flex items-stretch gap-0 ${errors.country ? 'react-select-error' : ''}`}>
          <Controller
            name="country"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                options={options}
                isLoading={isLoading}
                placeholder={isLoading ? 'Cargando...' : t.select_option}
                className={`w-full ${className}`}
                instanceId={instanceId}
                menuPosition="fixed"
                classNamePrefix="select"
                menuShouldScrollIntoView={false}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  onChange?.(val);
                }}
              />
            )}
          />
          {show_add && (
            <button
              type="button"
              onClick={handleAdd}
              title={t.add_country}
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
        {errors.country && (
          <span className="block text-red-400 text-xs mt-1" role="alert">
            {errors.country?.message?.toString()}
          </span>
        )}
      </div>

      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={t.add_country}
      >
        <CountryForm
          existingCountries={options}
          onCancel={() => setShowModal(false)}
          onSaved={handleCountrySaved}
        />
      </Modal>
    </>
  );
};

export default SelectCountry;