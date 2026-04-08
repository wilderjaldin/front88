'use client';
import React, { useEffect, useState } from 'react';
import { Checkbox } from '@mantine/core';
import { useForm, Controller } from "react-hook-form"
import Select from 'react-select';
import { useOptionsSelect } from '@/app/options'
import { customFormat } from '@/app/lib/format';
import Swal from 'sweetalert2'

import axios from 'axios'
import IconBackSpace from '@/components/icon/icon-backspace';
const url_validate = process.env.NEXT_PUBLIC_API_URL + 'referencia/ValidarReferencia';

const TableReference = ({ NroParte, t, items = [], token, options = [], close, quote_id = 0, brands=[] }) => {


  const [selected_items, setSelectedItems] = useState([]);
  const [selected_options, setSelectedOptions] = useState([]);
  const [recordsData, setRecordsData] = useState(items);
  const [filter, setFilter] = useState('');

  const {
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setRecordsData(() => {
      return items.filter((item) => {
        return (
          item.NroParte.toString().includes(filter.toUpperCase()) ||
          item.NomAplicacion.toString().includes(filter.toUpperCase())
        );
      });
    });
  }, [filter]);

  useEffect(() => {
    items.map(record => {
      setValue(`orders.${record.CodRegistro}.nro_part`, record.NroParte);
      let brand = brands.find(b => b.label == record.NomAplicacion) || null
      if (brand) {
        setValue(`orders.${record.CodRegistro}.application`, brand.value);
      }
    })

 }, [items, brands, setValue]);



  // ITEMS
  const toggleAll = () => {
    if (selected_items.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelectedItems((prev) =>
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

  const validateItem = async () => {
    try {
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


      const rs = await axios.post(url_validate, data_send);
      if (rs.data.estado == "OK") {
        close();
        Swal.fire({
          title: t.validate_quote_success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
    }
  }

  return (
    <div className="relative z-10">
      <div className='w-full'>
        <div className="relative ltr:ml-auto rtl:mr-auto">
          <input type="text" className="form-input w-full border border-dark border-1 pe-10" placeholder={t.filter} value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 cursor-pointer" onClick={() => setFilter('')}>
            <IconBackSpace className="fill-dark z-10"></IconBackSpace>
          </div>
        </div>
      </div>
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
            {recordsData.map((item, index) => {

              return (
                <tr key={index}>
                  <td>
                    <Checkbox
                      className='cursor-pointer'
                      checked={selected_items.includes(item)}
                      onChange={() => toggleRow(item)}
                    />
                  </td>
                  <td>
                    {item.NroParte}
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
        <button className='btn btn-dark' onClick={() => close()}>{t.btn_close}</button>
        <button disabled={((selected_items.length > 0) || (selected_options.length > 0)) ? false : true} className='btn btn-success' onClick={() => validateItem()}>{ t.validate }</button>
      </div>

      <div className="table-responsive mt-4">
        <h2 className='bg-gray-200 p-2'>{ t.options_for_nro_part } <span className='font-bold'>[{NroParte}]</span></h2>
        <table className="table-hover-table-compact">
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

export default TableReference;
