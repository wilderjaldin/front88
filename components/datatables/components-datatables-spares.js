'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import IconPencil from '../icon/icon-pencil';
import IconTrashLines from '../icon/icon-trash-lines';
import { useTranslation } from "@/app/locales";
import IconUserPlus from '../icon/icon-user-plus';
import IconListCheck from '../icon/icon-list-check';
import IconLayoutGrid from '../icon/icon-layout-grid';
import Dropdown from '@/components/dropdown';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconSearch from '../icon/icon-search';
import axios from 'axios'
import Swal from 'sweetalert2'
import sortBy from 'lodash/sortBy';

import { useDevice } from '@/context/device-context';

const url_delete_spare = process.env.NEXT_PUBLIC_API_URL + 'repuesto/EliminarRegistroCliente';
const DatatablesSpares = ({ data = [], t, editSparePart, token }) => {

  const { isMobile } = useDevice();

  const [value, setValue] = useState((isMobile) ? 'grid' : 'list');
  const options = [{ value: 0, label: "Todos" }, { value: 1, label: t.min_quantity }, { value: 2, label: t.abb_unit }, { value: 3, label: t.abb_special_order }, { value: 4, label: t.abb_special_order_quantity }, { value: 5, label: t.abb_special_order_date }, { value: 6, label: t.abb_modified_date }, { value: 7, label: t.abb_validity_date }, { value: 8, label: t.status }]
  const [checks, setChecks] = useState([]);
  const [all, setAll] = useState(false);

  const [spares, setSpares] = useState(data)
  const [search, setSearch] = useState('');
  const [hideCols, setHideCols] = useState(['CanDias', 'PedidoEspecial', 'CanMin', 'UniMed', 'CanStock', 'CanMin', 'UniMed', 'PedEspecialSinFecha', 'FecModifica', 'FecVencimiento', 'CodEstado']);

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(spares, 'NroParte'));
  const [recordsData, setRecordsData] = useState(initialRecords);

  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'NroParte',
    direction: 'desc',
  });


  const cols = [
    { accessor: 'CanStock', title: t.abb_available_quantity },
    { accessor: 'CanMin', title: t.min_quantity },
    { accessor: 'UniMed', title: t.abb_unit },
    { accessor: 'PedidoEspecial', title: t.abb_special_order },
    { accessor: 'CanDias', title: t.abb_special_order_quantity },
    { accessor: 'PedEspecialSinFecha', title: t.abb_special_order_date },
    { accessor: 'FecModifica', title: t.abb_modified_date },
    { accessor: 'FecVencimiento', title: t.abb_validity_date },
    { accessor: 'CodEstado', title: t.status }
  ];

  useEffect(() => {
    setSpares(data);
    setInitialRecords(data);
  }, [data]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    setPage(1);
  }, [sortStatus]);

  useEffect(() => {
    setInitialRecords(() => {
      return spares.filter((item) => {
        return (
          item.NroParte.toLowerCase().includes(search.toLowerCase()) ||
          item.DesRepuesto.toString().includes(search.toLowerCase())
        );
      });
    });
  }, [search]);

  const showHideColumns = (col, value) => {
    if (hideCols.includes(col)) {
      setHideCols((col) => hideCols.filter((d) => d !== col));
    } else {
      setHideCols([...hideCols, col]);
    }
  };



  const deleteSparePart = (s) => {
    Swal.fire({
      title: t.question_delete_spare,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      text: s.NroParte,
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_spare, { IdRepuesto: s.IdRepuesto, ValToken: token });

          if (rs.data.estado == "OK") {
            setSpares(() => {
              return spares.filter((item) => {
                return item.IdRepuesto != s.IdRepuesto;
              });
            });

            Swal.fire({
              position: "top-end",
              icon: "success",
              text: t.delete_spare_success,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.delete_spare_error,
              showConfirmButton: false,
              timer: 1500
            });
          }

        } catch (error) {
          
          Swal.fire({
            title: t.error,
            text: t.delete_spare_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }

      }

    });
  }

  return (
    <>
      {(spares.length > 0) &&
        <div className='panel bg-gray-200 mt-6'>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl">{t.spare_parts}</h2>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="flex gap-3 justify-between">

                <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex items-center gap-5 ltr:ml-auto rtl:mr-auto">
                    {(value === 'list') && 
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                      <div className="dropdown bg-white">
                        <Dropdown
                          placement={`bottom-end`}
                          btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                          button={
                            <>
                              <span className="ltr:mr-1 rtl:ml-1">{t.columns}</span>
                              <IconCaretDown className="h-5 w-5" />
                            </>
                          }
                        >
                          <ul className="!min-w-[240px]">
                            {cols.map((col, i) => {
                              return (
                                <li
                                  key={i}
                                  className="flex flex-col"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <div className="flex items-center px-4 py-1">
                                    <label className="mb-0 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!hideCols.includes(col.accessor)}
                                        className="form-checkbox"
                                        defaultValue={col.accessor}
                                        onChange={(event) => {
                                          setHideCols(event.target.value);
                                          showHideColumns(col.accessor, event.target.checked);
                                        }}
                                      />
                                      <span className="ltr:ml-2 rtl:mr-2">{col.title}</span>
                                    </label>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </Dropdown>
                      </div>
                    </div>
                    }
                    <div className="text-right">
                      <input type="text" className="form-input" placeholder={t.filter} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                    <IconListCheck />
                  </button>
                </div>
                <div>
                  <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                    <IconLayoutGrid />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {value === 'list' && (
            <div className="panel mt-5 overflow-hidden border-0 p-0">

              <div className="datatables">
              { (initialRecords.length>0) &&
                <DataTable
                  className="table-hover whitespace-nowrap"
                  records={initialRecords}
                  columns={[
                    {
                      title: '',
                      accessor: 'id',
                      render: (s) => (
                        <div className="relative inline-flex align-middle">
                          <button title={t.edit} type="button" className="btn btn-sm btn-info ltr:rounded-r-none rtl:rounded-l-none" onClick={() => editSparePart(s)}><IconPencil /></button>
                          <button title={t.delete} type="button" className="btn btn-sm btn-danger ltr:rounded-l-none rtl:rounded-r-none" onClick={() => deleteSparePart(s)}><IconTrashLines /></button>
                        </div>
                      )
                    },
                    {
                      accessor: 'NroParte',
                      title: t.nro_part,
                      sortable: true,
                      hidden: hideCols.includes('NroParte'),
                    },
                    {
                      accessor: 'DesRepuesto',
                      title: t.description,
                      sortable: true,
                      hidden: hideCols.includes('DesRepuesto'),
                    },
                    {
                      accessor: 'Proveedor',
                      title: t.supplier,
                      sortable: true,
                      hidden: hideCols.includes('Proveedor'),
                    },
                    {
                      accessor: 'Marca',
                      title: t.brand,
                      sortable: true,
                      hidden: hideCols.includes('Marca'),
                    },
                    {
                      accessor: 'Aplicacion',
                      title: t.application,
                      sortable: true,
                      hidden: hideCols.includes('Aplicacion'),
                    },
                    {
                      accessor: 'TipRepuesto',
                      title: t.spare_part_type,
                      sortable: true,
                      hidden: hideCols.includes('TipRepuesto'),
                    },
                    {
                      accessor: 'Estado',
                      title: t.status,
                      sortable: true,
                      hidden: hideCols.includes('Estado'),
                    },
                    {
                      accessor: 'Peso',
                      title: `${t.weight} (lb)`,
                      sortable: true,
                      hidden: hideCols.includes('Peso')
                    },
                    {
                      accessor: 'Costo',
                      title: t.cost,
                      sortable: true,
                      hidden: hideCols.includes('Costo'),
                    },
                    {
                      accessor: 'CanStock',
                      title: t.abb_available_quantity,
                      sortable: true,
                      hidden: hideCols.includes('CanStock'),
                    },
                    {
                      accessor: 'CanMin',
                      title: t.min_quantity,
                      sortable: true,
                      hidden: hideCols.includes('CanMin'),
                    },
                    {
                      accessor: 'UniMed',
                      title: t.abb_unit,
                      sortable: true,
                      hidden: hideCols.includes('UniMed'),
                    },
                    {
                      accessor: 'PedidoEspecial',
                      title: t.abb_special_order,
                      sortable: true,
                      hidden: hideCols.includes('PedidoEspecial'),
                      render: (s) => (
                        (s.PedidoEspecial == 1) ?
                          <span className="badge bg-success">{t.yes}</span>
                          :
                          <span className="badge bg-dark">{t.no}</span>
                      )
                    },
                    {
                      accessor: 'CanDias',
                      title: t.abb_special_order_quantity,
                      sortable: true,
                      hidden: hideCols.includes('CanDias'),
                    },
                    {
                      accessor: 'PedEspecialSinFecha',
                      title: t.abb_special_order_date,
                      sortable: true,
                      hidden: hideCols.includes('PedEspecialSinFecha'),
                      render: (s) => (
                        (s.PedEspecialSinFecha == 1) ?
                          <span className="badge bg-success">{t.yes}</span>
                          :
                          <span className="badge bg-dark">{t.no}</span>
                      )
                    },
                    {
                      accessor: 'FecModifica',
                      title: t.abb_modified_date,
                      sortable: true,
                      hidden: hideCols.includes('FecModifica'),
                    },
                    {
                      accessor: 'FecVencimiento',
                      title: t.abb_validity_date,
                      sortable: true,
                      hidden: hideCols.includes('FecVencimiento'),
                    },
                    {
                      accessor: 'CodEstado',
                      title: t.status,
                      sortable: true,
                      hidden: hideCols.includes('CodEstado'),
                    }

                  ]}
                  highlightOnHover
                  totalRecords={initialRecords.length}
                  recordsPerPage={pageSize}
                  onPageChange={(p) => setPage(p)}
                  recordsPerPageOptions={PAGE_SIZES}
                  onRecordsPerPageChange={setPageSize}
                  sortStatus={sortStatus}
                  onSortStatusChange={setSortStatus}
                  minHeight={200}
                  paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                />
                }
              </div>


              
            </div>)}

          {value === 'grid' && (
            <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {(Array.isArray(initialRecords)) &&
                <>
                  {initialRecords.map((s, index) => {
                    return (
                      <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={index}>
                        <div className="relative mt-10 px-6">
                          <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">

                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_part}</div>
                              <div className='text-white-dark'>{s.NroParte}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.description}</div>
                              <div className='text-white-dark'>{s.DesRepuesto}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.supplier}</div>
                              <div className='text-white-dark'>{s.Proveedor}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.brand}</div>
                              <div className='text-white-dark'>{s.Marca}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.application}</div>
                              <div className='text-white-dark'>{s.Aplicacion}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.spare_part_type}</div>
                              <div className='text-white-dark'>{s.TipRepuesto}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.status}</div>
                              <div className='text-white-dark'>{s.Estado}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.weight + ' (lb)'}</div>
                              <div className='text-white-dark'>{s.Peso}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.cost}</div>
                              <div className='text-white-dark'>{s.Costo}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_available_quantity}</div>
                              <div className='text-white-dark'>{s.CanStock}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.min_quantity}</div>
                              <div className='text-white-dark'>{s.CanMin}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_unit}</div>
                              <div className='text-white-dark'>{s.UniMed}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_special_order}</div>
                              <div className='text-white-dark'>
                                {
                                  (s.PedidoEspecial == 1) ?
                                    <span className="badge bg-success">{t.yes}</span>
                                    :
                                    <span className="badge bg-dark">{t.no}</span>
                                }
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_special_order_quantity}</div>
                              <div className='text-white-dark'>{s.CanDias}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_special_order_date}</div>
                              <div className='text-white-dark'>
                                {
                                  (s.PedEspecialSinFecha == 1) ?
                                    <span className="badge bg-success">{t.yes}</span>
                                    :
                                    <span className="badge bg-dark">{t.no}</span>
                                }</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_modified_date}</div>
                              <div className='text-white-dark'>{s.FecModifica}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.abb_validity_date}</div>
                              <div className='text-white-dark'>{s.FecVencimiento}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="flex-none ltr:mr-2 rtl:ml-2">{t.status}</div>
                              <div className='text-white-dark'>{s.CodEstado}</div>
                            </div>


                          </div>

                          <div className="flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                            <button type="button" className="btn btn-outline-info w-1/2" onClick={() => editSparePart(s)}>
                              {t.btn_edit}
                            </button>
                            <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteSparePart(s)}>
                              {t.btn_delete}
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </>
              }
            </div>
          )}
        </div>
      }

    </>
  );
};

export default DatatablesSpares;
