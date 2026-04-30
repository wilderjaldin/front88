// components/select-city.js
import React, { useState } from 'react';
import Select from 'react-select';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import CityForm from '@/components/forms/city-form';
import { Controller } from 'react-hook-form';

// SelectCity es un componente de presentación puro.
// La preselección al editar la maneja el padre directamente
// con setValue('city', ...) tras cargar las ciudades.
//
// Props:
//   cities          → [{ value, label }] lista de ciudades del país seleccionado
//   control         → react-hook-form control
//   errors          → react-hook-form errors
//   isLoading       → spinner mientras el padre carga ciudades
//   show_add        → mostrar o no el botón [+]
//   instanceId      → para múltiples selects en la misma página
//   selectedCountry → { value, label } país actualmente seleccionado en el form padre
//                     se pasa a CityForm para mostrarlo fijo (sin selector de país)
//   onCityAdded     → ({ newCity, ciudades }) callback para que el padre actualice
//                     su lista de ciudades tras agregar una nueva
const SelectCity = ({
  t,
  cities            = [],
  control,
  errors            = {},
  isLoading         = false,
  show_add          = true,
  instanceId        = 'select-city',
  className         = '',
  selectedCountry   = null,
  onCityAdded,
  setValue,
}) => {
  const [showModal, setShowModal] = useState(false);
console.log('selectedCountry', selectedCountry)
  const isDisabled  = !isLoading && cities.length === 0;
  const placeholder = isLoading
    ? 'Cargando...'
    : isDisabled
      ? 'Selecciona un país primero'
      : t.select_option;

  const handleAdd = () => setShowModal(true);

  const handleCitySaved = ({ newCity, ciudades }) => {
    setShowModal(false);
    // Notifica al padre para que actualice su estado de ciudades
    onCityAdded?.({ newCity, ciudades });
    // Autoselecciona la ciudad recién creada en el select
    setValue?.('city', newCity, { shouldValidate: false });
  };

  return (
    <>
      <div>
        <div className={`flex items-stretch gap-0 ${errors.city ? 'react-select-error' : ''}`}>
          <Controller
            name="city"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                options={cities}
                isLoading={isLoading}
                isDisabled={isDisabled}
                placeholder={placeholder}
                className={`w-full ${className}`}
                instanceId={instanceId}
                menuPosition="fixed"
                classNamePrefix="select"
                menuShouldScrollIntoView={false}
                value={field.value}
                onChange={(val) => field.onChange(val)}
              />
            )}
          />
          {show_add && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isDisabled}
              title={t.add_city}
              className="flex items-center justify-center px-3 border border-l-0 border-gray-300
                         dark:border-gray-600 rounded-r-lg bg-gray-100 dark:bg-gray-800
                         text-gray-500 dark:text-gray-400 hover:bg-primary hover:border-primary
                         hover:text-white dark:hover:bg-primary dark:hover:border-primary
                         dark:hover:text-white transition-all duration-150 shrink-0 group
                         disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:bg-gray-100 disabled:hover:border-gray-300
                         disabled:hover:text-gray-400 dark:disabled:hover:bg-gray-800"
            >
              <IconPlus className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90 group-disabled:rotate-0" />
            </button>
          )}
        </div>
        {errors.city && (
          <span className="block text-red-400 text-xs mt-1" role="alert">
            {errors.city?.message?.toString()}
          </span>
        )}
      </div>

      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={t.add_city}
      >
        <CityForm
          pais={selectedCountry}
          onCancel={() => setShowModal(false)}
          onSaved={handleCitySaved}
        />
      </Modal>
    </>
  );
};

export default SelectCity;