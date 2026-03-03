'use client';

import React, { useEffect} from 'react';
import axios from 'axios'

import IconInfoCircle from '@/components/icon/icon-info-circle';

const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ComprarCotizacionFrmPago';

const MethodPaymentQuote = ({ info_payment, setInfoPayment, load_payment, info_contact, setInfoContact, token, t, order_id, option_payment, setOptionPayment, errorsContact, registerContact }) => {

  

  useEffect(() => {
    if (load_payment) {
      getInfoPayment();
    }
  }, []);

  const getInfoPayment = async () => {
    try {
      const rs = await axios.post(url, { NroOrden: order_id, ValToken: token });
      if (rs.data.estado == 'Ok') {
        setInfoPayment(rs.data.dato1);
        setInfoContact(rs.data.dato2);
        //setLoadPayment(false);
      }
    } catch (error) {
    }
  }

  const handelChangePayment = (e) => {
    setOptionPayment(e.target.value)
  }
  return (
    <>
      <div className="mb-5 flex items-center justify-center">
        <div className="px-8 w-1/2 bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">

          <form action="">
            <fieldset className="space-y-6 mb-8">
              <div className="flex items-center justify-between py-4 border-b border-gray-300">
                <legend className="text-2xl text-gray-700 mr-4">{ t.select_payment_method }</legend>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <label htmlFor="transfer" className="relative flex flex-col bg-white border p-5 rounded-lg shadow-md cursor-pointer">
                  <span className="font-semibold text-gray-500 leading-tight uppercase mb-3">{ t.transfer }</span>
                  <span className="font-bold text-gray-900">
                    <span className="text-2xl uppercase">{ t.banking }</span>
                  </span>

                  <input checked={(option_payment == 'transfer')} type="radio" onChange={handelChangePayment} name="payment" id="transfer" value="transfer" className="absolute h-0 w-0 appearance-none" />
                  <span aria-hidden="true" className="hidden absolute inset-0 border-2 border-green-500 bg-green-200 bg-opacity-10 rounded-lg">
                    <span className="absolute top-4 right-4 h-6 w-6 inline-flex items-center justify-center rounded-full bg-green-200">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </span>
                </label>
                <label htmlFor="contact" className="relative flex flex-col bg-white border p-5 rounded-lg shadow-md cursor-pointer">
                  <span className="font-semibold text-gray-500 leading-tight uppercase mb-3">{ t.form }</span>
                  <span className="font-bold text-gray-900">
                    <span className="text-2xl uppercase">{ t.contact }</span>
                  </span>

                  <input checked={(option_payment == 'contact')} type="radio" onChange={handelChangePayment} name="payment" id="contact" value="contact" className="absolute h-0 w-0 appearance-none" />
                  <span aria-hidden="true" className="hidden absolute inset-0 border-2 border-green-500 bg-green-200 bg-opacity-10 rounded-lg">
                    <span className="absolute top-4 right-4 h-6 w-6 inline-flex items-center justify-center rounded-full bg-green-200">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-green-600">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
            {(option_payment == 'transfer') &&
              <>
                <h2 className='text-black text-lg font-bold'>{ t.make_the_deposit }</h2>
                {info_payment.map((p, index) => {
                  return (
                    <div key={index} className="relative flex items-center p-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                      <div className="flex-1">{p.NomBanco}</div>
                    </div>
                  )
                })}
                <div className='border-dotted border-b-2 border-gray-300 my-4'></div>
                <h2 className='text-black text-lg font-bold'>{ t.send_the_receipt }</h2>
                {info_contact.map((c, index) => {
                  return (
                    <div key={index}>
                      <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-200 my-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                        <div className="flex-1">{t.email}</div>
                        <div className="text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{c.CtoMail}</div>
                      </div>

                      <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-200 my-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                        <div className="flex-1">WhatsApp</div>
                        <div className="text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{c.NumCel}</div>
                      </div>
                    </div>
                  )
                })}
                <blockquote className="flex my-8 rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-secondary bg-white p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">
                  <IconInfoCircle className='text-secondary'></IconInfoCircle> <span className='ml-4'>{ t.order_will_be_processed }</span>
                </blockquote>
              </>
            }
            {(option_payment == 'contact') &&
              <div className='space-y-4 mb-8'>

                <div className="flex sm:flex-row flex-col items-center">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="name">{t.name}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...registerContact("name", { required: { value: true, message: t.required_field } })} aria-invalid={errorsContact.name ? "true" : "false"} placeholder={t.enter_name} className="form-input placeholder:" />
                    {errorsContact.name && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsContact.name?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col items-center">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="email">{t.email}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...registerContact("email", { required: { value: true, message: t.required_field } })} aria-invalid={errorsContact.email ? "true" : "false"} placeholder={t.enter_email} className="form-input placeholder:" />
                    {errorsContact.email && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsContact.email?.message?.toString()}</span>}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col items-center">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="phone">{t.phone}</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...registerContact("phone", { required: { value: true, message: t.required_field } })} aria-invalid={errorsContact.phone ? "true" : "false"} placeholder={t.enter_phone} className="form-input placeholder:" />
                    {errorsContact.phone && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsContact.phone?.message?.toString()}</span>}
                  </div>
                </div>

                

              </div>
            }
          </form>

        </div>
      </div>

    </>
  );
};

export default MethodPaymentQuote;
