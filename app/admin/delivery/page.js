"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import ItemsToDelivery from "@/app/admin/delivery/items-deliver"
import PendingDelivery from "@/app/admin/delivery/pending-delivery"

import axios from 'axios'
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2'
import { swalSuccess } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

import Modal from '@/components/modal';
import dynamic from 'next/dynamic';
const PdfViewerDelivery = dynamic(() => import('@/app/admin/queries/delivery-report/PdfViewerDelivery'), {
  ssr: false,
});

const URL_LIST_DELIVERIES = 'entregas';
const url_attach = process.env.NEXT_PUBLIC_API_URL + 'entrega/AdjuntarItems';
const url_cancel = process.env.NEXT_PUBLIC_API_URL + 'entrega/AnularEmbalaje';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'entrega/GuardarEntrega';

export default function Delivery() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const urlSort = searchParams.get("sort") ?? 'delivery';
  const urlDir  = searchParams.get("dir")  ?? 'desc';

  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sin fuente todavía: el nuevo GET entregas no trae estas listas de referencia
  // (antes venían en entrega/MostraListaEmbalaje junto al listado).
  const [users, setUsers] = useState([]);
  const [transports, setTransports] = useState([]);
  const [payment_conditions, setPaymentConditions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [seleccionados, setSeleccionados] = useState([])

  const [customer, setCustomer] = useState({})
  const [items, setItems] = useState([]);

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')

  useEffect(() => {
    getLists();
  }, [urlPage, urlSort, urlDir]);

  const getLists = async () => {
    setLoadingOrders(true);
    try {
      const rs = await axiosClient.get(URL_LIST_DELIVERIES, {
        params: { page: urlPage, sort: urlSort, dir: urlDir, codcutomer: 0, to: 0 },
      });
      setOrders(rs.data?.datos ?? []);
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

  const attachItems = async () => {
    try {

      let customers_codes = [];
      if (seleccionados.length > 0) {
        let CadNroEmbalaje = [];
        seleccionados.map(o => {
          CadNroEmbalaje.push(o.NroEmbalaje);
          customers_codes.push(o.CodCliente);
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

        let data_send = {
          CadNroEmbalaje: CadNroEmbalaje.join(","),
          ValToken: token
        };
        const rs = await axios.post(url_attach, data_send);
        if (rs.data.estado == 'Ok') {
          setItems(rs.data.dato);
          setCustomer({ CodCliente: customers_codes[0] });
        }
      }

    } catch (error) {

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
          let data_send = [];
          seleccionados.map(o => {
            data_send.push({
              NroEmbalaje: o.NroEmbalaje,
              ValToken: token
            });
          });
          const rs = await axios.post(url_cancel, data_send);
          if (rs.data.estado == 'Ok') {
            swalSuccess(t.packaging_was_cancel);
            setSeleccionados([])
            getLists();
          }
        } catch (error) {

        }
      }
    });
  }

  const print = (order_id) => {
    setShowModal(true)
    setModalSize('w-full max-w-5xl');
    setTimeout(() => {
      setModalContent(<PdfViewerDelivery order={{ NroEntrega: order_id }} token={token} />);
    }, 500);
  }

  //Guardar Despacho
  const saveDelivery = async (data_send) => {
    try {
      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == 'Ok') {
        swalSuccess(t.delivery_recorded_success);
        setSeleccionados([])
        setItems([]);
        getLists();
        if (rs.data.dato2)
          print(rs.data.dato2);
      }
    } catch (error) {

    }
  }

  useDynamicTitle(`${t.delivery}`);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.home}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.delivery}
        </li>
      </ul>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
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
          />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <ItemsToDelivery
            t={t}
            token={token}
            customer={customer}
            users={users}
            currencies={currencies}
            transports={transports}
            payment_conditions={payment_conditions}
            items={items}
            saveDelivery={saveDelivery}
          />
        </div>
      </div>

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}
