"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import Pendings from "@/app/admin/packaging/pendings"
import Packaging from "@/app/admin/packaging/packaging"

import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_LIST_ORDERS = 'embalajes/listar';
const URL_ATTACH_ITEM = 'embalajes/adicionar-item';
const URL_CANCEL_RECEPTION = 'embalajes/anular-recepcion';
const URL_SAVE_ITEMS = 'embalajes/guardar-items';

const TAB_KEYS = ['pending', 'packaging'];

export default function PackagingPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslation();

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const [orders, setOrders] = useState([])
  const [packagings, setPackagings] = useState([]);
  const [term, setTerm] = useState('');

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

  const mapOrders = (list = []) => list.map((o, index) => ({
    id:             index,
    NroRecepcion:   o.numRecepcion,
    NroOrdenCompra: o.numOrdenCompra,
    NomCliente:     o.cliente,
    NroOrden:       o.nroCotizacion,
    DirEntrega:     o.dirEnvio,
    Transporte:     o.transporte,
    Monto:          o.monto,
  }));

  const getLists = async (searchTerm = term) => {
    try {
      const params = {};
      if (searchTerm.trim()) params.term = searchTerm.trim();
      const rs = await axiosClient.get(URL_LIST_ORDERS, { params });
      setOrders(mapOrders(rs.data));
    } catch (error) {

    }
  }

  const cancelReception = async (selected) => {
    const data = selected.map(o => ({
      NumRecepcion:   o.NroRecepcion,
      NumOrdenCompra: o.NroOrdenCompra,
      NroCotizacion:  o.NroOrden,
    }));
    const rs = await axiosClient.post(URL_CANCEL_RECEPTION, data);
    setOrders(mapOrders(rs.data));
  }

  const saveEmbalaje = async (data) => {
    const rs = await axiosClient.post(URL_SAVE_ITEMS, data);
    setOrders(mapOrders(rs.data));
    router.push(`?option=${TAB_KEYS[0]}`, { scroll: false });
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
          CodRepuesto:     o.codRepuesto,
          NroOrden:        o.nroCotizacion,
          NroOrdenCompra:  src?.NroOrdenCompra,
          NroRecepcion:    src?.NroRecepcion,
          NomCliente:      o.cliente,
          NroParteCliente: o.nroParte,
          NroParteCompra:  o.nroParteCompra,
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

  const searchOrders = (searchTerm) => { setTerm(searchTerm); getLists(searchTerm); };
  const clearOrders  = () => { setTerm('');                    getLists(''); };

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
          <Pendings t={t} data={orders} attachOrder={attachOrder} cancelReception={cancelReception} onSearch={searchOrders} onClear={clearOrders} />
        )}
        {activeTab === 1 && (
          <Packaging
            t={t}
            packages={packagings}
            setPackagings={setPackagings}
            saveEmbalaje={saveEmbalaje}
          />
        )}
      </div>
    </>
  );
}
