'use client';
import React, { useEffect, useState } from 'react';

const TableBrands = ({ t, brands }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.brands_application_detail }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{t.brand}/{t.application}</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b, index) => {
              return (
                <tr key={index}>
                  <td>{b.NomMarca}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBrands;
