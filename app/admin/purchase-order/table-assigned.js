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
import IconArrowUp from '@/components/icon/icon-arrow-up';

const TableAssigned = ({ t, orders_assigned, assignOrder, unassignOrder, createPurchaseOrder }) => {

  const [selected_assigned, setSelectedAssigned] = useState([]);

  //
  const toggleSelectAssigned = (order) => {
    setSelectedAssigned((prev) =>
      prev.includes(order) ? prev.filter((i) => i.NroOrden !== order.NroOrden) : [...prev, order]
    )
  }

  const toggleAllAssigned = () => {
    if (selected_assigned.length === orders_assigned.length) {
      setSelectedAssigned([])
    } else {
      setSelectedAssigned(orders_assigned.map((d) => d))
    }
  }

  //

  const unassignOrderTable = async() => {
    const res = await unassignOrder(selected_assigned);
    if(res){
      setSelectedAssigned([]);
    }
  }

  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.assigned_purchase_orders }</h2>
      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-4">
          <button disabled={!(selected_assigned.length > 0)} onClick={() => unassignOrderTable()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.remove_from_list } <IconArrowUp className='-rotate-90 ml-2'></IconArrowUp>
          </button>

          <button disabled={!(selected_assigned.length > 0)} onClick={() => { createPurchaseOrder(selected_assigned); setSelectedAssigned([]); } } type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.create_purchase_order }
          </button>
        </div>
      </div>
      <table className="bg-white table-hover text-sm">
        <thead>
          <tr className="relative !bg-gray-400 hover:!bg-gray-400  text-center text-sm">
            <th className="w-1">
              <Checkbox
                checked={selected_assigned.length === orders_assigned.length && orders_assigned.length != 0}
                indeterminate={
                  selected_assigned.length > 0 &&
                  selected_assigned.length < orders_assigned.length
                }
                onChange={toggleAllAssigned}
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
          {orders_assigned.map((o, index) => {
            return (
              <tr key={index} className="group/item">
                <td className="w-1">
                  <input
                    type="checkbox"
                    className="border border-dark border-1 form-checkbox"
                    checked={selected_assigned.includes(o)}
                    onChange={() => toggleSelectAssigned(o)}
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

export default TableAssigned;