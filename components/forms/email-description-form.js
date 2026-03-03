'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Select from 'react-select';
import axios from 'axios'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/MostrarTemplateMail';
const url_lists = process.env.NEXT_PUBLIC_API_URL + 'empresa/ListaControlesEmp';




const ComponentEmailDescriptionForm = ({ token, options_template, setOptionsTemplate }) => {
  const t = useTranslation();
  const locale = useSelector(getLocale);

  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({});


  useEffect(() => {
    if(options_template.length == 0){
      getList();
    }    
  }, []);

  const getList = async () => {
    try {
      const rs = await axios.post(url_lists, { Idioma: locale, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        let array = []
        for (const d of rs.data.dato2) {
          if (d.CodDoc != 0) {
            array.push({ value: d.CodMoneda, label: d.DesMoneda });
          }
        }
        setOptionsTemplate(array)
      }
    } catch (error) {

    }
  }

  const handleChangeTemplate = async (select) => {
    
    try {
      const rs = await axios.post(url, {CodTemplate: select.value ,ValToken: token });
      
      if (rs.data.estado == 'OK') {
        reset(
          {
            description: rs.data.dato[0].Descripcion,
            subject: rs.data.dato[0].Asunto,
            message: rs.data.dato[0].Cuerpo,
          }
        );
      }
    } catch (error) {
      
    }
  }
  const onSubmit = async (data) => {
    try {
      
    } catch (error) {
      
    }
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full sm:w-4/5 m-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="template">{ t.template }</label>
              <div className="flex flex-1">
                <Select placeholder={t.select_option} className='w-full' options={options_template} onChange={handleChangeTemplate} />
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="description">{ t.description }</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("description", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.description ? "true" : "false"} placeholder={t.login.enter_description} className="form-input placeholder:" />
                {errors.description && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.description?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="subject">{ t.subject }</label>
              <div className="relative flex-1">

                <input type='text' autoComplete='OFF' {...register("subject", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.subject ? "true" : "false"} placeholder={t.login.enter_subject} className="form-input placeholder:" />
                {errors.subject && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.subject?.message?.toString()}</span>}

              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="message">{ t.message }</label>
              <div className="relative flex-1">

                <textarea rows={8} autoComplete='OFF' {...register("message", { required: { value: true, message: t.messages.required } })} aria-invalid={errors.message ? "true" : "false"} placeholder={t.login.enter_message} className="form-input placeholder:"></textarea>
                {errors.message && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.message?.message?.toString()}</span>}

              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ComponentEmailDescriptionForm;
