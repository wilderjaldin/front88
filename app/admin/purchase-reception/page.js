"use client";
import { useState, Fragment, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import { Tab } from '@headlessui/react';
import Orders from '@/app/admin/purchase-reception/orders';
import Receptions from '@/app/admin/purchase-reception/receptions';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
const url = process.env.NEXT_PUBLIC_API_URL + 'recepcion/MostrarOrdenesCompras';
const url_attach = process.env.NEXT_PUBLIC_API_URL + 'recepcion/AdjuntarOrdenes';

const tabs = { '0': 'orders', '1': 'receptions' }
export default function PurchaseReception() {


  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  let option = searchParams.get("option");
  const [current_tab, setCurrentTab] = useState(Object.keys(tabs).find((key) => tabs[key] === option) || 0);

  const [orders, setOrders] = useState([])
  const [receptions, setReceptions] = useState([])

  const [selected_orders, setSelectedOrders] = useState([]);

  useEffect(() => {
    async function fetchData() {
      await getList();
    }
    fetchData();

  }, []);

  const getList = async () => {
    try {
      const rs = await axios.post(url, { ValToken: token });

      if (rs.data.estado == 'Ok') {
        setOrders(() => rs.data.dato.map((o, index) => {
          o.id = index;
          return o;
        }));
      }
    } catch (error) {

    }
  }

  const attachOrder = async (selected) => {
    if (selected.length > 0) {
      setSelectedOrders(selected)
      let data = [];
      selected.map(o => {
        data.push({
          NroOrdenCompra: o.NumOrdenCompra,
          ValToken: token
        });
      });

      const rs = await axios.post(url_attach, data);

      if (rs.data.estado == 'Ok') {
        setCurrentTab(1);
        router.push(`?option=${tabs[1]}`)
        setReceptions(() => rs.data.dato.map((o, index) => {
          o.id = index;
          return o;
        }));
      }
    }
  }
  useDynamicTitle(`${t.purchase_reception}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.purchase_reception} </span>
          </li>
        </ul>
      </div>

      <Tab.Group
        selectedIndex={Number(current_tab)}
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
                {t.purchase_orders}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                          flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.purchase_reception}
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels className="shadow-lg bg-gray-200 ">

          <Tab.Panel>
            <Orders t={t} token={token} data={orders} setOrders={setOrders} attachOrder={attachOrder}></Orders>
          </Tab.Panel>
          <Tab.Panel>
            <Receptions t={t} token={token} data={receptions} setReceptions={setReceptions} setOrders={setOrders} selected_orders={selected_orders}></Receptions>
          </Tab.Panel>
        </Tab.Panels>

      </Tab.Group>
    </>
  );
}