"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Pendings from "@/app/admin/packaging/pendings"
import Packaging from "@/app/admin/packaging/packaging"

import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_LIST_ORDERS = 'embalaje/listar';
const URL_ATTACH_ITEM = 'embalaje/adicionar-item';

const TAB_KEYS = ['pending', 'packaging'];

export default function PackagingPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const [orders, setOrders] = useState([])
  const [packagings, setPackagings] = useState([]);

  useEffect(() => {
    getLists();
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab];
      if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    document.fonts?.ready?.then(measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [activeTab, orders.length, packagings.length]);

  const getLists = async () => {
    try {
      const rs = await axiosClient.get(URL_LIST_ORDERS);
      setOrders((rs.data ?? []).map((o, index) => ({
        id:             index,
        NroRecepcion:   o.numRecepcion,
        NroOrdenCompra: o.numOrdenCompra,
        NomCliente:     o.cliente,
        NroOrden:       o.nroCotizacion,
        DirEntrega:     o.dirEnvio,
        Transporte:     o.transporte,
        Monto:          o.monto,
      })));
    } catch (error) {

    }
  }

  const attachOrder = async (selected) => {
    if (selected.length === 0) return;

    let CadNroOrden = [];
    let CadNroOrdenCompra = [];
    let CadNroRecepcion = [];
    let customers_names = [];
    let address_names = [];
    selected.map(o => {
      CadNroOrden.push(o.NroOrden);
      CadNroOrdenCompra.push(o.NroOrdenCompra);
      CadNroRecepcion.push(o.NroRecepcion);
      customers_names.push(o.NomCliente);
      address_names.push(o.DirEntrega);
    });

    if (new Set(customers_names).size > 1) {
      swalError(t.error, t.different_customers_error, t.close);
      return;
    }
    if (new Set(address_names).size > 1) {
      swalError(t.error, t.different_address_error, t.close);
      return;
    }

    try {
      const data = {
        CadNumRecepcion: CadNroRecepcion.join(","),
        CadNroCotizacion: CadNroOrden.join(","),
        CadNumOrdenCompra: CadNroOrdenCompra.join(","),
      };

      const rs = await axiosClient.post(URL_ATTACH_ITEM, data);
      const list = Array.isArray(rs.data) ? rs.data : (rs.data?.dato ?? []);
      // adicionar-item no devuelve NroOrdenCompra/NroRecepcion por item — se
      // recuperan de las órdenes pendientes originalmente seleccionadas (mismo NroOrden).
      const orderMap = new Map(selected.map(o => [String(o.NroOrden), o]));
      setPackagings(list.map((o, index) => {
        const src = orderMap.get(String(o.nroCotizacion));
        return {
          id:              index,
          CodItem:         o.codItem,
          NroOrden:        o.nroCotizacion,
          NroOrdenCompra:  src?.NroOrdenCompra,
          NroRecepcion:    src?.NroRecepcion,
          NomCliente:      o.cliente,
          NroParteCliente: o.nroParte,
          Descripcion:     o.desRepuesto,
          CantRecibida:    o.canRecibida,
          Origen:          o.origen,
          HCode:           o.hCode,
          Material:        o.material,
          Presentacion:    o.presentacion,
        };
      }));
      router.push(`?option=${TAB_KEYS[1]}`, { scroll: false });
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  }

  const handleTabChange = (index) => {
    router.push(`?option=${TAB_KEYS[index]}`, { scroll: false });
  };

  useDynamicTitle(`${t.packaging}`);

  const tabLabels = [
    `${t.pending_packaging} (${orders.length})`,
    `${t.packaging} (${packagings.length})`,
  ];

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.packaging}
        </li>
      </ul>

      <div className="flex justify-center mb-5">
        <div className="relative flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-slate-700 dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out"
            style={{ left: glider.left, width: glider.width }}
          />
          {tabLabels.map((label, index) => (
            <button
              key={index}
              ref={el => { tabRefs.current[index] = el; }}
              type="button"
              onClick={() => handleTabChange(index)}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 outline-none whitespace-nowrap
                ${activeTab === index
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate__animated animate__faster animate__fadeIn">
        {activeTab === 0 && (
          <Pendings t={t} token={token} data={orders} attachOrder={attachOrder} onRefresh={getLists} />
        )}
        {activeTab === 1 && (
          <Packaging
            t={t}
            token={token}
            packages={packagings}
            setPackagings={setPackagings}
            onRefresh={getLists}
          />
        )}
      </div>
    </>
  );
}
