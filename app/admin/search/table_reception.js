'use client';
import React, { useEffect, useState } from 'react';

const TableReception = ({ t, orders }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.purchase_reception }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>Num. Recepción	</th>
              <th>{t.nro_quote}</th>
              <th>{t.nro_part}</th>
              <th>{ t.supplier}</th>
              <th>{ t.customer }</th>
              <th>Fec. Recepción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, index) => {
              return (
                <tr key={index}>
                  <td>{ o.NroRecepcion}</td>
                  <td>{ o.NroOrden}</td>
                  <td>{ o.NroParte}</td>
                  <td>{ o.NomPrv}</td>
                  <td>{ o.NomCliente }</td>
                  <td>{ o.FecRecepcion }</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableReception;
