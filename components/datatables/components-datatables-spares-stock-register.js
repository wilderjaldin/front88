'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import IconPencil from '../icon/icon-pencil';
import IconTrashLines from '../icon/icon-trash-lines';
import { useForm, SubmitHandler } from "react-hook-form"

import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'disponibilidad/GuardarNroParteDisponible';

const DatatablesSparesStockRegister = ({ t, token, items = [], action_cancel }) => {




  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSave = async (data) => {
    let _data = [];
    let c = [];
    data.items.map((amount, code_part) => {
      c = (items).find((key) => key.CodRepuesto == code_part);
      _data.push({ CodRepuesto: code_part, NroParte: (c.NroParte) ?? '', Cantidad: amount, ValToken: token });
    });

    try {
      const rs = await axios.post(url, _data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.available_stock_save_success,
          showConfirmButton: false,
          timer: 1500
        });
        action_cancel();
      } else {
        Swal.fire({
            position: "top-end",
            icon: "error",
            title: t.available_stock_save_error,
            showConfirmButton: false,
            timer: 1500
          });
      }
    } catch (error) {

    }
  }

  return (
    <>
      {(items.length > 0) &&
        <div className="panel p-0 mb-4">
          <div className="table-responsive">
            <form className="" onSubmit={handleSubmit(onSave)}>

              <table className=''>
                <thead>
                  <tr>
                    <th className='bg-gray-400 text-center uppercase w-32 text-sm'>{ t.amount }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.nro_part }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.description }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.supplier }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.application }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.brand }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.spare_part_type }</th>
                    <th className="bg-gray-400 text-center uppercase">{ t.status }</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, index) => {
                    return (
                      <tr key={index}>
                        <td className='!p-1 !text-sm'><input step="any" type="number" {...register(`items[${i.CodRepuesto}][]`, { required: false })} defaultValue={0} className='form-input' /></td>
                        <td className='!p-1 !text-sm'>{i.NroParte}</td>
                        <td className='!p-1 !text-sm'>{i.Descripcion}</td>
                        <td className='!p-1 !text-sm'>{i.Proveedor}</td>
                        <td className='!p-1 !text-sm'>{i.Aplicacion}</td>
                        <td className='!p-1 !text-sm'>{i.Marca}</td>
                        <td className='!p-1 !text-sm'>{i.TipRepuesto}</td>
                        <td className='!p-1 !text-sm'></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

            </form>
          </div>
        </div>
      }

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={action_cancel} type="button" className="btn btn-dark">
          {t.btn_cancel}
        </button>

        {(items.length > 0) &&
          <button type="button" onClick={handleSubmit(onSave)} className="btn btn-success">
            {t.btn_save}
          </button>
        }

      </div>
    </>
  );
};

export default DatatablesSparesStockRegister;
