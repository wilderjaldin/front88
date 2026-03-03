"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import Swal from 'sweetalert2'
import axios from 'axios'
import Select from 'react-select';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnPrintDelivery from "@/app/admin/queries/delivery-report/BtnPrintDelivery"

const url_list_customers = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const url_list_orders = process.env.NEXT_PUBLIC_API_URL + 'consulta/MostrarListaEntrega';
const url_cancel = process.env.NEXT_PUBLIC_API_URL + 'consulta/AnularEntrega';

export default function DeliveryReport() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])

  const [seleccionados, setSeleccionados] = useState([])
  const [isSelectItems, setIsSelectItems] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({});

  useEffect(() => {

    async function fetchData() {
      let res = await getListCustomers();
      await getOrders(0);
    }
    fetchData();


  }, []);

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

  const handleChangeCustomer = (value) => {
    setValue('customer', (value?.value) ?? 0);
  };

  const getListCustomers = async () => {
    try {
      const rs = await axios.post(url_list_customers, { ValToken: token });

      let options_customer = [];
      if (rs.data.estado == 'Ok') {
        rs.data.dato.map((s) => {
          if (s.CodCliente != 0) {
            options_customer.push({ value: s.CodCliente, label: s.NomCliente });
          }
        });
        setCustomers(options_customer);
      }
    } catch (error) {

    }
  }

  const getOrders = async (CodCliente = 0) => {
    try {
      const rs = await axios.post(url_list_orders, { CodCliente: CodCliente, ValToken: token });
      if (rs.data.estado == 'Ok') {
        setOrders(rs.data.dato);
      }
    } catch (error) {

    }
  }

  const handleCancelDelivery = async () => {
    Swal.fire({
      title: t.question_cancel_delivery,
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
              NroEntrega: o.NroEntrega,
              ValToken: token
            });
          });
          const rs = await axios.post(url_cancel, data_send);
          
          if (rs.data.estado == 'Ok') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delivery_was_cancel,
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

  const onSubmit = (data) => {
    getOrders(data.customer);
  }
  useDynamicTitle(`${t.query} | ${t.delivery_report}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.query}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.delivery_report} </span>
          </li>
        </ul>
      </div>

      <div className="panel mt-4 gap-4">
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <fieldset>
            <div className="flex sm:flex-row flex-col">
              <label className="text-end pt-2 mb-0  sm:ltr:mr-2 rtl:ml-2" htmlFor="customer">{ t.customer }</label>
              <div className="contents">
                <div className='flex flex-1 relative'>
                  <Select
                    isClearable
                    options={customers}
                    {...register('customer', { required: false })}
                    onChange={handleChangeCustomer}
                    id="customer-select"
                    instanceId="customer-select"
                    menuPosition={'fixed'}
                    menuShouldScrollIntoView={false}
                    classNames={'w-full rtl:rounded-r-none'}
                    placeholder={t.select_option} className='w-full' />

                  <button type="submit" className="btn btn-success ltr:rounded-l-none rtl:rounded-r-none">
                    { t.btn_search }
                  </button>
                </div>

              </div>
            </div>

          </fieldset>
        </form>
      </div>

      <div className="panel mt-4">
        <div className="table-responsive">
          <div className="bg-gray-400 px-4 pt-4">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <button disabled={isSelectItems} onClick={() => handleCancelDelivery()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                { t.cancel_delivery }
              </button>
            </div>
          </div>
          <table className="table-hover">
            <thead>
              <tr className="relative !bg-gray-400 text-center text-sm">
                <th className="w-28"></th>
                <th>{ t.nro_delivery }</th>
                <th>{ t.date }</th>
                <th>{ t.customer }</th>
                <th>{ t.received_by }</th>
                <th>{ t.delivered_by }</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="border border-dark border-1 form-checkbox"
                            checked={seleccionados.includes(o)}
                            onChange={() => toggleSeleccion(o)}
                          />
                        </label>
                        <BtnPrintDelivery token={token} t={t} order={o} className="btn btn-sm btn-dark"></BtnPrintDelivery>
                      </div>
                    </td>
                    <td>{o.NroEntrega}</td>
                    <td>{o.Fecha}</td>
                    <td>{o.NomCliente}</td>
                    <td>{o.RecibidoPor}</td>
                    <td>{o.EntregadoPor}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}