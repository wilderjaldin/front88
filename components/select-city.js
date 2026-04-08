import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { useOptionsSelect } from '@/app/options'
import Modal from '@/components/modal';
import CityForm from '@/components/forms/city-form';

const SelectCity = ({ t, current = '', show_add = true, className = '', onChange, register, errors, cities = [], setValue }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [cities_options, setCitiesOptions] = useState(cities || [])
  let cs = Object.keys(cities_options).find((key) => cities_options[key].value == current) || 0;
  const [current_select, setCurrentSelect] = useState(cs)
  const options_countries = useOptionsSelect("countries");


  useEffect(() => {

    if (current) {

      let cs = Object.keys(cities_options).find((key) => cities_options[key].value === current) || 0;

      setCurrentSelect(cs);

    } else {
      setCitiesOptions(cities)
      if (cities.length) {
        setCurrentSelect(0);

        setValue('city', cities[0].value)
      } else {
        setCurrentSelect(null);

        setValue('city', null);
      }
    }
  }, [current]);

  useEffect(() => {

    if (cities.length == 0) {
      setCurrentSelect(null);
      setValue('city', null);
    } else {
      if (!current) {

        setCurrentSelect(0);
        setValue('city', cities[0].value)
      }
    }
    setCitiesOptions(cities)
  }, [cities]);

  const addCity = () => {
    setModalTitle(t.add_city)
    setModalContent(<CityForm countries={options_countries} action_cancel={() => setShowModal(false)}></CityForm>);
    setShowModal(true);
  }

  const changeCity = (select) => {
    let cs = Object.keys(cities_options).find((key) => cities_options[key].value === select.value) || 0;
    setCurrentSelect(cs)
    onChange(select);
  }

  return (

    <>
      <div className={errors.city ? "react-select-error" : ""}>
        <div className='flex flex-1'>
          <Select id='select-city' 
          value={(current_select != null) ? (cities_options[current_select]) : null}  {...register('city', { required: { value: true, message: t.required_select } })} 
          placeholder={t.select_option} 
          className={`${className} w-full`} 
          options={cities_options} 
          onChange={(e) => changeCity(e)}
          instanceId="select"
          menuPosition={'fixed'}
          classNamePrefix="select"
          menuShouldScrollIntoView={false}
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