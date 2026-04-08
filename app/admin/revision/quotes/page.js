"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import QuoteForm from '@/components/forms/quote-form';
import ConfirmedQuoteForm from '@/components/forms/confirmed-quote-form';
import QuoteBatchForm from '@/components/forms/quote-batch-form';
import StepsToBuy from '@/app/admin/revision/quotes/steps_buy';
import QuoteWithoutCodeForm from '@/components/forms/quote-whithout-code-form'
import Link from "next/link";
import Swal from 'sweetalert2'
import { getLocale } from '@/store/localeSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'revision/ListaClientes';
const url_order = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarDetalleCotizacion';
const url_order_without_code = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarDetalleCotSinCod';
const url_order_confirmed = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetallemod/MostrarDetalleOrden';

export default function Quotes() {

  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const locale = useSelector(getLocale);


  const [order, setOrder] = useState([])
  const [items, setItems] = useState([])
  const option = searchParams.get("option");
  const customer_id = searchParams.get("customer");
  const order_id = searchParams.get("id") || null;
  const [tracking, setTracking] = useState([]);
  const [options_share, setOptionsShare] = useState([]);
  const [customer, setCustomer] = useState({ CodCliente: customer_id, NomCliente: "---" })

  useEffect(() => {
    async function fetchData() {

      if (order_id > 0) {
        Swal.fire({
          html: t.load_quote_info,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        await getOrder(order_id);

      }
      await getCustomer(customer_id);
    }
    fetchData();

  }, []);

  const getCustomer = async (customer_id) => {
    try {
      const rs = await axios.post(url, { ValToken: token });
      if (rs.data.estado == 'Ok') {
        rs.data.dato.map(u => {
          if (u.CodCliente == customer_id) {
            setCustomer(u);
          }
        })
      }
    } catch (error) {

    }
  }
  const getOrder = async (order_id) => {
    try {
      var rs = [];
      if (option == "quotes" || option == "batch" || option == "buy") {
        rs = await axios.post(url_order, { Idioma: locale, NroOrden: order_id, CodCliente: customer_id, TipoCot: 'NR', ValToken: token });
      } else if (option == "quotes-without-code") {
        rs = await axios.post(url_order_without_code, { Idioma: locale, NroOrden: order_id, CodCliente: customer_id, TipoCot: 'NR', ValToken: token });
      } else if (option == "confirmed-quote") {
        rs = await axios.post(url_order_confirmed, { Idioma: locale, NroOrden: order_id, CodCliente: customer_id, ValToken: token });
      }

      if (rs.data.estado == 'OK') {
        

        if (option == 'confirmed-quote') {
          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);
          Swal.close();
          return;
        }

        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
        setTracking(rs.data.dato3[0]);
        setCustomer(rs.data.dato5[0]);

        let _options_share = [];
        rs.data.dato4.map(s => {
          if (s.CodUsuario != 0) {
            _options_share.push({ value: s.CodUsuario, label: s.NomUsuario })
          }
        });

        setOptionsShare(_options_share);

        Swal.close();
      }
    } catch (error) {

    }

  }

  useDynamicTitle(`${t.quote} | ${(customer) ? customer.NomCliente : ""}`);

  return (
    <>


      <div className="mb-4.5 flex flex-col gap-5 px-5 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <ul className="flex space-x-2 rtl:space-x-reverse">
            <li>
              { t.revision }
            </li>
            <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
              {(customer) ? <Link href={`/admin/revision/orders-process`} className="text-blue-600 hover:underline">{t.orders_in_process}</Link> : <span>{t.orders_in_process}</span>}
            </li>
            <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
              {(customer) ? <Link href={`/admin/revision/orders-process?customer=${customer_id}&option=quotes`} className="text-blue-600 hover:underline">{t.quotes}</Link> : <span>{ t.quotes }</span>}
            </li>
            {(customer) &&
              <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span className="bg-blue-600 p-2 text-white rounded"> {customer.NomCliente} </span>
              </li>
            }
          </ul>
        </div>
        <div className="ltr:ml-auto rtl:mr-auto">
          <Link href={`/admin/revision/orders-process?customer=${customer_id}&option=quotes`} className="btn btn-outline-dark">{ t.back }</Link>
        </div>
      </div>
      {(option == 'quotes') && <QuoteForm getOrder={getOrder} token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items} options_share={options_share}></QuoteForm>}
      {(option == 'buy') && <StepsToBuy token={token} _customer_={customer} t={t} _order_={order} _items_={items}></StepsToBuy>}
      {(option == 'quotes-without-code') && <QuoteWithoutCodeForm _customer_={customer} _order_={order} _items_={items} t={t} token={token} ></QuoteWithoutCodeForm>}
      {(option == 'batch' && !order_id) && <QuoteBatchForm token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items}></QuoteBatchForm>}
      {(option == 'batch' && order_id) && <QuoteForm token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items}></QuoteForm>}

      {(option == 'confirmed-quote' && order_id) && <ConfirmedQuoteForm token={token} _customer_={customer} _tracking_={tracking} t={t} _order_={order} _items_={items}></ConfirmedQuoteForm>}

    </>
  );
}