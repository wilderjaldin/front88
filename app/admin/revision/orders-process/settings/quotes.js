"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import axios from 'axios'
import IconUserPlus from "@/components/icon/icon-user-plus";
import IconListCheck from "@/components/icon/icon-list-check";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconSearch from "@/components/icon/icon-search";
import IconPrinter from "@/components/icon/icon-printer";
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import BtnPrintQuote from "@/components/BtnPrintQuote"

const url = process.env.NEXT_PUBLIC_API_URL + "ordenes/MostrarCotizaciones"

export default function Quotes({ token, customer_id, quotes, setQuotes, loadQuotes, setLoadQuotes, t }) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState('list');
  const [filteredItems, setFilteredItems] = useState(quotes);
  const [search, setSearch] = useState('');

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);

  useEffect(() => {
    if (loadQuotes) {
      
      getQuotes();
    }
  }, []);

  useEffect(() => {
    async function fetchData() {

      await getQuotes();

    }
    fetchData();

  }, [customer_id]);

  const getQuotes = async () => {
    try {
      const rs = await axios.post(url,
        {
          CodCliente: customer_id,
          Todos: 1,
          NroOrden: 0,
          NroPedido: "",
          ValToken: token
        }
      );
      
      if (rs.data.estado == 'OK') {
        setQuotes(rs.data.dato);
        setFilteredItems(rs.data.dato);
        setLoadQuotes(false);
      }
    } catch (error) {

    }
  }

  const searchQuotes = () => {
    setFilteredItems(() => {
      return quotes.filter((item) => {
        return (item.NroOrden).toString().toLowerCase().includes(search.toLowerCase());
      });
    });
  };

  useEffect(() => {
    searchQuotes();
  }, [search]);

  const addQuote = () => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success mr-4",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
      title: t.question_do_you_have_the_codes,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t.yes,
      cancelButtonText: t.no,
      reverseButtons: false
    }).then((result) => {
      if (result.isConfirmed) {
        router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes`)
      } else if (result.dismiss === Swal.DismissReason.cancel
      ) {
        router.push(`/admin/revision/quotes?customer=${customer_id}&option=quotes-without-code`)
      }
    });
  }

  const batch = () => {
    router.push(`/admin/revision/quotes?customer=${customer_id}&option=batch`)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-xl px-5">{t.quotes}</h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3 px-5">
          <div className="flex gap-3">
            <div>
              <button type="button" className="btn btn-primary" onClick={() => addQuote()}>
                { t.new_quote }
              </button>
            </div>
            <div>
              <button type="button" className="btn btn-primary" onClick={() => batch()}>
                { t.enter_codes_in_batch }
              </button>
            </div>

            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                <IconListCheck />
              </button>
            </div>
            <div>
              <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                <IconLayoutGrid />
              </button>
            </div>

          </div>
          <div className="relative">
            <input type="text" placeholder={t.search} className="peer form-input py-2 ltr:pr-11 rtl:pl-11" onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
              <IconSearch className="mx-auto" />
            </button>
          </div>
        </div>
      </div>
      {!(filteredItems.length) && <h2 className="rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white mt-6 p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">{t.quotes_empty}</h2>}

      {value === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="table-responsive">
            {(filteredItems.length > 0) &&

              <table className="bg-white table-hover">
                <thead>
                  <tr className="relative !bg-gray-400 text-center uppercase">
                    <th></th>
                    <th>{t.nro_quote}</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>{ t.nro_pedido }</th>
                    <th>{ t.quote_date }</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((q, index) => {
                    return (
                      <tr key={index} className={`${(q.TipoCot == 'SC') ? 'bg-gray-200' : '' }`}>
                        <td>
                          <BtnPrintQuote order={q} token={token} className={`btn btn-sm btn-info`}></BtnPrintQuote>
                        </td>
                        <td>
                          <Link className="btn btn-sm btn-outline-info inline-block" href={`/admin/revision/quotes?customer=${customer_id}&option=${ (q.TipoCot == 'NR' ? 'quotes' : 'quotes-without-code') }&id=${q.NroOrden}`}>{q.NroOrden}</Link>
                        </td>
                        <td>{q.NroItems}</td>
                        <td>{q.Total}</td>
                        <td>{q.NroPedido}</td>
                        <td>{q.FecCotizacion}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>)}

      {value === 'grid' && (
        <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 px-5">
          {filteredItems.map((q, index) => {
            return (
              <div className={`${(q.TipoCot == 'SC') ? 'bg-gray-200' : 'bg-white' } border relative overflow-hidden rounded-md  text-center shadow dark:bg-[#1c232f]`} key={index}>
                <div className="relative mt-10 px-6">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_quote}</div>
                      <div className="text-white-dark">
                        <Link className="text-blue-900 hover:underline font-bold" href={`/admin/revision/quotes?customer=${customer_id}&option=${ (q.TipoCot == 'NR' ? 'quotes' : 'quotes-without-code') }&id=${q.NroOrden}`}>{q.NroOrden}</Link>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">Items</div>
                      <div className="text-white-dark">{q.NroItems}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">Total</div>
                      <div className="text-white-dark">{q.Total}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.nro_pedido }</div>
                      <div className="text-white-dark">{q.NroPedido}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.quote_date }</div>
                      <div className="text-white-dark">{q.FecCotizacion}</div>
                    </div>
                  </div>

                  <div className="flex w-full gap-4 my-6 items-center justify-center">
                    <BtnPrintQuote order={q} token={token} className={`btn btn-sm btn-info`}></BtnPrintQuote>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </>
  );
}