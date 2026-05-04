"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form"
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

const URL_CLIENTS        = process.env.NEXT_PUBLIC_API_URL + 'cliente/ObtenerLista';
const URL_SEARCH         = process.env.NEXT_PUBLIC_API_URL + 'revision/MostrarOrdenesProceso';
const URL_FILTER         = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaAgrupadaCliente';
const URL_LISTS          = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaEstadoOrden';
const URL_LIST_CUSTOMERS = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const URL_DELIVERED      = process.env.NEXT_PUBLIC_API_URL + 'revision/EntregarOrden';
const URL_CANCEL_ORDER   = process.env.NEXT_PUBLIC_API_URL + 'revision/AnularOrden';

const tabs = { '0': 'quotes', '1': 'open', '2': 'completed' }

export default function OrdersProcess() {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  const [customer,      setCustomer]      = useState(null)
  const [customers,     setCustomers]     = useState([])
  const [status,        setStatus]        = useState([])
  const [order_by,      setOrderBy]       = useState([
    { value: 1, label: t.select_customer },
    { value: 2, label: t.select_days_process },
    { value: 3, label: t.select_nro_order },
  ])
  const option      = searchParams.get("option") || "";
  const customer_id = searchParams.get("customer");
  const [orders,         setOrders]        = useState([])
  const [seleccionados,  setSeleccionados] = useState([])
  const [isSelectItems,  setIsSelectItems] = useState(true);
  const locale = useSelector(getLocale);

  const { register, handleSubmit, reset, getValues, setValue, setError, formState: { errors } } = useForm();

  const [show_modal,    setShowModal]    = useState(false);
  const [modal_title,   setModalTitle]   = useState('');
  const [modal_content, setModalContent] = useState(null);

  const alreadyCalled = useRef(false);

  useEffect(() => {
    if (alreadyCalled.current) return;
    alreadyCalled.current = true;
    async function fetchData() {
      await getListsStatus();
      let customers = await getListsCustomers();
      if (customer_id) getCustomer(customer_id, customers);
      await onSearch();
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (option == "") setCustomer(null);
  }, [option]);

  useEffect(() => {
    if (customer_id) getCustomer(customer_id, customers);
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
    setIsSelectItems(seleccionados.length === 0);
  }, [seleccionados]);

  const onSearch = async (CodCliente = 0, NroOrden = 0, CodEstado = "", OrdenarPor = 0) => {
    try {
      const rs = await axios.post(URL_SEARCH, {
        Idioma: locale, CodCliente, NroOrden, CodEstado, OrdenarPor, ValToken: token
      });
      if (rs.data.estado == 'Ok') setOrders(rs.data.dato);
    } catch (error) {}
  }

  const filterAction = async (CodCliente = 0, NroOrden = 0, CodEstado = "", OrdenarPor = 0) => {
    try {
      const rs = await axios.post(URL_FILTER, {
        CodCliente, NroOrden, CodEstado, OrdenarPor, ValToken: token
      });
      if (rs.data.estado == 'Ok') {
        setShowModal(true);
        setModalTitle('');
        setModalContent(
          <OptionsFilter cancel={() => setShowModal(false)} setOrders={setOrders} token={token} t={t} customers={rs.data.dato} />
        );
      }
    } catch (error) {}
  }

  const getListsStatus = async () => {
    try {
      const rs = await axios.post(URL_LISTS, { ValToken: token });
      if (rs.data.estado == 'Ok') {
        const options_status = rs.data.dato
          .filter(s => s.CodEstado != 0)
          .map(s => ({ value: s.CodEstado, label: s.NomEstadoOrden }));
        setStatus(options_status);
        return { status: options_status };
      }
      return [];
    } catch (error) { return []; }
  }

  const getListsCustomers = async () => {
    try {
      const rs = await axios.post(URL_LIST_CUSTOMERS, { ValToken: token });
      if (rs.data.estado == 'Ok') {
        const options_customer = rs.data.dato
          .filter(s => s.CodCliente != 0)
          .map(s => ({ value: s.CodCliente, label: s.NomCliente }));
        setCustomers(options_customer);
        return options_customer;
      }
      return [];
    } catch (error) { return []; }
  }

  const getCustomer = (id, customers) => {
    const cs = customers.find((key) => key.value == id) || null;
    setCustomer(cs);
  }

  const handleChangeStatus   = (v) => setValue('status',   v?.value ?? null);
  const handleChangeCustomer = (v) => setValue('customer', v?.value ?? null);
  const handleChangeOrderBy  = (v) => setValue('order_by', v?.value ?? null);

  const onSubmitSearch = async () => {
    const data = getValues();
    setSeleccionados([]);
    await onSearch(
      data.customer ?? 0,
      data.nro_order !== "" ? data.nro_order : 0,
      data.status   ?? "",
      data.order_by ?? 0,
    );
  }

  const onFilter = async () => {
    const data = getValues();
    await filterAction(
      data.customer ?? 0,
      data.nro_order !== "" ? data.nro_order : 0,
      data.status   ?? "",
      data.order_by ?? 0,
    );
  }

  const delivered = async () => {
    try {
      const data = seleccionados.map(order => ({ Idioma: locale, NroOrden: order.NroOrden, ValToken: token }));
      const rs   = await axios.post(URL_DELIVERED, data);
      if (rs.data.estado == 'Ok') {
        Swal.fire({ title: t.success, icon: 'success', confirmButtonColor: '#15803d', text: t.order_delivered_success, confirmButtonText: t.close })
          .then(() => setOrders(rs.data.dato));
      }
    } catch (error) {}
  }

  const cancelOrder = async () => {
    try {
      const data = seleccionados.map(order => ({ Idioma: locale, NroOrden: order.NroOrden, ValToken: token }));
      const rs   = await axios.post(URL_CANCEL_ORDER, data);
      if (rs.data.estado == 'Ok') {
        Swal.fire({ title: t.success, icon: 'success', confirmButtonColor: '#15803d', text: t.order_cancel_success, confirmButtonText: t.close })
          .then(() => setOrders(rs.data.dato));
      }
    } catch (error) {}
  }

  useDynamicTitle(`${customer ? t.orders_in_process + ' | ' + customer.label : t.revision} | ${t.orders_in_process}`);

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex items-center space-x-2 rtl:space-x-reverse text-sm mb-6">
        <li className="text-gray-400">{t.revision}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          {customer
            ? <Link href="/admin/revision/orders-process" className="text-primary hover:text-primary/80 hover:underline">{t.orders_in_process}</Link>
            : <span className="text-gray-600 dark:text-gray-400 font-medium">{t.orders_in_process}</span>
          }
        </li>
        {customer &&
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded text-xs font-semibold">{customer.label}</span>
          </li>
        }
      </ul>

      {!customer && (
        <>
          {/* Panel de filtros */}
          <div className="panel shadow mb-6">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-2 sm:w-1/4 sm:text-end" htmlFor="status">
                    {t.condition}
                  </label>
                  <div className="relative flex-1">
                    <Select
                      isClearable
                      options={status}
                      {...register('status', { required: false })}
                      onChange={handleChangeStatus}
                      id="status-select"
                      placeholder={t.select_option}
                      className="w-full"
                    />
                    {errors.status && <span className="text-red-500 text-xs mt-1 block">{errors.status?.message?.toString()}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-2 sm:w-1/4 sm:text-end" htmlFor="customer">
                    {t.customer}
                  </label>
                  <div className="flex-1 relative">
                    <Select
                      isClearable
                      options={customers}
                      {...register('customer', { required: { value: true, message: t.required_select } })}
                      onChange={handleChangeCustomer}
                      id="customer-select"
                      instanceId="customer-select"
                      menuPosition="fixed"
                      menuShouldScrollIntoView={false}
                      placeholder={t.select_option}
                      className="w-full"
                    />
                    {errors.customer && <span className="text-red-500 text-xs mt-1 block absolute -bottom-5 left-0">{errors.customer?.message?.toString()}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-2 sm:w-1/4 sm:text-end" htmlFor="nro_order">
                    {t.nro_order}
                  </label>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      autoComplete="OFF"
                      {...register("nro_order", { required: false })}
                      placeholder={t.nro_order}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 pt-2 sm:w-1/4 sm:text-end" htmlFor="order_by">
                    {t.order_by}
                  </label>
                  <div className="relative flex-1">
                    <Select
                      isClearable
                      placeholder={t.select_option}
                      className="w-full"
                      {...register("order_by", { required: false })}
                      onChange={handleChangeOrderBy}
                      options={order_by}
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-3">
              <button onClick={onFilter} type="button" className="btn btn-outline-dark">
                {t.filter}
              </button>
              <button onClick={onSubmitSearch} type="button" className="btn btn-primary">
                {t.search}
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="panel mt-5 overflow-hidden border-0 p-0">

            {/* Barra de acciones */}
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={delivered}
                disabled={isSelectItems}
                className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.delivered}
              </button>
              <button
                type="button"
                onClick={cancelOrder}
                disabled={isSelectItems}
                className="btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel_order}
              </button>
              {seleccionados.length > 0 && (
                <span className="text-primary text-xs ml-1 font-medium">
                  {seleccionados.length} {t.selected ?? 'seleccionado(s)'}
                </span>
              )}
            </div>

            {/* Tabla de datos */}
            <div className="datatables">
              <table className="table-hover whitespace-nowrap w-full text-sm">
                <thead>
                  <tr className="text-center uppercase text-xs tracking-wider">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={orders.length > 0 && seleccionados.length === orders.length}
                        onChange={toggleTodos}
                      />
                    </th>
                    <th className="px-3 py-3"></th>
                    <th className="px-3 py-3">{t.customer}</th>
                    <th className="px-3 py-3">{t.nro_order}</th>
                    <th className="px-3 py-3">{t.city}</th>
                    <th className="px-3 py-3">{t.condition}</th>
                    <th className="px-3 py-3">Total $us.</th>
                    <th className="px-3 py-3">{t.days_process}</th>
                    <th className="px-3 py-3">{t.date_order}</th>
                    <th className="px-3 py-3">{t.date_update_order}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${
                        seleccionados.includes(o)
                          ? 'bg-primary/5'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-3">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={seleccionados.includes(o)}
                            onChange={() => toggleSeleccion(o)}
                          />
                          <BtnPrintQuote order={o} token={token} className="btn btn-sm btn-info" />
                        </div>
                      </td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{o.NomCliente}</td>
                      <td className="px-3 py-2 text-center">
                        {o.Estado !== "DESPACHADO"
                          ? <Link
                              href={`/admin/revision/quotes?customer=${o.CodCliente}&option=confirmed-quote&id=${o.NroOrden}`}
                              className="text-primary hover:text-primary/80 font-semibold hover:underline"
                            >
                              {o.NroOrden}
                            </Link>
                          : <span className="text-gray-400">{o.NroOrden}</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{o.Ciudad}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {o.Estado}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-end text-gray-700 dark:text-gray-300 font-medium">{customFormat(o.Total)}</td>
                      <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{o.DiasProceso}</td>
                      <td className="px-3 py-2 text-gray-400">{o.FecOrden}</td>
                      <td className="px-3 py-2 text-gray-400">{o.FecModificacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {customer && (
        <Settings
          customer_id={customer_id}
          tabs={tabs}
          _customer={customer}
          setCustomer={setCustomer}
          token={token}
          t={t}
        />
      )}

      <Modal
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={modal_title}
        content={modal_content}
      />
    </>
  );
}
