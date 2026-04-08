'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import FormAddBrand from '@/components/forms/add-brand-form';
import SelectCountry from '@/components/select-country'
import SelectCity from '@/components/select-city'
import Select from 'react-select';
import { useOptionsSelect } from '@/app/options'
import Loading from '@/components/layouts/loading';
import { getNameOption, getNameCity } from '@/app/options'
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/GuardarCliente';

const ComponentCustomerForm = ({ action_cancel, customer, show_labels_opc = false, token, updateList, doc_types = [] }) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false)
  const t = useTranslation();
  const [show_labels, setShowLabels] = useState(show_labels_opc)
  const cities_all = useOptionsSelect("cities");
  const countries = useOptionsSelect("countries");
  const [cities, setCities] = useState([]);
  const [current_country, setCurrentCountry] = useState('');
  const [current_city, setCurrentCity] = useState('');
  const options_reports = useMemo(() => [
    { value: 'ES', label: t.spanish },
    { value: 'US', label: t.english },
  ], [t]);

  const {
    register, reset,
    handleSubmit, getValues, setValue, control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: (customer?.NomCliente) ?? '',
      address: (customer?.DirCliente) ?? '',
      country: (customer?.NomPais) ?? '',
      city: (customer?.NomCiudad) ?? '',
      doc_type: doc_types.find(opt => opt.value === (customer?.Documento ?? 'CI')) || null,
      doc_number: (customer?.Documento) ?? '',
      website: (customer?.SitioWeb) ?? '',
      main_activity: (customer?.ActPrincipal) ?? '',
      report: options_reports.find(opt => opt.value === (customer?.Idioma ?? 'ES')) || null
    }
  });

  useEffect(() => {
    const currentValue = getValues('report');
    if (currentValue) {
      const newOption = options_reports.find(o => o.value === currentValue.value || o.value === currentValue);
      if (newOption) setValue('report', newOption);
    }
  }, [t, options_reports, getValues, setValue]);



  useEffect(() => {
    reset(
      {
        name: (customer?.NomCliente) ?? '',
        address: (customer?.DirCliente) ?? '',
        country: (customer?.NomPais) ?? '',
        city: (customer?.NomCiudad) ?? '',
        doc_number: (customer?.Documento) ?? '',
        website: (customer?.SitioWeb) ?? '',
        main_activity: (customer?.ActPrincipal) ?? ''
      }
    )
  }, []);

  useEffect(() => {

    if (customer?.IdCliente) {
      setShowLabels(true);
    }

  }, [customer]);


  const cancel = () => {

    setShowLabels(true);
  }


  const onSubmit = async (data) => {


    try {
      let data_customer = {
        IdCliente: (customer?.IdCliente) ?? 0,
        NomCliente: data.name,
        CodPais: (data.country.value) ?? '',
        CodCiudad: data.city,
        TipDocumento: (data.doc_type.value) ?? '',
        NroDocumento: data.doc_number,
        DirCliente: data.address,
        SitioWeb: data.website,
        ActPrincipal: data.main_activity,
        IdiomaReporte: (data.report.value) ?? '',
        ValToken: token
      }

      const rs = await axios.post(url, data_customer);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.customer_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          data_customer.IdCliente = (customer?.IdCliente) ?? rs.data.dato;
          data_customer.NomPais = countries.find(c => c.value == data.country?.value)?.label || '';
          data_customer.NomCiudad = getNameCity(((data.country.value) ?? "" ), data.city);
          data_customer.Documento = data.doc_type.value + ' ' + data.doc_number;
          data_customer.NomIdioma = data.report;
          updateList(data_customer);
          if(!customer?.IdCliente){
            action_cancel();
          }

        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.customer_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }



    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.customer_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const changeCountry = (select) => {

    let selec_cities = cities_all[select.value.toUpperCase()] || [];

    setCities(selec_cities);
    setValue('city', null);
    setCurrentCity(null);
    setValue('country', (select) ?? null);
  }

  const changeCity = (select) => {
    const currentValues = getValues();

    reset({
      ...currentValues,
      city: (select?.value) ?? null
    });
  }


  const editCustomer = () => {
    setShowLabels(false);
    changeCountry({ value: customer.CodPais, label: customer.NomPais });
    //
    setCurrentCountry(customer.CodPais)

    setCurrentCity(customer.CodCiudad);
    reset({
      name: customer.NomCliente,
      address: customer.DirCliente,
      country: customer.CodPais,
      city: customer.CodCiudad,
      doc_type: customer.Documento,
      doc_number: customer.NumDocumento,
      website: customer.SitioWeb,
      main_activity: customer.ActPrincipal,
      doc_type: doc_types.find(opt => opt.value === (customer?.CodDocumento.toUpperCase() ?? 'CI')) || null,
      report: options_reports.find(opt => opt.value === (customer?.IdiomaRep.toUpperCase() ?? 'ES')) || null
    })
  }



  return (
    <>
      {isLoading && <Loading />}
      <div className={`${!(customer?.IdCliente) && 'panel shadow-lg border bg-gray-200 p-5 mt-5'}`}>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className='space-y-4'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="name">{t.customer}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{customer.NomCliente}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.enter_customer_name} className={`form-input ${errors.name ? "error" : ""}`} />
                      {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="address">{t.central_address}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{customer.DirCliente}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' defaultValue='' {...register("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.enter_address_main} className={`form-input ${errors.address ? "error" : ""}`} />
                      {errors.address && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
                    </>
                  }

                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.country}</label>
                <div className="w-full flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${customer.NomPais}`}</label>
                    :
                    <SelectCountry setValue={setValue} current={current_country} t={t} options={countries} register={register} errors={errors} onChange={(e) => changeCountry(e)} setLoading={setLoading}></SelectCountry>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.city}</label>
                <div className="w-full flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${customer.NomCiudad}`}</label>
                    :
                    <SelectCity setValue={setValue} current={current_city} t={t} register={register} errors={errors} reset={reset} cities={cities} onChange={(e) => changeCity(e)} ></SelectCity>
                  }
                </div>
              </div>


            </div>
            <div className='space-y-4'>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nit">{t.nro_nit}</label>
                <div className="flex flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${customer.NomDocumento} ${customer.NumDocumento}\xa0`}</label>
                    :
                    <>
                      <Controller
                        name="doc_type"
                        control={control}
                        rules={{ required: false }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={doc_types}
                            placeholder={t.select_option}
                            className="w-full"
                          />
                        )}
                      />

                      <input {...register('doc_number', { required: false })} type="text" placeholder="" className="form-input ltr:rounded-r-md rtl:rounded-l-md rtl:border-l-0" />
                    </>
                  }

                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="website">{t.website}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{`${customer.SitioWeb}\xa0`}</label>
                    :
                    <input id="website" {...register('website', { required: false })} type="text" placeholder={ t.enter_website } className="form-input ltr:rounded-l-none rtl:rounded-r-none form-input disabled:pointer-events-none disabled:bg-[#eee] dark:disabled:bg-[#1b2e4b] disabled:cursor-not-allowed" />
                  }
                </div>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="main_activity">{t.main_activity}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{`${customer.ActPrincipal}\xa0`}</label>
                    :
                    <input id="main_activity" {...register('main_activity', { required: false })} type="text" placeholder={ t.enter_main_activity } className="form-input ltr:rounded-l-none rtl:rounded-r-none form-input disabled:pointer-events-none disabled:bg-[#eee] dark:disabled:bg-[#1b2e4b] disabled:cursor-not-allowed" />
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_report">{t.show_reports_in}</label>
                {(show_labels) ?
                  <label htmlFor="" className='form-select-label flex-1'>{`${customer.NomIdioma}\xa0`}</label>
                  :
                  <div className='flex flex-1'>
                    <Controller
                      name="report"
                      control={control}
                      rules={{ required: false }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={options_reports}
                          placeholder={t.select_option}
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                }
              </div>

            </div>

          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              {(show_labels) ?
                <>
                  <button onClick={() => editCustomer()} type="button" className="btn btn-outline-dark">
                    {t.btn_edit}
                  </button>
                </>
                :
                <>
                  {(customer?.IdCliente) ?
                    <button onClick={() => cancel()} type="button" className="btn btn-dark">
                      {t.btn_cancel}
                    </button>
                    :
                    <button onClick={() => action_cancel()} type="button" className="btn btn-dark">
                      {t.btn_cancel}
                    </button>
                  }
                  <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                    {t.btn_save}
                  </button>
                </>
              }

            </div>
          </div>

        </form>
      </div>

    </>
  );
};

export default ComponentCustomerForm;
