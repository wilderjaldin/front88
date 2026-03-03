'use client';
import React, { useState } from 'react';
import { useForm } from "react-hook-form"
import DatatablesSparesStockRegister from '@/components/datatables/components-datatables-spares-stock-register';
import axios from 'axios'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
const url = process.env.NEXT_PUBLIC_API_URL + 'disponibilidad/BuscarNroParte';

const ComponentAvailabilityForm = ({ action_cancel, token, t }) => {

  const [items, setItems] = useState([]);
  const locale = useSelector(getLocale);

  const {
    register,
    handleSubmit,
    formState: { },
  } = useForm();

  const onSearch = async (data) => {
    try {
      const rs = await axios.post(url, { Idioma: locale, NroParte: data.query, ValToken: token });
      if (rs.data.estado == 'OK') {
        setItems(rs.data.dato)
      }
    } catch (error) {
      
    }
  }

  return (
    <>

      <div className='bg-gray-200 shadow-lg border p-4'>

        <div className="grid grid-cols-1 gap-6">
          <div className={``}>
            <div className="mb-5">
              <form className="" onSubmit={handleSubmit(onSearch)}>

                <div className="relative">
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                      </svg>
                    </div>
                    <input type="search" defaultValue='' {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={t.enter_spare_part_search} required />
                    <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        </div>
        <div>
          {(items) && <DatatablesSparesStockRegister action_cancel={() => action_cancel()} items={items} t={t} token={token} />}
        </div>

      </div>
    </>
  );
};

export default ComponentAvailabilityForm;
