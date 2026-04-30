// components/select-trading.js
import React, { useState } from 'react';
import ConditionForm from '@/components/forms/condition-form';
import Select from 'react-select';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import { Controller } from 'react-hook-form';

// Props:
//   t             → traducciones
//   control       → react-hook-form control
//   errors        → react-hook-form errors
//   options       → [{ value, label }] condiciones de pago (viene del padre)
//   setConditions → actualiza la lista de condiciones en el padre tras agregar una nueva
//   show_add      → mostrar o no el botón [+] (default: true)
const SelectTrading = ({
  t,
  control,
  errors    = {},
  options   = [],
  setConditions,
  show_add  = true,
  setValue,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div>
        <div className={`flex items-stretch gap-0 ${errors.condition ? 'react-select-error' : ''}`}>
          <Controller
            name="condition"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                isClearable
                options={options}
                placeholder={t.select_option}
                className="w-full"
                instanceId="condition-select"
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
              onClick={() => setShowModal(true)}
              title={t.add_terms_of_payment}
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

        {errors.condition && (
          <span className="block text-red-400 text-xs mt-1" role="alert">
            {errors.condition?.message?.toString()}
          </span>
        )}
      </div>

      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={t.add_terms_of_payment}
      >
        <ConditionForm
          onCancel={() => setShowModal(false)}
          onSaved={({ newCondicion, condicionOptions }) => {
            setShowModal(false);
            // Actualiza la lista en el padre
            setConditions(condicionOptions);
            // Autoselecciona la condición recién creada
            setValue?.('condition', newCondicion, { shouldValidate: false });
          }}
        />
      </Modal>
    </>
  );
};

export default SelectTrading;