"use client";
import { useEffect, Fragment, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import axios from 'axios'
import { Tab } from '@headlessui/react';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import sortBy from 'lodash/sortBy';
import ItemsUnassigned from '@/app/admin/queries/spare-parts-quotation/items-unassigned'
import ItemsAssigned from '@/app/admin/queries/spare-parts-quotation/items-assigned'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
const url_orders = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/ListaRepCotizar';
const url_assign_order = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/AsignarAUsuario';
const url_unassign_order = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/QuitarAsignacionUsuario';

const tabs = { '0': 'unassigned', '1': 'assigned'}

export default function SparePartsQuotation() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  let option = searchParams.get("option");
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;

  const [orders_unassigned, setOrdersUnassigned] = useState([])
  const [orders_assigned, setOrdersAssigned] = useState([])


  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy([], 'id'));
  const [recordsData, setRecordsData] = useState(initialRecords);

  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'id',
    direction: 'asc',
  });

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  //

  const {
    register,
    handleSubmit, reset, getValues, setValue, setError,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    
    async function fetchData() {
      let res = await getLists();
      //let search = await onSearch();
    }
    fetchData();

  }, []);

  const getLists = async () => {
    let array = [];
    try {
      const rs = await axios.post(url_orders, { IndiceFiltro: 0, ValToken: token });
      
      if (rs.data.estado == 'OK') {

        let orders_unassigned = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let orders_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setOrdersUnassigned(orders_unassigned);
        setOrdersAssigned(orders_assigned);
        setInitialRecords(orders_unassigned);
      }
      return array;

    } catch (error) {
      
      return [];
    }
  }


  const assignOrder = async (selected_pending) => {
    try {
      let data = [];
      selected_pending.map(o => {
        data.push({ CodRegistro: o.CodRegistro, ValToken: token });
      });
      
      const rs = await axios.post(url_assign_order, data);
      
      if (rs.data.estado == 'OK') {
        let orders_unassigned = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let orders_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setOrdersUnassigned(orders_unassigned);
        setOrdersAssigned(orders_assigned);
      }
    } catch (error) {
      
    }
  }

  const unassignOrder = async (selected_assigned) => {
    try {
      let data = [];
      selected_assigned.map(o => {
        data.push({ CodRegistro: o.CodRegistro, ValToken: token });
      });

      const rs = await axios.post(url_unassign_order, data);
      
      if (rs.data.estado == 'OK') {


        let orders_unassigned = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let orders_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setOrdersUnassigned(orders_unassigned);
        setOrdersAssigned(orders_assigned);
      }
    } catch (error) {
      
    }
  }
  useDynamicTitle(`${ t.query } | ${t.spare_parts_to_be_quoted}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.query }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold">{ t.spare_parts_to_be_quoted }</span>
          </li>
        </ul>
      </div>

      <Tab.Group defaultIndex={current_tab} onChange={(index) => {
        router.push(`?option=${tabs[index]}`)
      }}>
        <Tab.List className="mb-5 mt-3 grid grid-cols-4 gap-2 rtl:space-x-reverse sm:flex sm:flex-wrap sm:justify-center sm:space-x-3">

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                          flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.unassigned_quote_items }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                          flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.items_to_be_quoted_assigned }
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels className="shadow-lg bg-gray-200 ">

          <Tab.Panel>
            <ItemsUnassigned t={t} token={token} data={orders_unassigned} assignOrder={assignOrder}></ItemsUnassigned>
          </Tab.Panel>
          <Tab.Panel>
           <ItemsAssigned t={t} token={token} data={orders_assigned} unassignOrder={unassignOrder} setOrdersAssigned={setOrdersAssigned}></ItemsAssigned>
          </Tab.Panel>
        </Tab.Panels>

      </Tab.Group>


    </>
  );
}