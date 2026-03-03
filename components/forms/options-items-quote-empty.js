'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'
const url_save = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarRepPorCotizar';

const OptionsItemsQuoteEmpty = ({ close, data, token, t, code }) => {


  const brands = useOptionsSelect("brands") || [];
  const [select, setSelect] = useState({})
  const [show_other, setShowOther] = useState(false);
  const [add_other, setAddOther] = useState(true);
  const {
    register,setValue,
    handleSubmit, 
    formState: { errors },
  } = useForm({ defaultValues: { nro_part: data.nro_part, brand: null } });

  useEffect(() => {
    if (add_other) {
      brands.unshift({ value: 'other', label: t.other });
      setAddOther(false);
    }
  }, []);

  const handlerOnChange = (value) => {
    if (value.value == 'other') {
      setShowOther(true);
    } else {
      setShowOther(false);
    }
    if (value) {
      setValue('brand', value.value)
      setSelect(value)
    } else {
      setValue('brand', null)
      setSelect({})
    }
  }

  const onSubmit = async (data) => {
    
    let data_form = {
      CodRegistro: code,
      NomMarca: (show_other) ? '' : select.label,
      NomMarcaOtro: (show_other) ? data.other : '',
      ValToken: token
    }

    
    
    try {
      const rs = await axios.post(url_save, data_form);
      
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.spare_part_add_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          close();
        });
      }
    } catch (error) {

    }
  }


  return (
    <>
      <form className="" onSubmit={handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div className="flex sm:flex-row flex-col">
            <label className="mb-0 sm:w-1/2 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nro_part">{ t.code }/{ t.nro_part }</label>
            <div className="relative flex-1">
              <input type='text' autoComplete='OFF' {...register("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_part ? "true" : "false"} placeholder={t.enter_nro_part} className="form-input placeholder:" />
              {errors.nro_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_part?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col">
            <label className="mb-0 sm:w-1/2 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="brand">{ t.which_manufacturer_does_the_part_code }
              <span className='text-sm text-gray-400 block'>Caterpillar, Komatsu, John Deere, Case, etc.</span>
            </label>
            <div className="relative flex-1">
              <Select placeholder={t.select_option} className='w-full'

                options={brands}
                {...register('brand', { required: { value: true, message: t.required_select } })}
                isSearchable
                id="brand-select"
                instanceId="brand-select"
                onChange={handlerOnChange}
                menuPosition={'fixed'}
                menuShouldScrollIntoView={false}
              />
              {errors.brand && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}

            </div>
          </div>

          {(show_other) &&
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/2 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="other">{t.other}</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("other", { required: { value: true, message: t.required_field } })} aria-invalid={errors.other ? "true" : "false"} placeholder={t.enter_other_brand} className="form-input placeholder:" />
                {errors.other && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.other?.message?.toString()}</span>}
              </div>
            </div>
          }

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => close()} type="button" className="btn btn-dark">
              {t.btn_cancel}
            </button>

            <button type="submit" className="btn btn-success">
              {t.btn_save}
            </button>

          </div>

        </div>
      </form>
    </>
  );
};

export default OptionsItemsQuoteEmpty;
