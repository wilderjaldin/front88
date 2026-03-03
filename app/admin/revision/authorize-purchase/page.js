"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import { customFormat } from '@/app/lib/format';
import axios from 'axios'
import Swal from 'sweetalert2'

import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'revision/PendientesPorAutorizar';
const url_proceed_to_purchase = process.env.NEXT_PUBLIC_API_URL + 'revision/ProcederCompra';

export default function AuthorizePurchase() {

  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders, setOrders] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [isSelectItems, setIsSelectItems] = useState(false);

  useEffect(() => {

    async function fetchData() {
      await getOrders();
    }
    fetchData();
  }, []);


  const toggleSeleccion = (order) => {
    setSeleccionados((prev) =>
      prev.includes(order) ? prev.filter((i) => i.NroOrden !== order.NroOrden) : [...prev, order]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === orders.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(orders.map((d) => d))
    }
  }

  useEffect(() => {
    if (seleccionados.length > 0) {
      setIsSelectItems(false)
    } else {
      setIsSelectItems(true);
    }
  }, [seleccionados]);

  const getOrders = async () => {
    try {
      const rs = await axios.post(url, { ValToken: token });
      
      if (rs.data.estado == 'OK') {
        setOrders(rs.data.dato);
      }

    } catch (error) {
      
    }
  }

  const ProceedPurchase = async () => {
    
    try {
      let data = [];
      seleccionados.map((o) => {
        data.push({ NroOrden: o.NroOrden, ValToken: token });
      });
      
      const rs = await axios.post(url_proceed_to_purchase, data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.proceed_purchase_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setSeleccionados([]);
        });
        setOrders(rs.data.dato);
      }
    } catch (error) {

    }
  }
  useDynamicTitle(`${ t.revision} | ${t.authorize_purchase}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.revision }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.authorize_purchase }</span>
          </li>
        </ul>
      </div>

      {
        (orders.length > 0) &&

        <div className="table-responsive mt-5">
          <div className="bg-gray-400 p-4">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <button disabled={isSelectItems} onClick={() => ProceedPurchase()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                { t.proceed_to_purchase }
              </button>
            </div>
          </div>
          <table className="bg-white table-hover">
            <thead>
              <tr className="relative !bg-gray-400 text-center uppercase">
                <th>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="border border-dark border-1 bg-white form-checkbox"
                      checked={seleccionados.length === orders.length}
                      onChange={toggleTodos}
                    />
                  </label>
                </th>
                <th>{t.customer}</th>
                <th>{ t.nro_order }</th>
                <th>{t.city}</th>
                <th>Total</th>
                <th>{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, index) => {
                return (
                  <tr key={index} className={`border-b transition-colors ${seleccionados.includes(o) ? 'bg-blue-100' : ''}`}>
                    <td>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="border border-dark border-1 form-checkbox"
                          checked={seleccionados.includes(o)}
                          onChange={() => toggleSeleccion(o)}
                        />
                      </label>
                    </td>
                    <td>{o.NomCliente}</td>
                    <td>{o.NroOrden}</td>
                    <td>{o.Ciudad}</td>
                    <td>{ customFormat(o.Total)}</td>
                    <td>{o.FecOrden}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
    </>
  );
}