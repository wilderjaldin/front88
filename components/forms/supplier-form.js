'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from "@/app/locales";
import SelectCountry from '@/components/select-country'
import SelectCity from '@/components/select-city'
import Select from 'react-select';
import { useOptionsSelect, getNameOption, getNameCity } from '@/app/options'

import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'proveedor/GuardarPrv';

const ComponentSupplierForm = ({ action_cancel, supplier = [], show_labels_opc = false, token = '', updateList, doc_types = [] }) => {

  const router = useRouter();
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [enabled_special_order, setEnableSpecialOrder] = useState(false)
  const [modal_content, setModalContent] = useState(null);
  const t = useTranslation();
  const [show_labels, setShowLabels] = useState(show_labels_opc)

  const countries = useOptionsSelect("countries");
  const cities_all = useOptionsSelect("cities");
  const [cities, setCities] = useState([]);
  const [current_country, setCurrentCountry] = useState('');
  const [current_city, setCurrentCity] = useState('');
  const [current_type_doc_select, setCurrentTypeDoc] = useState(doc_types.find((key) => key.value === supplier?.TipDocumento) || null);
  const [current_report_select, setCurrentReport] = useState(0);

  const options_reports = useMemo(() => [
    { value: 'ES', label: t.spanish },
    { value: 'US', label: t.english },
  ], [t]);

  const {
    register, reset, setValue, control,getValues,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      company: supplier?.NomPrv,
      address: supplier?.DirPrv,
      country: supplier?.country,
      days_process: supplier?.DiasProceso,
      days_shipping_standard: supplier?.DiasShipingStandard,
      website: supplier?.SitWeb,
      doc_type: doc_types.find(opt => opt.value === (supplier?.doc_type ?? 'CI')) || null,
      doc_number: supplier?.NumDocumento,
      report: options_reports.find(opt => opt.value === (supplier?.report ?? 'ES')) || null
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
    let report = '';
    
    if (supplier?.report) {

    } else {
      report = (options_reports[0].value) || '';
    }
    reset({
      company: supplier?.NomPrv,
      address: supplier?.DirPrv,
      country: supplier?.country,
      days_process: supplier?.DiasProceso,
      days_shipping_standard: supplier?.DiasShipingStandard,
      website: supplier?.SitWeb,
      doc_number: supplier?.NumDocumento,

    })


  }, []);

  const cancel = () => {
    setShowLabels(true);
  }
  const onSubmit = async (data) => {
    console.log(data)
    try {
      let data_supplier = {
        CodPrv: (supplier?.CodPrv) ?? 0,
        NomPrv: data.company,
        TipDocumento: (data.doc_type.value) ?? '',
        NumDocumento: data.doc_number,
        CodPais: data.country.value,
        NomPais: getNameOption("countries", data.country?.value) || "",
        NomCiudad: getNameCity(data.country?.value, data.city) || "",
        CodCiudad: data.city,

        TieneStock: (data.consider_stock) ? 1 : 0,
        DiasProceso: data.days_process,

        DiasShipingStandard: data.days_shipping_standard,
        DirPrv: data.address,
        SitWeb: data.website,
        IdiomaReporte: (data.report.value) ?? '',
        ValToken: token

      }
      

      const rs = await axios.post(url, data_supplier);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.supplier_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          data_supplier.CodPrv = (supplier?.CodPrv) ?? rs.data.dato;
          console.log('supplier.CodPrv', supplier?.CodPrv)
          updateList(data_supplier);
          if(!supplier?.CodPrv){
            console.log('IFF');
            action_cancel();
          } else {
            cancel();
          }
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.supplier_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }



    } catch (error) {
console.log(error)
      Swal.fire({
        title: t.error,
        text: t.supplier_error_server + " - " + error.mensaje,
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
    setCurrentCity('');
    setValue('country', ((select) ?? null));
  }

  const changeCity = (select) => {
    setValue('city', ((select.value) ?? null));
  }


  const onChangeDoc = (select) => {
    setValue('doc_type', ((select.value) ?? null));
    setCurrentTypeDoc(select);
  }

  const onChangeReport = (select) => {
    setValue('report', ((select.value) ?? null));
  }

  const editSupplier = () => {
    setShowLabels(false);
    changeCountry({ value: supplier.CodPais, label: supplier.NomPais });
    //
    setCurrentCountry(supplier.CodPais)
    setCurrentCity(supplier.CodCiudad);
    let current_report = Object.keys(options_reports).find((key) => options_reports[key].value.toUpperCase() === supplier.IdiomaReporte.toUpperCase()) || null;
    setCurrentReport(current_report)

    setCurrentTypeDoc(doc_types.find((key) => key.value.toUpperCase() === supplier.TipDocumento.toUpperCase()) || null);
    console.log(supplier)
    reset({
      company: supplier.NomPrv,
      address: supplier.DirPrv,
      country: supplier.CodPais,
      city: supplier.CodCiudad,
      days_process: supplier.DiasProceso,
      days_shipping_standard: supplier.DiasShipingStandard,
      doc_number: supplier.NumDocumento,
      website: supplier.SitWeb,
      consider_stock: supplier.TieneStock,
      doc_type: doc_types.find(opt => opt.value === (supplier.TipDocumento.toUpperCase() ?? '')) || null,
      report: options_reports.find(opt => opt.value === (supplier.IdiomaReporte.toUpperCase() ?? '')) || null
    })
  }

  return (
    <>
      <div className={`${!(supplier?.CodPrv) && 'panel shadow-lg border bg-gray-200 p-5 mt-5'}`}>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className='space-y-4'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="company">{t.company}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{supplier.NomPrv}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' {...register("company", { required: { value: true, message: t.required_field } })} aria-invalid={errors.company ? "true" : "false"} placeholder={t.login.enter_company} className={`form-input ${errors.company ? "error" : ""}`} />
                      {errors.company && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.company?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="address">{t.address}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{supplier.DirPrv}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' defaultValue='' {...register("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.login.enter_address} className={`form-input ${errors.address ? "error" : ""}`} />
                      {errors.address && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.country}</label>
                <div className="w-full flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${supplier.NomPais}`}</label>
                    :
                    <SelectCountry setValue={setValue} current={current_country} options={countries} t={t} register={register} errors={errors} onChange={(e) => changeCountry(e)} control={control}></SelectCountry>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required">{t.city}</label>
                <div className="w-full flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${supplier.NomCiudad}`}</label>
                    :
                    <SelectCity setValue={setValue} current={current_city} t={t} register={register} errors={errors} reset={reset} cities={cities} onChange={(e) => changeCity(e)} ></SelectCity>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="days_process">{t.days_process}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{supplier.DiasProceso}</label>
                    :
                    <>
                      <input type='number' autoComplete='OFF' defaultValue='' {...register("days_process", { required: { value: true, message: t.required_field } })} aria-invalid={errors.days_process ? "true" : "false"} placeholder={t.login.enter_days_process} className={`form-input ${errors.days_process ? "error" : ""}`} />
                      {errors.days_process && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.days_process?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end required" htmlFor="days_shipping_standard">{t.days_shipping_standard}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{supplier.DiasShipingStandard}</label>
                    :
                    <>
                      <input type='number' autoComplete='OFF' defaultValue='' {...register("days_shipping_standard", { required: { value: true, message: t.required_field } })} aria-invalid={errors.days_shipping_standard ? "true" : "false"} placeholder={t.login.enter_days_shipping_standard} className={`form-input ${errors.days_shipping_standard ? "error" : ""}`} />
                      {errors.days_shipping_standard && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.days_shipping_standard?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

            </div>
            <div className='space-y-4'>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nit">{t.nro_nit}</label>
                <div className="flex flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${supplier.NomDocumento} ${supplier.NumDocumento}\xa0`}</label>
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
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="main_activity">{t.website}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{`${supplier.SitWeb}\xa0`}</label>
                    :
                    <input type='text' autoComplete='OFF' defaultValue='' {...register("website", { required: false })} placeholder={t.login.enter_nro_customer} className="form-input placeholder:" />
                  }
                </div>
              </div>


              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_report">{t.show_reports_in}</label>
                {(show_labels) ?
                  <label htmlFor="" className='form-select-label flex-1'>{`${supplier.NomIdioma}\xa0`}</label>
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

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor=""></label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className=''>{(supplier.TieneStock) ? t.stock_is_considered : t.stock_is_not_considered}</label>
                    :
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" {...register('consider_stock', { required: false })} className="form-checkbox bg-white" />
                        <span className="">{t.consider_stock}</span>
                      </label>
                    </div>
                  }
                </div>
              </div>


            </div>

          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              {(show_labels) ?
                <>
                  <button onClick={() => editSupplier()} type="button" className="btn btn-outline-dark">
                    {t.btn_edit}
                  </button>
                </>
                :
                <>
                  {(supplier?.CodPrv) ?
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

export default ComponentSupplierForm;
