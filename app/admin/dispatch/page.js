"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import ItemsToDelivery from "@/app/admin/dispatch/items-deliver"
import PendingDelivery from "@/app/admin/dispatch/pending-delivery"

import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2'
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

import Modal from '@/components/modal';
import { downloadInvoice, downloadPackingList } from '@/app/lib/embalajeReports';

const URL_LIST_DELIVERIES = 'entregas';
const URL_ATTACH_ITEMS = 'entregas/adjuntar-items';
const URL_CONTROLS = 'entregas/controles';
const URL_SAVE_DISPATCH = 'entregas/guardar-despacho';
const URL_CANCEL_PACKING = 'embalajes/anular';

const TAB_KEYS = ['pending', 'dispatch'];

export default function Dispatch() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslation();

  const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const urlSort = searchParams.get("sort") ?? 'delivery';
  const urlDir  = searchParams.get("dir")  ?? 'desc';
  const urlTerm = searchParams.get("term") ?? '';

  const option = searchParams.get("option") || "";
  const activeTab = Math.max(0, TAB_KEYS.indexOf(option));

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);

  const [seleccionados, setSeleccionados] = useState([])

  const [customer, setCustomer] = useState({})
  const [items, setItems] = useState([]);

  const [show_modal, setShowModal] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    getLists();
  }, [urlPage, urlSort, urlDir, urlTerm]);

  useEffect(() => {
    axiosClient.get(URL_CONTROLS).then(rs => {
      setSellers(rs.data?.vendedores ?? []);
      setDeliverers(rs.data?.despachadores ?? []);
    }).catch(() => {});
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
  }, [activeTab, orders.length, items.length]);

  const getLists = async () => {
    setLoadingOrders(true);
    try {
      const params = { page: urlPage, sort: urlSort, dir: urlDir, codcutomer: 0, to: 0 };
      if (urlTerm.trim()) params.term = urlTerm.trim();
      const rs = await axiosClient.get(URL_LIST_DELIVERIES, { params });
      setOrders(rs.data?.datos ?? []);
      setTotalOrders(rs.data?.total ?? 0);
      setTotalPages(rs.data?.totalPaginas ?? 1);
    } catch (error) {

    }
    setLoadingOrders(false);
  }

  const handleSort = (col) => {
    const params = new URLSearchParams(searchParams.toString());
    if (urlSort === col) {
      params.set("dir", urlDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set("sort", col);
      params.set("dir", 'desc');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set("page", String(newPage)); else params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (term) => {
    const params = new URLSearchParams(searchParams.toString());
    const v = term.trim();
    if (v) params.set("term", v); else params.delete("term");
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("term");
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const goToTab = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("option", key);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (index) => goToTab(TAB_KEYS[index]);

  const attachItems = async () => {
    if (seleccionados.length === 0) return;
    try {
      let customers_codes = [];
      let CadNroEmbalaje = [];
      seleccionados.map(o => {
        CadNroEmbalaje.push(o.nroEmbalaje);
        customers_codes.push(o.codCliente);
      });
      //verifica que sea el mismo cliente
      if (customers_codes.length > 1) {
        let s = new Set(customers_codes);
        let a1 = [...s]
        if (a1.length > 1) {
          Swal.fire({
            title: t.error,
            text: t.different_customers_delivery_error,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }

      }

      const rs = await axiosClient.post(URL_ATTACH_ITEMS, {
        cadNumEmbalaje: CadNroEmbalaje.join(","),
      });
      const list = Array.isArray(rs.data) ? rs.data : [];
      setItems(list.map(i => ({
        NroEmbalaje:  i.numEmbalaje,
        NroOrden:     i.nroCotizacion,
        CodItem:      i.codItem,
        CodRepuesto:  i.codRepuesto,
        NomCliente:   i.cliente,
        NroParte:     i.nroParte,
        Descripcion:  i.desRepuesto,
        Cantidad:     i.cantidad,
        Origen:       i.origen,
        HCode:        i.hCode,
        Material:     i.material,
        Presentacion: i.presentacion,
      })));
      setCustomer({ CodCliente: customers_codes[0] });
      // Deja la lista de pendientes atrás: sin page/sort/dir/term heredados.
      router.push(`?option=${TAB_KEYS[1]}`, { scroll: false });
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  }

  const handleCancelPacking = async () => {
    Swal.fire({
      title: t.question_cancel_packaging,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.close,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const data_send = seleccionados.map(o => o.nroEmbalaje);
          await axiosClient.post(URL_CANCEL_PACKING, data_send);
          swalSuccess(t.packaging_was_cancel);
          setSeleccionados([])
          getLists();
        } catch (error) {
          const apiMsg = error?.response?.data?.mensaje;
          swalError(t.error, apiMsg ?? t.error, t.close);
        }
      }
    });
  }

  // Los reportes son por embalaje (embalajes/{numEmbalaje}/...) — se asume un solo
  // embalaje por despacho, que es el caso visto hasta ahora. Si se llegan a despachar
  // varios embalajes juntos, esto solo cubre el primero.
  const print = (numDespacho, numEmbalaje) => {
    setPrintOrder({ NumDespacho: numDespacho, NumEmbalaje: numEmbalaje });
    setShowModal(true);
  }

  const closePrintModal = () => {
    setShowModal(false);
    setPrintOrder(null);
    // El despacho recién guardado ya no debe aparecer como pendiente.
    getLists();
  }

  const handleDownloadInvoice = async () => {
    setDownloadingReport(true);
    try {
      await downloadInvoice(printOrder.NumEmbalaje, printOrder.NumDespacho);
    } catch (error) {
      console.error('Error al imprimir invoice:', error);
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleDownloadPackingList = async () => {
    setDownloadingReport(true);
    try {
      await downloadPackingList(printOrder.NumEmbalaje, printOrder.NumDespacho);
    } catch (error) {
      console.error('Error al imprimir lista de empaque:', error);
    } finally {
      setDownloadingReport(false);
    }
  };

  //Guardar Despacho
  const saveDelivery = async (data_send) => {
    try {
      const rs = await axiosClient.post(URL_SAVE_DISPATCH, data_send);
      swalSuccess(t.delivery_recorded_success);
      setSeleccionados([])
      setItems([]);
      getLists();
      if (rs.data?.numEntrega)
        print(rs.data.numEntrega, data_send[0]?.nroEmbalaje);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.error, t.close);
    }
  }

  useDynamicTitle(`${t.delivery}`);

  const tabLabels = [
    `${t.pending_dispatch} (${totalOrders})`,
    `${t.delivery} (${items.length})`,
  ];

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.delivery}
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
          <PendingDelivery
            t={t}
            data={orders}
            loading={loadingOrders}
            seleccionados={seleccionados}
            setSeleccionados={setSeleccionados}
            attachItems={attachItems}
            handleCancelPacking={handleCancelPacking}
            page={urlPage}
            sortColumn={urlSort}
            sortDir={urlDir}
            totalPages={totalPages}
            onSort={handleSort}
            onPageChange={handlePageChange}
            term={urlTerm}
            onSearch={handleSearch}
            onClear={handleClearFilter}
          />
        )}
        {activeTab === 1 && (
          <ItemsToDelivery
            t={t}
            customer={customer}
            sellers={sellers}
            deliverers={deliverers}
            items={items}
            saveDelivery={saveDelivery}
          />
        )}
      </div>

      <Modal
        size="w-full max-w-lg"
        closeModal={closePrintModal}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        content={
          printOrder && (
            <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-300">
              {t.delivery_recorded_success}
              <div className="mt-1 text-xs text-gray-400">
                {t.nro_packaging}: {printOrder.NumEmbalaje} — {t.nro_dispatch}: {printOrder.NumDespacho}
              </div>
            </div>
          )
        }
        headerActions={
          printOrder && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={downloadingReport}
                onClick={handleDownloadInvoice}
                className="btn btn-primary btn-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.export_invoice}
              </button>
              <button
                type="button"
                disabled={downloadingReport}
                onClick={handleDownloadPackingList}
                className="btn btn-primary btn-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.export_packing_list}
              </button>
            </div>
          )
        }
      />
    </>
  );
}
