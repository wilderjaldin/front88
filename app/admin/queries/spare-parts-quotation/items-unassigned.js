'use client';
import React, { useEffect, useState } from 'react';

import ComponentsDatatablesOrdersPlaced from "@/components/datatables/components-datatables-orders-placed"
import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowDown from "@/components/icon/icon-arrow-down";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axios from 'axios'
import Link from 'next/link';
const url_filter = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/MostrarDatosPFiltro';
const url_search = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/BuscarListaSinAsignar';
const url_save_apps = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarAplicacion';

const ItemsUnassigned = ({ token, t, data, assignOrder }) => {


  const [orders_assigned, setOrdersAssigned] = useState([])

  const [selected_pending, setSelectedPending] = useState([]);
  const [isSelectPending, setIsSelectPending] = useState(false);


  //

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(data, 'id'));
  const [recordsData, setRecordsData] = useState(initialRecords);


  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'id',
    direction: 'asc',
  });

  const {
    register,
    getValues,
    setValue,
    reset,
    handleSubmit
  } = useForm()

  useEffect(() => {
    setInitialRecords(data);
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
    setSelectedPending([]);
    initialRecords.map((o, index) => (setValue(`applications.${o.CodRegistro}.app`, o.Aplicacion)));
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  //

  //
  const toggleAll = () => {
    if (selected_pending.length === recordsData.length) {
      setSelectedPending([]);
    } else {
      setSelectedPending(recordsData.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelectedPending((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };
  useEffect(() => {
    if (selected_pending.length > 0) {
      setIsSelectPending(false)
    } else {
      setIsSelectPending(true);
    }
  }, [selected_pending]);

  useEffect(() => {
    setPage(1);
    setInitialRecords(() => {
      return data.filter((item) => {
        return (
          item.NomCliente.toLowerCase().includes(filter.toLowerCase()) ||
          item.NroOrden.toString().includes(filter.toLowerCase()) ||
          item.NroParte.toString().includes(filter.toLowerCase()) ||
          item.Aplicacion.toLowerCase().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

  //

  const onFilter = async () => {
    try {
      const rs = await axios.post(url_filter, { Opcion: 'NA', ValToken: token });
      
    } catch (error) {

    }
  }

  const handleSearch = async () => {
    try {
      const rs = await axios.post(url_search, { NroParte: search, IndiceOrdenar: 0, ValToken: token });
      if (rs.data.estado == 'OK') {
        let orders_unassigned = rs.data.dato.map((o, index) => {
          o.id = index;
          return o;
        });
        setInitialRecords(orders_unassigned)
      }
    } catch (error) {

    }
  }

  const handleSaveAplication = async () => {
    
    let data = [];
    recordsData.map(o => {
      data.push({ CodRegistro: o.CodRegistro, NomMarca: getValues(`applications.${o.CodRegistro}.app`), ValToken: token });
    })
    
    
    try {
      const rs = await axios.post(url_save_apps, data);
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_apps_quote_success,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.save_apps_quote_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.save_apps_quote_error_server,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }

  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <div>
        <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.unassigned_quote_items }</h2>
        <div className="relative p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
              </svg>
            </div>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={ t.enter_data_search } required />
            <div className="absolute end-2.5 bottom-2.5">
              <button type="button" onClick={() => setSearch('')} className="btn-dark hover:bg-gray-900 text-white mr-2 font-medium rounded-lg text-sm px-4 py-2">{t.btn_clear}</button>
              <button type="button" onClick={() => handleSearch()} className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectPending} onClick={() => assignOrder(selected_pending)} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.assign } <IconArrowDown  className='rotate-90 ml-2'></IconArrowDown>
          </button>
          <button onClick={() => handleSaveAplication()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.save_application }
          </button>

          <div>
            <div className="relative ltr:ml-auto rtl:mr-auto">
              <input type="text" className="form-input w-full border border-dark border-1 pe-10" placeholder={t.filter} value={filter} onChange={(e) => setFilter(e.target.value)} />
              <div className="absolute inset-y-0 end-0 flex items-center pe-3 cursor-pointer" onClick={() => setFilter('')}>
                <IconBackSpace className="fill-dark z-10"></IconBackSpace>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        className="table-hover table-compact whitespace-nowrap"
        records={recordsData}
        columns={[
          {
            accessor: 'select',
            title: (
              <Checkbox
                checked={selected_pending.length === recordsData.length && recordsData.length != 0}
                indeterminate={
                  selected_pending.length > 0 &&
                  selected_pending.length < recordsData.length
                }
                onChange={toggleAll}
              />
            ),
            render: (record) => (
              <Checkbox
                checked={selected_pending.includes(record)}
                onChange={() => toggleRow(record)}
              />
            ),
            textAlign: 'center',
            width: 50,
          },
          { accessor: 'NroOrden', title: t.nro_order, sortable: true,
            render: (record) => (
              <Link className='btn btn-sm btn-outline-info inline-block' href={`/admin/revision/quotes?customer=${record.CodCliente}&option=quotes&id=${record.NroOrden}`}>{ record.NroOrden }</Link>
            )
          },
          { accessor: 'NroParte', title: t.nro_part, sortable: true },
          { accessor: 'Cantidad', title: t.amount , sortable: true },
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          { accessor: 'AsignadoA', title: 'Asignado a', sortable: true },
          {
            accessor: 'Aplicacion', title: t.application, sortable: true,
            render: (record) => (
              <>
                <input
                  type="text"
                  {...register(`applications.${record.CodRegistro}.app`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            )
          },
          { accessor: 'Dias', title: 'Días', sortable: true }
        ]}
        highlightOnHover
        totalRecords={initialRecords.length}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={(p) => setPage(p)}
        recordsPerPageOptions={PAGE_SIZES}
        onRecordsPerPageChange={setPageSize}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        minHeight={200}
        paginationText={({ from, to, totalRecords }) => `${t.showing}  ${from} ${t.to} ${to} ${t.of} ${totalRecords} ${t.entries}`}
      />

    </div>
  );
};

export default ItemsUnassigned;
