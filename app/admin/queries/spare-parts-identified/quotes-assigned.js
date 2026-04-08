'use client';
import React, { useEffect, useState } from 'react';

import ComponentsDatatablesOrdersPlaced from "@/components/datatables/components-datatables-orders-placed"
import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowUp from "@/components/icon/icon-arrow-up";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import Assigned from "@/app/admin/queries/spare-parts-identified/assigned"
import Modal from '@/components/modal';
import axios from 'axios'
import Link from 'next/link';


const url_save_note = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/GuardarNota';
const url_delete = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/EliminarItem';

const QuotesAssigned = ({ token, t, data, unassignOrder, setQuotesAssigned }) => {

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-xl')
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
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
    setSelectedOrders([])

    initialRecords.map((o, index) => (setValue(`orders.${o.NroOrden}.note`, o.Nota)));

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
          item.NomCliente.toLowerCase().includes(filter.toLowerCase()) ||
          item.Marca.toLowerCase().includes(filter.toLowerCase()) ||
          item.NroOrden.toString().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

  const handleDeleteOrders = async () => {

    if (selected_orders.length > 0) {

      Swal.fire({
        title: t.question_delete_the_selected_records,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#15803d',
        confirmButtonText: t.yes,
        cancelButtonText: t.btn_cancel,
        reverseButtons: true
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            let data = [];
            if (selected_orders.length > 0) {
              selected_orders.map(o => {
                data.push({ NroOrden: o.NroOrden, ValToken: token });
              })
            }
            
            const rs = await axios.post(url_delete, data);
            
            if (rs.data.estado == 'OK') {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: t.delete_quote_success,
                showConfirmButton: false,
                timer: 1500
              }).then(r => {
                let orders_assigned = rs.data.dato.map((o, index) => {
                  o.id = index;
                  return o;
                });
                setQuotesAssigned(orders_assigned);
              });
            } else {
              Swal.fire({
                position: "top-end",
                icon: "error",
                title: t.delete_quote_error,
                showConfirmButton: false,
                timer: 1500
              });
            }
          } catch (error) {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.delete_quote_error_server,
              showConfirmButton: false,
              timer: 1500
            });
          }
        }
      });

    }
  }
  
  const handleSaveNote = async () => {

    let data = [];
    recordsData.map(o => {
      data.push({ CodRegistro: o.NroOrden, Nota: getValues(`orders.${o.NroOrden}.note`), ValToken: token });
    });
    try {
      const rs = await axios.post(url_save_note, data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_note_quote_success,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.save_note_quote_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.save_note_quote_error_server,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }

  const handleShowAssignments = () => {
    setShowModal(true);
    setModalTitle('Items asignados a otros usuarios');
    setModalContent(<Assigned token={token} t={t} ></Assigned>)
  }



  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.assigned_quotations }</h2>


      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectAssigned} onClick={() => unassignOrder(selected_orders)} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.remove_assignment } <IconArrowUp className='-rotate-90 ml-2'></IconArrowUp>
          </button>

          <button disabled={isSelectAssigned} onClick={() => handleDeleteOrders()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.delete }
          </button>
          <button onClick={() => handleShowAssignments()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.view_assignments }
          </button>
          <button onClick={() => handleSaveNote()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.btn_save }
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
          { accessor: 'NroOrden', title: t.nro_quote, sortable: true,
            render: (record) => (
              <Link className='btn btn-sm btn-outline-info inline-block' href={`/admin/queries/spare-parts-identified/quotes?customer=${record.CodCliente}&id=${record.NroOrden}`}>{ record.NroOrden }</Link>
            )
          },
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          { accessor: 'Marca', title: t.brand, sortable: true },
          {
            accessor: 'Nota', title: t.note, sortable: true,
            render: (record) => (
              <>
                <input
                  type="text"
                  {...register(`orders.${record.NroOrden}.note`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            )
          },
          { accessor: 'FecCotizacion', title: t.quote_date, sortable: true }
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
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </div>
  );
};

export default QuotesAssigned;
