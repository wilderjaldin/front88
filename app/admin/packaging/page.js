"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import Pendings from "@/app/admin/packaging/pendings"
import Packaging from "@/app/admin/packaging/packaging"

import axios from 'axios'
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_lists_orders = process.env.NEXT_PUBLIC_API_URL + 'embalaje/MostrarRecepcionCompra ';
const url_attach = process.env.NEXT_PUBLIC_API_URL + 'embalaje/AdjuntarItems';

export default function PackagingPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders, setOrders] = useState([])
  const [packagings, setPackagings] = useState([]);
  const [types_packagings, setTypePackaging] = useState();
  const locale = useSelector(getLocale);

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
        setOrders(() => rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        }));
        let options = [];
        rs.data.dato2.map((o, index) => {
          if (o.CodEmbalaje != 0) {
            options.push({ value: o.CodEmbalaje, label: o.DesEmbalaje });
          }
        });
        setTypePackaging(options);
      }
    } catch (error) {

    }
  }

  const attachOrder = async (selected) => {
    if (selected.length > 0) {
      let CadNroOrden = [];
      let CadNroOrdenCompra = [];
      let CadNroRecepcion = [];
      let customers_names = [];
      let address_names = [];
      selected.map(o => {
        CadNroOrden.push(o.NroOrden);
        CadNroOrdenCompra.push(o.NroOrdenCompra);
        CadNroRecepcion.push(o.NroRecepcion);
        customers_names.push(o.NomCliente);
        address_names.push(o.DirEntrega);
      });
      //
      if (customers_names.length > 1) {
        let s = new Set(customers_names);
        let a1 = [...s]
        if (a1.length > 1) {
          Swal.fire({
            title: t.error,
            text: t.different_customers_error,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }

      }
      if (address_names.length > 1) {
        let address = new Set(address_names);
        let address_different = [...address]
        if (address_different.length > 1) {
          Swal.fire({
            title: t.error,
            text: t.different_address_error,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }
      }
      //

      let data = {
        CadNroOrden: CadNroOrden.join(","),
        CadNroOrdenCompra: CadNroOrdenCompra.join(","),
        CadNroRecepcion: CadNroRecepcion.join(","),
        ValToken: token
      };
      
      const rs = await axios.post(url_attach, data);
      if (rs.data.estado == 'Ok') {
        setPackagings(rs.data.dato);
      }
    }
  }

  useDynamicTitle(`${t.packaging}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.packaging} </span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-12 mt-4 gap-4">
        <div className="col-span-4">
          <div className="panel">
            <h2 className="font-bold text-xl mb-4">{ t.pending_packaging }</h2>
            <Pendings t={t} token={token} data={orders} setOrders={setOrders} attachOrder={attachOrder} ></Pendings>
          </div>
        </div>
        <div className="col-span-8">
          <div className="panel">
            <h2 className="font-bold text-xl mb-4">{t.packaging}</h2>
            <Packaging t={t} token={token} packages={packagings} setOrders={setOrders} setPackagings={setPackagings} types_packagings={types_packagings}></Packaging>
          </div>
        </div>
      </div>
    </>
  );
}