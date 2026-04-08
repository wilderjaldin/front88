'use client';
import React, { useEffect, useState } from 'react';


const TableItems = ({ t, items, token }) => {


  return (
    <div className="table-responsive">
      <table className="table-hover">
        <thead>
          <tr>
            <th>{ t.nro_part } 1</th>
            <th>{ t.brand } 1</th>
            <th>{ t.nro_part } 2</th>
            <th>{ t.brand } 2</th>
          </tr>
        </thead>
        <tbody>
          { items.map((item, index) => {
            return (
            <tr>
              <td>{ item.nro_part_1 }</td>
              <td>{ item.brand_1 }</td>
              <td>{ item.nro_part_2 }</td>
              <td>{ item.brand_2 }</td>
            </tr>
            )
          }) }
        </tbody>
      </table>
    </div>
  );
};

export default TableItems;
