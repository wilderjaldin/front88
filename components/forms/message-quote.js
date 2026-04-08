'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import { formatEmailBody } from "@/app/lib/formatEmail";
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarDatosMail';
const url_send_email = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/EnviarMailProforma';

const MessageQuoteForm = ({ close, token, t, order, setItems, setOrder }) => {

  const [disableInput, setDisabledInput] = useState(true)


  const [filteredItems, setFilteredItems] = useState([]);
  const [select_contacts, setSelectContacts] = useState([]);
  const [details_message, setDetailsMessage] = useState([]);



  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    
    getContacts();
  }, []);

  useEffect(() => {
    
    setValue('from', details_message.RemitenteMail);
    setValue('subject', details_message.AsuntoMail);
    setValue('message', details_message.CuerpoMail);
  }, [details_message]);

  const getContacts = async () => {
    try {
      const rs = await axios.post(url, { NroOrden: order.NroOrden, ValToken: token });

      setDetailsMessage(rs.data.dato2[0]);
      setFilteredItems(rs.data.dato1);

    } catch (error) {
      
    }
  }



  const onSave = async (data) => {

    try {
      Swal.fire({
        html: t.sending_message,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const rs = await axios.post(url_send_email, { NroOrden: order.NroOrden, AsuntoMail: data.subject, DestinoMail: data.to, CuerpoMail: formatEmailBody(data.message, "html"), ValToken: token });
      
      Swal.close();
      if (rs.data.estado == 'Ok') {
        close();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.message_sent,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {

        });
      } else if (rs.data.estado == 'Error') {
        close();
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: rs.data.mensaje,
          showConfirmButton: false,
          timer: 3500
        }).then(async (r) => {

        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.message_sent_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const selectContact = (e, contact) => {
    
    let emails = select_contacts;
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


  return (
    <>

      <div className=''>

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
                      <td>
                        <label className="flex items-center cursor-pointer">
                          <input onChange={(e) => selectContact(e, contact)} type="checkbox" className="border border-dark border-1 form-checkbox" />
                        </label>
                      </td>
                      <td>{contact.NomContacto}</td>
                      <td>{contact.Mail1}</td>
                      <td>{contact.Mail2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className={``}>
            <div className="mb-5">
              <form className="space-y-4" onSubmit={handleSubmit(onSave)}>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="to">{t.to_email}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("to", { required: { value: true, message: t.required_field } })} aria-invalid={errors.to ? "true" : "false"} placeholder={t.enter_to} className="form-input placeholder:" />
                    {errors.to && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.to?.message?.toString()}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="from">{t.from_email}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("from", { required: { value: true, message: t.required_field } })} aria-invalid={errors.from ? "true" : "false"} placeholder={t.enter_from} className="form-input placeholder:" />
                    {errors.from && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.from?.message?.toString()}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="subject">{t.subject}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("subject", { required: { value: true, message: t.required_field } })} aria-invalid={errors.subject ? "true" : "false"} placeholder={t.enter_subject} className="form-input placeholder:" />
                    {errors.subject && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.subject?.message?.toString()}</span>}
                  </div>
                </div>
                <div>
                  <textarea {...register("message", { required: { value: true, message: t.required_field } })} className='form-input' rows={8}></textarea>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => close()} type="button" className="btn btn-dark">
                    {t.btn_cancel}
                  </button>

                  <button type="button" onClick={handleSubmit(onSave)} className="btn btn-success">
                    {t.btn_send}
                  </button>

                </div>

              </form>

            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default MessageQuoteForm;
