import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { Controller } from 'react-hook-form';
import Modal from '@/components/modal';
import CityForm from '@/components/forms/city-form';

const SelectCity = ({ t, current = '', show_add = true, className = '', onChange, control, errors, cities = [], setValue, options_countries }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);


  useEffect(() => {
    console.log('cities', cities)
    if (!cities.length || !current) return;
    console.log('current city', current)
    const selected = cities.find(c => c.value == current.toString().toUpperCase().trim());
    console.log('selected', selected)
    if (selected) {
      setValue("city", selected);
    }
  }, [cities, current, setValue]);


  const addCity = () => {
    setModalTitle(t.add_city)
    setModalContent(<CityForm countries={options_countries} action_cancel={() => setShowModal(false)}></CityForm>);
    setShowModal(true);
  }



  return (

    <>
      <div className={errors.city ? "react-select-error" : ""}>
        <div className='flex flex-1'>
          <Controller
            name="city"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <Select
                {...field}
                options={cities}
                placeholder={t.select_option}
                className={`${className} w-full`}
                instanceId="select-city"
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
          {(show_add) &&
            <button onClick={() => addCity()} type="button" className="btn bg-gray-400 shadow-none ltr:rounded-l-none rtl:rounded-r-none">
              <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" /> {t.btn_add}
            </button>
          }
        </div>
      </div>
      <div className='block'>
        {errors.city && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.city?.message?.toString()}</span>}
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}

export default SelectCity;