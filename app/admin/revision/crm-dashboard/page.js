"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useOptionsSelect } from '@/app/options'
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Link from "next/link";
import IconSave from "@/components/icon/icon-save";
import IconCheck from "@/components/icon/icon-check";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'revision/MostrarDatosSeguimiento';
const url_proceed_to_purchase = process.env.NEXT_PUBLIC_API_URL + 'revision/ProcederCompra';
const url_save_note_follow = process.env.NEXT_PUBLIC_API_URL + 'revision/GuardarNotaSeguimiento';
const url_save_note = process.env.NEXT_PUBLIC_API_URL + 'revision/GuardarAnotacion';
const url_close_message = process.env.NEXT_PUBLIC_API_URL + 'revision/CerrarMensaje';
const url_close_follow = process.env.NEXT_PUBLIC_API_URL + 'revision/CerrarSeguimientoCot';

export default function CRMDashboard() {

  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders_quote, setOrdersQuote] = useState([])
  const [orders_follow, setOrdersFollow] = useState([])
  const [message, setMessage] = useState([])
  const [inbox, setInbox] = useState([])

  const {
    register,
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

  useEffect(() => {
    
    setValue('note', message?.Anotacion)
  }, [message]);

  const getData = async () => {
    try {
      const rs = await axios.post(url, { ValToken: token });
      
      if (rs.data.estado == 'OK') {
        setOrdersQuote(rs.data.dato1);
        setOrdersFollow(rs.data.dato2);
        setInbox(rs.data.dato3);
        setMessage(rs.data.dato4[0]);
      }

    } catch (error) {
      
    }
  }

  const newMessage = () => {
    setValue('note', '');
  }

  const saveNote = async (order, type) => {
    try {
      let note = getValues(`${type}.${order.NroOrden}.note`);
      const rs = await axios.post(url_save_note_follow, { CodRegistro: order.CodRegistro, Anotacion: note, ValToken: token });
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_note_success,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      
    }
  }

  const saveMessage = async () => {
    try {
      let note = getValues('note');
      const rs = await axios.post(url_save_note, { CodRegistro: message.CodRegistro, Anotacion: note, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_note_success,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {

    }
  }

  const closeMessage = async (m) => {
    try {
      const rs = await axios.post(url_close_message, { CodMensaje: m.CodMensaje, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.close_message_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setInbox(rs.data.dato)
        });
      }
    } catch (error) {
      
    }
  }

  const closeFollow = async (o, type) => {
    try {
      const rs = await axios.post(url_close_follow, { CodRegistro: o.CodRegistro, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.close_follow_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          if(type == 'quote'){
            setOrdersQuote(rs.data.dato);
          } else if(type == 'follow'){
            setOrdersFollow(rs.data.dato);
          }
        });
      }
    } catch (error) {
      
    }
  }
  useDynamicTitle(`${ t.revision } | ${t.panel_crm}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.revision }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.panel_crm }</span>
          </li>
        </ul>
      </div>
      <div className="flex flex-row gap-6">
        <div className="basis-3/4">

          <div className="table-responsive mt-5">
            <h2 className="text-xl font-bold text-blue-600">{ t.pending_quote }</h2>
            <table className="bg-white table-hover text-sm">
              <thead>
                <tr className="relative !bg-gray-400 text-center text-sm">
                  <th className="w-1 !p-0">
                  </th>
                  <th>{ t.nro_order }</th>
                  <th>{ t.days }</th>
                  <th>{t.customer}</th>
                  <th>{t.application}</th>
                  <th>{ t.shared_by }</th>
                  <th>{t.note}</th>
                </tr>
              </thead>
              <tbody>
                {orders_quote.map((o, index) => {
                  return (
                    <tr key={index} className="group/item">
                      <td className="w-1 !p-1">
                        <label title="" className="cursor-pointer" onClick={() => closeFollow(o, 'quote') }>
                          <IconCheck className="fill-gray-400 group/edit group-hover/item:fill-green-400"></IconCheck>
                        </label>
                      </td>
                      <td>
                        <Link className="text-blue-900 hover:underline font-bold" href={`/admin/revision/quotes?customer=${o.CodCliente}&option=${(o.TipCot == 'NR') ? 'quotes' : 'quotes-without-code'}&id=${o.NroOrden}`}>{o.NroOrden}</Link>
                      </td>
                      <td className="w-2">{o.Dias}</td>
                      <td className="w-2">{o.NomCliente}</td>
                      <td className="w-2">{o.Aplicacion}</td>
                      <td className="w-2">{o.CompartidoPor}</td>
                      <td className="!p-0">
                        <div className="flex items-center justify-center">
                          <input defaultValue={o.Nota} {...register(`quote.${o.NroOrden}.note`, { required: false })} type="text" placeholder="" className="form-input border border-dark border-1 ltr:rounded-r-none rtl:rounded-l-none " />
                          <button onClick={() => saveNote(o, 'quote')} type="button" className="btn btn-outline-dark ltr:rounded-l-none rtl:rounded-r-none px-1">
                            <IconSave></IconSave>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="table-responsive mt-10">
            <h2 className="text-xl font-bold text-blue-600">{ t.pending_follow_up }</h2>
            <table className="bg-white table-hover">
              <thead>
                <tr className="relative !bg-gray-400 text-center !text-sm">
                  <th className="w-1 !p-0"></th>
                  <th>{ t.nro_order }</th>
                  <th>{ t.days }</th>
                  <th>{t.customer}</th>
                  <th>Total $us</th>
                  <th>{ t.shared_by }</th>
                  <th>{ t.type_of_follow_up }</th>
                  <th>{t.note}</th>
                </tr>
              </thead>
              <tbody>
                {orders_follow.map((o, index) => {
                  return (
                    <tr key={index} className="group/item">
                      <td className="w-1 !p-1">
                        <label title="Cerrar seguimiento" className="cursor-pointer" onClick={() => closeFollow(o, 'follow') }>
                          <IconCheck className="fill-gray-400 group/edit group-hover/item:fill-green-400"></IconCheck>
                        </label>
                      </td>
                      <td className="w-2">
                        <Link className="text-blue-900 hover:underline font-bold" href={`/admin/revision/quotes?customer=${o.CodCliente}&option=${(o.TipCot == 'NR') ? 'quotes' : 'quotes-without-code'}&id=${o.NroOrden}`}>{o.NroOrden}</Link>
                      </td>
                      <td className="w-2">{o.Dias}</td>
                      <td className="w-2">{o.NomCliente}</td>
                      <td className="w-2">{customFormat(o.Total)}</td>
                      <td className="w-2">{o.CompartidoPor}</td>
                      <td className="w-2">{o.TipSeguimiento}</td>
                      <td className="!p-0">
                        <div className="flex items-center justify-center">
                          <input defaultValue={o.Nota} {...register(`follow.${o.NroOrden}.note`, { required: false })} type="text" placeholder="" className="form-input border border-dark border-1 ltr:rounded-r-none rtl:rounded-l-none " />
                          <button onClick={() => saveNote(o, 'follow')} type="button" className="btn btn-outline-dark ltr:rounded-l-none rtl:rounded-r-none px-1">
                            <IconSave></IconSave>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
        <div className="basis-1/4">
          <div className="bg-gray-200 shadow-lg mt-10 p-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h2 className="text-xl font-bold text-blue-600 mb-4 upercase">{ t.notes }</h2>
                <textarea {...register('note')} className="form-input" rows={8}></textarea>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <button onClick={() => newMessage()} type='button' className='btn btn-outline-secondary'> {t.btn_new} </button>
                  <button onClick={() => saveMessage()} type='button' className='btn btn-success'> {t.btn_save} </button>
                </div>
              </div>
              <div className="border-t border-1 border-gray-400 h-1 w-full my-4"></div>
              <div className="">
                <h2 className="text-xl font-bold text-blue-600 mb-4 updercase">{ t.inbox }</h2>
                <table className="bg-white table-hover text-sm">
                  <thead>
                    <tr className="relative !bg-gray-400 text-center text-sm">
                      <th>{ t.started_by }</th>
                      <th>{ t.message }</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inbox.map((m, index) => {
                      return (
                        <tr className="text-sm group/item" key={index}>
                          <td>{m.Notificacion}</td>
                          <td>{m.DesMensaje}</td>
                          <td>
                            <label className="cursor-pointer" onClick={() => closeMessage(m) }>
                              <IconCheck className="fill-gray-400 group/edit group-hover/item:fill-green-400"></IconCheck>
                            </label>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>



    </>
  );
}