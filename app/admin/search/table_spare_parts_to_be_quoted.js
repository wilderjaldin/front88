'use client';

import Link from "next/link";

const TableSparePartsQuote = ({ t, data }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.spare_parts_to_be_quoted }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{t.nro_part}</th>
              <th>{t.nro_quote}</th>
              <th>{ t.customer }</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, index) => {
              return (
                <tr key={index}>
                  <td><Link href={``} className='inline-block'><span className='btn btn-sm btn-outline-info'>{c.NroParte}</span></Link></td>
                  <td>{c.NroOrden}</td>
                  <td>{c.NomCliente}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSparePartsQuote;
