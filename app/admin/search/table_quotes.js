'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const TableQuotes = ({ t, quotes }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.quotes }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{t.nro_quote}</th>
              <th>{t.nro_part}</th>
              <td>{ t.customer }</td>
              <th>{ t.quote_date }</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, index) => {
              return (
                <tr key={index}>
                  <td><Link href={`/admin/revision/quotes?customer=${q.CodCliente}&option=quotes&id=${q.NroOrden}`} className='inline-block'><span className='btn btn-sm btn-outline-info'>{q.NroOrden}</span></Link></td>
                  <td>{q.NroParte}</td>
                  <td>{ q.NomCliente }</td>
                  <td>{q.FecCotizacion}</td>                  
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableQuotes;
