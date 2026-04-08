'use client';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'

const url_list = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarListasDesplegables';
const url_get_detail_address = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/SeleccionarDirEntrega';
const url_update_instruction = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarInsEntrega';
const url_get_instruction = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarInsEntrega';
const url_save_address = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarDirEntrega';

const DeliveryInstructionsForm = ({ action_cancel, order_id, token, t }) => {

  const [address, setAddress] = useState([]);

  const {
    register,
    handleSubmit, setValue, getValues, control,
    formState: { errors },
  } = useForm();


  useEffect(() => {

    async function fetchData() {
      await getShippingSelect();
      await getInstruction();
    }
    fetchData();

  }, []);

  const getShippingSelect = async () => {
    try {
      const rs = await axios.post(url_list, { NroOrden: order_id, ValToken: token });

      if (rs.data.estado == 'OK') {
        let options = [];
        rs.data.dato.map((o) => {
          if (o.CodDireccion != 0) {
            options.push({ value: o.CodDireccion, label: o.DesDireccion });
          }
        });

        setAddress(options);
      }
    } catch (error) {

    }
  }

  const getInstruction = async () => {
    try {
      const rs = await axios.post(url_get_instruction, { NroOrden: order_id, ValToken: token });

      if (rs.data.estado == 'OK') {
        setValue('payment_method', rs.data.dato[0].FormaPago)
        setValue('instructions', rs.data.dato[0].InsEntrega);

        setValue('city', rs.data.dato[0].DirEntCiudad)
        setValue('company', rs.data.dato[0].DirEntNomEmpresa);
        setValue('contact', rs.data.dato[0].DirEntNomContacto);
        setValue('phone', rs.data.dato[0].DirEntNumTelefono);
        setValue('email', rs.data.dato[0].DirEntMail);
        setValue('address', rs.data.dato[0].DirEntDireccion);
        setValue('city', rs.data.dato[0].DirEntCiudad);
        setValue('state', rs.data.dato[0].DirEntNomEstado);
        setValue('zip', rs.data.dato[0].DirEntCodPostal);
      }
    } catch (error) {

    }
  }

  const onSubmit = async (data) => {
    try {
      const rs = await axios.post(url_save_address, { NroOrden: order_id, CodDireccion: data.select_shipping.value, ValToken: token });
      if (rs.data.estado == 'Ok') {
        action_cancel();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.shipping_address_update,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {

    }
  }

  const handleChange = async (select) => {

    if (select.value) {
      try {

        setValue('select_shipping', select)
        const rs = await axios.post(url_get_detail_address, { CodDireccion: select.value, ValToken: token });

        if (rs.data.estado == 'Ok') {
          const data = rs.data.dato[0];

          setValue('city', data.DirEntCiudad)
          setValue('company', data.DirEntNomEmpresa);
          setValue('contact', data.DirEntNomContacto);
          setValue('phone', data.DirEntNumTelefono);
          setValue('email', data.DirEntMail);
          setValue('address', data.DirEntDireccion);
          setValue('city', data.DirEntCiudad);
          setValue('state', data.DirEntNomEstado);
          setValue('zip', data.DirEntCodPostal);
        }
      } catch (error) {

      }
    }

  }

  const updateInstruction = async () => {
    try {
      let data_send = {
        NroOrden: order_id,
        InsEntrega: getValues('instructions'),
        ValToken: token
      }
      const rs = await axios.post(url_update_instruction, data_send);

      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.instruction_update,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {

    }
  }



  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

        <div className='space-y-1 mt-0'>


          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_shipping">{ t.method_of_payment }</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("payment_method", { required: false })} aria-invalid={errors.code ? "true" : "false"} placeholder={t.enter_code} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end">{ t.delivery_instructions }</label>
            <div className="relative flex-1">
              <textarea className='form-input form-input-sm' rows={4} {...register('instructions', { required: false })} ></textarea>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => updateInstruction()} className="btn btn-success">
              {t.btn_update}
            </button>
          </div>

          <hr />


          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select_shipping">{ t.delivery_address }</label>
            <div className="relative flex-1">
              <Controller
                name="select_shipping"
                control={control}
                rules={{ required: { value: true, message: t.required_select } }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    tabIndex={4}
                    options={address}
                    placeholder={t.select_option}
                    onChange={handleChange}
                    className="w-full"
                  />
                )}
              />
              {errors.select_shipping && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.select_shipping?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="city">{t.city}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("city", { required: { value: true, message: t.required_field } })} aria-invalid={errors.city ? "true" : "false"} placeholder={t.enter_city} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.city && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.city?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="address">{t.address}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.enter_address} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.address && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="company">{t.company}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("company", { required: false })} aria-invalid={errors.company ? "true" : "false"} placeholder={t.enter_company} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.company && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.company?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="contact">{t.contact}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("contact", { required: false })} aria-invalid={errors.contact ? "true" : "false"} placeholder={t.enter_contact} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.contact && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.contact?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone">{t.phone}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("phone", { required: false })} aria-invalid={errors.phone ? "true" : "false"} placeholder={t.enter_phone} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.phone && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email">{t.email}</label>
            <div className="relative flex-1">
              <input type='text' readOnly={true} autoComplete='OFF' {...register("email", { required: false })} aria-invalid={errors.email ? "true" : "false"} placeholder={t.enter_email} className="form-input form-input-sm placeholder: read-only:border-none read-only:cursor-default" />
              {errors.email && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.email?.message?.toString()}</span>}
            </div>
          </div>

          <hr />

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="name">{t.name}</label>
            <div className="relative flex-1">
              <input type='text' autoComplete='OFF' {...register("name", { required: false })} aria-invalid={errors.name ? "true" : "false"} placeholder={t.enter_name} className="form-input form-input-sm placeholder:" />
              {errors.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.name?.message?.toString()}</span>}
            </div>
          </div>


          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone_contact">{t.phone}</label>
            <div className="relative flex-1">
              <input type='text' autoComplete='OFF' {...register("phone_contact", { required: false })} aria-invalid={errors.phone_contact ? "true" : "false"} placeholder={t.enter_phone_contact} className="form-input form-input-sm placeholder:" />
              {errors.phone_contact && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone_contact?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col items-center">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email_contact">{t.email}</label>
            <div className="relative flex-1">
              <input type='text' autoComplete='OFF' {...register("email_contact", { required: false })} aria-invalid={errors.email_contact ? "true" : "false"} placeholder={t.enter_email_contact} className="form-input form-input-sm placeholder:" />
              {errors.email_contact && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.email_contact?.message?.toString()}</span>}
            </div>
          </div>

        </div>






        <div className="mb-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
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

export default DeliveryInstructionsForm;
