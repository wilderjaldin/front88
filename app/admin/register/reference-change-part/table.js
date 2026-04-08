'use client';
import React, { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useForm, Controller } from "react-hook-form"
import IconSave from '@/components/icon/icon-save';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import Select from 'react-select';
import { customFormat } from '@/app/lib/format';

const TableItems = ({ NroParte = "", quote_id=0, t, items, token, brands, updateItem, deleteItem, validateItem, options = [] }) => {


  const [selected_items, setSelectedOrders] = useState([]);
  const [selected_options, setSelectedOptions] = useState([]);

  const {
    register,
    setValue,
    getValues,
    control,
    formState: { },
  } = useForm();



  useEffect(() => {
    items.map(record => {
      setValue(`orders.${record.CodRegistro}.nro_part`, record.NroParte);
      let brand = brands.find(b => b.label == record.NomAplicacion) || null;
      if (brand) {
        const current = Object.keys(brands).find((key) => brands[key].label == record.NomAplicacion) || null;
        if (current) {
          setValue(`orders.${record.CodRegistro}.application`, brand.value);
        }

      }
    })

  }, [items]);



  //
  const toggleAll = () => {
    if (selected_items.length === items.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(items.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelectedOrders((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };

  //

  // OPTIONS
  const toggleAllOptions = () => {
    if (selected_options.length === options.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions(options.map((r) => r));
    }
  };

  const toggleRowOption = (row) => {
    setSelectedOptions((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };
  //

  const handleChecked = (event, record, field) => {
    setValue(`orders.${record.CodRegistro}.${field}`, ((event.target.checked) ? 1 : 0));
  }


  const handleUpdate = async (record) => {
    const data = {
      CodRegistro: record.CodRegistro,
      NroParte: getValues(`orders.${record.CodRegistro}.nro_part`),
      CodMarca: getValues(`orders.${record.CodRegistro}.application`),
      Cambio: (getValues(`orders.${record.CodRegistro}.change`)) ? 1 : 0,
      Referencia: (getValues(`orders.${record.CodRegistro}.reference`)) ? 1 : 0,
      UltimoCambio: (getValues(`orders.${record.CodRegistro}.recent_change`)) ? 1 : 0,
      ValToken: token
    }
    updateItem(data);
  }

  const handleValidate = async () => {
    let data_send = [];
    selected_items.map((item) => {
      let value_select = getValues(`orders.${item.CodRegistro}.application`);
      let select = brands.find((b) => b.value == value_select)
      data_send.push(
        {
          NroOrden: quote_id,
          NroParte: item.NroParte,
          NomMarca: (select?.label) ?? "",
          ValToken: token
        }
      )
    }
    );

    selected_options.map((item) => {
      data_send.push(
        {
          NroOrden: quote_id,
          NroParte: item.NroParte,
          NomMarca: item.NomMarca,
          ValToken: token
        }
      )
    }
    );
    await validateItem(data_send);
    setSelectedOrders([])
    setSelectedOptions([])
  }

  return (
    <div className="relative z-10">

      <div className="table-responsive">
        <table className="table-hover table-compact">
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selected_items.length === items.length && items.length != 0}
                  indeterminate={
                    selected_items.length > 0 &&
                    selected_items.length < items.length
                  }
                  onChange={toggleAll}
                />
              </th>
              <th>{ t.nro_part }</th>
              <th>{t.application}</th>
              <th>{ t.d_register }</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {

              return (
                <tr key={index}>
                  <td>
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <Checkbox
                        className='cursor-pointer'
                        checked={selected_items.includes(item)}
                        onChange={() => toggleRow(item)}
                      />
                      <button className='btn btn-sm btn-success' onClick={() => handleUpdate(item)}><IconSave></IconSave></button>
                      <button className='btn btn-sm btn-danger' onClick={() => deleteItem({ CodRegistro: item.CodRegistro })} ><IconTrashLines></IconTrashLines></button>
                    </div>
                  </td>
                  <td>
                    <input type="text" {...register(`orders.${item.CodRegistro}.nro_part`)} className='form-input' />
                  </td>
                  <td>
                    <Controller
                      name={`orders.${item.CodRegistro}.application`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isClearable
                          isSearchable
                          placeholder={t.select_option}
                          menuPosition="fixed"
                          menuShouldScrollIntoView={false}
                          className="w-full"
                          options={brands}
                          value={brands.find(option => option.value === field.value) || null}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value ?? null);
                          }}
                        />
                      )}
                    />
                  </td>
                  <td>{item.FecRegistra}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button disabled={((selected_items.length > 0) || (selected_options.length > 0)) ? false : true} className='btn btn-lg btn-success' onClick={() => handleValidate()}>{ t.validate }</button>
      </div>

      <div className="table-responsive mt-4">
        <h2 className='bg-gray-200 p-2'>{ t.options_for_nro_part } <span className='font-bold'>[{NroParte}]</span></h2>
        <table className="table-hover table-compact">
          <thead>
            <tr>
              <th>
                <Checkbox
                  checked={selected_options.length === options.length && options.length != 0}
                  indeterminate={
                    selected_options.length > 0 &&
                    selected_options.length < options.length
                  }
                  onChange={toggleAllOptions}
                />
              </th>
              <th>{ t.nro_part }</th>
              <th>{t.description}</th>
              <th>{t.supplier}</th>
              <th>{t.brand}</th>
              <th>{t.weight}</th>
              <th>{t.cost}</th>
              <th>{t.condition}</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o, index) => {
              return (
                <tr key={index}>
                  <td>
                    <Checkbox
                      className='cursor-pointer'
                      checked={selected_options.includes(o)}
                      onChange={() => toggleRowOption(o)}
                    />
                  </td>
                  <td>{o.NroParte}</td>
                  <td>{o.DesRepuesto}</td>
                  <td>{o.NomPrv}</td>
                  <td>{o.NomMarca}</td>
                  <td className='text-end'>{customFormat(o.Peso)}</td>
                  <td className='text-end'>{customFormat(o.Costo)}</td>
                  <td>{o.Estado}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default TableItems;
