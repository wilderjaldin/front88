"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import { customFormat } from '@/app/lib/format';
import axios from 'axios';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_PENDIENTES       = 'cotizaciones/pendientes-autorizar';
const URL_PROCEDER_COMPRA  = process.env.NEXT_PUBLIC_API_URL + 'revision/ProcederCompra';

export default function AuthorizePurchase() {
  const token = useSelector(selectToken);
  const t     = useTranslation();

  const [orders,        setOrders]        = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => { getOrders(); }, []);

  const toggleSeleccion = (order) => {
    setSeleccionados(prev =>
      prev.some(o => o.nroCotizacion === order.nroCotizacion)
        ? prev.filter(o => o.nroCotizacion !== order.nroCotizacion)
        : [...prev, order]
    );
  };

  const toggleTodos = () => {
    setSeleccionados(seleccionados.length === orders.length ? [] : [...orders]);
  };

  const getOrders = async () => {
    try {
      const rs = await axiosClient.get(URL_PENDIENTES);
      setOrders(rs.data ?? []);
    } catch {}
  };

  const proceedPurchase = async () => {
    try {
      const data = seleccionados.map(o => ({ NroOrden: o.nroCotizacion, ValToken: token }));
      const rs   = await axios.post(URL_PROCEDER_COMPRA, data);
      if (rs.data.estado === 'OK') {
        Swal.fire({
          position: "top-end", icon: "success",
          title: t.proceed_purchase_success,
          showConfirmButton: false, timer: 1500,
        });
        setOrders(rs.data.dato ?? []);
        setSeleccionados([]);
      }
    } catch {}
  };

  useDynamicTitle(`${t.revision} | ${t.authorize_purchase}`);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.revision}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.authorize_purchase}
        </li>
      </ul>

      {orders.length > 0 && (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0 mt-5">
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <button
              type="button"
              onClick={proceedPurchase}
              disabled={seleccionados.length === 0}
              className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium
                hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {t.proceed_to_purchase}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  {['', t.customer, t.nro_order, t.city, 'Total $us', t.date].map((h, i) => (
                    <th key={i} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap">
                      {i === 0
                        ? <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={orders.length > 0 && seleccionados.length === orders.length}
                            onChange={toggleTodos}
                          />
                        : h
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((o, i) => (
                  <tr
                    key={i}
                    className={`transition-colors ${
                      seleccionados.some(s => s.nroCotizacion === o.nroCotizacion)
                        ? 'bg-primary/5 dark:bg-primary/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={seleccionados.some(s => s.nroCotizacion === o.nroCotizacion)}
                        onChange={() => toggleSeleccion(o)}
                      />
                    </td>
                    <td className="text-xs text-gray-700 dark:text-gray-300 px-3 py-2 font-medium">{o.nomCliente}</td>
                    <td className="text-xs text-gray-700 dark:text-gray-300 px-3 py-2 font-semibold text-primary">{o.nroCotizacion}</td>
                    <td className="text-xs text-gray-500 px-3 py-2">{o.nomCiudad}</td>
                    <td className="text-xs text-gray-700 dark:text-gray-300 px-3 py-2 text-right font-medium">{customFormat(o.totalSus)}</td>
                    <td className="text-xs text-gray-400 px-3 py-2">{o.fecOrden}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
