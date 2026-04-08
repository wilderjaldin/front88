'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const TableSuppliers = ({ t, suppliers }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.suppliers_details }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{ t.supplier }</th>
              <th>{ t.address }</th>
              <th>{ t.nro_document }</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s, index) => {
              return (
                <tr key={index}>
                  <td><Link href={`/admin/register/suppliers?supplier=${s.CodPrv}&option=general`} className='inline-block'><span className='btn btn-sm btn-outline-info'>{s.NomPrv}</span></Link></td>
                  <td>{s.Direccion}</td>
                  <td>{s.NumDoc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSuppliers;
