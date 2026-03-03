"use client";
import { useEffect, useState, Fragment } from "react";
import { useTranslation } from "@/app/locales";
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import IconArrowUp from "@/components/icon/icon-arrow-up";
import IconArrowDown from "@/components/icon/icon-arrow-down";
import PurchaseOrderDetails from "@/app/admin/purchase-order/purchase-order";
import { Checkbox } from '@mantine/core';
import { Tab } from '@headlessui/react';

import TableUnassign from "@/app/admin/purchase-order/table-unassign"
import TableAssigned from "@/app/admin/purchase-order/table-assigned"
import Link from "next/link";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'ordencompra/MostrarOrdenesCompra';
const url_assign_order = process.env.NEXT_PUBLIC_API_URL + 'ordencompra/AsignarOrdenCompra';
const url_unassign_order = process.env.NEXT_PUBLIC_API_URL + 'ordencompra/DesasignarOrdenCompra';
const url_show_purchase_order_items = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/DetOrdenesCompraItems';

const tabs = { '0': 'pending', '1': 'assigned' }

export default function PurchaseOrder() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useSelector(selectToken);
  const t = useTranslation();

  const [orders_unassigned, setOrdersUnassigned] = useState([])
  const [orders_assigned, setOrdersAssigned] = useState([])





  const [CadNroOrden, setCadNroOrden] = useState('');

  const [items, setItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [contact, setContact] = useState([]);

  let option = searchParams.get("option") || "";
  const [currentTab, setCurrentTab] = useState(
    Number(Object.keys(tabs).find((key) => tabs[key] === option) ?? 0)
  );

  const [reload, setReloadState] = useState(false);

  const setReload = () => {
    setReloadState(!reload);
  }
  useEffect(() => {

    async function fetchData() {
      await getData();
    }
    fetchData();
  }, [reload]);

  useEffect(() => {
    if (option == "") {
      setItems([]);
    }
  }, [option]);


  const getData = async () => {
    try {
      const rs = await axios.post(url, { ValToken: token });

      if (rs.data.estado == 'Ok') {
        setOrdersUnassigned(rs.data.dato1);
        setOrdersAssigned(rs.data.dato2);
      }

    } catch (error) {

    }
  }

  const assignOrder = async (selected_pending) => {
    try {
      let names = [];
      let ids = [];
      selected_pending.map(o => {
        names.push(`'${o.NomProveedor}'`);
        ids.push(o.NroOrden);
      });
      let CadNomPrv = names.join(",");
      let CadNroOrden = ids.join(",");

      let data = {
        CadNomPrv: CadNomPrv,
        CadNroOrden: CadNroOrden,
        ValToken: token
      }

      const rs = await axios.post(url_assign_order, data);

      if (rs.data.estado == 'Ok') {
        setOrdersUnassigned(rs.data.dato1);
        setOrdersAssigned(rs.data.dato2);
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  }

  const unassignOrder = async (selected_assigned) => {
    try {
      let names = [];
      let ids = [];
      selected_assigned.map(o => {
        names.push(`'${o.NomProveedor}'`);
        ids.push(o.NroOrden);
      });
      let CadNomPrv = names.join(",");
      let CadNroOrden = ids.join(",");

      let data = {
        CadNomPrv: CadNomPrv,
        CadNroOrden: CadNroOrden,
        ValToken: token
      }

      const rs = await axios.post(url_unassign_order, data);
      if (rs.data.estado == 'Ok') {
        setOrdersUnassigned(rs.data.dato1);
        setOrdersAssigned(rs.data.dato2);
        return true;
      }
      return false;
    } catch (error) {

      return false;
    }
  }

  const createPurchaseOrder = async (selected_assigned) => {
    try {
      let names = [];
      let ids = [];
      selected_assigned.map(o => {
        names.push(`${o.NomProveedor}`);
        ids.push(o.NroOrden);
      });
      if (names.length > 1) {
        let s = new Set(names);
        let diferrents_suppliers = [...s];
        if (diferrents_suppliers.length > 1) {
          Swal.fire({
            title: t.error,
            text: `${t.different_providers_error} [${diferrents_suppliers.toString()}]`,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
          return;
        }
        names = diferrents_suppliers;
      }

      let CadNomPrv = names.join(",");
      let CadNroOrden = ids.join(",");

      let data = {
        NomPrv: CadNomPrv,
        CadNroOrden: CadNroOrden,
        NumOrdCompra: 0,
        ValToken: token
      }
      const rs = await axios.post(url_show_purchase_order_items, data);
      if (rs.data.estado == 'Ok') {
        setItems(rs.data.dato1)
        setContact((rs.data.dato2[0]) ?? [])
        setOrder(rs.data.dato3[0])
        setCadNroOrden(CadNroOrden);

      }
    } catch (error) {
      
    }
  }

  const goToTab = (tabName) => {
    const index = Object.keys(tabs).find(
      key => tabs[key] === tabName
    );

    if (index !== undefined) {
      setCurrentTab(Number(index));
      router.push(`?option=${tabs[index]}`);
    }
  };

  useDynamicTitle(`${t.purchase_order}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            {(items.length > 0) ?
              <Link href={'/admin/purchase-order'} className="text-blue-600 hover:underline">{t.purchase_order}</Link>
              :
              <span className="font-bold">{t.purchase_order}</span>
            }
          </li>
          {(items.length > 0) &&
            <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
              <span className="font-bold">{t.creating_purchase_order}</span>
            </li>
          }
        </ul>
      </div>
      {!(items.length > 0) ?

        <Tab.Group
          selectedIndex={currentTab}
          onChange={(index) => {
            setCurrentTab(index);
            router.push(`?option=${tabs[index]}`);
          }}
        >
          <Tab.List className="mb-5 mt-3 grid grid-cols-4 gap-2 rtl:space-x-reverse sm:flex sm:flex-wrap sm:justify-center sm:space-x-3">

            <Tab as={Fragment}>
              {({ selected }) => (
                <button
                  className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                          flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
                >
                  {t.unassigned_pending}
                </button>
              )}
            </Tab>
            <Tab as={Fragment}>
              {({ selected }) => (
                <button
                  className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                          flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
                >
                  {t.assigned}
                </button>
              )}
            </Tab>
          </Tab.List>
          <Tab.Panels className="shadow-lg bg-gray-200 ">

            <Tab.Panel>
              <TableUnassign t={t} token={token} goToTab={goToTab} orders_unassigned={orders_unassigned} assignOrder={assignOrder}></TableUnassign>
            </Tab.Panel>
            <Tab.Panel>
              <TableAssigned t={t} token={token} orders_assigned={orders_assigned} unassignOrder={unassignOrder} createPurchaseOrder={createPurchaseOrder} ></TableAssigned>
            </Tab.Panel>
          </Tab.Panels>

        </Tab.Group>


        :
        <PurchaseOrderDetails setReload={setReload} CadNroOrden={CadNroOrden} token={token} t={t} order={order} items={items} setOrder={() => setItems([])} setItems={setItems} contact={contact} ></PurchaseOrderDetails>
      }



    </>
  );
}