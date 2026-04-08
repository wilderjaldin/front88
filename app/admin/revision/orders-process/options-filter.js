import React, { useRef, useEffect, useState } from 'react';

import axios from 'axios'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';

const url = process.env.NEXT_PUBLIC_API_URL + 'revision/FiltrarListaOrdProceso';



const OptionsFilter = ({ t, token, customers, cancel, setOrders }) => {

  const locale = useSelector(getLocale);

  const [seleccionados, setSeleccionados] = useState([])

  const toggleSeleccion = (order) => {
    setSeleccionados((prev) =>
      prev.includes(order) ? prev.filter((i) => i.NomCliente !== order.NomCliente) : [...prev, order]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === customers.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(customers.map((d) => d))
    }
  }

  const onAccept = async () => {
    
    try {
      let data = [];
      seleccionados.map(c => {
        data.push(
        {
          Idioma: locale,
          NomCliente: c.NomCliente,
          ValToken: token
        }
        )
      });

      

      const rs = await axios.post(url, data);
      
      if(rs.data.estado == 'Ok'){
        setOrders(rs.data.dato);
        cancel();
      }
    } catch (error) {
      
    }
  }

  return (

    <>
      <div className="table-responsive">
        <table className="bg-white table-hover">
          <thead>
            <tr className="relative !bg-gray-400 text-center uppercase">
              <th>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="border border-dark border-1 bg-white form-checkbox"
                    checked={seleccionados.length === customers.length}
                    onChange={toggleTodos}
                  />
                </label>
              </th>
              <th>{t.customer}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((o, index) => {
              return (
                <tr key={index} className={`border-b transition-colors ${seleccionados.includes(o) ? 'bg-blue-100' : ''}`}>
                  <td>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="border border-dark border-1 form-checkbox"
                        checked={seleccionados.includes(o)}
                        onChange={() => toggleSeleccion(o)}
                      />
                    </label>
                  </td>
                  <td>{o.NomCliente}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="my-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => cancel() } type="button" className="btn btn-outline-dark">
              { t.btn_cancel }
            </button>
            <button disabled={(seleccionados?.length==0)} onClick={() => onAccept()} type="button" className="btn btn-success">
              { t.accept }
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

export default OptionsFilter;