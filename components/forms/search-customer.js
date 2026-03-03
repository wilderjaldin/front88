'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import IconBackSpace from '../icon/icon-backspace';
import IconCheck from '../icon/icon-check';
import IconInfoCircle from '../icon/icon-info-circle';

const url = process.env.NEXT_PUBLIC_API_URL + 'revision/BuscarCliente';

const SearchCustomerForm = ({ token, t, close }) => {

  const router = useRouter();
  const [customers, setCustomers] = useState([])
  const [isSearch, setIsSearch] = useState(false)

  const {
    register, reset,
    handleSubmit,
    setFocus,
    formState: { },
  } = useForm({ defaultValues: {} });

  React.useEffect(() => {
    setFocus("query");
  }, [setFocus]);


  const onSearch = async (data) => {

    try {
      const response = await axios.post(url, { Filtro: data.query, ValToken: token });
      setCustomers(response.data.dato);
      setIsSearch(true);

    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.customer_error_search,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }
  const clear = () => {
    reset({ query: "" });
    setCustomers([]);
    setIsSearch(false);
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="" onSubmit={handleSubmit(onSearch)}>
          <div className="relative">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                </svg>
              </div>
              <input autoFocus type="search" {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={t.enter_search_customer} required />
              <div className="mt-4 flex items-center text-center sm:absolute sm:end-2.5 sm:bottom-2.5">
                <button type="button" onClick={() => clear()} className="btn-dark hover:bg-gray-900 text-white mr-2 font-medium rounded-lg text-sm px-2.5 py-1.5"><IconBackSpace className=''></IconBackSpace></button>
                <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
              </div>
            </div>
          </div>
        </form>
        <div className="table-responsive">
          {(customers.length > 0) &&
            <table className="bg-white table-hover">
              <tbody>
                {customers.map((c, index) => {
                  return (
                    <tr key={index} className='group/item'>
                      <td className='w-1'><button onClick={() => { router.push(`/admin/revision/orders-process?customer=${c.CodCliente}&option=quotes`); close(); }} className='btn btn-sm btn-dark group/edit group-hover/item:btn-success'><IconCheck className='fill-white'></IconCheck> </button> </td>
                      <td className='text-start'>{c.NomCliente}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          }
          {(isSearch && customers.length == 0)
            &&
            <div className="relative flex items-center rounded border !border-info bg-info-light p-3.5 text-info before:absolute before:top-1/2 before:-mt-2 before:border-b-8 before:border-l-8 before:border-t-8 before:border-b-transparent before:border-l-inherit before:border-t-transparent ltr:border-l-[64px] ltr:before:left-0 rtl:border-r-[64px] rtl:before:right-0 rtl:before:rotate-180 dark:bg-info-dark-light">
              <span className="absolute inset-y-0 m-auto h-6 w-6 text-white ltr:-left-11 rtl:-right-11">
                <IconInfoCircle className="h-6 w-6" />
              </span>
              <h2 className='text-dark'>{t.customer_empty}</h2>
            </div>
          }


        </div>
      </div>

    </>
  );
};

export default SearchCustomerForm;
