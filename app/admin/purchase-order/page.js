"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2'
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import PurchaseOrderDetails from "@/app/admin/purchase-order/purchase-order";

import TableUnassign from "@/app/admin/purchase-order/table-unassign"
import TableAssigned from "@/app/admin/purchase-order/table-assigned"
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const URL_LIST_ASSIGNED   = 'ordenescompra/listar-pendientes-asignados';
const URL_LIST_UNASSIGNED = 'ordenescompra/listar-pendientes-no-asignados';
const URL_ASSIGN_ORDER = 'ordenescompra/asignar-item';
const URL_UNASSIGN_ORDER = 'ordenescompra/quitar-item';
const URL_PREVIEW_OC = 'ordenescompra/detalle-items';

const TAB_KEYS = ['pending', 'assigned'];

export default function PurchaseOrder() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders_unassigned, setOrdersUnassigned] = useState([])
  const [orders_assigned, setOrdersAssigned] = useState([])

  const [CadNroOrden, setCadNroOrden] = useState('');

  const [items, setItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [contact, setContact] = useState([]);

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const [reload, setReloadState] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({});

  const setReload = () => {
    setReloadState(!reload);
  }

  // Invalida el cache de ambos tabs; el tab activo se recarga de inmediato
  // y el otro queda pendiente de recarga para la próxima vez que se abra.
  // Se omite en el montaje inicial (loadedTabs ya arranca vacío) para no
  // generar una referencia nueva que dispare un fetch duplicado.
  const isFirstReload = useRef(true);
  useEffect(() => {
    if (isFirstReload.current) { isFirstReload.current = false; return; }
    setLoadedTabs({});
  }, [reload]);

  useEffect(() => {
    const key = TAB_KEYS[activeTab];
    if (loadedTabs[key]) return;
    const fetcher = key === 'assigned' ? fetchAssigned : fetchUnassigned;
    fetcher().then(() => setLoadedTabs(prev => ({ ...prev, [key]: true })));
  }, [activeTab, loadedTabs]);

  useEffect(() => {
    if (option == "") {
      setItems([]);
    }
  }, [option]);

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
  }, [activeTab, orders_unassigned.length, orders_assigned.length]);

  const mapPendingOrder = (o) => ({
    NomProveedor: o.razSoc,
    NroOrden: o.nroCotizacion,
    NroItems: o.nroTems,
    Monto: o.total,
    Dias: o.dias,
    NomCliente: o.nomCliente,
    TieneDivididos: o.tieneDivididos ?? false,
    TieneCambioProveedor: o.tieneCambioProveedor ?? false,
    CodItemsConCambios: o.codItemsConCambios ?? [],
  });

  const fetchAssigned = async () => {
    try {
      const rs = await axiosClient.get(URL_LIST_ASSIGNED);
      setOrdersAssigned((rs.data ?? []).map(mapPendingOrder));
    } catch (error) {

    }
  }

  const fetchUnassigned = async () => {
    try {
      const rs = await axiosClient.get(URL_LIST_UNASSIGNED);
      setOrdersUnassigned((rs.data ?? []).map(mapPendingOrder));
    } catch (error) {

    }
  }

  const assignOrder = async (selected_pending) => {
    try {
      const data = {
        CadNomPrv: selected_pending.map(o => o.NomProveedor),
        CadNroCotizacion: selected_pending.map(o => o.NroOrden),
      };

      const rs = await axiosClient.post(URL_ASSIGN_ORDER, data);

      setOrdersUnassigned((rs.data.noAsignados ?? []).map(mapPendingOrder));
      setOrdersAssigned((rs.data.asignados ?? []).map(mapPendingOrder));
      setLoadedTabs({ pending: true, assigned: true });
      return true;
    } catch (error) {

      return false;
    }
  }

  const unassignOrder = async (selected_assigned) => {
    try {
      const data = {
        CadNomPrv: selected_assigned.map(o => o.NomProveedor),
        CadNroCotizacion: selected_assigned.map(o => o.NroOrden),
      };

      const rs = await axiosClient.post(URL_UNASSIGN_ORDER, data);

      setOrdersUnassigned((rs.data.noAsignados ?? []).map(mapPendingOrder));
      setOrdersAssigned((rs.data.asignados ?? []).map(mapPendingOrder));
      setLoadedTabs({ pending: true, assigned: true });
      return true;
    } catch (error) {

      return false;
    }
  }

  const createPurchaseOrder = async (selected_assigned) => {
    try {
      const names = [...new Set(selected_assigned.map(o => o.NomProveedor))];
      if (names.length > 1) {
        Swal.fire({
          title: t.error,
          text: `${t.different_providers_error} [${names.toString()}]`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

      const cadNroCotizacion = selected_assigned.map(o => o.NroOrden);

      const rs = await axiosClient.post(URL_PREVIEW_OC, {
        CadNomPrv: names,
        CadNroCotizacion: cadNroCotizacion,
      });

      const bloque = (Array.isArray(rs.data) ? rs.data : [])[0] ?? {};
      const detalle = bloque.detalle ?? [];
      const con = bloque.contacto ?? {};
      const add = bloque.datosAdicionales ?? {};

      setItems(detalle.map(d => ({
        CodRepuesto:     d.codRepuesto,
        CodPrv:          d.codProveedor ?? null,
        CodItem:         d.codItem,
        NroOrden:        d.nroCotizacion,
        NroParteCliente: d.nroParte,
        NroParteCompra:  d.nroParteCompra,
        Descripcion:     d.desRepuesto,
        NomPrv:          d.razSoc ?? '',
        CantFaltante:    d.canFaltante,
        CantComprada:    d.canComprada,
        CostoSistema:    d.costo,
        CostoReal:       d.costoReal,
        Total:           d.total,
        OrigenCompra:    d.origenCompra ?? '',
        isDivide:        d.isDivide ?? 0,
        EsDividido:      d.esDividido ?? false,
        NumCorrelativo:  d.numCorrelativo ?? null,
        PuedeDividirCantidad:  d.puedeDividirCantidad  ?? true,
        PuedeCambiarProveedor: d.puedeCambiarProveedor ?? true,
        CambioProveedor:       d.cambioProveedor ?? false,
        CodPrvOriginal:        d.codProveedorOriginal ?? null,
        NomPrvOriginal:        d.razSocOriginal ?? '',
      })));
      setContact({
        NomContato: con.nomContacto,
        Mail:       con.email,
        Telefono:   con.telefono,
      });
      setOrder({
        NomPrv:           add.nomPrv ?? names[0] ?? '',
        CodPrv:           add.codProveedor ?? null,
        NumOrden:         add.numOrden,
        NomPaisProveedor: undefined,
        CodPaisProveedor: undefined,
        NomPaisDestino:   undefined,
        CodPaisDestino:   undefined,
        MtoShipping:      add.mtoShipping ?? 0,
        MtoOtros:         add.mtoOtros ?? 0,
        MtoSubTotal:      add.subTotal ?? 0,
        MtoTotal:         add.total ?? 0,
      });
      setCadNroOrden(cadNroCotizacion.join(","));

    } catch (error) {

    }
  }

  const goToTab = (tabName) => {
    const index = TAB_KEYS.indexOf(tabName);
    if (index !== -1) {
      router.push(`?option=${TAB_KEYS[index]}`, { scroll: false });
    }
  };

  const handleTabChange = (index) => {
    router.push(`?option=${TAB_KEYS[index]}`, { scroll: false });
  };

  useDynamicTitle(`${t.purchase_order}`);

  if (items.length > 0) {
    return (
      <PurchaseOrderDetails setReload={setReload} CadNroOrden={CadNroOrden} token={token} t={t} order={order} items={items} setOrder={() => setItems([])} setItems={setItems} contact={contact} ></PurchaseOrderDetails>
    );
  }

  const tabLabels = [
    `${t.unassigned_pending} (${orders_unassigned.length})`,
    `${t.assigned} (${orders_assigned.length})`,
  ];

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.purchase_order}
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
          <TableUnassign t={t} token={token} goToTab={goToTab} orders_unassigned={orders_unassigned} assignOrder={assignOrder}></TableUnassign>
        )}
        {activeTab === 1 && (
          <TableAssigned t={t} token={token} orders_assigned={orders_assigned} unassignOrder={unassignOrder} createPurchaseOrder={createPurchaseOrder} setReload={setReload} ></TableAssigned>
        )}
      </div>
    </>
  );
}
