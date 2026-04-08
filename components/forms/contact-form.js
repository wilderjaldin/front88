'use client';
import { useRouter, redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import axios from 'axios'
import Swal from 'sweetalert2'

const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/AdicionarContacto';

const ComponentContactForm = ({ action_cancel, contact = [], is_new = false, customer = {}, token, updateList = null, is_new_customer = 'false' }) => {
  const router = useRouter();
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [enabled_special_order, setEnableSpecialOrder] = useState(false)
  const [modal_content, setModalContent] = useState(null);
  const t = useTranslation();



  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', last_name: '', position: '', email_1: '', email_2: '', phone_1: '', phone_2: '', phone_3: '' } });

  useEffect(() => {
    if (contact) {
      reset({ name: contact.NomContacto, last_name: contact.ApllContacto, position: contact.NomCargo, email_1: contact.Mail1, email_2: contact.Mail2, phone_1: contact.NumTelefono1, phone_2: contact.NumTelefono2, phone_3: contact.NumTelefono3 });
    } else {
      reset({ name: '', last_name: '', position: '', email_1: '', email_2: '', phone_1: '', phone_2: '', phone_3: '' });
    }

    
  }, [contact]);


  const onSubmit = async (data) => {
    try {
      let data_contact = {
        "CodContacto": (contact?.CodContacto) ?? 0,
        "CodCliente": customer.IdCliente,
        "NomContacto": data.name,
        "ApllContacto": data.last_name,
        "NomCargo": data.position,
        "Mail1": data.email_1,
        "Mail2": data.email_2,
        "NumTel1": data.phone_1,
        "NumTel2": data.phone_2,
        "NumTel3": data.phone_3,
        "ValToken": token
      }
      

      const rs = await axios.post(url, data_contact);
      
      if (rs.data.estado == 'OK') {

        
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: (contact?.CodContacto) ? t.contact_update_save : t.contact_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          

         
            updateList(rs.data.dato);
            action_cancel();
          
          
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.contact_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      
      Swal.fire({
        title: t.error,
        text: t.contact_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  return (
    <>
      <div className=''>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1">
            <div className='space-y-4'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="name">{t.names}</label>
                <div className="relative flex-1">
                  <input type='text' autoComplete='OFF' {...register("name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.login.enter_name} className={`form-input ${errors.name ? "error" : ""}`} />
                  {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="last_name">{t.last_name}</label>
                <div className="relative flex-1">
                  <input type='text' id='last_name' autoComplete='OFF' {...register("last_name", { required: { value: true, message: t.required_field } })} aria-invalid={errors.last_name ? "true" : "false"} placeholder={t.login.enter_name} className={`form-input ${errors.last_name ? "error" : ""}`} />
                  {errors.last_name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.last_name?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="position">{t.job_title}</label>
                <div className="relative flex-1">
                  <input type='text' id='position' autoComplete='OFF' {...register("position", { required: false })} aria-invalid={errors.position ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="email_1">{t.email} 1</label>
                <div className="relative flex-1">
                  <input type='text' id='email_1' autoComplete='OFF' {...register("email_1", { required: false })} aria-invalid={errors.email_1 ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="email_2">{t.email} 2</label>
                <div className="relative flex-1">
                  <input type='text' id='email_2' autoComplete='OFF' {...register("email_2", { required: false })} aria-invalid={errors.email_2 ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="phone_1">{t.phone} 1</label>
                <div className="relative flex-1">
                  <input type='text' id='phone_1' autoComplete='OFF' {...register("phone_1", { required: false })} aria-invalid={errors.phone_1 ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                  {errors.phone_1 && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone_1?.message?.toString()}</span>}
                </div>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="phone_2">{t.phone} 2</label>
                <div className="relative flex-1">
                  <input type='text' id='phone_2' autoComplete='OFF' {...register("phone_2", { required: false })} aria-invalid={errors.phone_2 ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                  {errors.phone_2 && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone_2?.message?.toString()}</span>}
                </div>
              </div>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="phone_3">{t.phone} 3</label>
                <div className="relative flex-1">
                  <input type='text' id='phone_3' autoComplete='OFF' {...register("phone_3", { required: false })} aria-invalid={errors.phone_3 ? "true" : "false"} placeholder={t.login.enter_name} className="form-input placeholder:" />
                </div>
              </div>

              

            </div>
          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">

              <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>{t.btn_cancel}</button>
              <button type="submit" className="btn btn-success">
                {(is_new) ? t.btn_register_contact : t.btn_update_contact}
              </button>

            </div>
          </div>

        </form>
      </div>

    </>
  );
};

export default ComponentContactForm;
