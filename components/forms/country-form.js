'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import axios from 'axios'
import Swal from 'sweetalert2'

const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/AdicionarPais';
const url_get_countries = process.env.NEXT_PUBLIC_API_URL + "cliente/MostrarPaisGral"

const CountryForm = ({ action_cancel, token, countries = [] }) => {

  const t = useTranslation();
  const [options, setOptions] = useState([]);
  const [select, setSelect] = useState({})
  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { country: '' } });

  useEffect(() => {
    if(options.length == 0){
      
      getCountries();
    }      
  }, []);

  const getCountries = async () => {
    try {
      
      const rs = await axios.post(url_get_countries, { ValToken: token });
      
      let array = [];
      for (const d of rs.data.dato) {
        if (d.CodPais != 0) {
          array.push({ value: d.CodPais, label: d.NomPais });
        }
      }
      setOptions(array)
    } catch (error) {
      
    }

  }

  const onSubmit = async (data) => {
    
    
    
    let exist = countries.filter((c) => { return c.value.toLowerCase() == select.value.toLowerCase() });
    
    if(exist.length){
      Swal.fire({
        title: t.warning,
        text: t.country_error_exist,
        icon: 'warning',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return true;
    }
    
    try {
      const rs = await axios.post(url, {CodPais: select.value, NomPais: select.label, ValToken: token });

      if(rs.data.estado == 'OK'){
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.country_success_save,
          confirmButtonText: t.close
        }).then( async (r) => {

          countries.push({value: select.value.toUpperCase(), label: select.label.toUpperCase() });
          countries.sort(function(a, b){
            let x = a.label.toLowerCase();
            let y = b.label.toLowerCase();
            if (x < y) {return -1;}
            if (x > y) {return 1;}
            return 0;
          });  
          const response = await fetch("/api/saveFile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: "countries.json",
              folder: "data-runtime",
              content: countries,
            }),
          });



        action_cancel()});
      } else {
        Swal.fire({
          title: t.error,
          text: t.country_error_save+" - "+rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
      //saveCountries(data);
    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.country_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }
  const handlerOnChange = (value) => {
    
    if (value) {
      setValue('country', value?.value);
      setSelect(value)
    } else {
      setValue('country', null );
      setSelect({})
    }
    
  }
 

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>


        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="country">{t.select_country}</label>
          <div className="relative flex-1">
            
            {(options) && <Select
              options={options}
              defaultValue={options[0]}
              isClearable
              {...register('country', { required: { value: true, message: t.required_field } })}
              isSearchable
              id="city-select"
              instanceId="city-select"
              onChange={handlerOnChange}
              menuPosition={'fixed'}
              menuShouldScrollIntoView={false}
              placeholder={t.select_option}
            ></Select>}
            {errors.country && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.country?.message?.toString()}</span>}
          </div>
        </div>




        <div className="mb-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
              {t.btn_cancel}
            </button>

            <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
              {t.btn_add}
            </button>

          </div>
        </div>

      </form>

    </>
  );
};

export default CountryForm;
