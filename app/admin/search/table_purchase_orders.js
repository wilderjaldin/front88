'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const TablePurchaseOrders = ({ t, orders }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.purchase_orders }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{ t.purchase_order }</th>
              <th>{t.nro_quote}</th>
              <th>{t.nro_part}</th>
              <th>{ t.customer }</th>
              <th>{ t.supplier }</th>
              <th>{ t.purchase_order_date }</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, index) => {
              return (
                <tr key={index}>
                  <td><Link href={`#`} className='inline-block'><span className='btn btn-sm btn-outline-info'>{o.NroOrdenCompra}</span></Link></td>
                  <td>{o.NroOrden}</td>
                  <td>{o.NroParte}</td>
                  <td>{o.NomCliente}</td>
                  <td>{o.NomProveedor}</td>
                  <td>{o.FecOrdenCompra}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablePurchaseOrders;
