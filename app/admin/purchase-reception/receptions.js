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
const url_verify = process.env.NEXT_PUBLIC_API_URL + 'recepcion/ValidarDatosRecepcion';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'recepcion/GuardarDatosRecepcion';

const url_save_note = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarNota';
const url_save_status = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/CodigoInvalidoDescontinuado';

const Receptions = ({ token, t, data, setReceptions, setOrders, selected_orders }) => {


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
    setRecordsData(initialRecords);

    initialRecords.map((o, index) => {
      setValue(`orders_${index}_note`, o.Nota);
    });

  }, [initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  //


  useEffect(() => {
    setInitialRecords(() => {
      return data.filter((item) => {
        return (
          item.NumOrdenCompra.toString().includes(filter.toLowerCase()) ||
          item.NroOrden.toString().includes(filter.toLowerCase()) ||
          item.NomCliente.toLowerCase().includes(filter.toLowerCase()) ||
          item.NroParte.toString().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

  const handleReceiveAll = () => {
    recordsData.map((o, index) => {      
      setValue(`orders_${index}_amount`, o.CantFaltante);
    })
  }

  const handleSaveChanges = async () => {
    if (data.length > 0) {
      let data_send = [];
      data.map(o => {
        data_send.push({
          CadNroOrdenCompra: "",
          CantItems: 1,
          ValToken: token
        });
      });
      const is_valid = await verify(data);
      if (is_valid) {
        saveDataReception();
      } else {

        Swal.fire({
          title: t.error,
          text: t.attached_tems_does_not_match_the_orders,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    }
  }

  const verify = async (data) => {
    try {
      let NumOrdenCompra = [];
      
      selected_orders.map(o => {
        NumOrdenCompra.push(`${o.NumOrdenCompra}`);
      });
      let CadNroOrdenCompra = NumOrdenCompra.join(",");

      let data_send = {
        CadNroOrdenCompra: CadNroOrdenCompra,
        CantItems: data.length,
        ValToken: token
      }

      const rs = await axios.post(url_verify, data_send);
      if (rs.data.estado == 'Ok') {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      
      return false;
    }
  }

  const saveDataReception = async () => {
    try {
      let data_send = [];
      let different =  false;
      data.map((o, index) => {
        if(getValues(`orders_${index}_amount`) < 1 || getValues(`orders_${index}_amount`) > o.CantFaltante){
          different=true;
        }
        data_send.push(
          {
            NroOrdenCompra: o.NumOrdenCompra,
            NroOrden: o.NroOrden,
            NroParte: o.NroParte,
            NroParteCliente: o.NroParteCliente,
            CantFaltante: o.CantFaltante,
            CantRecibida: getValues(`orders_${index}_amount`),
            CodItem: o.CodItem,
            CodRepuesto: index,
            Origen: getValues(`orders_${index}_origen`),
            HCode: getValues(`orders_${index}_code`),
            Material: getValues(`orders_${index}_material`),
            Presentacion: getValues(`orders_${index}_presentacion`),
            Nota: getValues(`orders_${index}_note`),
            ValToken: token
          }
        );
      });

      if(different){
        Swal.fire({
          icon: "error",
          title: t.save_puschase_receipt_amount_error
        });
        return;
      }
      
      const rs = await axios.post(url_save, data_send);
      
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_puschase_receipt_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setOrders(() => rs.data.dato.map((o, index) => {
            o.id = index;
            return o;
          }));
          setReceptions([]);
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.save_puschase_receipt_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.save_puschase_receipt_error_server,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }


  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.purchase_reception }</h2>


      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">

          <button onClick={() => handleSaveChanges()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.btn_save_changes }
          </button>
          <button onClick={() => handleReceiveAll()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.receive_all }
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
          { accessor: 'NumOrdenCompra', title: t.nro_purchase_order, sortable: true },
          { accessor: 'NroOrden', title: t.nro_order, sortable: true },
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          { accessor: 'NroParte', title: t.nro_part, sortable: true },
          { accessor: 'NroParteCliente', title: t.nro_part_customer, sortable: true },
          { accessor: 'Descripcion', title: t.description, sortable: true },
          { accessor: 'CantFaltante', title: t.missing_amount, sortable: true },
          {
            accessor: 'CantRecibida', title: t.amount_received, sortable: true,
            render: (record, index) => (
              <>
                <input
                  step="any" type="number"
                  {...register(`orders_${index}_amount`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            ),
          },
          {
            accessor: 'Origen', title: 'Origen', sortable: true,
            render: (record, index) => (
              <>
                <input
                  type="text"
                  {...register(`orders_${index}_origen`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            ),
            width: 250,
          },
          {
            accessor: 'HCode', title: t.h_code , sortable: true,
            render: (record, index) => (
              <>
                <input
                  type="text"
                  {...register(`orders_${index}_code`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            ),
            width: 150,
          },
          {
            accessor: 'Material', title: 'Material', sortable: true,
            render: (record, index) => (
              <>
                <input
                  type="text"
                  {...register(`orders_${index}_material`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            ),
            width: 250,
          },
          {
            accessor: 'Presentacion', title: t.presentation, sortable: true,
            render: (record, index) => (
              <>
                <input
                  type="text"
                  {...register(`orders_${index}_presentacion`)}
                  className="form-input form-input-sm w-full border border-dark border-1"
                />
              </>
            ),
            width: 250,
          },
          {
            accessor: 'Nota', title: t.note, sortable: true,
            render: (record, index) => (
              <>
                <input
                  type="text"
                  {...register(`orders_${index}_note`)}
                  className="form-input form-input-sm w-full border border-dark border-1"

                />
              </>
            ),
            textAlign: 'center',
            width: 250,
          }
        ]}
        highlightOnHover
        totalRecords={initialRecords.length}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        minHeight={120}
      />
    </div>
  );
};

export default Receptions;
