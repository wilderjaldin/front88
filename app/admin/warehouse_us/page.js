"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

import TablePending from "@/app/admin/warehouse_us/table-pending";
import TableInWarehouse from "@/app/admin/warehouse_us/table-in-warehouse";
import TableAttached from "@/app/admin/warehouse_us/table-attached";

const URL_LIST = 'ordenescompra/recepcion-usa';
const URL_IN_WAREHOUSE = 'ordenescompra/embalaje-usa';
const URL_ITEMS = 'ordenescompra/detalleitemembalaje-usa';

const TAB_KEYS = ['pending', 'in_warehouse', 'attached'];

const mapOrder = (o) => ({
  NumOrdenCompra: o.numOrdenCompra,
  NroOrden:       o.nroOrden,
  Proveedor:      o.proveedor,
  Cliente:        o.cliente,
  Dias:           o.intDias,
  Status:         o.nomStatus,
  Tracking:       o.numTracking,
  CodPais:        o.codPaisCliente,
  NomPais:        o.nomPais,
});

const mapInWarehouseOrder = (o) => ({
  NroOrden: o.nroCotizacion,
  Cliente:  o.cliente,
  Estado:   o.estadoOrden,
});

const mapAttachedItem = (d) => ({
  NroOrden:    d.nroCotizacion,
  Cliente:     d.cliente,
  NroParte:    d.nroParte,
  Descripcion: d.desRepuesto,
  CanRecibida: d.canRecibida,
});

export default function WarehouseUs() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const t = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inWarehouseOrders, setInWarehouseOrders] = useState([]);
  const [loadingInWarehouse, setLoadingInWarehouse] = useState(false);
  const [attachedItems, setAttachedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const getData = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.get(URL_LIST);
      setOrders((rs.data ?? []).map(mapOrder));
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }

  const getInWarehouseData = async () => {
    setLoadingInWarehouse(true);
    try {
      const rs = await axiosClient.get(URL_IN_WAREHOUSE);
      setInWarehouseOrders((rs.data ?? []).map(mapInWarehouseOrder));
    } catch (error) {

    } finally {
      setLoadingInWarehouse(false);
    }
  }

  useEffect(() => {
    getData();
    getInWarehouseData();
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
  }, [activeTab, orders.length]);

  const handleTabChange = (index) => {
    router.push(`?option=${TAB_KEYS[index]}`, { scroll: false });
  };

  const handleViewItems = async (selected) => {
    if (selected.length === 0) return;
    setLoadingItems(true);
    try {
      const rs = await axiosClient.post(URL_ITEMS, {
        nrocotizacion: selected.map(o => o.NroOrden),
      });
      setAttachedItems((rs.data ?? []).map(mapAttachedItem));
      router.push(`?option=attached`, { scroll: false });
    } catch (error) {

    } finally {
      setLoadingItems(false);
    }
  };

  useDynamicTitle(`${t.warehouse_us}`);

  const tabLabels = [
    t.unreceived_purchase_orders,
    t.in_warehouse,
    t.attached_items,
  ];

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.warehouse_us}
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
          <TablePending t={t} title={t.unreceived_purchase_orders} orders={orders} loading={loading} onRefresh={getData} onViewItems={handleViewItems} />
        )}
        {activeTab === 1 && (
          <TableInWarehouse t={t} orders={inWarehouseOrders} loading={loadingInWarehouse} onRefresh={getInWarehouseData} onViewItems={handleViewItems} />
        )}
        {activeTab === 2 && (
          attachedItems.length === 0 && !loadingItems ? (
            <div className="panel flex flex-col items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">{t.attached_items}</h2>
              <p className="text-sm text-gray-400">{t.select_orders_hint}</p>
            </div>
          ) : (
            <TableAttached t={t} items={attachedItems} loading={loadingItems} />
          )
        )}
      </div>
    </>
  );
}
