"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import ComponentsDatatablesOrdersPlaced from "@/components/datatables/components-datatables-orders-placed"
import IconBackSpace from "@/components/icon/icon-backspace";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_lists_customers = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const url_lists_status = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaEstadoOrden';
const url_search = process.env.NEXT_PUBLIC_API_URL + 'cotrealizadas/CotOrdRealizadas';
const url_verify = process.env.NEXT_PUBLIC_API_URL + 'cotrealizadas/VerifCotizacion ';

export default function OrdersPlaced() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [customers, setCustomers] = useState([])
  const [status, setStatus] = useState([]);
  const [orders, setOrders] = useState([]);
  let term = searchParams.get("term") || '';

  const {
    register,
    handleSubmit, reset, getValues, setValue, setError,
    formState: { errors },
  } = useForm({ defaultValues: { nro_order: term } });


  useEffect(() => {

    async function fetchData() {
      let res = await getLists();
      let search = await onSearch(0, ((term != "") ? term : 0), "");
    }
    fetchData();


  }, []);

  const getLists = async () => {
    let array = [];
    try {
      const rs = await axios.post(url_lists_customers, { ValToken: token });
      
      if (rs.data.estado == 'Ok') {
        let options_customer = [];
        rs.data.dato.map((c) => {
          if (c.CodCliente != 0) {
            options_customer.push({ value: c.CodCliente, label: c.NomCliente });
          }
        });
        setCustomers(options_customer);
        array.customers = options_customer;
      }
      const rs_status = await axios.post(url_lists_status, { ValToken: token });
      if (rs_status.data.estado == 'Ok') {

        let options_status = [];
        rs_status.data.dato.map((s) => {
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

  const onSearch = async (CodCliente = 0, NroOrden = 0, CodEstado = "") => {
    try {
      let data = {
        CodCliente: CodCliente,
        NroOrden: NroOrden,
        CodEstado: CodEstado,
        ValToken: token
      }

      const rs = await axios.post(url_search, data);
      if(NroOrden){
        router.push(`?term=${NroOrden}`);
      }
      
      if (rs.data.estado == 'OK') {
        setOrders(() => rs.data.dato.map((o, index) => {
          o.id = index;
          return o;
        }));
      }
    } catch (error) {
      
    }
  }

  const onSubmitSearch = async () => {
    let data = getValues();
    
    await onSearch((data.customer) ?? 0, ((data.nro_order != "") ? data.nro_order : 0), (data.status) ?? "");
  }

  const verify = (o) => {

    Swal.fire({
      title: t.verifying,
      showConfirmButton: false,
      timer: 1000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then(async (r) => {
      try {
        await axios.post(url_verify, { NroOrden: o.NroOrden, ValToken: token }).then(rs => {
          
          router.push(`/admin/revision/quotes?customer=${o.CodCliente}&option=${(o.TipCot == 'NR') ? 'quotes' : 'quotes-without-code'}&id=${o.NroOrden}`);
        });

      } catch (error) {
        
      }
    });
  }

  const clear = () => {
    
    setValue('nro_order', '');
  }

  useDynamicTitle(`${ t.query } | ${t.orders_done}` );

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.query }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold">{ t.orders_done }</span>
          </li>
        </ul>
      </div>

      <div className="panel shadow-lg bg-gray-200 mt-5 mb-8 pb-1 z-10">
        <form className="">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status-select">{ t.status }</label>
              <Select
                isClearable
                options={status}
                {...register('status', { required: false })}
                onChange={handleChangeStatus}
                id="status-select"
                placeholder={t.select_option} className='w-full' />
            </div>
            <div>
              <label htmlFor="customer-select">{ t.customer }</label>
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
            </div>
            <div>
              <label htmlFor="nro_order">{ t.nro_order }/{ t.quote }</label>

              <div className="relative">
                <input step="any" type="number" id="nro_order" autoComplete='OFF' {...register("nro_order", { required: false })} className="form-input pe-10 placeholder:" />
                <div className="absolute inset-y-0 end-0 flex items-center pe-3 cursor-pointer" onClick={() => clear()}>
                  <IconBackSpace className="fill-dark z-10"></IconBackSpace>
                </div>
              </div>
            </div>

            <div className="my-5">

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={() => onSubmitSearch()} type="button" className="btn btn-primary">
                  {t.search}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
      {(orders) && <ComponentsDatatablesOrdersPlaced orders={orders} verify={verify} t={t}></ComponentsDatatablesOrdersPlaced>}

    </>
  );
}