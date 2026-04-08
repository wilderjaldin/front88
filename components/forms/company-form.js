'use client';
import IconLockDots from '@/components/icon/icon-lock-dots';
import IconMail from '@/components/icon/icon-mail';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import FormAddBrand from '@/components/forms/add-brand-form';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'
import SelectDocumentType from '@/components/select-document-type';

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarDatosEmp';

const ComponentCompanyForm = ({ company = {}, show_labels_opc = false, token, setCompany, doc_types, setDocTypes }) => {
  const router = useRouter();
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [enabled_special_order, setEnableSpecialOrder] = useState(false)
  const [modal_content, setModalContent] = useState(null);
  const t = useTranslation();
  const [default_doc, setDefaultDoc] = useState({})
  const [show_labels, setShowLabels] = useState(show_labels_opc)
  const options_docs = useOptionsSelect("doc_types");

  const {
    register, reset, getValues, setValue, control,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: company.name, doc_type: company.doc_type, doc_number: company.doc_number, phone: company.phone, whatsapp: company.whatsapp, address: company.address, website: company.website, email: company.email, country: company.country, city: company.city } });

  useEffect(() => {

    reset({ name: company.name, doc_type: company.doc_type, doc_number: company.doc_number, phone: company.phone, whatsapp: company.whatsapp, address: company.address, website: company.website, email: company.email, country: company.country, city: company.city })
  }, [company]);

  const edit = () => {
    setShowLabels(false);

    let doc_current = options_docs.filter((o) => {
      return o.value === company.doc_type
    })[0];
    setDefaultDoc(doc_current);


    reset({ name: company.name, doc_type: company.doc_type, doc_number: company.doc_number, phone: company.phone, whatsapp: company.whatsapp, address: company.address, website: company.website, email: company.email, country: company.country, city: company.city })
  }

  const cancel = () => {
    setShowLabels(true);
  }

  const handleChangeDocType = (value) => {
    setValue('doc_type', ((value.value) ?? null));
  };

  const onSubmit = async (data) => {

    const save_data = {
      "NomEmpresa": data.name,
      "NumDoc": data.doc_number,
      "TipDoc": data.doc_type,
      "NumTelefono": data.phone,
      "NumWp": data.whatsapp,
      "Direccion": data.address,
      "MailEmp": data.email,
      "SitioWeb": data.website,
      "ValToken": token
    }
    try {
      const response = await axios.post(url, save_data);
      if (response.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          text: t.company_success_save,
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'Cerrar'
        }).then(() => {
          setShowLabels(true);
          let data_company = {
            name: data.name,
            doc_number: data.doc_number,
            doc_type: data.doc_type,
            phone: data.phone,
            whatsapp: data.whatsapp,
            address: data.address,
            email: data.email,
            website: data.website,
            country: company.country,
            city: company.city
          }
          setCompany(data_company);
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.company_error_save,
          icon: 'info',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Cerrar'
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.company_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Cerrar'
      });
    }
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <div className="grid grid-cols-1 sm:flex gap-4 w-full m-auto">
          <form className="basis-3/5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2 required" htmlFor="name">{t.company}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.name) ?? '\xa0'}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.enter_company_name} className={`form-input ${errors.name ? "error" : ""}`} />
                      {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="nit">{t.doc_type}</label>
                <div className="flex flex-1 items-center gap-0">
                  {(show_labels) ?
                    <label htmlFor="" className='form-select-label'>{`${company.doc_type} ${company.doc_number}`}</label>
                    :
                    <> 
                      <SelectDocumentType t={t} token={token} options={doc_types} setDocTypes={setDocTypes} control={control} errors={errors}></SelectDocumentType>
                      <input type="text" {...register("doc_number", { required: false })} placeholder="Número de documento" className="ml-2 form-input ltr:rounded-r-md rtl:rounded-l-md rtl:border-l-0" />
                    </>
                  }
                </div>
              </div>


              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2 required" htmlFor="phone">{t.phone}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.phone) ?? '\xa0'}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' defaultValue='' {...register("phone", { required: { value: true, message: t.required_field } })} aria-invalid={errors.phone ? "true" : "false"} placeholder={t.enter_phone} className={`form-input ${errors.phone ? "error" : ""}`} />
                      {errors.phone && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="whatsApp">WhatsApp</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.whatsapp) ?? '\xa0'}</label>
                    :
                    <input type='text' autoComplete='OFF' defaultValue='' {...register("whatsapp", { required: false })} aria-invalid={errors.whatsApp ? "true" : "false"} placeholder={t.enter_whatsApp} className="form-input placeholder:" />

                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2 required" htmlFor="address">{t.address}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.address) ?? '\xa0'}</label>
                    :
                    <>
                      <input type='text' autoComplete='OFF' defaultValue='' {...register("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.enter_address} className={`form-input ${errors.address ? "error" : ""}`} />
                      {errors.address && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
                    </>
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="websitey">{t.web_site}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.website) ? company.website : '\xa0'}</label>
                    :
                    <input type='text' autoComplete='OFF' {...register("website", { required: false })} placeholder={t.enter_website} className="form-input placeholder:" />
                  }
                </div>
              </div>


              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="email">{t.email}</label>
                <div className="relative flex-1">
                  {(show_labels) ?
                    <label htmlFor="" className='form-input-label'>{(company.email) ?? '\xa0'}</label>
                    :
                    <input type='text' autoComplete='OFF' {...register("email", { required: false })} placeholder={t.enter_email} className="form-input placeholder:" />
                  }
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="select_country">{t.country}</label>
                <label htmlFor="" className='form-select-label flex-1'>{(company.country) ?? '\xa0'}</label>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/3 text-end sm:ltr:mr-2 rtl:ml-2" htmlFor="select_city">{t.city}</label>
                <label htmlFor="" className='form-select-label flex-1'>{(company.city) ?? '\xa0'}</label>
              </div>
            </div>

            <div className="my-5">

              <div className="flex flex-wrap items-center justify-center gap-2">
                {(show_labels) ?
                  <button onClick={() => edit()} type="button" className="btn btn-outline-dark">
                    {t.btn_update}
                  </button>
                  :
                  <>
                    <button onClick={() => cancel()} type="button" className="btn btn-dark">
                      {t.btn_cancel}
                    </button>
                    <button type="submit" className="btn btn-success">
                      {t.btn_save}
                    </button>
                  </>
                }

              </div>
            </div>

          </form>
          <div className="basis-2/5 flex flex-wrap items-center justify-center gap-2">
            <img className="inline w-full sm:w-3/4 m-auto" src="/assets/images/logo.png" alt="logo" />
          </div>
        </div>

      </div>

    </>
  );
};

export default ComponentCompanyForm;
