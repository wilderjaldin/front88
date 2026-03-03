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
import IconPencil from "@/components/icon/icon-pencil";
import PurchaseOrderDetails from "@/app/admin/purchase-order/purchase-order";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnPrintOrder from "@/components/BtnPrintOrder"

const url_list = process.env.NEXT_PUBLIC_API_URL + 'consulta/MostrarListaOrdenCompra';
const url_edit = process.env.NEXT_PUBLIC_API_URL + 'consulta/ModificarOrdenCompra';

export default function PurchaseOrders() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders, setOrders] = useState([]);

  const [items, setItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [contact, setContact] = useState([]);

  let term = searchParams.get("term") || '';

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { purchase_order_number: term } });

  useEffect(() => {

    async function fetchData() {
      await onSearch( ((term != "") ? term : 0), 0);
    }
    fetchData();


  }, []);

/*
  useEffect(() => {
    async function fetchData() {
      await onSearch(term, 0);
    }
    fetchData();
  }, [term]);
  */

  const onSearch = async (NroOrdenCompra, NroOrden) => {
    try {
      const rs = await axios.post(url_list, { NroOrden: NroOrden, NroOrdenCompra: NroOrdenCompra, ValToken: token });

      if (rs.data.estado == 'Ok') {
        setOrders(rs.data.dato)
      }
    } catch (error) {

    }
  }
  const onSubmit = (data) => {
    onSearch((data.purchase_order_number != "") ? data.purchase_order_number : 0, (data.order_number != "") ? data.order_number : 0);
    if(data.purchase_order_number){
      router.push(`?term=${data.purchase_order_number}`);
    }
  }

  const handleEdit = async (order) => {

    try {
      const rs = await axios.post(url_edit, { NroOrdenCompra: order.NroOrdenCompra, ValToken: token });

      if (rs.data.estado == 'Ok') {
        rs.data.dato1[0].NroOrden = order.NroOrdenCompra;
        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
        setContact(rs.data.dato3[0]);
      } else if (rs.data.estado == "Inálido") {
        Swal.fire({
          title: t.error,
          text: t.you_cannot_modify_purchase,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {

    }
  }
  useDynamicTitle(`${t.query} | ${t.purchase_orders}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.query}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.purchase_orders} </span>
          </li>
        </ul>
      </div>


      {!(order.NroOrden) ?
        <>
          <div className="panel mt-4 gap-4">
            <form action="" onSubmit={handleSubmit(onSubmit)}>
              <fieldset>
                <div className="flex flex-row gap-4">
                  <div className="basis-6/12">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className='space-y-4'>

                        <div>
                          <label htmlFor="select_type">{ t.nro_purchase_order }</label>
                          <input type='text' autoComplete='OFF' {...register("purchase_order_number", { required: false })} className="form-input placeholder:" />
                        </div>

                      </div>

                      <div className='space-y-4'>

                        <div>
                          <label htmlFor="select_type">{ t.nro_order }</label>
                          <input type='text' autoComplete='OFF' {...register("order_number", { required: false })} className="form-input placeholder:" />
                        </div>

                      </div>

                    </div>

                  </div>
                  <div className="">
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">

                      <button type="submit" className="btn btn-success">
                        {t.btn_search}
                      </button>

                    </div>
                  </div>
                </div>

              </fieldset>
            </form>
          </div>

          <div className="panel">
            <div className="table-responsive">
              <table className="table-hover">
                <thead>
                  <tr className="relative !bg-gray-400 text-center text-sm">
                    <th></th>
                    <th>{ t.nro_purchase_order }</th>
                    <th>{ t.date_oc }</th>
                    <th>{ t.supplier }</th>
                    <th>Total</th>
                    <th>{ t.shipping_amount }</th>
                    <th>{ t.others_amount }</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, index) => {
                    return (
                      <tr key={index}>

                        <td>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button className="btn btn-sm btn-info" title={t.edit} onClick={() => handleEdit(o)}>
                              <IconPencil />
                            </button>
                            <BtnPrintOrder token={token} t={t} order={o} className="btn btn-sm btn-dark"></BtnPrintOrder>
                          </div>
                        </td>
                        <td>{o.NroOrdenCompra}</td>
                        <td>{o.FecOrdenCompra}</td>
                        <td>{o.NomPrv}</td>
                        <td>{o.Total}</td>
                        <td>{o.MtoShipping}</td>
                        <td>{o.MtoOtros}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
        :
        <PurchaseOrderDetails CadNroOrden={""} token={token} t={t} order={order} setOrder={() => setOrder({})} items={items} setItems={setItems} contact={contact} ></PurchaseOrderDetails>
      }
    </>
  );
}