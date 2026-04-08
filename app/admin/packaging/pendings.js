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
import IconArrowForward from '@/components/icon/icon-arrow-forward';

const url_cancel_reception = process.env.NEXT_PUBLIC_API_URL + 'embalaje/AnularRecepcion';

const url_save_note = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarNota';
const url_save_status = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/CodigoInvalidoDescontinuado';

const Pendings = ({ token, t, data, setOrders, attachOrder }) => {

  //
  const [selected_orders, setSelectedOrders] = useState([]);
  const [isSelectAssigned, setIsSelectAssigned] = useState(false);
  //
  const [users, setUsers] = useState([]);
  const [loadUsers, setLoadUsers] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [loadSuppliers, setLoadSuppliers] = useState(true)
  //
  const {
    register,
    getValues,
    setValue,
    handleSubmit
  } = useForm()

  //packages table
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(data, 'firstName'));
  const [recordsData, setRecordsData] = useState(initialRecords);

  const [filter, setFilter] = useState('');
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'firstName',
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
    setInitialRecords(() => {
      return data.filter((item) => {
        return (
          item.NroOrden.toString().includes(filter.toLowerCase()) ||
          item.NroOrdenCompra.toString().includes(filter.toLowerCase()) ||
          item.NomCliente.toLowerCase().includes(filter.toLowerCase()) ||
          item.DirEntrega.toLowerCase().includes(filter.toLowerCase()) ||
          item.NroRecepcion.toString().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    setPage(1);
  }, [sortStatus]);
  //



  useEffect(() => {
    setInitialRecords(data);
  }, [data]);

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

  const handleCancelReception = async () => {
    Swal.fire({
      title: t.question_cancel_the_order_reception,
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
              NroRecepcion: o.NroRecepcion,
              ValToken: token
            });
          });
          const rs = await axios.post(url_cancel_reception, data_send);
            
          if (rs.data.estado == 'Ok') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.the_order_reception_was_cancel,
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

  const attach = async () => {
    await attachOrder(selected_orders);
    setSelectedOrders([]);    
  }


  return (
    <div className="">

      <div className="mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectAssigned} onClick={() => handleCancelReception()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.cancel_reception }
          </button>
          <button disabled={isSelectAssigned} onClick={() => attach() } type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.attach_order } <IconArrowForward></IconArrowForward>
          </button>


          <div className='w-full'>
            <div className="relative ltr:ml-auto rtl:mr-auto">
              <input type="text" className="form-input w-full border border-dark border-1 pe-10" placeholder={t.filter} value={filter} onChange={(e) => setFilter(e.target.value)} />
              <div className="absolute inset-y-0 end-0 flex items-center pe-3 cursor-pointer" onClick={() => setFilter('')}>
                <IconBackSpace className="fill-dark z-10"></IconBackSpace>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="datatables">
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
            { accessor: 'NroOrden', title: t.nro_order, sortable: true },
            { accessor: 'NroOrdenCompra', title: t.nro_purchase_order , sortable: true },
            { accessor: 'NomCliente', title: t.customer, sortable: true },
            { accessor: 'NroRecepcion', title: t.nro_reception, sortable: true },
            { accessor: 'DirEntrega', title: t.delivery_address, sortable: true }
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
    </div>
  );
};

export default Pendings;
