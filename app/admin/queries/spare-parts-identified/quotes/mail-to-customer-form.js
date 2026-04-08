'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useForm, useWatch, SubmitHandler } from "react-hook-form"
import { formatEmailBody } from "@/app/lib/formatEmail";
const url_data_email = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/MostrarDatosMailCliente';
const url_send_email = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/EnviarMailCliente';

import { customFormat } from '@/app/lib/format';
import Link from 'next/link';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';
import IconArrowForward from '@/components/icon/icon-arrow-forward';

const MailToCustomerForm = ({ close, t, item, token, order, order_id, print, selected = [] }) => {


  const [filteredItems, setFilteredItems] = useState([]);
  const [select_contacts, setSelectContacts] = useState([]);
  const [details_message, setDetailsMessage] = useState([]);
  const [otherContact, setOtherContact] = useState(false)
  const [loading, setLoading] = useState(false);


  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();


  useEffect(() => {

    async function fetchData() {
      await getData();
    }
    fetchData();
  }, []);

  const getData = async () => {
    try {
      let data = {
        NroOrden: order.NroOrden,
        ValToken: token
      };

      const rs = await axios.post(url_data_email, data);
      if (rs.data.estado == 'OK') {
        setValue('from', rs.data.dato2[0].RemitenteMail);
        setValue('subject', rs.data.dato2[0].AsuntoMail);
        setValue('message', rs.data.dato2[0].CuerpoMail);

        setDetailsMessage(rs.data.dato2[0]);
        setFilteredItems(rs.data.dato1);

      }

    } catch (error) {

    }
  }

  const selectContact = (e, contact) => {

    let emails = [...select_contacts];
    if (e.target.checked) {
      if (contact.Mail1 && contact.Mail1 != "") {
        emails.push(contact.Mail1);
      }
      if (contact.Mail2 && contact.Mail2 != "") {
        emails.push(contact.Mail2);
      }
      //setSelectContacts(prevArray => [...prevArray, contact.CodContacto]);
      setSelectContacts(emails);
    } else {
      if (contact.Mail1 && contact.Mail1 != "") {
        emails = emails.filter((e) => {
          return contact.Mail1 != e;
        });

      }
      if (contact.Mail2 && contact.Mail2 != "") {
        emails = emails.filter((e) => {
          return contact.Mail2 != e;
        });
      }

      setSelectContacts(emails);

    }

    setValue('to', emails.map(String).join(';'));
  }

  const onSend = async (data) => {
    setLoading(true);
    try {
      let data_send = {
        AsuntoMail: data.subject,
        DestinoMail: data.to,
        CuerpoMail: formatEmailBody(data.message, "html"),
        ValToken: token
      }
      

      const rs = await axios.post(url_send_email, data_send);
      

      if (rs.data.estado == 'Ok') {
        close();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.message_sent,
          showConfirmButton: false,
          timer: 3500
        }).then(async (r) => {

        });
      } else {
        close();
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.message_sent_error,
          showConfirmButton: false,
          timer: 3500
        }).then(async (r) => {

        });
      }

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Error al enviar",
        showConfirmButton: false,
        timer: 3500
      });
    } finally {
      setLoading(false); // 👈 liberar loading siempre
    }
  }



  const handleOtherContact = (e) => {
    setOtherContact(e.target.checked);
  }


  return (
    <>
      <div className="table-responsive">
        {(filteredItems.length > 0) &&
          <table className="table-striped table-hover table-compact whitespace-nowrap mb-2">
            <thead>
              <tr>
                <th className='w-1'></th>
                <th>{t.name}</th>
                <th>{ t.mail } 1</th>
                <th>{ t.mail } 2</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((contact, index) => {
                return (
                  <tr key={index}>
                    <td className='!p-1 !m-0'>
                      <label className="flex items-center cursor-pointer">
                        <input onChange={(e) => selectContact(e, contact)} type="checkbox" className="border border-dark border-1 form-checkbox" />
                      </label>
                    </td>
                    <td className='text-[0.7rem] !p-1 !m-0'>{contact.NomContacto}</td>
                    <td className='text-[0.7rem] !p-1 !m-0'>{contact.Mail1}</td>
                    <td className='text-[0.7rem] !p-1 !m-0'>{contact.Mail2}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }
      </div>
      <hr />
      <form className="space-y-4" onSubmit={handleSubmit(onSend)}>
        <div className="space-y-4">
          <div className='flex sm:flex-row flex-col'>
            <div className='mb-0 mt-2 sm:w-2/5 text-end'>
              <label className="cursor-pointer">
                <input onChange={handleOtherContact} type="checkbox" className="border border-dark border-1 form-checkbox" />
                { t.other_contact }
              </label>
            </div>
          </div>


          <div className="flex sm:flex-row flex-col">
            <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="other_name">{ t.name_contact }</label>
            <div className="relative flex-1">
              <input type='text' disabled={!otherContact} autoComplete='OFF'
                {...register("other_name", {
                  required: otherContact ? { value: true, message: t.required_field } : false
                })}
                aria-invalid={errors.other_name ? "true" : "false"} className="form-input form-input-sm placeholder: disabled:btn-outline-dark hover:disabled:bg-gray-200 disabled:bg-gray-200 hover:disabled:text-dark" />
              {errors.other_name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.other_name?.message?.toString()}</span>}
            </div>
          </div>

          <div className="flex sm:flex-row flex-col">
            <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="other_email">{t.email}</label>
            <div className="relative flex-1">
              <input type='text' disabled={!otherContact} autoComplete='OFF'
                {...register("other_email", {
                  required: otherContact ? { value: true, message: t.required_field } : false,
                  pattern: otherContact
                    ? { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.invalid_email }
                    : undefined
                })}
                aria-invalid={errors.other_email ? "true" : "false"} className="form-input form-input-sm placeholder: disabled:btn-outline-dark hover:disabled:bg-gray-200 disabled:bg-gray-200 hover:disabled:text-dark" />
              {errors.other_email && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.other_email?.message?.toString()}</span>}
            </div>
          </div>
        </div>
        <hr />
        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="to">{t.to_email}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("to", { required: { value: true, message: t.required_field } })} aria-invalid={errors.to ? "true" : "false"} placeholder={t.enter_to} className="form-input form-input-sm placeholder:" />
            {errors.to && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.to?.message?.toString()}</span>}
          </div>
        </div>

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="from">{t.from_email}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("from", { required: { value: true, message: t.required_field } })} aria-invalid={errors.from ? "true" : "false"} placeholder={t.enter_from} className="form-input form-input-sm placeholder:" />
            {errors.from && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.from?.message?.toString()}</span>}
          </div>
        </div>

        <div className="flex sm:flex-row flex-col">
          <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="subject">{t.subject}</label>
          <div className="relative flex-1">
            <input type='text' autoComplete='OFF' {...register("subject", { required: { value: true, message: t.required_field } })} aria-invalid={errors.subject ? "true" : "false"} placeholder={t.enter_subject} className="form-input form-input-sm placeholder:" />
            {errors.subject && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.subject?.message?.toString()}</span>}
          </div>
        </div>
        <div>
          <textarea {...register("message", { required: { value: true, message: t.required_field } })} className='form-input' rows={8}></textarea>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={close} type="button" className="btn btn-outline-dark">
            { t.do_not_send }
          </button>

          <button 
            type="submit" 
            disabled={loading}
            className={`btn btn-success ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ?  t.sending_message : <> { t.btn_send } <IconArrowForward /></>}
          </button>

        </div>

      </form>
    </>
  );
};

export default MailToCustomerForm;
