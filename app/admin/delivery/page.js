"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import ItemsToDelivery from "@/app/admin/delivery/items-deliver"

import axios from 'axios'
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

import Modal from '@/components/modal';
import dynamic from 'next/dynamic';
const PdfViewerDelivery = dynamic(() => import('@/app/admin/queries/delivery-report/PdfViewerDelivery'), {
  ssr: false,
});

const url_lists_orders = process.env.NEXT_PUBLIC_API_URL + 'entrega/MostraListaEmbalaje';
const url_attach = process.env.NEXT_PUBLIC_API_URL + 'entrega/AdjuntarItems';
const url_cancel = process.env.NEXT_PUBLIC_API_URL + 'entrega/AnularEmbalaje';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'entrega/GuardarEntrega';



export default function Delivery() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();
  const locale = useSelector(getLocale);

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [transports, setTransports] = useState([]);
  const [payment_conditions, setPaymentConditions] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [seleccionados, setSeleccionados] = useState([])
  const [isSelectItems, setIsSelectItems] = useState(false);

  const [customer, setCustomer] = useState({})
  const [items, setItems] = useState([]);

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')

  useEffect(() => {

    async function fetchData() {
      let res = await getLists();
    }
    fetchData();


  }, []);

  const getLists = async () => {
    try {
      const rs = await axios.post(url_lists_orders, { Idioma: locale, ValToken: token });
      if (rs.data.estado == 'Ok') {
        setOrders(rs.data.dato1);
        let _users = [];
        rs.data.dato2.map(o => {
          if (o.CodUsuario != 0) {
            _users.push({ value: o.CodUsuario, label: o.NomUsuario });
          }
        });
        setUsers(_users);

        let _trans = [];
        rs.data.dato3.map(o => {
          if (o.CodTransporte != "") {
            _trans.push({ value: o.CodTransporte, label: o.DesTransporte });
          }
        });
        setTransports(_trans);

        let _conditions = [];
        rs.data.dato4.map(o => {
          if (o.CodCondPago != "") {
            _conditions.push({ value: o.CodCondPago, label: o.DesCondPago });
          }
        });
        setPaymentConditions(_conditions);

        let _coins = [];
        rs.data.dato5.map(o => {
          if (o.CodMoneda != "") {
            _coins.push({ value: o.CodMoneda, label: o.DesMoneda });
          }
        });
        setCurrencies(_coins);

      }
    } catch (error) {

    }
  }

  const toggleSeleccion = (order) => {
    setSeleccionados((prev) =>
      prev.includes(order) ? prev.filter((i) => i !== order) : [...prev, order]
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
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.packaging_was_cancel,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              setSeleccionados([])
              setOrders(rs.data.dato);
            });
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
      setModalContent(<PdfViewerDelivery order={ {NroEntrega: order_id} } token={token} />);
    }, 500); // 100ms suele ser suficiente
  }

  //Guardar Despacho
  const saveDelivery = async (data_send) => {
    try {
      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.delivery_recorded_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setSeleccionados([])
          setItems([]);
          setOrders(rs.data.dato1);
          if(rs.data.dato2)
            print(rs.data.dato2);
        });

      }
    } catch (error) {
      
    }
  }
  useDynamicTitle(`${t.delivery}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.delivery} </span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-12 mt-4 gap-4">
        <div className="col-span-4">
          <div className="panel">
            <h2 className="font-bold text-xl mb-4">{t.pending_delivery}</h2>
            <div className="table-responsive mt-5">
              <div className="bg-gray-400 p-4">
                <div className="flex flex-wrap items-center justify-start gap-2">
                  <button disabled={isSelectItems} onClick={() => handleCancelPacking()} type="button" className="btn enabled:btn-outline-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                    {t.cancel_packaging}
                  </button>

                  <button disabled={isSelectItems} onClick={() => attachItems()} type="button" className="btn enabled:btn-primary disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                    {t.attach_items}
                  </button>
                </div>
              </div>
              <table className="table-hover table-compact">
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
                    <th>{t.packaging_number}</th>
                    <th>{t.customer}</th>
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
                        <td>{o.NroEmbalaje}</td>
                        <td>{o.NomCliente}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-span-8">
          <div className="panel">
            <h2 className="font-bold text-xl mb-4">{t.items_to_deliver}</h2>
            <ItemsToDelivery t={t} token={token} customer={customer} users={users} currencies={currencies} transports={transports} payment_conditions={payment_conditions} items={items} saveDelivery={saveDelivery}></ItemsToDelivery>
          </div>
        </div>
      </div>

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}