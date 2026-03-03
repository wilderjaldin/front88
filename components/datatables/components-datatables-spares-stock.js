'use client';
import { useRef, useState } from 'react';
import IconPencilPaper from '../icon/icon-pencil-paper';
import IconSave from '../icon/icon-save';
import IconTrashLines from '../icon/icon-trash-lines';
import { useForm, SubmitHandler } from "react-hook-form";


const DatatablesSparesStock = ({ items = [], t, removeItem, updateAmount }) => {

  const [item_edit, setItem] = useState([]);
  const inputRef = useRef(null);


  const editItem = (item) => {
    setItem(item);
  }

  const saveItem = async (item) => {
    let rs = await updateAmount(item, inputRef.current.value);
    if(rs){
      setItem([]);
    }
  }

  return (
    <div className="panel mt-6">
      <div className="table-responsive mb-5">
        <table className="table-hover bg-white mantine-Table-root mantine-cdbiq">
          <thead>
            <tr>
              <th className="bg-gray-400 text-center uppercase">{t.nro_part}</th>
              <th className="bg-gray-400 text-center uppercase">{t.description}</th>
              <th className="bg-gray-400 text-center uppercase">{t.registration_date}</th>
              <th className="bg-gray-400 text-center uppercase">{t.amount}</th>
              <th className="bg-gray-400 text-center uppercase">{t.supplier}</th>
              <th className="bg-gray-400 text-center uppercase">{t.application}</th>
              <th className="bg-gray-400 text-center uppercase">{t.brand}</th>
              <th className="bg-gray-400 text-center uppercase">{t.spare_part_type}</th>
              <th className="bg-gray-400 text-center uppercase"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, index) => {
              return (
                <tr key={index}>
                  <td>{i.NroParte}</td>
                  <td>{i.Descripcion}</td>
                  <td>{i.FecIngreso}</td>
                  <td>
                    {(item_edit.CodRegistro == i.CodRegistro) ?
                      <input ref={inputRef} step="any" type="number" defaultValue={i.Cantidad} className='form-input' />
                      :
                      <label htmlFor="" className='font-bold'>{i.Cantidad}</label>
                    }
                  </td>
                  <td>{i.Proveedor}</td>
                  <td>{i.Aplicacion}</td>
                  <td>{i.Marca}</td>
                  <td>{i.TipRepuesto}</td>
                  <td>
                    <div className="flex flex-wrap items-end justify-end gap-2">
                      {(item_edit.CodRegistro == i.CodRegistro) ?
                        <>
                          <button type="button" onClick={() => setItem([])} className="btn btn-sm btn-dark">
                            {t.btn_cancel}
                          </button>
                          <button type="button" onClick={() => saveItem(i)} className="btn btn-sm btn-success">
                            <IconSave />
                          </button>
                        </>
                        :
                        <>
                          <button type="button" onClick={() => editItem(i)} className="btn btn-sm btn-info">
                            <IconPencilPaper />
                          </button>
                          <button type="button" onClick={() => removeItem(i)} className="btn btn-sm btn-danger">
                            <IconTrashLines />
                          </button>
                        </>
                      }


                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
};

export default DatatablesSparesStock;
