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
import { useOptionsSelect } from '@/app/options'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';

const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/AdicionarCiudad';
const url_get_countries = process.env.NEXT_PUBLIC_API_URL + "cliente/MostrarPaisGral"

const CityForm = ({ action_cancel,  countries = [] }) => {

  const t = useTranslation();
  const token = useSelector(selectToken);
  const [select, setSelect] = useState(countries[0]);

  const cities = useOptionsSelect("cities");

  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { country: (countries[0].value || null), city: null } });

  const onSubmit = async (data) => {
    let selec_cities = cities[select.value.toUpperCase()] || [];
    let exist = selec_cities.filter((c) => { return c.label.toUpperCase() == data.city.toUpperCase() });
    if (exist.length) {
      Swal.fire({
        title: t.warning,
        text: t.city_error_exist,
        icon: 'warning',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return true;
    }

    try {
      const rs = await axios.post(url, { CodPais: select.value.toUpperCase(), NomCiudad: data.city.toUpperCase(), ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.city_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {

                    
          selec_cities.push({ value: rs.data.dato, label: data.city.toUpperCase() });
          selec_cities.sort(function (a, b) {
            let x = a.label.toLowerCase();
            let y = b.label.toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
          });

          cities[select.value.toUpperCase()] =  selec_cities;

          

          const response = await fetch("/api/saveFile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: "cities.json",
              folder: "data-runtime",
              content: cities,
            }),
          });
          action_cancel()
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.city_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
      //saveCountries(data);
    } catch (error) {
      
      Swal.fire({
        title: t.error,
        text: t.city_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }

    
  }
  const handlerOnChange = (value) => {
    setValue('country', ((value?.value) ?? null) );
    setSelect(value);
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>


        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="country">{t.select_country}</label>
          <div className="relative flex-1">

            {(countries) && <Select
              options={countries}
              defaultValue={countries[0]}
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

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="city">{ t.city_name }</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' defaultValue='' {...register("city", { required: { value: true, message: t.required_field } })} aria-invalid={errors.city ? "true" : "false"} placeholder={t.enter_city_name} className="form-input placeholder:" />
            {errors.city && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.city?.message?.toString()}</span>}
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

export default CityForm;
