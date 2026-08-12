"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Orders from '@/app/admin/purchase-reception/orders';
import Receptions from '@/app/admin/purchase-reception/receptions';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_LIST = 'recepcion/listar';
const URL_ATTACH = 'recepcion/adjuntaritems';

const TAB_KEYS = ['orders', 'receptions'];

export default function PurchaseReception() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const [orders, setOrders] = useState([])
  const [receptions, setReceptions] = useState([])

  const [selected_orders, setSelectedOrders] = useState([]);

  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    getList();
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
  }, [activeTab, orders.length, receptions.length]);

  const getList = async () => {
    setLoadingOrders(true);
    try {
      const rs = await axiosClient.get(URL_LIST);

      setOrders((rs.data ?? []).map((o, index) => ({
        id:              index,
        NumOrdenCompra:  o.numOrdenCompra,
        NroOrden:        o.nroOrden,
        NomPrv:          o.proveedor,
        Dias:            o.intDias,
        NumTracking:     o.numTracking,
        Nota:            o.nota,
        CodPaisCliente:  o.codPaisCliente,
        NomPais:         o.nomPais,
        NomStatus:       o.nomStatus,
        CodPrv:          o.codPrv,
        Recepcion1:      o.recepcion1 ?? false,
        Recepcion2:      o.recepcion2 ?? false,
        Recepcion3:      o.recepcion3 ?? false,
        TieneNota:       o.tieneNota ?? false,
      })));
    } catch (error) {

    } finally {
      setLoadingOrders(false);
    }
  }

  const attachOrder = async (selected) => {
    if (selected.length === 0) return;
    setSelectedOrders(selected);
    try {
      const rs = await axiosClient.post(URL_ATTACH, {
        numOrdenCompra: selected.map(o => o.NumOrdenCompra),
      });

      router.push(`?option=${TAB_KEYS[1]}`, { scroll: false });
      setReceptions((rs.data ?? []).map((o, index) => ({
        id:              index,
        NumOrdenCompra:  o.numOrdenCompra,
        NroOrden:        o.nroCotizacion,
        NomCliente:      o.cliente,
        NroParte:        o.nroParteCompra,
        NroParteCliente: o.nroParte,
        Descripcion:     o.desRepuesto,
        CantFaltante:    o.canFaltante,
        CanRecibida:     o.canRecibida,
        CodItem:         o.codItem,
        CodRepuesto:     o.codRepuesto,
        NotaItem:        o.notaItem,
        Origen:          o.origen,
        HCode:           (o.hCode ?? '').trim(),
        Presentacion:    o.presentacion,
        Material:        o.material,
      })));
    } catch (error) {

    }
  }

  const handleTabChange = (index) => {
    router.push(`?option=${TAB_KEYS[index]}`, { scroll: false });
  };

  useDynamicTitle(`${t.purchase_reception}`);

  const tabLabels = [
    t.purchase_orders,
    t.purchase_reception,
  ];

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.purchase_reception}
        </li>
      </ul>

      {/* Tabs con glider */}
      <div className="flex justify-center mb-5">
        <div className="relative flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-slate-700 dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out"
            style={{ left: glider.left, width: glider.width }}
          />
          {tabLabels.map((label, index) => (
            <button
              key={label}
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
          <Orders
            t={t}
            data={orders}
            setOrders={setOrders}
            attachOrder={attachOrder}
            loading={loadingOrders}
            onRefresh={getList}
          />
        )}
        {activeTab === 1 && (
          <Receptions t={t} token={token} data={receptions} setReceptions={setReceptions} selected_orders={selected_orders} onRefresh={getList} />
        )}
      </div>
    </>
  );
}
