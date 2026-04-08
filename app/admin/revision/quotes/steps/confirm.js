'use client';

import React, { useEffect } from 'react';
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ComprarCotizacion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const url_buy_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ConfirmarCotizacion';

const ConfirmQuote = ({ quote_detail, setQuoteDetail, load_detail, setLoadDetail, token, t, order_id, shipping_info, goTo, option_payment, info_contact, info_payment, contact }) => {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {

    if (load_detail) {

      getDetail();
    }
  }, []);

  const getDetail = async () => {
    try {
      const rs = await axios.post(url, { NroOrden: order_id, ValToken: token });

      if (rs.data.estado == 'OK') {
        setQuoteDetail(rs.data.dato[0]);
        setLoadDetail(false);
      }
    } catch (error) {

    }
  }

  const goToQuote = () => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("step");
    nextSearchParams.set('option', 'quotes')
    router.replace(`${pathname}?${nextSearchParams}`);
  }

  const confirmQuote = () => {
    Swal.fire({
      title: t.question_buy_quote,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      confirmButtonText: t.yes_confirm,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const data = {
            NroOrden: order_id,
            FrmPago: (option_payment === 'transfer') ? t.transfer : "CONTACTAR",
            DirEntNomPais: shipping_info.country,
            DirEntNomCiudad: shipping_info.city,
            DirEntDireccion: shipping_info.address,
            DirEntNomEmpresa: shipping_info.company,
            DirEntNomContacto: shipping_info.contact,
            DirEntNumTelefono: shipping_info.phone,
            DirEntMail: shipping_info.email,
            DirEntNomEstado: shipping_info.state,
            DirEntCodPostal: shipping_info.zip,
            CtoNomContacto: contact.name,
            CtoNumTelefono: contact.phone,
            CtoMail: contact.email,
            InsEntrega: shipping_info.note,
            ValToken: token

          }



          let rs = await axios.post(url_buy_quote, data);

          if (rs.data.estado == "Ok") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.quote_buy_success,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              const customer_id = searchParams.get("customer");
              router.push(`/admin/revision/orders-process?customer=${customer_id}&option=open`);
              return;
            });

          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.quote_buy_error,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.quote_buy_success_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  }

  return (
    <div className="mb-5 flex items-center justify-center">
      <div className="mb-5 w-3/4">
        <div className='flex flex-row gap-8'>
          <div className="basis-3/5">

            <div className="px-8 w-full bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">
              <h2 className='text-lg text-black font-bold mt-4'>{t.shipment}/{t.delivery_place}</h2>

              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.country}/{t.city}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.country} / {shipping_info.city}</div>
              </div>

              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.address}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.address}</div>
              </div>
              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.company}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.company}</div>
              </div>
              {(shipping_info.country == 'USA') &&
                <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                  <div className="flex-1">{t.state}</div>
                  <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.state}</div>
                </div>
              }
              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.contact}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.contact}</div>
              </div>
              {(shipping_info.country == 'USA') &&
                <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                  <div className="flex-1">{t.zip}</div>
                  <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.zip}</div>
                </div>
              }
              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.phone}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.phone}</div>
              </div>
              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="flex-1">{t.email}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{shipping_info.email}</div>
              </div>
              <div className="relative flex items-center p-2">
                <div className="flex-1">{t.delivery_instruction}</div>
                <div className="text-blue-600 ltr:ml-auto rtl:mr-auto pl-4">{shipping_info.note}</div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <button type="button" className="btn btn-dark" onClick={() => goTo(2)}>
                  {t.change_delivery_location}
                </button>

              </div>

            </div>

            <div className="mt-8 px-8 w-full bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">
              <h2 className='text-lg text-black font-bold mt-4'>{t.method_of_payment}</h2>

              {(option_payment === 'transfer') ?
                <div>
                  <h2 className='text-lg'>{t.by_bank_transfer}:</h2>

                  {info_payment.map((p, index) => {
                    return (
                      <div key={index} className="relative flex items-center p-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                        <div className="flex-1">{p.NomBanco}</div>
                      </div>
                    )
                  })}

                  <div className='border-dotted border-b-2 border-gray-300 my-4'></div>
                  <h2 className='text-black text-lg font-bold'>{t.send_the_receipt}</h2>

                  {info_contact.map((c, index) => {
                    return (
                      <div key={index}>
                        <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-200 my-4">
                          <div className="flex-1">{t.email}</div>
                          <div className="text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{c.CtoMail}</div>
                        </div>

                        <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-200 my-4">
                          <div className="flex-1">WhatsApp</div>
                          <div className="text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{c.NumCel}</div>
                        </div>
                      </div>
                    )
                  })}

                </div>
                :
                <div>
                  <h2 className='text-lg'>{t.we_will_contact}:</h2>

                  <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                    <div className="flex-1">{t.name}</div>
                    <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{contact.name}</div>
                  </div>
                  <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                    <div className="flex-1">{t.email}</div>
                    <div className="text-blue-600 ltr:ml-auto rtl:mr-auto">{contact.email}</div>
                  </div>
                  <div className="relative flex items-center p-2">
                    <div className="flex-1">{t.phone}</div>
                    <div className="text-blue-600 ltr:ml-auto rtl:mr-auto pl-4">{contact.phone}</div>
                  </div>

                </div>
              }

              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <button type="button" className="btn btn-dark" onClick={() => goTo(3)}>
                  {t.modify_payment_method}
                </button>

              </div>

            </div>

          </div>
          <div className="basis-2/5">
            <div className="px-8 w-full bg-white shadow-[4px_6px_10px_-3px_#bfc9d4] rounded border border-white-light dark:border-[#1b2e4b] dark:bg-[#191e3a] dark:shadow-none">

              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                <div className="flex-1">{t.nro_order}</div>
                <div className="text-xl text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{quote_detail?.NroOrden}</div>
              </div>

              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                <div className="flex-1">{t.nro_pedido}</div>
                <div className="text-xl text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{quote_detail?.NroPedido}</div>
              </div>
              <div className="relative flex items-center p-2 border-dotted border-b-2 border-gray-300">
                <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                <div className="flex-1">Items</div>
                <div className="text-xl text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{quote_detail?.NroItems}</div>
              </div>
              <div className="relative flex items-center p-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary ltr:mr-1 rtl:ml-1.5"></div>
                <div className="flex-1">Total</div>
                <div className="text-xl text-blue-600 font-bold ltr:ml-auto rtl:mr-auto">{quote_detail?.TotResumen}</div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <button type="button" className="btn btn-dark" onClick={() => goToQuote()}>
                  {t.modify}
                </button>

                <button type="button" onClick={() => confirmQuote()} className="btn btn-success">
                  {t.confirm}
                </button>

              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ConfirmQuote;
