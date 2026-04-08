'use client';
import React, { useEffect, useState } from 'react';

import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axios from 'axios'
import Select from 'react-select';
import IconPlusCircle from '@/components/icon/icon-plus-circle';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import BtnPrintPacking from "@/app/admin/packaging/BtnPrintPacking"

const url_save = process.env.NEXT_PUBLIC_API_URL + 'embalaje/GuardarEmbalaje';

const Packaging = ({ token, t, packages, types_packagings, setOrders, setPackagings }) => {

  //
  const [selected_orders, setSelectedOrders] = useState([]);
  const [isSelectAssigned, setIsSelectAssigned] = useState(false);
  //
  const [users, setUsers] = useState([]);
  const [loadUsers, setLoadUsers] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [loadSuppliers, setLoadSuppliers] = useState(true)

  //
  const [selectedPackage, setSelectedPackege] = useState([]);
  //
  const [current_row, setCurrentRow] = useState(1);


  // rows
  const [rows, setRows] = useState([])



  //

  const {
    register,
    reset,
    setValue,
    getValues,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm();




  //

  const handleChange = (value, r) => {
    setValue(`packaging.${r.id}.type_packaging`, (value?.value) ?? null);
    clearErrors(`packaging.${r.id}.type_packaging`)
  }


  useEffect(() => {
    rows.map(r => {
      setValue(`packaging.${r.id}.amount`, getValues(`packaging.${r.id}.amount`) || 1);
      setValue(`packaging.${r.id}.long`, getValues(`packaging.${r.id}.long`) || "0.0");
      setValue(`packaging.${r.id}.width`, getValues(`packaging.${r.id}.width`) || "0.0");
      setValue(`packaging.${r.id}.weight`, getValues(`packaging.${r.id}.weight`) || "0.0");
      setValue(`packaging.${r.id}.height`, getValues(`packaging.${r.id}.height`) || "0.0");
      setValue(`packaging.${r.id}.type_packaging`, getValues(`packaging.${r.id}.type_packaging`) || null);
    });
  }, [rows]);

  const addRow = () => {
    setRows([...rows, { id: (current_row) }]);
    setCurrentRow(current_row + 1);
  }

  const removeRow = (id) => {
    let _rows = rows.filter((r, index) => {
      return id != r.id
    });
    setRows(_rows);
  }



  const handleSave = async () => {
    try {

      let dimensions = [];
      let isEmpty = false;
      rows.map(r => {
        if (getValues(`packaging.${r.id}.type_packaging`) == null) {
          isEmpty = true;
          setError(`packaging.${r.id}.type_packaging`, { type: 'custom', message: t.required_field });
        }
        dimensions.push(
          {
            TipEmbalaje: getValues(`packaging.${r.id}.type_packaging`),
            Cantidad: getValues(`packaging.${r.id}.amount`),
            Peso: getValues(`packaging.${r.id}.weight`),
            Largo: getValues(`packaging.${r.id}.long`),
            Ancho: getValues(`packaging.${r.id}.width`),
            Alto: getValues(`packaging.${r.id}.height`)
          })
      });

      if (isEmpty) {
        Swal.fire({
          title: t.error,
          text: t.packaging_type_is_not_selected,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

      if (dimensions.length == 0) {
        Swal.fire({
          title: t.error,
          text: t.packaging_dimensions_empty,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

      packages.map(p => {
        p.ValToken = token;
        return p;
      })
      let data_send = { Dimensiones: dimensions, Items: packages };

      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == 'Ok') {

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.packaging_successfully_saved,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setOrders(() => rs.data.dato.map((o, index) => {
            o.id = index;
            return o;
          }));
          setPackagings([])
          setRows([]);
          setCurrentRow(1);
          reset();
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.packaging_error_saved,
          showConfirmButton: false,
          timer: 1500
        });
      }

    } catch (error) {

    }
  }

  const handlePrint = async () => {
    try {
      
    } catch (error) {
      
    }
  }

  return (
    <div className="">

      <div className="bg-gray-100 shadow-lg border mb-4 table-responsive mb-5 z-20">
        <table className="table-hover table-compact whitespace-nowrap w-full">
          <thead>
            <tr>
              <th className="min-w-20">{ t.packaging_type }</th>
              <th className="max-w-4">{ t.amount }</th>
              <th className="max-w-4">{ t.weight_lb }</th>
              <th className="max-w-4">{ t.long }</th>
              <th className="max-w-2">{ t.width }</th>
              <th className="max-w-2">{ t.height }</th>
              <th className="text-end">
                <button onClick={() => addRow()} type="button" title="Agregar" className="btn btn-sm btn-primary w-8 h-8 p-0 "><IconPlusCircle /></button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => {

              return (

                <tr key={index}>
                  <td className="!p-1">
                    <div className="relative flex-1">
                      <Select
                        isSearchable={false}
                        instanceId={`city-select-${index}`}
                        menuPosition={'fixed'}
                        menuShouldScrollIntoView={false}

                        options={types_packagings}
                        //{...register('type_packaging', { required: { value: true, message: t.required_select } })}
                        {...register(`packaging.${r.id}.type_packaging`)}
                        onChange={(event) => handleChange(event, r)}
                        id="type_packaging-select"
                        placeholder={t.select_option} className={`w-full border${(errors.packaging && errors.packaging[r.id]?.type_packaging) ? ' border-1 border-red-400' : ''}`} />
                    </div>
                  </td>
                  <td className="!p-1">
                    <input type='text' autoComplete='OFF' {...register(`packaging.${r.id}.amount`)} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                  </td>
                  <td className="!p-1">
                    <input type='text' autoComplete='OFF' {...register(`packaging.${r.id}.weight`)} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                  </td>
                  <td className="!p-1">
                    <input type='text' autoComplete='OFF' {...register(`packaging.${r.id}.long`)} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                  </td>
                  <td className="!p-1">
                    <input type='text' autoComplete='OFF' {...register(`packaging.${r.id}.width`)} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                  </td>
                  <td className="!p-1">
                    <input type='text' autoComplete='OFF' {...register(`packaging.${r.id}.height`)} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                  </td>
                  <td className="!py-0">
                    {(index > 0) &&
                      <button type="button" onClick={() => removeRow(r.id)} className="hover:text-red-800 w-8 h-8 p-0 ">
                        <IconTrashLines />
                      </button>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className='bg-gray-100 shadow-lg border mt-10'>
        <div className="mb-2 mt-4 ml-4">
          <div className="flex flex-wrap items-center justify-start gap-2">
            <button disabled={(packages.length > 0) ? false : true} onClick={() => handleSave()} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
              { t.save_packaging }
            </button>
            <BtnPrintPacking packages={packages} disabled={(packages.length > 0) ? false : true} token={token} t={t} order_id={packages[0]?.NroRecepcion} className='btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark'></BtnPrintPacking>
            

          </div>

        </div>
        <div className="table-responsive mt-4">
          <table className='table-hover bg-white table-compact'>
            <thead>
              <tr>
                <th>{ t.nro_order }</th>
                <th>{ t.customer }</th>
                <th>{ t.nro_part }</th>
                <th>{ t.description }</th>
                <th>{ t.qty }</th>
                <th>Origen</th>
                <th>{ t.h_code }</th>
                <th>Material</th>
                <th>{ t.presentation }</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((o, index) => {
                return (
                  <tr key={index}>
                    <td>{o.NroOrden}</td>
                    <td>{o.NomCliente}</td>
                    <td>{o.NroParteCliente}</td>
                    <td>{o.Descripcion}</td>
                    <td>{o.CantRecibida}</td>
                    <td>{o.Origen}</td>
                    <td>{o.HCode}</td>
                    <td>{o.Material}</td>
                    <td>{o.Presentacion}</td>
                  </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Packaging;
