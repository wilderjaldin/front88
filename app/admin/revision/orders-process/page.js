"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import OptionsFilter from "@/app/admin/revision/orders-process/options-filter"
import Settings from "./settings";
import Link from "next/link";
import { customFormat } from '@/app/lib/format';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnPrintQuote from "@/components/BtnPrintQuote"
const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/ObtenerLista';

const url_search = process.env.NEXT_PUBLIC_API_URL + 'revision/MostrarOrdenesProceso';
const url_filter = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaAgrupadaCliente';
const url_lists = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaEstadoOrden';
const url_list_customers = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const url_delivered = process.env.NEXT_PUBLIC_API_URL + 'revision/EntregarOrden';
const url_cancel_order = process.env.NEXT_PUBLIC_API_URL + 'revision/AnularOrden';

const tabs = { '0': 'quotes', '1': 'open', '2': 'completed' }

export default function OrdersProcess() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [customer, setCustomer] = useState(null)
  const [customers, setCustomers] = useState([])
  const [status, setStatus] = useState([])
  const [order_by, setOrderBy] = useState([{ value: 1, label: t.select_customer }, { value: 2, label: t.select_days_process }, { value: 3, label: t.select_nro_order }])
  const option = searchParams.get("option") || "";
  const customer_id = searchParams.get("customer");
  const [orders, setOrders] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [isSelectItems, setIsSelectItems] = useState(false);
  const locale = useSelector(getLocale);
  const {
    register,
    handleSubmit, reset, getValues, setValue, setError,
    formState: { errors },
  } = useForm();


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);

  const alreadyCalled = useRef(false);

  useEffect(() => {
    if (alreadyCalled.current) return;
    alreadyCalled.current = true;

    async function fetchData() {

      await getListsStatus();
      let customers = await getListsCustomers();
      if (customer_id) {
        getCustomer(customer_id, customers);
      } else {

      }
      await onSearch();


    }
    fetchData();

  }, []);

  useEffect(() => {
    if (option == "") {
      setCustomer(null);
    }
  }, [option]);

  useEffect(() => {
    if (customer_id) {
      getCustomer(customer_id, customers);
      // setShowForm(false);
    }
  }, [customer_id]);



  const toggleSeleccion = (order) => {
    setSeleccionados((prev) =>
      prev.includes(order) ? prev.filter((i) => i.NroOrden !== order.NroOrden) : [...prev, order]
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

  const onSearch = async (CodCliente = 0, NroOrden = 0, CodEstado = "", OrdenarPor = 0) => {
    try {
      let data = {
        Idioma: locale,
        CodCliente: CodCliente,
        NroOrden: NroOrden,
        CodEstado: CodEstado,
        OrdenarPor: OrdenarPor,
        ValToken: token
      }

      const rs = await axios.post(url_search, data);


      if (rs.data.estado == 'Ok') {
        setOrders(rs.data.dato);
      }
    } catch (error) {

    }
  }

  const filterAction = async (CodCliente = 0, NroOrden = 0, CodEstado = "", OrdenarPor = 0) => {
    try {
      let data = {
        CodCliente: CodCliente,
        NroOrden: NroOrden,
        CodEstado: CodEstado,
        OrdenarPor: OrdenarPor,
        ValToken: token
      }

      const rs = await axios.post(url_filter, data);


      if (rs.data.estado == 'Ok') {
        setShowModal(true);
        setModalTitle('');

        setModalContent(<OptionsFilter cancel={() => setShowModal(false)} setOrders={setOrders} token={token} t={t} customers={rs.data.dato}></OptionsFilter>);
      }
    } catch (error) {

    }
  }

  const getListsStatus = async () => {
    let array = [];
    try {
      const rs = await axios.post(url_lists, { ValToken: token });

      if (rs.data.estado == 'Ok') {

        let options_status = [];
        rs.data.dato.map((s) => {
          if (s.CodEstado != 0) {
            options_status.push({ value: s.CodEstado, label: s.NomEstadoOrden });
          }
        });
        array.status = options_status;
        setStatus(options_status);

      }
      return array;

    } catch (error) {

      return [];
    }
  }

  const getListsCustomers = async () => {
    let options_customer = [];
    try {
      const rs = await axios.post(url_list_customers, { ValToken: token });

      if (rs.data.estado == 'Ok') {


        rs.data.dato.map((s) => {
          if (s.CodCliente != 0) {
            options_customer.push({ value: s.CodCliente, label: s.NomCliente });
          }
        });
        setCustomers(options_customer);

      }
      return options_customer;

    } catch (error) {

      return [];
    }
  }

  const getCustomer = async (id, customers) => {

    let cs = (customers).find((key) => key.value == id) || null;
    setCustomer(cs);
  }

  const handleChangeStatus = (value) => {
    if (value) {
      setValue('status', value?.value);
    } else {
      setValue('status', null);
    }
  };

  const handleChangeCustomer = (value) => {

    setValue('customer', (value?.value) ?? null);
  };

  const handleChangeOrderBy = (value) => {
    setValue('order_by', (value?.value) ?? null);
  }

  const onSubmitSearch = async () => {
    let data = getValues();

    setSeleccionados([]);
    await onSearch((data.customer) ?? 0, ((data.nro_order != "") ? data.nro_order : 0), (data.status) ?? "", (data.order_by) ?? 0);
  }

  const onFilter = async () => {
    let data = getValues();

    await filterAction((data.customer) ?? 0, ((data.nro_order != "") ? data.nro_order : 0), (data.status) ?? "", (data.order_by) ?? 0);
  }

  const delivered = async () => {
    try {
      let data = [];
      seleccionados.map(order => {
        data.push({ Idioma: locale, NroOrden: order.NroOrden, ValToken: token });
      });

      const rs = await axios.post(url_delivered, data);

      if (rs.data.estado == 'Ok') {

        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.order_delivered_success,
          confirmButtonText: t.close
        }).then(async (r) => {
          setOrders(rs.data.dato);
        });
      }
    } catch (error) {

    }
  }

  const cancelOrder = async () => {
    try {
      let data = [];
      seleccionados.map(order => {
        data.push({ Idioma: locale, NroOrden: order.NroOrden, ValToken: token });
      });

      const rs = await axios.post(url_cancel_order, data);

      if (rs.data.estado == 'Ok') {

        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.order_cancel_success,
          confirmButtonText: t.close
        }).then(async (r) => {
          setOrders(rs.data.dato);
        });
      }
    } catch (error) {

    }
  }
  useDynamicTitle(`${((customer)) ? t.orders_in_process + ' | ' + customer.label : t.revision} | ${t.orders_in_process}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.revision}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            {(customer) ? <Link href={`/admin/revision/orders-process`} className="text-blue-600 hover:underline">{t.orders_in_process}</Link> : <span>{t.orders_in_process}</span>}
          </li>
          {(customer) &&
            <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
              <span className="bg-blue-600 p-2 text-white rounded"> {customer.label} </span>
            </li>
          }
        </ul>
      </div>
      {!(customer) &&
        <>
          <div className="panel shadow-lg bg-gray-200 mt-5 mb-8 pb-1">
            <div className="">
              <form className="grid grid-cols-2 gap-4">
                <div>
                  <div className="space-y-4">
                    <div className="flex sm:flex-row flex-col">
                      <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="status">{t.condition}</label>
                      <div className="relative flex-1">
                        <Select
                          isClearable
                          options={status}
                          {...register('status', { required: false })}
                          onChange={handleChangeStatus}
                          id="status-select"
                          placeholder={t.select_option} className='w-full' />
                        {errors.status && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.status?.message?.toString()}</span>}
                      </div>
                    </div>

                    <div className="flex sm:flex-row flex-col">
                      <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="customer">{t.customer}</label>
                      <div className="contents">
                        <div className='flex flex-1 relative'>
                          <Select
                            isClearable
                            options={customers}
                            {...register('customer', { required: { value: true, message: t.required_select } })}
                            onChange={handleChangeCustomer}
                            id="customer-select"
                            instanceId="customer-select"
                            menuPosition={'fixed'}
                            menuShouldScrollIntoView={false}
                            classNames={'w-full rtl:rounded-r-none'}
                            placeholder={t.select_option} className='w-full' />
                          <div className='block absolute -bottom-10 left-0'>
                            {errors.customer && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.customer?.message?.toString()}</span>}
                          </div>

                        </div>

                      </div>
                    </div>
                  </div>


                </div>
                <div>


                  <div className="space-y-4">
                    <div className="flex sm:flex-row flex-col">
                      <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="nro_order">{t.nro_order}</label>
                      <div className="relative flex-1">
                        <input type='text' autoComplete='OFF' {...register("nro_order", { required: false })} placeholder={t.login.enter_email} className="form-input placeholder:" />
                      </div>
                    </div>

                    <div className="flex sm:flex-row flex-col">
                      <label className="text-end pt-2 mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="order_by">{t.order_by}</label>
                      <div className="relative flex-1">
                        <Select isClearable placeholder={t.select_option} className='w-full' {...register("order_by", { required: false })} onChange={handleChangeOrderBy} options={order_by} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="my-5">

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={() => onFilter()} type="button" className="btn btn-secondary">
                  {t.filter}
                </button>
                <button onClick={() => onSubmitSearch()} type="button" className="btn btn-primary">
                  {t.search}
                </button>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <div className="bg-gray-400 p-4">
              <div className="flex flex-wrap items-center justify-start gap-2">
                <button type="button" onClick={() => delivered()} disabled={isSelectItems} className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                  {t.delivered}
                </button>
                <button type="button" onClick={() => cancelOrder()} disabled={isSelectItems} className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
                  {t.cancel_order}
                </button>
              </div>
            </div>
            <table className="bg-white table-hover table-compact whitespace-nowrap">
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
                  <th></th>
                  <th>{t.customer}</th>
                  <th>{t.nro_order}</th>
                  <th>{t.city}</th>
                  <th>{t.condition}</th>
                  <th>Total $us.</th>
                  <th>{t.days_process}</th>
                  <th>{t.date_order}</th>
                  <th>{t.date_update_order}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, index) => {
                  return (
                    <tr key={index} className={`border-b transition-colors ${seleccionados.includes(o) ? 'bg-blue-100' : ''}`}>
                      <td>
                        <div className="flex w-full gap-4 my-6 items-center justify-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="border border-dark border-1 form-checkbox"
                              checked={seleccionados.includes(o)}
                              onChange={() => toggleSeleccion(o)}
                            />
                          </label>
                          <BtnPrintQuote order={o} token={token} className={`btn btn-sm btn-info`}></BtnPrintQuote>
                        </div>
                      </td>
                      <td></td>
                      <td>{o.NomCliente}</td>
                      <td className="text-center">
                        {(o.Estado != "DESPACHADO") ?
                          <Link href={`/admin/revision/quotes?customer=${o.CodCliente}&option=confirmed-quote&id=${o.NroOrden}`} className="btn btn-sm btn-outline-info">{o.NroOrden}</Link>
                          :
                          <label htmlFor="">{o.NroOrden}</label>
                        }
                      </td>
                      <td>{o.Ciudad}</td>
                      <td>{o.Estado}</td>
                      <td className="text-end">{customFormat(o.Total)}</td>
                      <td>{o.DiasProceso}</td>
                      <td>{o.FecOrden}</td>
                      <td>{o.FecModificacion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      }



      {(customer) && <Settings customer_id={customer_id} tabs={tabs} _customer={customer} setCustomer={setCustomer} token={token} t={t}></Settings>}
      <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}