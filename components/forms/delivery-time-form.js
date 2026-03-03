'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconTrashLines from '../icon/icon-trash-lines';
import IconPlusCircle from '../icon/icon-plus-circle';
import IconPencil from '../icon/icon-pencil';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconSave from '../icon/icon-save';
import IconCancelCircle from '../icon/icon-cancel-circle';

const url_save = process.env.NEXT_PUBLIC_API_URL + 'empresa/GuardarTiempoEnt';
const url_delete = process.env.NEXT_PUBLIC_API_URL + 'empresa/EliminarTiempoEnt';

const ComponentDeliveryTimeForm = ({ company = [], delivery = [], token }) => {
  const t = useTranslation();
  const [current_row, setCurrentRow] = useState(1);
  const [rows, setRows] = useState([])
  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { },
  } = useForm({ defaultValues: {} });

  useEffect(() => {
    setRows(delivery);
    setCurrentRow(delivery.length + 1)
  }, [delivery]);


  const addRow = () => {
    const newRow = { IdRegistro: current_row, Rango1: 0, Rango2: 0, Descripcion: '' };
    setRows([...rows, newRow]);
    setEditingRowId(current_row);
    setCurrentRow(current_row + 1);
    setBackupRow(null);
  };

  const deleteDelivery = async (row) => {
    Swal.fire({
      title: t.question_delete_record,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_delete, { CodRegistro: row.IdRegistro, ValToken: token });

          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.record_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              title: t.error,
              text: t.record_deleted_error,
              icon: 'error',
              confirmButtonColor: '#dc2626',
              confirmButtonText: t.close
            });
          }
        } catch (error) {

        }
        let _rows = rows.filter((r, index) => {
          return row.IdRegistro != r.IdRegistro
        });
        setRows(_rows);
        setEditingRowId(null);
      }
    });

  }

  const editDelivery = (row) => {
    const originalValues = getValues(`data[${row.IdRegistro}]`);
    setBackupRow({
      IdRegistro: row.IdRegistro,
      start: originalValues?.start ?? row.Rango1,
      end: originalValues?.end ?? row.Rango2,
      description: originalValues?.description ?? row.Descripcion,
    });

    setEditingRowId(row.IdRegistro);
  }
  const cancel = (row) => {
    if (!backupRow) {
      // si es una fila nueva, simplemente se elimina
      setRows(prev => prev.filter(r => r.IdRegistro !== row.IdRegistro));
    } else {
      // Restaurar en react-hook-form
      setValue(`data[${row.IdRegistro}][start]`, backupRow.start);
      setValue(`data[${row.IdRegistro}][end]`, backupRow.end);
      setValue(`data[${row.IdRegistro}][description]`, backupRow.description);

      // Restaurar también en rows (estado local)
      setRows(prev =>
        prev.map(r =>
          r.IdRegistro === row.IdRegistro
            ? {
              ...r,
              Rango1: backupRow.start,
              Rango2: backupRow.end,
              Descripcion: backupRow.description,
            }
            : r
        )
      );
    }

    setEditingRowId(null);
    setBackupRow(null);
  };
  const updateDelivery = async (row) => {
    try {
      const values = getValues(`data[${row.IdRegistro}]`);


      let data_send = {
        CodRegistro: row.IdRegistro,
        Valor1: values.start,
        Valor2: values.end,
        Descripcion: values.description,
        ValToken: token
      }
      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == "OK") {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.record_updated,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.record_updated_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
      setEditingRowId(null);
    } catch (error) {

    }
  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4'>
        <form className="w-full sm:w-4/5 m-auto">
          <div className="table-responsive mb-5">
            {(rows) &&
              <table className="table-hover bg-white mantine-Table-root mantine-cdbiq">
                <thead>
                  <tr>
                    <th className="w-24">{ t.value } 1</th>
                    <th className="w-24">{ t.value } 2</th>
                    <th className="max-w-4">{ t.description_delivery_time }</th>
                    <th className="flex items-center">                      
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, index) => {

                    return (

                      <tr key={index} className="group hover:bg-gray-50">
                        <td className="!p-1">
                          <input type='number' defaultValue={r.Rango1} readOnly={editingRowId !== r.IdRegistro} autoComplete='OFF' {...register(`data[${r.IdRegistro}][start]`, { required: false })} placeholder={t.login.enter_min_cost} className={`form-input ${editingRowId === r.IdRegistro ? '' : 'group-hover:read-only:bg-gray-50 read-only:border-none'}`} />
                        </td>
                        <td className="!p-1">
                          <input type='number' defaultValue={r.Rango2} readOnly={editingRowId !== r.IdRegistro} autoComplete='OFF' {...register(`data[${r.IdRegistro}][end]`, { required: false })} placeholder={t.login.enter_min_cost} className={`form-input ${editingRowId === r.IdRegistro ? '' : 'group-hover:read-only:bg-gray-50 read-only:border-none'}`} />
                        </td>
                        <td className="!p-1">
                          <input type='text' defaultValue={r.Descripcion} readOnly={editingRowId !== r.IdRegistro} autoComplete='OFF' {...register(`data[${r.IdRegistro}][description]`, { required: false })} placeholder={t.login.enter_min_cost} className={`form-input ${editingRowId === r.IdRegistro ? '' : 'group-hover:read-only:bg-gray-50 read-only:border-none'}`} />
                        </td>
                        <td>
                          <div
                            className={`mx-auto flex w-max items-center gap-2 ${editingRowId === r.IdRegistro ? '' : 'opacity-0 group-hover:opacity-100'
                              }`}
                          >
                            {editingRowId === r.IdRegistro ? (
                              <>
                                <button type="button" onClick={() => updateDelivery(r)} title={t.btn_save}>
                                  <IconSave></IconSave>
                                </button>
                                <button type="button" onClick={() => cancel(r)} title={t.btn_cancel}>
                                  <IconCancelCircle className='fill-black'></IconCancelCircle>
                                </button>
                              </>
                            ) : (

                              !(editingRowId) &&

                              <div>
                                <button type="button" onClick={() => editDelivery(r)} title={t.btn_edit}>
                                  <IconPencil />
                                </button>
                                <button type="button" onClick={() => deleteDelivery(r)} title={t.delete}>
                                  <IconTrashLines />
                                </button>
                              </div>


                            )}

                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>

          <div>
            {!(editingRowId) && <button onClick={() => addRow()} type="button" title="Agregar" className="btn btn-sm m-auto btn-primary  p-1 "><IconPlusCircle className='mr-2' />{t.btn_add}</button>}
          </div>

        </form>


      </div>

    </>
  );
};

export default ComponentDeliveryTimeForm;
