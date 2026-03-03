'use client';
import React, { useEffect, useState } from 'react';

import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowUp from "@/components/icon/icon-arrow-up";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axios from 'axios'
import IconArrowDown from '@/components/icon/icon-arrow-down';
const url_filter = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/MostrarDatosPFiltro';
const url_save_changes = process.env.NEXT_PUBLIC_API_URL + 'recepcion/GuardarCambiosOrdenCompra';
const url_cancel_order = process.env.NEXT_PUBLIC_API_URL + 'recepcion/AnulaOrdenCompra';
const url_save_status = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/CodigoInvalidoDescontinuado';

const Orders = ({ token, t, data, setOrders, attachOrder }) => {

  //
  const [selected_orders, setSelectedOrders] = useState([]);
  const [isSelectAssigned, setIsSelectAssigned] = useState(false);
  //
  const [users, setUsers] = useState([]);
  const [loadUsers, setLoadUsers] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [loadSuppliers, setLoadSuppliers] = useState(true)
  //

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(data, 'id'));
  const [recordsData, setRecordsData] = useState(initialRecords);


  const [filter, setFilter] = useState('');
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'id',
    direction: 'asc',
  });

  const {
    register,
    getValues,
    setValue,
    handleSubmit
  } = useForm()

  useEffect(() => {
    setInitialRecords(data);
    data.map(o => {
      setValue(`orders.${o.NumOrdenCompra}.tracking`, o.NumTracking);
      setValue(`orders.${o.NumOrdenCompra}.note`, o.Nota);
      setValue(`orders.${o.NumOrdenCompra}.checked`, o.Revisado);
    })
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
    setSelectedOrders([])

    initialRecords.map((o, index) => (setValue(`orders.${o.NumOrdenCompra}.note`, o.Nota)));

  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  //

  //
  const toggleAll = () => {
    if (selected_orders.length === recordsData.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(recordsData.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelectedOrders((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };
  useEffect(() => {
    if (selected_orders.length > 0) {
      setIsSelectAssigned(false)
    } else {
      setIsSelectAssigned(true);
    }
  }, [selected_orders]);
  //

  useEffect(() => {
    setPage(1);
    setInitialRecords(() => {
      return data.filter((item) => {
        return (
          item.NumOrdenCompra.toString().includes(filter.toLowerCase()) ||
          item.NroOrden.toString().includes(filter.toLowerCase()) ||
          item.NomPrv.toLowerCase().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);



  const handleSaveChanges = async () => {

    let data_send = [];
    selected_orders.map(o => {
      data_send.push({
        NroOrdenCompra: o.NumOrdenCompra,
        Revisado: (getValues(`orders.${o.NumOrdenCompra}.checked`) == 1) ? 1 : 0,
        NumTracking: getValues(`orders.${o.NumOrdenCompra}.tracking`),
        Nota: getValues(`orders.${o.NumOrdenCompra}.note`),
        ValToken: token
      });
    });
    
    try {
      const rs = await axios.post(url_save_changes, data_send);
      
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_data_success,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.save_data_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.save_data_error_server,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }
  const handleCancelOrder = async () => {
    Swal.fire({
      title: t.question_the_purchase_order_cancel,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.close,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let data_send = [];
          selected_orders.map(o => {
            data_send.push({
              NroOrdenCompra: o.NumOrdenCompra,
              ValToken: token
            });
          });
          const rs = await axios.post(url_cancel_order, data_send);
          
          if (rs.data.estado == 'Ok') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.the_purchase_order_was_cancel,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              setRecordsData(() => rs.data.dato.map((o, index) => {
                o.id = index;
                return o;
              }));
              setSelectedOrders([]);
              setOrders(() => rs.data.dato.map((o, index) => {
                o.id = index;
                return o;
              }));
            });
          }
        } catch (error) {

        }
      }
    });

  }
  const handleChecked = (event, record) => {
    
    setValue(`orders.${record.NumOrdenCompra}.checked`, ((event.target.checked) ? 1 : 0));
  }




  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.purchase_orders }</h2>


      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectAssigned} onClick={() => attachOrder(selected_orders)} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.attach_order } <IconArrowDown  className='rotate-90 ml-2'></IconArrowDown>
          </button>

          <button disabled={isSelectAssigned} onClick={() => handleCancelOrder()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.cancel_purchase_order }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleSaveChanges()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.btn_save_changes }
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
                checked={selected_orders.length === recordsData.length && recordsData.length != 0}
                indeterminate={
                  selected_orders.length > 0 &&
                  selected_orders.length < recordsData.length
                }
                onChange={toggleAll}
              />
            ),
            render: (record) => (

              <Checkbox
                className='cursor-pointer'
                checked={selected_orders.includes(record)}
                onChange={() => toggleRow(record)}
              />


            ),
            textAlign: 'center',
            width: 50,
          },
          { accessor: 'NumOrdenCompra', title:  t.nro_purchase_order , sortable: true },
          { accessor: 'NroOrden', title: t.nro_order, sortable: true },
          { accessor: 'NomPrv', title: t.supplier, sortable: true },
          { accessor: 'Dias', title: t.days_of_process, sortable: true },
          {
            accessor: 'Revisado', title: t.revised, sortable: true,
            render: (record) => (

              <Checkbox
                className='cursor-pointer'
                {...register(`orders.${record.NumOrdenCompra}.checked`)}
                value={1}
                //checked={(record.Revisado == 1) ?? false}
                onChange={(event) => handleChecked(event, record)}
              />


            )
          },
          {
            accessor: 'NumTracking', title: 'Tracking', sortable: true,
            render: (record) => (
              <>
                <input
                  type="text"
                  {...register(`orders.${record.NumOrdenCompra}.tracking`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            )
          },
          {
            accessor: 'Nota', title: t.note, sortable: true,
            render: (record) => (
              <>
                <input
                  type="text"
                  {...register(`orders.${record.NumOrdenCompra}.note`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            )
          }
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

export default Orders;
