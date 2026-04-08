'use client';
import IconCheck from '@/components/icon/icon-check';
import IconX from '@/components/icon/icon-x';
import React, { useEffect, useState } from 'react';

const TableSparePartsChange = ({ t, orders }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.changes_part_reference }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{ t.nro_part }</th>
              <th>{ t.change }</th>
              <th>{ t.reference }</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, index) => {
              return (
                <tr key={index}>
                  <td>{o.NroParte}</td>
                  <td>{ (o.Cambio == 1) ? <IconCheck className='fill-green-600'> </IconCheck> : <IconX></IconX>  }</td>
                  <td>{ (o.Referencia == 1) ? <IconCheck className='fill-green-600'> </IconCheck> : <IconX></IconX>  }</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSparePartsChange;
