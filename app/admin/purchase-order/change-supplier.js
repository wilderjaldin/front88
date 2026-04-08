'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useForm } from "react-hook-form"
import { customFormat } from '@/app/lib/format';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';


const url = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/MostrarOpcionPrv';
const url_change_supplier = process.env.NEXT_PUBLIC_API_URL + 'ordcompradetalle/SeleccionarOpcionPrv';


const ChangeSupplier = ({ CadNroOrden, close, t, token, item, items, setItems, setSelectedItems, setReload }) => {

  const router = useRouter();
  const [suppliers, setSuppliers] = useState([])
  const [top, setTop] = useState([]);
  const locale = useSelector(getLocale);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  const [selected, setSelected] = useState([]);
  const [isSelect, setIsSelect] = useState(false);

  useEffect(() => {
    getList();
  }, [item]);

  const getList = async () => {
    try {
      const rs = await axios.post(url, {
        Idioma: locale,
        NroParteCompra: item.NroParteCompra,
        NroParteCliente: item.NroParteCliente,
        ValToken: token

      });

      if (rs.data.estado == 'Ok') {

        const supplier_top = rs.data.dato.filter(s => {
          return s.CodRepuesto == item.CodRepuesto
        });
        if (supplier_top[0]) {
          setTop(supplier_top[0]);
        }
        setSuppliers(rs.data.dato);
        setSuppliers(
          () =>
            rs.data.dato.filter(s => {
              return s.CodRepuesto != item.CodRepuesto
            })
        )
      }
    } catch (error) {

    }
  }

  const toggleSelect = (item) => {

    setSelected(item)
  }

  useEffect(() => {
    if (selected?.CodRepuesto) {
      setIsSelect(false)
    } else {
      setIsSelect(true);
    }
  }, [selected]);

  const handleChangeSupplier = async () => {
    try {

      let data_send =
      {
        NomPrvOrigen: top.NomPrv,
        CadNroOrden: CadNroOrden,
        CodRepuestoSelect: selected.CodRepuesto,
        NroOrdenSelec: item.NroOrden,
        CodItemSelec: item.CodItem,
        NomPrvSelec: selected.NomPrv,
        CantidadSelect: item.CantFaltante,
        NroParteCliente: selected.NroParteCliente,
        CodRepuestoOriginal: top.CodRepuesto,
        OrigenCompra: "CT",
        ValToken: token,
        

      }

      const rs = await axios.post(url_change_supplier, data_send);

      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.change_supplier_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          close();
          if(rs.data.dato.length==0){
            setReload();
            setItems([]);
          } else{
            setItems(rs.data.dato);            
          }
          setSelectedItems([]);
          window.location.reload();          
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.change_supplier_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: t.change_supplier_error_server,
        showConfirmButton: false,
        timer: 1500
      });
    }
  }

  return (
    <>
      <table className="bg-white table-hover text-sm">
        <thead>
          <tr className="relative !bg-gray-400 text-center text-sm">
            <th>{ t.nro_part_customer }</th>
            <th>{ t.nro_part_purchase }</th>
            <th>{ t.amount }</th>
            <th>{ t.cost }</th>
            <th>{ t.type }</th>
            <th>{ t.supplier }</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{top.NroParteCliente}</td>
            <td>{top.NroParteCompra}</td>
            <td>{item.CantFaltante}</td>
            <td>{customFormat(top.Costo)}</td>
            <td>{top.TipoRep}</td>
            <td>{top.NomPrv}</td>
          </tr>
        </tbody>
      </table>
      <table className="bg-white table-hover text-sm">
        <thead>
          <tr className="relative !bg-gray-400 text-center text-sm">
            <th></th>
            <th>{ t.nro_part_customer }</th>
            <th>{ t.nro_part_purchase }</th>
            <th>{ t.amount }</th>
            <th>{ t.cost }</th>
            <th>{ t.type }</th>
            <th>{ t.supplier }</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s, index) => {
            return (
              <tr key={index}>
                <td className='w-1 !p-0'>
                  <input
                    type="radio"
                    name='supplier'
                    className="border border-dark border-1 form-radio"
                    onChange={() => toggleSelect(s)}
                  />
                </td>
                <td>{s.NroParteCliente}</td>
                <td>{s.NroParteCompra}</td>
                <td>{item.CantFaltante}</td>
                <td>{customFormat(s.Costo)}</td>
                <td>{s.TipoRep}</td>
                <td>{s.NomPrv}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-8">

        <button disabled={isSelect} type="button" onClick={() => handleChangeSupplier()} className="btn btn-success">
          Seleccionar
        </button>

      </div>
    </>
  );
};

export default ChangeSupplier;
