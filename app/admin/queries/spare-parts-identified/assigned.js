'use client';
import React, { useEffect, useState } from 'react';
import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowDown from "@/components/icon/icon-arrow-down";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import Link from 'next/link';

import axios from 'axios'

const url_assigned = process.env.NEXT_PUBLIC_API_URL + 'repporidentificar/VerAsignaciones';

const Assigned = ({ t, token }) => {

  const [items, setItems] = useState([])
  useEffect(() => {

    async function fetchData() {
      let res = await getData();
    }
    fetchData();
  }, []);

  const getData = async () => {
    try {
      const rs = await axios.post(url_assigned, { ValToken: token });
      if (rs.data.estado == 'OK') {
        setItems(rs.data.dato);
      }
    } catch (error) {

    }
  }

  return (
    <div className="table-responsive">
      {(items.length > 0) ?
        <table className='table-hover'>
        <thead>
          <tr>
            <th>{ t.nro_order }</th>
            <th>{ t.customer }</th>
            <th>{ t.user }</th>
            <th>{ t.days }</th>
          </tr>
        </thead>
        <tbody>
          { items.map( (item, index ) => {
            return(
              <tr key={index}>
                <td>{ item.NroOrden }</td>
                <td>{ item.NomCliente }</td>
                <td>{ item.NomUsuario }</td>
                <td>{ item.Dias }</td>
              </tr>
            )
          }) }
        </tbody>
      </table>
      :
      <div>
        <h2 className='text-lg font-bold'>{ t.record_empty }</h2>
      </div>
      }
    </div>
  );
};

export default Assigned;
