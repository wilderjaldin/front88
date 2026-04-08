'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useForm, useWatch, SubmitHandler } from "react-hook-form"

const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarResumenCostos';
import { customFormat } from '@/app/lib/format';
import Link from 'next/link';
import IconTrash from '@/components/icon/icon-trash';
import IconX from '@/components/icon/icon-x';

const DivideQuantity = ({ close, t, item, items, setItems }) => {

  const [current_row, setCurrentRow] = useState(1);
  const [rows, setRows] = useState([])
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  const [selected, setSelected] = useState([]);
  const [isSelect, setIsSelect] = useState(false);

  useEffect(() => {
    setRows([{ id: 1, NroParteCliente: item.NroParteCliente, NroParteCompra: item.NroParteCompra, Cantidad: 1 }, { id: 2, NroParteCliente: item.NroParteCliente, NroParteCompra: item.NroParteCompra, Cantidad: 1 }])
    setCurrentRow(3);
  }, [item]);

  const toggleSelect = (item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i.NroOrden !== item.NroOrden) : [...prev, item]
    )
  }

  const toggleAll = () => {
    if (selected.length === rows.length) {
      setSelected([])
    } else {
      setSelected(rows.map((d) => d))
    }
  }

  useEffect(() => {
    if (selected.length > 0) {
      setIsSelect(false)
    } else {
      setIsSelect(true);
    }
  }, [selected]);

  const addRow = () => {
    var total = 0;
    rows.map(item => {
      total += Number(getValues(`data.${item.id}.quantity`));
    });

    if (total < item.CantFaltante) {
      setRows([...rows, { id: current_row, NroParteCliente: item.NroParteCliente, NroParteCompra: item.NroParteCompra, Cantidad: 1 }])
      setCurrentRow(current_row + 1);
    }
  }

  const removeRow = (id) => {
    let _rows = rows.filter((r, index) => {
      return id != r.id
    });
    setRows(_rows);
  }

  const divide = () => {
    var total = 0;
    rows.map(item => {
      total += Number(getValues(`data.${item.id}.quantity`));
    });

    if (total != item.CantFaltante) {
      Swal.fire({
        title: t.error,
        text: `${t.the_amount_must_add_up}: ${item.CantFaltante}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    let quantity = 1;
    let _items = [];
    rows.map(i => {
      quantity = Number(getValues(`data.${i.id}.quantity`));
      _items.push({
        CantComprada: quantity,
        CantFaltante: quantity,
        CodItem: item.CodItem,
        CodRepuesto: item.CodRepuesto,
        CostoReal: item.CostoReal,
        CostoSistema: item.CostoSistema,
        Descripcion: item.Descripcion,
        NroOrden: item.NroOrden,
        NroParteCliente: item.NroParteCliente,
        NroParteCompra: item.NroParteCompra,
        OrigenCompra: item.OrigenCompra,
        Total: item.Total,
        isDivide: 1
      });
    });
    setItems(_items);
    close();
  }

  return (
    <>
      <div className="relative !mt-0 px-6 mb-8">
        <div className="mt-6 grid grid-cols-1 gap-0 ltr:text-left rtl:text-right">
          <div className="flex sm:flex-row flex-col border-b pb-2">
            <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.nro_part_customer }</div>
            <div className="text-end ml-8 font-bold flex-1">{item.NroParteCliente}</div>
          </div>
          <div className="flex sm:flex-row flex-col border-b pb-2">
            <div className="flex-none ltr:mr-2 rtl:ml-2">	{ t.nro_part_purchase }</div>
            <div className="text-end ml-8 font-bold flex-1">{item.NroParteCompra}</div>
          </div>
          <div className="flex sm:flex-row flex-col">
            <div className="flex-none ltr:mr-2 rtl:ml-2">{ t.amount }</div>
            <div className="text-end ml-8 font-bold flex-1">{item.CantFaltante}</div>
          </div>
        </div>
      </div>
      <table className="bg-white table-hover text-sm">
        <thead>
          <tr className="relative !bg-gray-400 text-center text-sm">
            <th>{ t.nro_part_customer }</th>
            <th>{ t.nro_part_purchase }</th>
            <th>
              <div className="flex justify-between">
                { t.quantity  }
                <button className='btn btn-sm btn-dark' type='button' onClick={() => addRow()}>{ t.btn_add }</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            return (
              <tr key={index}>
                <td>{item.NroParteCliente}</td>
                <td>{item.NroParteCompra}</td>
                <td>
                  <div className="flex items-center justify-center">
                    <input step="any" defaultValue={1} {...register(`data.${item.id}.quantity`)} className="form-input border border-dark border-1 ltr:rounded-r-none rtl:rounded-l-none " />
                    <button onClick={() => removeRow(item.id)} type="button" className="btn btn-outline-danger ltr:rounded-l-none rtl:rounded-r-none px-1">
                      <IconX className='p-0 h-5'></IconX>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-8">

        <button type="button" onClick={() => divide()} className="btn btn-success">
          { t.divide_quantity }
        </button>

      </div>
    </>
  );
};

export default DivideQuantity;
