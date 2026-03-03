'use client';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'

const url_add_brand = process.env.NEXT_PUBLIC_API_URL + "cliente/AdicionarMarcaCliente";

const AddBrandCustomerForm = ({ current_brands, action_cancel, customer, token, updateListBrands, t }) => {


  const brands = useOptionsSelect("brands") || [];
  const [select, setSelect] = useState({});

  const {
    register, reset, setValue,
    handleSubmit, setError,
    formState: { errors },
  } = useForm({ defaultValues: { brand: '' } });


  const onSubmit = async (data) => {

    let exist = current_brands.filter((item) => {
      return item.CodMarca == data.brand;
    });
    if(exist.length){
      setError('brand', { type: 'custom', message: t.brand_exist_error });
      return true;
    }

    
    try {
      const rs = await axios.post(url_add_brand, { CodMarca: data.brand, CodCliente: customer.IdCliente, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        updateListBrands(select);
        action_cancel();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.brand_add_save,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      
    }
  }

  const handlerOnChange = (value) => {
    if (value) {
      setValue('brand', value.value)
      setSelect(value)
    } else {
      setValue('brand', null)
      setSelect({})
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className='space-y-4'>
          <div>
            <label htmlFor="brand-select" className='required'>{ t.brand }</label>
            <div className={errors.brand ? "react-select-error" : ""}>
              <Select placeholder={t.select_option} className='w-full' options={brands}
                {...register('brand', { required: { value: true, message: t.required_select } })}
                isSearchable
                id="brand-select"
                instanceId="brand-select"
                onChange={handlerOnChange}
                menuPosition={'fixed'}
                classNamePrefix="select"
                menuShouldScrollIntoView={false}
              />
              {errors.brand && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
            </div>
          </div>

        </div>



        <div className="mb-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
              { t.btn_cancel }
            </button>

            <button type="submit" className="btn btn-success">
              { t.btn_save }
            </button>

          </div>
        </div>

      </form>

    </>
  );
};

export default AddBrandCustomerForm;
