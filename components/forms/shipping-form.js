'use client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useOptionsSelect, getNameCity } from '@/app/options'
import SelectCountry from '@/components/select-country'
import SelectCity from '@/components/select-city'
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/AdicionarDirEntrega';

const ComponentShippingForm = ({ action_cancel, address = [], is_new = false, updateList, customer, token, current_country, current_city }) => {

  const countries = useOptionsSelect("countries");
  const cities_all = useOptionsSelect("cities");
  const [cities, setCities] = useState((current_country) ? cities_all[current_country] : []);
  const [isUsa, setIsUsa] = useState( (address?.CodPais && address.CodPais == 'US') ? true : false );

  const t = useTranslation();
  const {
    register, reset, setValue,
    handleSubmit,control,
    formState: { errors },
  } = useForm({ defaultValues: { compamy: '', contact: '', phone: '', email: '', country: '', address: '', city: '', state: '', zip: '' } });

  useEffect(() => {
    if (address) {

      reset({ company: address.NomEmpresa, contact: address.NomContacto, phone: address.NumTelefono, email: address.Mail, country: address.CodPais, address: address.DesDireccion, city: address.CodCiudad, state: address.NomEstado, zip: address.CodPostal });
    } else {
      reset({ company: '', contact: '', phone: '', email: '', country: '', address: '', city: '', state: '', zip: '' });
    }


  }, []);


  const onSubmit = async (data) => {

    try {
      let city_name = getNameCity(data.country, data.city)
      let data_address = {

        CodDir: (address.CodDir) ?? 0,
        CodCliente: (customer.IdCliente) ?? 0,
        CodPais: data.country,
        CodCiudad: data.city,
        NomCiudad: city_name,
        DesDireccion: data.address,
        NomEmpresa: data.company,
        NomContacto: data.contact,
        NumTelefono: data.phone,
        Mail: data.email,
        NomEstado: data.state,
        CodPostal: data.zip,
        ValToken: token
      }




      const rs = await axios.post(url, data_address);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.shipping_address_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          updateList(rs.data.dato);
          action_cancel();
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.shipping_address_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }




    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.shipping_address_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }


  }

  const changeCountry = (select) => {

    let selec_cities = cities_all[select.value.toUpperCase()] || [];

    setCities(selec_cities);
    setValue('country', select.value)
    
    setIsUsa( (select?.value && select.value == 'US') ? true : false );
    
  }

  const changeCity = (select) => {

    setValue('city', ((select?.value) ?? null))
  }

  return (
    <>
      <div className=''>
        <form className="" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1">
            <div className='space-y-4'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="company">{t.company}</label>
                <div className="relative flex-1">
                  <input type='text' autoComplete='OFF' {...register("company", { required: { value: true, message: t.required_field } })} aria-invalid={errors.company ? "true" : "false"} placeholder={''} className={`form-input ${errors.company ? "error" : ""}`} />
                  {errors.company && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.company?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="contact">{t.contact}</label>
                <div className="relative flex-1">
                  <input type='text' id='contact' autoComplete='OFF' {...register("contact", { required: { value: true, message: t.required_field } })} aria-invalid={errors.contact ? "true" : "false"} placeholder={t.login.enter_name} className={`form-input ${errors.contact ? "error" : ""}`} />
                  {errors.contact && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.contact?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone">{t.phone}</label>
                <div className="relative flex-1">
                  <input type='text' id='phone' autoComplete='OFF' {...register("phone", { required: false })} aria-invalid={errors.phone ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email">{t.email}</label>
                <div className="relative flex-1">
                  <input type='text' id='email' autoComplete='OFF' {...register("email", { required: false })} aria-invalid={errors.email ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.country}</label>
                <div className="w-full flex-1">

                  <SelectCountry setValue={setValue} current={current_country} options={countries} t={t} register={register} errors={errors} onChange={(e) => changeCountry(e)} control={control}></SelectCountry>

                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="address">{t.address}</label>
                <div className="relative flex-1">
                  <input type='text' id='address' autoComplete='OFF' {...register("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.login.enter_name} className={`form-input ${errors.address ? "error" : ""}`} />
                  {errors.address && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
                </div>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.city}</label>
                <div className="w-full flex-1">

                  <SelectCity setValue={setValue} current={current_city} t={t} register={register} errors={errors} reset={reset} cities={cities} onChange={(e) => changeCity(e)} ></SelectCity>

                </div>
              </div>
              {(isUsa) &&
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="state">{t.state}</label>
                  <div className="relative flex-1">
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <input type='text' id='state' autoComplete='OFF' {...register("state", { required: false })} placeholder={t.login.enter_name} className="form-input placeholder:" />
                      </div>
                      <div>
                        <div className="flex sm:flex-row flex-col">
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="zip">{t.zip}</label>
                          <div className="relative flex-1">
                            <input type='text' id='zip' autoComplete='OFF' {...register("zip", { required: false })} placeholder={t.login.enter_name} className="form-input placeholder:" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }


            </div>
          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>{t.btn_cancel}</button>
              <button type="submit" className="btn btn-success">
                {(is_new) ? t.btn_register_address : t.btn_update_address}
              </button>

            </div>
          </div>

        </form>
      </div>

    </>
  );
};

export default ComponentShippingForm;
