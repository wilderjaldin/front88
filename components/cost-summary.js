'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarResumenCostos';
import { customFormat } from '@/app/lib/format';

const CostSummary = ({ close, token, t, order, setItems, setOrder }) => {

  const [summary, setSummary] = useState([]);

  useEffect(() => {
    getSummary();
  }, []);

  const getSummary = async () => {
    try {
      const rs = await axios.post(url, { NroOrden: order.NroOrden, ValToken: token });

      if (rs.data.estado == 'OK') {
        setSummary(rs.data.dato[0]);
      }
    } catch (error) {
    }
  }
  return (
    <>

      <div className='table-responsive'>
        <table className='table-striped w-full'>
          <tbody>
            <tr>
              <td className='text-end pr-4 text-black w-1/2'>{ t.spare_parts_cost }</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.CostoRepuesto) }</td>
            </tr>
            <tr>
              <td className='text-end pr-4 text-black'>{ t.freight }</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.FleteInterno) }</td>
            </tr>
            <tr>
              <td className='text-end pr-4 text-black'>{ t.utility }</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.Utilidad) }</td>
            </tr>
            <tr>
              <td className='text-end pr-4 text-black'>{ t.discount }</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.Descuento) }</td>
            </tr>
            <tr>
              <td className='text-end pr-4 text-black'>{ t.tax }</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.Impuesto) }</td>
            </tr>
            <tr>
              <td className='text-end pr-4 text-black text-lg font-bold'>TOTAL</td>
              <td className='text-blue-600 font-bold text-lg text-end'>{ customFormat(summary.Total) }</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CostSummary;
