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
import DeleteForm from '@/app/admin/queries/spare-parts-quotation/delete-form'
import ShowAssignmentsForm from '@/app/admin/queries/spare-parts-quotation/show-assignments-form'
import Modal from '@/components/modal';
import MailToCustomerForm from "@/app/admin/queries/spare-parts-quotation/mail-to-customer-form"
import MailToSupplierForm from "@/app/admin/queries/spare-parts-quotation/mail-to-supplier-form"

import axios from 'axios'
const url_filter = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/MostrarDatosPFiltro';
const url_export = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/ExportarListaEx';
const url_save_note = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarNota';
const url_save_status = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/CodigoInvalidoDescontinuado';

const ItemsAssigned = ({ token, t, data, unassignOrder, setOrdersAssigned }) => {

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

    initialRecords.map((o, index) => (setValue(`orders.${o.CodRegistro}.note`, o.Nota)));

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
          item.NroOrden.toString().includes(filter.toLowerCase()) ||
          item.NroParte.toString().includes(filter.toLowerCase()) ||
          item.Aplicacion.toLowerCase().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

  const handleDeleteOrders = async () => {
    if (selected_orders.length > 0) {
      setModalSize('w-full max-w-xl');
      setModalTitle('');
      setModalContent(
        <DeleteForm
          t={t}
          token={token}
          action_cancel={() => setShowModal(false)}
          users={users}
          setUsers={setUsers}
          loadUsers={loadUsers}
          setLoadUsers={setLoadUsers}
          selected_orders={selected_orders}
          setOrdersAssigned={setOrdersAssigned}
        //suppliers={suppliers}
        //setSuppliers={setSuppliers}
        //loadSuppliers={loadSuppliers}
        //setLoadSuppliers={setLoadSuppliers}
        ></DeleteForm>);
      setShowModal(true);
    }
  }

  const handleExportOrders = async () => {
    try {
      if (selected_orders.length > 0) {
        let CadCodRegistro = []
        selected_orders.map(o => {
          CadCodRegistro.push(o.CodRegistro);
        });

        let data_send = {
          CadCodRegistro: CadCodRegistro.join(","),
          ValToken: token
        };

        const response = await axios.post(url_export, data_send, {
          responseType: "blob",
        });


        const contentDisposition = response.headers["content-disposition"];
        let filename = "archivo.csv";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        // Crear un blob
        const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);

        // Crear un link oculto y simular click
        const link = document.createElement("a");
        link.href = url;
        link.className ="no-load";
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();

        // Limpiar
        link.remove();
        window.URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error("Error al descargar:", error);
    }
  }
  const handleSaveStatus = async (option) => {
    Swal.fire({
      title: `${(option == 'IV') ? t.question_change_status_invalid : ((option == 'DE') ? t.question_change_status_discontinued : t.question_change_status_no_option)}`,
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
              data.push({ EstadoCodigo: option, CodRegistro: o.CodRegistro, NroOrden: o.NroOrden, NroParte: o.NroParte, ValToken: token });
            })
          }

          const rs = await axios.post(url_save_status, data);

          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.save_change_status_order_success,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              let orders_assigned = rs.data.dato.map((o, index) => {
                o.id = index;
                return o;
              });
              setOrdersAssigned(orders_assigned);
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.save_change_status_order_error,
              showConfirmButton: false,
              timer: 1500
            });
          }
        } catch (error) {
          Swal.fire({
            position: "top-end",
            icon: "error",
            title: t.save_change_status_order_error_server,
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });
  }
  const handleSaveNote = async () => {

    let data = [];
    recordsData.map(o => {
      data.push({ CodRegistro: o.CodRegistro, Nota: getValues(`orders.${o.CodRegistro}.note`), ValToken: token });
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
    setModalTitle('Items Asignados a otros Usuarios');
    setModalSize('w-full max-w-5xl');
    setModalContent(
      <ShowAssignmentsForm
        t={t}
        token={token}
        action_cancel={() => setShowModal(false)}
        users={users}
        setUsers={setUsers}
        loadUsers={loadUsers}
        setLoadUsers={setLoadUsers}
        selected_orders={selected_orders}
        setOrdersAssigned={setOrdersAssigned}
      //suppliers={suppliers}
      //setSuppliers={setSuppliers}
      //loadSuppliers={loadSuppliers}
      //setLoadSuppliers={setLoadSuppliers}
      ></ShowAssignmentsForm>);
    setShowModal(true);
  }

  const handleMailToCustomer = () => {

    let customers_names = [];
    selected_orders.map(o => {
      customers_names.push(o.NomCliente);
    });
    //
    if (customers_names.length > 1) {
      let s = new Set(customers_names);
      let a1 = [...s]
      if (a1.length > 1) {
        Swal.fire({
          title: t.error,
          text: t.different_customers_send_email_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

    }


    setModalTitle('');
    setModalSize('w-full max-w-3xl');
    setModalContent(<MailToCustomerForm selected={selected_orders} close={() => setShowModal(false)} print={print} t={t} token={token}></MailToCustomerForm>);
    setShowModal(true);
  }

  const handleMailToSupplier = () => {
    setModalTitle('');
    setModalSize('w-full max-w-3xl');
    setModalContent(<MailToSupplierForm selected={selected_orders} close={() => setShowModal(false)} print={print} t={t} token={token}></MailToSupplierForm>);
    setShowModal(true);
  }



  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.items_to_be_quoted_assigned }</h2>


      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectAssigned} onClick={() => unassignOrder(selected_orders)} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.remove_assignment } <IconArrowUp className='-rotate-90 ml-2'></IconArrowUp>
          </button>

          <button disabled={isSelectAssigned} onClick={() => handleDeleteOrders()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.delete }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleExportOrders()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.export }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleMailToCustomer()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.mail_to_customer }
          </button>
          <button disabled={isSelectAssigned} type="button" onClick={() => handleMailToSupplier()} className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.mail_to_supplier }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleSaveStatus('IV')} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.invalid }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleSaveStatus('DE')} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.discontinued }
          </button>
          <button disabled={isSelectAssigned} onClick={() => handleSaveStatus('SO')} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.no_option }
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
          { accessor: 'NroOrden', title: t.nro_order, sortable: true },
          { accessor: 'NroParte', title: t.nro_part, sortable: true },
          { accessor: 'Cantidad', title: t.amount , sortable: true },
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          { accessor: 'Aplicacion', title: t.application, sortable: true },
          { accessor: 'SugerenciaPrv', title: t.supplier_suggestion, sortable: true },
          {
            accessor: 'Nota', title: 'Nota', sortable: true,
            render: (record) => (
              <>
                <input
                  type="text"
                  {...register(`orders.${record.CodRegistro}.note`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            )
          },
          { accessor: 'Dias', title: 'Días', sortable: true },
          { accessor: 'FecCotizacion', title: 'Fecha Cot.', sortable: true }
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

export default ItemsAssigned;
