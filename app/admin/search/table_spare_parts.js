'use client';

import Link from "next/link";
import { customFormat } from '@/app/lib/format';

const TableSparePartsOptions = ({ t, spare_parts }) => {

  return (
    <div className="panel shadow-xl border-[#b7b7b7] border mt-8 px-0 py-0">
      <div className='table-responsive mt-4'>
        <h2 className='px-8 text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight mb-2'>{ t.part_number_options }</h2>
        <table className="table-hover table-striped table-compact whitespace-nowrap">
          <thead>
            <tr className="!bg-gray-400 text-center uppercase">
              <th>{ t.nro_part }</th>
              <th>{ t.supplier }</th>
              <th>{ t.description }</th>
              <th>{ t.cost }</th>
              <th>{ t.weight }</th>
            </tr>
          </thead>
          <tbody>
            {spare_parts.map((c, index) => {
              return (
                <tr key={index}>
                  <td><Link href={`/admin/register/spares?id=${c.CodRepuesto}&action=view`} className='inline-block'><span className='btn btn-sm btn-outline-info'>{c.NroParte}</span></Link></td>
                  <td>{c.NomPrv}</td>
                  <td>{c.DesRepuesto}</td>
                  <td>{ customFormat(c.Costo) }</td>
                  <td>{c.Peso}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSparePartsOptions;
