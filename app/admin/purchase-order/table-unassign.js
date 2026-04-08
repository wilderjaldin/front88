'use client';
import React, { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm, Controller } from "react-hook-form"
import IconSave from '@/components/icon/icon-save';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import Select from 'react-select';
import { customFormat } from '@/app/lib/format';
import IconArrowDown from '@/components/icon/icon-arrow-down';

const TableUnassigned = ({ t, orders_unassigned, assignOrder, goToTab }) => {


  const [selected_pending, setSelectedPending] = useState([]);

  //
  const toggleSelectPending = (order) => {
    setSelectedPending((prev) =>
      prev.includes(order) ? prev.filter((i) => i.NroOrden !== order.NroOrden) : [...prev, order]
    )
  }

  const toggleAllPending = () => {
    if (selected_pending.length === orders_unassigned.length) {
      setSelectedPending([])
    } else {
      setSelectedPending(orders_unassigned.map((d) => d))
    }
  }

 

  const assignOrderTable = async() => {
    const res = await assignOrder(selected_pending);
    if(res){
      setSelectedPending([]);
      goToTab('assigned');
    }
  }

  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.pending_orders_not_assigned }</h2>

      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start">
          <button disabled={!(selected_pending.length>0)} onClick={() => assignOrderTable()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.assign } <IconArrowDown className='rotate-90 ml-2'></IconArrowDown>
          </button>
        </div>
      </div>

      <table className="bg-white table-hover text-sm">
        <thead>
          <tr className="relative !bg-gray-400 text-center text-sm">
            <th className="w-1">
              <Checkbox
                checked={selected_pending.length === orders_unassigned.length && orders_unassigned.length != 0}
                indeterminate={
                  selected_pending.length > 0 &&
                  selected_pending.length < orders_unassigned.length
                }
                onChange={toggleAllPending}
              />
            </th>
            <th>{t.supplier}</th>
            <th>{ t.nro_order }</th>
            <th>Items</th>
            <th>{ t.value }</th>
            <th>{t.days}</th>
            <th>{t.customer}</th>
          </tr>
        </thead>
        <tbody>
          {orders_unassigned.map((o, index) => {
            return (
              <tr key={index} className="group/item">
                <td className="w-1">
                  <input
                    type="checkbox"
                    className="border border-dark border-1 form-checkbox"
                    checked={selected_pending.includes(o)}
                    onChange={() => toggleSelectPending(o)}
                  />
                </td>
                <td>{o.NomProveedor}</td>
                <td className="w-2">{o.NroOrden}</td>
                <td className="w-2">{o.NroItems}</td>
                <td className="w-2">{o.Monto}</td>
                <td className="w-2">{o.Dias}</td>
                <td className="!p-0">{o.NomCliente}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TableUnassigned;