import React, { useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { useOptionsSelect } from '@/app/options'
import Modal from '@/components/modal';
import CurrencyForm from '@/components/forms/currency-form';
import { Controller } from 'react-hook-form';

const SelectCurrency = ({ t, token, current_currency = null, show_add = true, className = '', onChange, register, errors, control }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const currencies_options = useOptionsSelect("currencies");


  const addCurrency = () => {
    setModalTitle(t.add_currency)
    setModalContent(<CurrencyForm token={token} action_cancel={() => setShowModal(false)}></CurrencyForm>);
    setShowModal(true);
  }

  return (

    <>
      <div className='flex flex-1'>
        <Controller
          name={'commercial_currency'}
          control={control}
          rules={{ required: { value: true, message: t.required_field } }}
          render={({ field }) => (
            <Select
              {...field}
              isClearable
              isSearchable
              placeholder={t.select_option}
              menuPosition="fixed"
              menuShouldScrollIntoView={false}
              className={`${className} w-full`}
              options={currencies_options}
              value={currencies_options.find(option => option.value === field.value) || null}
              onChange={(selectedOption) => {
                field.onChange(selectedOption?.value ?? null);
              }}
            />
          )}
        />
        {(show_add) &&
          <button onClick={() => addCurrency()} type="button" className="btn bg-gray-400 shadow-none ltr:rounded-l-none rtl:rounded-r-none">
            <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" /> {t.btn_add}
          </button>
        }
      </div>
      <div className='block'>
        {errors.commercial_currency && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.commercial_currency?.message?.toString()}</span>}
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}

export default SelectCurrency;