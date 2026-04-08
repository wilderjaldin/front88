import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { useOptionsSelect } from '@/app/options'
import Modal from '@/components/modal';
import CountryForm from '@/components/forms/country-form';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';

const SelectCountry = ({ t, current = '', show_add = true, className = '', onChange, register, errors, options, setValue }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);

  let cs = Object.keys(options).find((key) => options[key].value.toUpperCase() == current.toUpperCase()) || null;

  const [current_select, setCurrentSelect] = useState(cs)
  const token = useSelector(selectToken);



  useEffect(() => {
    if (!options.length || !current) return;

    const selected = options.find(
      c => c.value?.toUpperCase() === current.toUpperCase()
    );

    if (selected) {
      setValue('country', selected, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }

    let cs = Object.keys(options).find((key) => options[key].value.toUpperCase() == current.toUpperCase()) || null;
    setCurrentSelect(cs);

  }, [options, current, setValue]);

  const addCountry = () => {
    setModalTitle(t.add_country)
    setModalContent(<CountryForm countries={options} action_cancel={() => setShowModal(false)} token={token}></CountryForm>);
    setShowModal(true);
  }

  return (

    <>
      <div className={errors.country ? "react-select-error" : ""}>
        <div className='flex flex-1'>
          <Select id='select-country' 
          defaultValue={(current_select != null) ? options[current_select] : null}  {...register('country', { required: { value: true, message: t.required_select } })} 
          placeholder={t.select_option}
          className={`${className} w-full`} 
          options={options} 
          onChange={onChange}
          instanceId="select-country"
          menuPosition={'fixed'}
          classNamePrefix="select"
          menuShouldScrollIntoView={false}
          />
          {(show_add) &&
            <button onClick={() => addCountry()} type="button" className="btn bg-gray-400 shadow-none ltr:rounded-l-none rtl:rounded-r-none">
              <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" /> {t.btn_add}
            </button>
          }
        </div>
      </div>
      <div className='block'>
        {errors.country && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.country?.message?.toString()}</span>}
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}

export default SelectCountry;