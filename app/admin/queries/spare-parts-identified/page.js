"use client";
import { useEffect, Fragment, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import { Tab } from '@headlessui/react';
import Swal from 'sweetalert2'
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import ComponentsDatatablesOrdersPlaced from "@/components/datatables/components-datatables-orders-placed"
import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowDown from "@/components/icon/icon-arrow-down";
import IconArrowUp from "@/components/icon/icon-arrow-up";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import QuotesAssigned from '@/app/admin/queries/spare-parts-identified/quotes-assigned'
import QuotesIdentify from '@/app/admin/queries/spare-parts-identified/quotes-identify'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_orders = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/ListaRepIdentificar';
const url_assign_order = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/AsignarUsuario';
const url_unassign_order = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/QuitarAsignacionUsuario';

const tabs = { '0': 'identify', '1': 'assigned' }


export default function SparePartsIdentified() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  let option = searchParams.get("option");
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;

  const [quotes_identify, setQuotesIdentify] = useState([])
  const [quotes_assigned, setQuotesAssigned] = useState([])


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

        let quotes_identify = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let quotes_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setQuotesIdentify(quotes_identify);
        setQuotesAssigned(quotes_assigned);
        setInitialRecords(quotes_identify);
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
        data.push({ NroOrden: o.NroOrden, ValToken: token });
      });

      const rs = await axios.post(url_assign_order, data);
      
      if (rs.data.estado == 'OK') {
        let quotes_identify = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let quotes_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setQuotesIdentify(quotes_identify);
        setQuotesAssigned(quotes_assigned);
      }
    } catch (error) {
      
    }
  }

  const unassignOrder = async (selected_assigned) => {
    try {
      let data = [];
      selected_assigned.map(o => {
        data.push({ NroOrden: o.NroOrden, ValToken: token });
      });

      const rs = await axios.post(url_unassign_order, data);
      
      if (rs.data.estado == 'OK') {


        let quotes_identify = rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        });
        let quotes_assigned = rs.data.dato2.map((o, index) => {
          o.id = index;
          return o;
        });

        setQuotesIdentify(quotes_identify);
        setQuotesAssigned(quotes_assigned);
      }
    } catch (error) {
      
    }
  }
  useDynamicTitle(`${ t.query } | ${t.spare_parts_to_be_identified}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.query }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold">{ t.spare_parts_to_be_identified }</span>
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
                className={`${selected ? '!bg-success text-white !outline-none' : ''} flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.quotes_with_codes_to_identify }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''} flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.assigned_quotations }
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels className="shadow-lg bg-gray-200 ">

          <Tab.Panel>
            <QuotesIdentify t={t} token={token} data={quotes_identify} assignOrder={assignOrder}></QuotesIdentify>            
          </Tab.Panel>
          <Tab.Panel>
            <QuotesAssigned t={t} token={token} data={quotes_assigned} unassignOrder={unassignOrder} setQuotesAssigned={setQuotesAssigned}></QuotesAssigned>
          </Tab.Panel>
        </Tab.Panels>

      </Tab.Group>


    </>
  );
}