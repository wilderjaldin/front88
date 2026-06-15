'use client';
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import Select from 'react-select';

const EquipmentForm = ({ t, brands = [], showModal, setDataEquipment }) => {

  const [select, setSelect] = useState(null);

  const { register, getValues, setValue, formState: { errors } } = useForm();

  const onChangeSelectBrand = (value) => {
    setSelect(value);
    setValue('brand', value?.value ?? null);
  };

  const next = () => {
    setDataEquipment(getValues(), select);
    showModal('engine');
  };

  const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 text-right pr-3";
  const inputClass = "h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-3">

      <div className="flex items-center gap-2">
        <label className={labelClass}>{t.brand}</label>
        <div className="flex-1">
          <Select
            instanceId="equipment-brand-select"
            menuPosition="fixed"
            menuShouldScrollIntoView={false}
            placeholder={t.select_option}
            options={brands}
            value={select}
            onChange={onChangeSelectBrand}
            filterOption={(opt, input) => input.length >= 2 && opt.label.toLowerCase().includes(input.toLowerCase())}
            noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? (t.type_to_search ?? 'Escribe al menos 2 caracteres') : (t.no_options ?? 'Sin opciones')}
            styles={{
              control: b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '14px' }),
              valueContainer: b => ({ ...b, padding: '0 8px' }),
              indicatorsContainer: b => ({ ...b, height: '36px' }),
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className={labelClass}>{t.model}</label>
        <input
          type="text"
          autoComplete="off"
          {...register("equipment_model")}
          placeholder={t.enter_equipment_model}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className={labelClass}>{t.equipment_serie}</label>
        <input
          type="text"
          autoComplete="off"
          {...register("equipment_serie")}
          placeholder={t.enter_equipment_serie}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={next}
          className="h-9 rounded-lg bg-primary px-6 text-white text-sm font-medium hover:bg-primary/90 transition shadow-sm"
        >
          {t.next ?? 'Continuar'}
        </button>
      </div>

    </div>
  );
};

export default EquipmentForm;
