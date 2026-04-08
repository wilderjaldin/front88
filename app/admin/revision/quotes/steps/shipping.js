'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Modal from '@/components/modal';
import Select from 'react-select';
import { useSearchParams } from "next/navigation";
import IconPlusProps from '@/components/icon/icon-plus';
import ComponentShippingForm from "@/components/forms/shipping-form";
import IconPencil from '@/components/icon/icon-pencil';
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarListasDesplegables';
const url_get_detail = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/SeleccionarDirEntrega';
const url_get_address = process.env.NEXT_PUBLIC_API_URL + 'cliente/RecuperarDirEntrega';

const ShippingQuote = ({ shipping, setShipping, load_shipping, token, t, order_id, getValues, registerShipping, reset, errors }) => {

  const searchParams = useSearchParams();

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [isEdit, setIsEdit] = useState(false)
  const [current_address, setCurrentAddress] = useState(null)

  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (load_shipping) {
      getShippingSelect();
    }
  }, []);

  const getShippingSelect = async () => {
    try {
      const rs = await axios.post(url, { NroOrden: order_id, ValToken: token });
      if (rs.data.estado == 'OK') {
        //setQuoteDetail(rs.data.dato2[0]);
        let options = [];
        rs.data.dato.map((o) => {
          if (o.CodDireccion != 0) {
            options.push({ value: o.CodDireccion, label: o.DesDireccion });
          }
        });
        setShipping(options);
      }
    } catch (error) {

    }
  }

  const handleChange = async (select) => {
    setSelectedAddress(select);
    if (select.value) {
      try {
        const rs = await axios.post(url_get_detail, { CodDireccion: select.value, ValToken: token });
        if (rs.data.estado == 'Ok') {
          const data = rs.data.dato[0];
          data.CodDireccion = select.value;
          setCurrentAddress(data);
          reset({
            'company': data.DirEntNomEmpresa,
            'contact': data.DirEntNomContacto,
            'phone': data.DirEntNumTelefono,
            'email': data.DirEntMail,
            'country': data.DirEntPais,
            'address': data.DirEntDireccion,
            'city': data.DirEntCiudad,
            'state': data.DirEntNomEstado,
            'zip': data.DirEntCodPostal
          });
        }
      } catch (error) {

      }
    }
  }

  const handleAddAddress = () => {
    setModalTitle(t.btn_add_address)
    const customer_id = searchParams.get("customer") || 0;
    let customer = { IdCliente: customer_id }
    setModalContent(<ComponentShippingForm updateList={updateList} token={token} customer={customer} action_cancel={() => setShowModal(false)} is_new={true} address={[]}></ComponentShippingForm>);
    setShowModal(true);
  }

  const updateList = (addresses) => {
    const options = addresses
      .filter(o => o.CodDir !== 0)
      .map(o => ({ value: o.CodDir, label: o.DesDireccion }));

    setShipping(options);

    if (selectedAddress) {
      const updated = options.find(o => o.value === selectedAddress.value);
      if (updated) {
        setSelectedAddress(updated);
        handleChange(updated);
      }
    }
  }

  const getAddress = async () => {

    try {
      const rs = await axios.post(url_get_address, { CodRegistro: current_address.CodDireccion, ValToken: token });

      return rs.data.dato[0];
    } catch (error) {
      return [];
    }
  }

  const handleEditAddress = async () => {

    let address_edit = await getAddress();

    setModalTitle(t.btn_update_address)
    const customer_id = searchParams.get("customer") || 0;
    let customer = { IdCliente: customer_id }
    setModalContent(<ComponentShippingForm current_country={(address_edit.CodPais) ?? null} current_city={(address_edit.CodCiudad) ?? null} updateList={updateList} token={token} customer={customer} action_cancel={() => setShowModal(false)} is_new={false} address={address_edit}></ComponentShippingForm>);
    setShowModal(true);
  }

  const handleEditCancelAddress = () => {
    setIsEdit(false);
    reset({
      'company': current_address.DirEntNomEmpresa,
      'contact': current_address.DirEntNomContacto,
      'phone': current_address.DirEntNumTelefono,
      'email': current_address.DirEntMail,
      'country': current_address.DirEntPais,
      'address': current_address.DirEntDireccion,
      'city': current_address.DirEntCiudad,
      'state': current_address.DirEntNomEstado,
      'zip': current_address.DirEntCodPostal
    });
  }

  const handleUpdateAddress = () => {


  }

  return (
    <>
      <div className="mb-5 flex items-center justify-center">
        <div className="px-8 w-1/2 bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">

          <div className='mt-4'>
            <label htmlFor="select_shipping">{ t.select_option }</label>
            <div className="flex flex-1">
              <Select onChange={handleChange} value={selectedAddress} id="select_shipping" placeholder={t.select_option} className='w-full' options={shipping} />
              <button onClick={() => handleAddAddress()} type="button" className='btn btn-dark'> <IconPlusProps></IconPlusProps> {t.btn_add} </button>
            </div>
          </div>


          <hr />

          <div className='space-y-4 mt-8 relative'>
            {(current_address) &&
              <div className='top-0 right-0 z-10 flex flex-wrap items-center justify-center gap-2'>
                {(isEdit) ?
                  <>
                    <button onClick={() => handleEditCancelAddress()} className='btn btn-sm btn-dark'> {t.btn_cancel}</button>
                    <button onClick={() => handleUpdateAddress()} className='btn btn-sm btn-primary'> {t.btn_update}</button>
                  </>
                  :
                  <button onClick={() => handleEditAddress()} className='btn btn-sm btn-info'> {t.btn_edit}</button>
                }
              </div>
            }
            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="company">{t.company}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("company", { required: { value: true, message: t.required_field } })} aria-invalid={errors.company ? "true" : "false"} placeholder={t.enter_company} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.company && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.company?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="contact">{t.contact}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("contact", { required: { value: true, message: t.required_field } })} aria-invalid={errors.contact ? "true" : "false"} placeholder={t.enter_contact} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.contact && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.contact?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone">{t.phone}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("phone", { required: { value: true, message: t.required_field } })} aria-invalid={errors.phone ? "true" : "false"} placeholder={t.enter_phone} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.phone && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.phone?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email">{t.email}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("email", { required: { value: true, message: t.required_field } })} aria-invalid={errors.email ? "true" : "false"} placeholder={t.enter_email} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.email && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.email?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="country">{t.country}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("country", { required: { value: true, message: t.required_field } })} aria-invalid={errors.country ? "true" : "false"} placeholder={t.enter_country} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.country && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.country?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="address">{t.address}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("address", { required: { value: true, message: t.required_field } })} aria-invalid={errors.address ? "true" : "false"} placeholder={t.enter_address} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.address && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.address?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="city">{t.city}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("city", { required: { value: true, message: t.required_field } })} aria-invalid={errors.city ? "true" : "false"} placeholder={t.enter_city} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.city && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.city?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="state">{t.state}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("state", { required: { value: true, message: t.required_field } })} aria-invalid={errors.state ? "true" : "false"} placeholder={t.enter_state} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.state && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.state?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="zip">{t.zip}</label>
              <div className="relative flex-1">
                <input type='text' readOnly={!isEdit} autoComplete='OFF' {...registerShipping("zip", { required: { value: true, message: t.required_field } })} aria-invalid={errors.zip ? "true" : "false"} placeholder={t.enter_zip} className="form-input placeholder: read-only:border-none read-only:cursor-default" />
                {errors.zip && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.zip?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-center">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="note">{ t.delivery_instructions }</label>
              <div className="relative flex-1">
                <textarea rows="4" {...registerShipping("note", { required: false })} className="form-input placeholder:"></textarea>
              </div>
            </div>
          </div>


        </div>
      </div>
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>

    </>
  );
};

export default ShippingQuote;
