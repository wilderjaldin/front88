import React, { useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { useOptionsSelect } from '@/app/options'
import Modal from '@/components/modal';
import ConditionForm from '@/components/forms/condition-form';
import { Controller } from 'react-hook-form';

const SelectTrading = ({ t, token, show_add = true, control, errors, options, setConditions }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const currencies_options = useOptionsSelect("currencies");


  const addCurrency = () => {
    setModalTitle(t.add_terms_of_payment)
    setModalContent(<ConditionForm setConditions={setConditions} action_cancel={() => setShowModal(false)} token={token}></ConditionForm>);
    setShowModal(true);
  }

  return (

    <>
      <div className={`flex ${errors.condition ? "react-select-error" : ""}`}>

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
              value={options.find((c) => c.value === field.value) || null}
              onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}

            />
          )}
        />

        {(show_add) &&
          <button
            type="button"
            onClick={addCurrency}
            className="btn bg-gray-400 shadow-none flex items-center ltr:rounded-l-none rtl:rounded-r-none"
          > <IconPlusProps className="h-5 w-5 " />
          </button>
        }
      </div>
      
        {errors.condition && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.condition?.message?.toString()}</span>}
      <Modal size='w-full max-w-2xl' closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}

export default SelectTrading;