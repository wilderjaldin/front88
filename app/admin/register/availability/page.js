"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import ComponentAvailabilityForm from "@/components/forms/availability-form";
import IconPlusProps from '@/components/icon/icon-plus';
import DatatablesSparesStock from "@/components/datatables/components-datatables-spares-stock";
import Modal from '@/components/modal';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { getLocale } from '@/store/localeSlice';

const url = process.env.NEXT_PUBLIC_API_URL + 'disponibilidad/MostrarDatosDisponibles';
const url_delete_data = process.env.NEXT_PUBLIC_API_URL + 'disponibilidad/EliminarRegistroCantDisponible';
const url_update_amount = process.env.NEXT_PUBLIC_API_URL + 'disponibilidad/ModificarCantDisponibles';

export default function Availability() {

  const t = useTranslation();
  const token = useSelector(selectToken);
  const [items, setItems] = useState([])

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
   const locale = useSelector(getLocale);

  const {
    register,
    handleSubmit,
    formState: { },
  } = useForm({ defaultValues: { query: '', show_inactive: false } });

  const onSearch = async (data) => {

    //setRowData(rowDataJson)
    try {
      const rs = await axios.post(url, { Idioma: locale, NroParte: data.query, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        setItems(rs.data.dato)
      }
    } catch (error) {

    }
  }

  const removeItem = (item) => {
    Swal.fire({
      title: t.question_delete_available_stock,
      text: item.NroParte + ' ' + item.Descripcion,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_data, { CodRegistro: item.CodRegistro, ValToken: token });

          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.available_stock_deleted,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              updateList(() => {
                return items.filter((i) => {
                  return i.CodRegistro != item.CodRegistro;
                });
              });
            });

          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.available_stock_deleted_error,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.available_stock_deleted_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  }

  const updateAmount = async (item, amount) => {
    try {
      let rs = await axios.post(url_update_amount, { CodRegistro: item.CodRegistro, Cantidad: amount, ValToken: token });

      if (rs.data.estado == "OK") {

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.available_stock_update,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          updateList(() => {
            return items.map((i) => {
              if (i.CodRegistro == item.CodRegistro) {
                i.Cantidad = amount;
              }
              return i;
            });
          });
        });
        return true;
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.available_stock_update_error,
          showConfirmButton: false,
          timer: 1500
        });
        return false;
      }

    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.available_stock_update_error_server,
        showConfirmButton: false,
        timer: 1500
      });
      return false;
    }
  }

  const newStock = () => {
    setModalTitle(t.register_new_stock)
    setModalContent(<ComponentAvailabilityForm action_cancel={() => setShowModal(false)} t={t} token={token} ></ComponentAvailabilityForm>);
    setShowModal(true);
  }

  const updateList = (data) => {
    setItems(data);
  }

  useDynamicTitle(`${t.register} | ${t.availability}` );

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.register }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.availability }</span>
          </li>
        </ul>


        <div className="grid grid-cols-1 gap-6 pt-5">
          <div className={`panel shadow-lg border bg-gray-200`}>
            <div className="mb-5">
              <form className="space-y-5" onSubmit={handleSubmit(onSearch)}>
                <label htmlFor="search" className="text-sm font-medium text-gray-900 dark:text-white">{ t.nro_part }</label>
                <div className="relative">
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                      </svg>
                    </div>
                    <input type="search" defaultValue='' {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={ t.enter_spare_part_search } required />
                    <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{ t.btn_search }</button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
        <div className="my-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => newStock()} type="button" className="btn btn-primary">
              <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
              { t.add_stock }
            </button>
          </div>
        </div>
        <Modal size={'w-full max-w-5xl'} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
        {(items) && <DatatablesSparesStock items={items} t={t} removeItem={removeItem} updateAmount={updateAmount} />}
      </div>
    </>
  );
}