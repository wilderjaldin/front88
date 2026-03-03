'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import Select from 'react-select';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Checkbox } from '@mantine/core';
import sortBy from 'lodash/sortBy';

const url_list = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/VerAsignaciones';
const url_remove = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/QuitarAsignaciones';
const url_change = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/ModificarAsignaciones';

const ShowAssignmentsForm = ({ token, t, action_cancel, setOrdersAssigned }) => {

  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([])
  const [current_position, setCurrentPosition] = useState(0)
  const [data_values, setData] = useState([]);
  const [selected_items, setSelectedOrders] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(records, 'NroOrden'));
  const [recordsData, setRecordsData] = useState(initialRecords);

  const [search, setSearch] = useState('');

  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'NroOrden',
    direction: 'desc',
  });

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function fetchData() {
      await getLists();
    }
    fetchData();

  }, []);

  const getLists = async () => {
    let array = [];
    try {
      const rs = await axios.post(url_list, { ValToken: token });

      if (rs.data.estado == 'OK') {
        setRecords(() => rs.data.dato1.map((o, index) => {
          o.id = index;
          return o;
        }));
        let options = [];
        rs.data.dato2.map((o, index) => {
          if (o.CodUsuario != 0) {
            options.push({ value: o.CodUsuario, label: o.NomUsuario });
          }
        });
        setUsers(options);
      }
      return array;

    } catch (error) {

      return [];
    }
  }

  useEffect(() => {
    const sorted = sortBy(records, 'NroOrden');
    setInitialRecords(sorted);
    setSortStatus({ columnAccessor: 'NroOrden', direction: 'desc' });
  }, [records]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    setPage(1);
  }, [sortStatus]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData(records.slice(from, to));
  }, [page, pageSize]);

  useEffect(() => {
    setInitialRecords(() => {
      return records.filter((item) => {
        return (
          item.NroOrden.toString().includes(search.toLowerCase()) ||
          item.NroParte.toLowerCase().includes(search.toLowerCase()) ||
          item.Marca.toLowerCase().includes(search.toLowerCase()) ||
          item.NomCliente.toLowerCase().includes(search.toLowerCase())
        );
      });
    });
  }, [search]);

  const toggleRow = (row) => {
    setSelectedOrders((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };

  const handleChangeOption = (select) => {
    setValue('user', (select?.value) ?? null);
  }

  const next = async (data) => {
    let position = current_position;


    if (position <= selected_items.length) {
      let d = [];
      d.push(
        ...data_values, {
        CodUsuDestino: data.user,
        Mensaje: data.message,
        CodRegistro: selected_items[position].CodRegistro,
        NroOrden: data.nro_quote,
        NroParte: selected_items[position].NroParte,
        UltimoItem: ((current_position + 1) == selected_items.length) ? 1 : 0,
        ValToken: token
      });

      setData(d);
      position++;
      if (position == selected_items.length) {

        try {
          const rs = await axios.post(url_delete, d);

          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delete_orders_success,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              let orders_assigned = rs.data.dato.map((o, index) => {
                o.id = index;
                return o;
              });
              setOrdersAssigned(orders_assigned);
            });

          }
          action_cancel();
        } catch (error) {

        }

      } else {
        setValue('nro_quote', selected_items[position].NroOrden);
        setValue('message', 'Listo');
        setCurrentPosition(position);
      }

    } else {

    }

  }

  const removeAssignment = async () => {
    try {
      let data = [];
      selected_items.map(item => {
        data.push({
          CodRegistro: item.CodRegistro,
          ValToken: token
        })
      });

      const rs = await axios.post(url_remove, data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.remove_assignment_success,
          showConfirmButton: false,
          timer: 2000
        }).then(r => {
          setRecords(() => rs.data.dato.map((o, index) => {
            o.id = index;
            return o;
          }));
        });

      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.remove_assignment_error,
          showConfirmButton: false,
          timer: 2500
        });
      }
    } catch (error) {

    }
  }

  const changeUser = async () => {
    try {
      let data = [];
      let CodUsuario = getValues('user');
      if(selected_items.length == 0 ) { return; }
      selected_items.map(item => {
        data.push(
          {
            CodRegistro: item.CodRegistro,
            CodUsuario: CodUsuario,
            ValToken: token
          }
        )
      });
      
      const rs = await axios.post(url_change, data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.change_user_success,
          showConfirmButton: false,
          timer: 2000
        }).then(r => {
          setRecords(() => rs.data.dato.map((o, index) => {
            o.id = index;
            return o;
          }));
        });

      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.change_user_error,
          showConfirmButton: false,
          timer: 2500
        });
      }

    } catch (error) {

    }
  }

  return (
    <div className="">
      <form action="" >
        <fieldset>
          <div className="flex sm:flex-row flex-col gap-4">
            <div className='sm:w-3/4 space-y-2'>
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="to_user">{ t.user }</label>
                <div className="relative flex-1">
                  <Select
                    options={users}
                    isClearable
                    {...register('user', { required: { value: true, message: t.required_select } })}
                    isSearchable
                    id="user-select"
                    instanceId="user-select"
                    menuPosition={'fixed'}
                    onChange={handleChangeOption}
                    menuShouldScrollIntoView={false}
                    placeholder={t.select_option}
                  ></Select>
                  {errors.user && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.user?.message?.toString()}</span>}
                </div>
              </div>



            </div>

          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button disabled={(selected_items.length > 0) ? false : true} onClick={() => removeAssignment()} type="button" className="btn btn-danger">
              { t.remove_assignment }
            </button>
            <button disabled={(selected_items.length > 0) ? false : true} type="button" onClick={handleSubmit(changeUser)} className="btn btn-success">
              { t.change_user }
            </button>


          </div>
        </fieldset>


      </form>
      <div className="datatables mt-4">
        <div className="mb-5 block flex-col gap-5 md:flex-row md:items-center">
          <div className="ltr:ml-auto rtl:mr-auto">
            <input type="text" className="form-input w-full border border-dark border-1" placeholder={t.filter} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable
          noRecordsText={t.empty_results}
          highlightOnHover
          className="table-hover whitespace-nowrap"
          records={recordsData}
          columns={[
            {
              accessor: 'select',
              title: "",
              render: (record) => (
                <Checkbox
                  className='cursor-pointer'
                  checked={selected_items.includes(record)}
                  onChange={() => toggleRow(record)}
                />
              ),
              textAlign: 'center',
              width: 50,
            },

            { accessor: 'NroOrden', title: t.nro_order, sortable: true },
            {
              accessor: 'NroParte', title: t.nro_part, sortable: true
            },
            { accessor: 'Marca', title: t.application, sortable: true },
            {
              accessor: 'Cantidad', title: t.amount , sortable: true
            },
            { accessor: 'NomCliente', title: t.customer, sortable: true },
            { accessor: 'NomUsuario', title: t.user, sortable: true },
            { accessor: 'Dias', title: t.days, sortable: true }
          ]}
          totalRecords={initialRecords.length}
          recordsPerPage={pageSize}
          page={page}
          onPageChange={(p) => setPage(p)}
          recordsPerPageOptions={PAGE_SIZES}
          onRecordsPerPageChange={setPageSize}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          minHeight={200}
          paginationText={({ from = 0, to = 1, totalRecords = 110 }) => `${t.showing}  ${from} ${t.to} ${to} ${t.of} ${totalRecords} ${t.entries}`}

        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button onClick={() => action_cancel()} type="button" className="btn btn-dark">
          {t.close}
        </button>
      </div>

    </div>
  );
};

export default ShowAssignmentsForm;
