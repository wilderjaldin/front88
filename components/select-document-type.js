import React, { useState } from 'react';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import { useOptionsSelect } from '@/app/options'
import Modal from '@/components/modal';
import DocumentTypeForm from '@/components/forms/document-type-form';
import { Controller } from 'react-hook-form';

const SelectDocumentType = ({ t, token, current_currency = null, show_add = true, className = '', onChange, control, errors, options, setDocTypes }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const currencies_options = useOptionsSelect("currencies");


  const addCurrency = () => {
    setModalTitle(t.add_doc_type)
    setModalContent(<DocumentTypeForm setDocTypes={setDocTypes} action_cancel={() => setShowModal(false)} token={token}></DocumentTypeForm>);
    setShowModal(true);
  }

  return (

    <>
      <div className="flex">

        <Controller
          name="doc_type"
          control={control}
          rules={{ required: false }}
          render={({ field }) => (
            <Select
              {...field}
              options={options}
              placeholder={t.select_option}
              className="w-[200px]"
              value={options.find((c) => c.value === field.value) || null}
              onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  height: '42px',
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: '42px',
                  padding: '0 8px',
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '42px',
                }),
              }}

            />
          )}
        />

        {(show_add) &&
          <button
            type="button"
            onClick={addCurrency}
            className="btn bg-gray-400 shadow-none h-[42px] flex items-center ltr:rounded-l-none rtl:rounded-r-none"
          > <IconPlusProps className="h-5 w-5 " /> 
          </button>
        }
      </div>
      <div className='block'>
        {errors.currency && <span className='block text-red-400 error block text-xs mt-1' role="alert">{errors.currency?.message?.toString()}</span>}
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}

export default SelectDocumentType;