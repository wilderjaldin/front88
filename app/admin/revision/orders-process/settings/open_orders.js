"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import axios from 'axios'
import IconSearch from "@/components/icon/icon-search";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconListCheck from "@/components/icon/icon-list-check";
const url = process.env.NEXT_PUBLIC_API_URL + "ordenes/MostrarCotizacionesAbiertas"

export default function OpenOrders({ token, customer_id, t, setLoadOpenOrders, loadOpenOrders, setOpenOrders, open_orders }) {



  const [value, setValue] = useState('list');
  const [filteredItems, setFilteredItems] = useState(open_orders);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (loadOpenOrders) {
      getOrders();
    }
  }, []);

  const getOrders = async () => {
    try {
      const rs = await axios.post(url,
        {
          CodCliente: customer_id,
          ValToken: token
        }
      );
      if (rs.data.estado == 'OK') {
        setOpenOrders(rs.data.dato);
        setFilteredItems(rs.data.dato);
        setLoadOpenOrders(false);
      }
    } catch (error) {

    }
  }

  const searchQuotes = () => {
    setFilteredItems(() => {
      return open_orders.filter((item) => {
        return (item.NroOrden).toString().toLowerCase().includes(search.toLowerCase());
      });
    });
  };

  useEffect(() => {
    searchQuotes();
  }, [search]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-xl">{t.quotes}</h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex gap-3">
            
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
                    <th>{t.nro_quote}</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>{ t.nro_pedido }</th>
                    <th>{ t.quote_date }</th>
                    <th>{ t.date_order }</th>
                    <th>{ t.status }</th>
                  </tr>
                </thead>
                <tbody>
                  {open_orders.map((o, index) => {
                    return (
                      <tr key={index}>
                        <td>{o.NroOrden}</td>
                        <td>{o.NroItems}</td>
                        <td>{o.Total}</td>
                        <td>{o.NroPedido}</td>
                        <td>{o.FecCotizacion}</td>
                        <td>{o.FecOrden}</td>
                        <td>{o.Estado}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>)}

      {value === 'grid' && (
        <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((q, index) => {
            return (
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                <div className="relative my-10 px-6">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_quote}</div>
                      <div className="text-white-dark">{q.NroOrden}</div>
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
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.date_order }</div>
                      <div className="text-white-dark">{q.FecOrden}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.status }</div>
                      <div className="text-white-dark">{q.Estado}</div>
                    </div>
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