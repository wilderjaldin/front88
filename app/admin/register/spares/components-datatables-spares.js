'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOff from '@/components/icon/icon-toggle-off';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import { useTranslation } from "@/app/locales";
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconPlusProps from '@/components/icon/icon-plus';
import Dropdown from '@/components/dropdown';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconSearch from '@/components/icon/icon-search';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { Controller, useForm } from 'react-hook-form';
import Swal from 'sweetalert2'
import { Pagination } from '@mantine/core';

import { useDevice } from '@/context/device-context';
import IconSearchCircle from '@/components/icon/icon-search-circle';
import IconBackSpace from '@/components/icon/icon-backspace';
import IconPhoto from '@/components/icon/icon-photo';
import IconFile from '@/components/icon/icon-file';
import IconEye from '@/components/icon/icon-eye';



const url_delete_spare = process.env.NEXT_PUBLIC_API_URL + 'repuesto/EliminarRegistroCliente';

const DatatablesSpares = ({
  data = [],
  t,
  page,
  pageSize,
  total,
  currentFilters = {},
  onPageChange,
  handleSearch,
  handleClear,
  handleNew,
  handleEdit,
  handleView,
  handleToggleStatus,
  brands = [],
  suppliers = [],
  typesSpare = []
}) => {

  const { isMobile } = useDevice();

  const [value, setOptionView] = useState((isMobile) ? 'grid' : 'list');
  const options = [{ value: 0, label: "Todos" }, { value: 1, label: t.min_quantity }, { value: 2, label: t.abb_unit }, { value: 3, label: t.abb_special_order }, { value: 4, label: t.abb_special_order_quantity }, { value: 5, label: t.abb_special_order_date }, { value: 6, label: t.abb_modified_date }, { value: 7, label: t.abb_validity_date }, { value: 8, label: t.status }]
  const [checks, setChecks] = useState([]);
  const [all, setAll] = useState(false);

  const [hideCols, setHideCols] = useState(['canDias', 'blnPedidoEspecial', 'canMin', 'uniMed', 'canStock', 'canMin', 'uniMed', 'blnPedEspecialSinFecha', 'fecModifica', 'fecVencimiento', 'codEstado']);

  const options_status = useMemo(() => [
    { value: '', label: t.all },
    { value: 'AC', label: t.active },
    { value: 'IN', label: t.inactive }
  ], [t]);

  // Lookup O(1) — keys normalizadas a Number para evitar mismatch string vs number
  // (el backend puede devolver value como string "415" pero currentFilters.supplier es Number(415))
  const brandsMap = useMemo(() => new Map(brands.map(b => [Number(b.value), b])), [brands]);
  const suppliersMap = useMemo(() => new Map(suppliers.map(s => [Number(s.value), s])), [suppliers]);

  // ── Resolver valor para AsyncSelect ──────────────────────────────────────
  // AsyncSelect necesita el objeto {value, label} completo para mostrar el label.
  // Cuando el mapa llega después del montaje (carga asíncrona desde el padre),
  // el campo ya tiene el id numérico pero el mapa estaba vacío → no mostraba nada.
  // Esta función devuelve el objeto si el mapa ya lo tiene, o null si aún no cargó.
  const resolveSupplier = (id) => (id != null ? suppliersMap.get(id) ?? null : null);
  const resolveBrand = (id) => (id != null ? brandsMap.get(id) ?? null : null);

  // ── AsyncSelect: filtra en memoria, sin requests adicionales ────────────
  // - Sin texto → no muestra nada (evita que el usuario crea que solo existen N opciones)
  // - Con 2+ caracteres → filtra el array completo y muestra máx 20 resultados
  const ASYNC_LIMIT = 20;
  const ASYNC_MIN_CHARS = 2;

  const filterOptions = (options, inputValue) => {
    const term = inputValue.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return options
      .filter(o => o.label.toLowerCase().includes(term))
      .slice(0, ASYNC_LIMIT);
  };

  const loadSuppliers = useCallback(
    (inputValue, callback) => callback(filterOptions(suppliers, inputValue)),
    [suppliers]
  );

  const loadBrands = useCallback(
    (inputValue, callback) => callback(filterOptions(brands, inputValue)),
    [brands]
  );

  const {
    register, reset,
    handleSubmit, control,
  } = useForm({
    defaultValues: {
      term: currentFilters.term ?? '',
      status: currentFilters.status ?? 'AC',
      supplier: null,  // se resuelve cuando llegan los catálogos
      brand: null,
      application: null,
      type: currentFilters.type ?? '',
    }
  });

  // Sincronizar form cuando la URL cambia externamente (ej: botón atrás del browser)
  useEffect(() => {
    reset({
      term: currentFilters.term ?? '',
      status: currentFilters.status ?? 'AC',
      // Los AsyncSelect guardan el objeto {value,label} — se resuelven abajo
      supplier: suppliersMap.get(currentFilters.supplier) ?? null,
      brand: brandsMap.get(currentFilters.brand) ?? null,
      application: brandsMap.get(currentFilters.application) ?? null,
      type: currentFilters.type ?? '',
    });
  }, [
    currentFilters.term,
    currentFilters.status,
    currentFilters.supplier,
    currentFilters.brand,
    currentFilters.application,
    currentFilters.type,
  ]);

  // Cuando llegan los catálogos desde el servidor, resolver los ids de la URL
  // en objetos {value,label} y setearlos en el form para que los AsyncSelect
  // los muestren correctamente.
  useEffect(() => {
    if (suppliers.length === 0 && brands.length === 0) return;

    reset((prev) => ({
      ...prev,
      supplier: currentFilters.supplier ? suppliersMap.get(currentFilters.supplier) ?? null : prev.supplier,
      brand: currentFilters.brand ? brandsMap.get(currentFilters.brand) ?? null : prev.brand,
      application: currentFilters.application ? brandsMap.get(currentFilters.application) ?? null : prev.application,
    }));
  }, [suppliers.length, brands.length]);


  const cols = [
    { accessor: 'canStock', title: t.abb_available_quantity },
    { accessor: 'canMin', title: t.min_quantity },
    { accessor: 'uniMed', title: t.abb_unit },
    { accessor: 'blnPedidoEspecial', title: t.abb_special_order },
    { accessor: 'canDias', title: t.abb_special_order_quantity },
    { accessor: 'blnPedEspecialSinFecha', title: t.abb_special_order_date },
    { accessor: 'fecModifica', title: t.abb_modified_date },
    { accessor: 'fecVencimiento', title: t.abb_validity_date },
    { accessor: 'codEstado', title: t.status }
  ];





  const showHideColumns = (col, value) => {
    if (hideCols.includes(col)) {
      setHideCols((col) => hideCols.filter((d) => d !== col));
    } else {
      setHideCols([...hideCols, col]);
    }
  };



  const deleteSparePart = (s) => {
    handleToggleStatus(s);
  };

   


  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-BO");
  };

  return (


    <div className=''>



      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* IZQUIERDA */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {t.spare_parts} <span>({total})</span>
          </h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2"></div>
        </div>

        {/* DERECHA */}
        <div className="flex flex-col gap-3">

          <div className="flex flex-wrap items-end justify-end gap-3">

            <form
              onSubmit={handleSubmit(handleSearch)}
              className="flex items-center gap-2"
            >

              {/* LIST / GRID */}
              <div className="flex h-10 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">

                <button
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center transition
        ${value === 'list'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => setOptionView('list')}
                >
                  <IconListCheck className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center transition
        ${value === 'grid'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => setOptionView('grid')}
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </button>

              </div>

              {/* INPUT */}
              <input
                type="text"
                placeholder={t.filter}
                {...register("term")}
                className="h-10 w-80 rounded-lg border border-gray-300 dark:border-gray-700 
      bg-white dark:bg-gray-900 
      px-4 text-sm
      focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              {/* BUSCAR */}
              <button
                type="submit"
                className="flex h-10 px-2 items-center justify-center rounded-lg
      bg-primary/20 text-primary
      hover:bg-primary/40 transition"
                title={t.search}
              >
                <IconSearch className="h-4 w-4 mr-2" /> { t.search }
              </button>

              {/* LIMPIAR */}
              <button
                type="button"
                onClick={() => {
                  reset({
                    term: '', status: 'AC',
                    supplier: null, brand: null, application: null, type: null,
                  });
                  handleClear();
                }}
                className="flex h-10 items-center justify-center rounded-lg
      bg-gray-200 text-gray-700
      hover:bg-gray-300 transition
      dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 px-2"
                title={t.btn_clear}
              >
                <IconBackSpace className="h-4 w-4 mr-2" />{ t.btn_clear }
              </button>

            </form>

            {/* SEPARADOR VERTICAL */}
            <div className="h-10 w-px bg-gray-300 dark:bg-gray-600 mx-4" />

            {/* NUEVO */}
            <button
              type="button"
              onClick={handleNew}
              className="h-10 rounded-lg bg-primary px-5
            text-white text-sm font-medium
            shadow-sm hover:bg-primary/90 transition"
            >
              {t.btn_add_spare_parts}
            </button>

          </div>


          {/* FILA ABAJO — filtros por catálogo */}
          <div className="flex flex-wrap items-center gap-3">

            {/* ESTADO */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Estado</span>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={options_status}
                    value={options_status.find(o => o.value === field.value) ?? null}
                    onChange={(s) => field.onChange(s?.value ?? '')}
                    placeholder="Estado"
                    styles={{ control: (base) => ({ ...base, minWidth: '160px', width: '160px' }) }}
                  />
                )}
              />
            </div>

            {/* PROVEEDOR */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Proveedor</span>
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadSuppliers}
                    defaultOptions={false}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Buscar proveedor..."
                    noOptionsMessage={({ inputValue }) =>
                      inputValue.length < ASYNC_MIN_CHARS
                        ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
                        : 'Sin resultados'
                    }
                    isClearable
                    cacheOptions
                    styles={{ control: (base) => ({ ...base, minWidth: '200px', width: '200px' }) }}
                  />
                )}
              />
            </div>

            {/* MARCA */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Marca</span>
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadBrands}
                    defaultOptions={false}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Buscar marca..."
                    noOptionsMessage={({ inputValue }) =>
                      inputValue.length < ASYNC_MIN_CHARS
                        ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
                        : 'Sin resultados'
                    }
                    isClearable
                    cacheOptions
                    styles={{ control: (base) => ({ ...base, minWidth: '200px', width: '200px' }) }}
                  />
                )}
              />
            </div>

            {/* APLICACIÓN */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Aplicación</span>
              <Controller
                name="application"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    loadOptions={loadBrands}
                    defaultOptions={false}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Buscar aplicación..."
                    noOptionsMessage={({ inputValue }) =>
                      inputValue.length < ASYNC_MIN_CHARS
                        ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
                        : 'Sin resultados'
                    }
                    isClearable
                    cacheOptions
                    styles={{ control: (base) => ({ ...base, minWidth: '200px', width: '200px' }) }}
                  />
                )}
              />
            </div>

            {/* TIPO DE REPUESTO — vacío por ahora, listo para cuando se agreguen opciones */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Tipo de Repuesto</span>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    options={typesSpare}
                    value={typesSpare.find(o => o.value === field.value) ?? null}
                    onChange={(s) => field.onChange(s?.value ?? '')}
                    placeholder="Tipo de repuesto..."
                    isClearable
                    styles={{ control: (base) => ({ ...base, minWidth: '180px', width: '180px' }) }}
                  />

                )}
              />
            </div>

            { value === 'list' && (
              
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">Columnas</span>
              <div className="dropdown">
                <Dropdown
                  placement={`bottom-end`}
                  btnClassName="!flex items-center btn btn-outline-primary font-semibold dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
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
            ) }

          </div>

        </div>




      </div>




      {
        value === 'list' && (
          <div className="panel mt-5 overflow-hidden border-0 p-0">

            <div className="datatables">

              <DataTable
                className="table-hover whitespace-nowrap"
                records={data}
                columns={[
                  {
                    title: '',
                    accessor: 'id',
                    render: (s) => (
                      <div className="flex gap-1">

                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleView(s)}
                          title="Ver"
                        >
                          <IconEye className="w-4 h-4 text-gray-600" />
                        </button>

                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleEdit(s)}
                          title="Editar"
                        >
                          <IconPencil className="w-4 h-4 text-blue-500" />
                        </button>

                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleToggleStatus(s)}
                          title={s.codEstado === 'AC' ? 'Inactivar' : 'Activar'}
                        >
                          {s.codEstado === 'AC'
                            ? <IconToggleOn  className="w-5 h-5  fill-green-500" />
                            : <IconToggleOff className="w-5 h-5 text-gray-400" />
                          }
                        </button>

                      </div>
                    )
                  },
                  {
                    accessor: 'files',
                    title: "",
                    sortable: false,
                    render: (s) => (
                      <div className="flex items-center gap-1">

                        {(s.tieneImagen) &&
                          <IconPhoto
                            className={`w-6 h-6 text-blue-500`}
                          />
                        }

                        {(s.tieneDocumento) &&
                          <IconFile
                            className={`w-5 h-5 text-indigo-500`}
                          />
                        }

                      </div>
                    )
                  },
                  {
                    accessor: 'nroParte',
                    title: t.nro_part,
                    sortable: false,
                    hidden: hideCols.includes('nroParte'),
                  },
                  {
                    accessor: 'descripcion',
                    title: t.description,
                    sortable: false,
                    hidden: hideCols.includes('descripcion'),
                  },
                  {
                    accessor: 'proveedor',
                    title: t.supplier,
                    sortable: false,
                    hidden: hideCols.includes('proveedor'),
                  },
                  {
                    accessor: 'marca',
                    title: t.brand,
                    sortable: false,
                    hidden: hideCols.includes('marca'),
                  },
                  {
                    accessor: 'aplicacion',
                    title: t.application,
                    sortable: false,
                    hidden: hideCols.includes('aplicacion'),
                  },
                  {
                    accessor: 'desTipRepuesto',
                    title: t.spare_part_type,
                    sortable: false,
                    hidden: hideCols.includes('desTipRepuesto'),
                  },
                  {
                    accessor: 'desEstado',
                    title: t.status,
                    sortable: false,
                    hidden: hideCols.includes('desEstado'),
                  },
                  {
                    accessor: 'peso',
                    title: `${t.weight} (lb)`,
                    sortable: false,
                    hidden: hideCols.includes('peso')
                  },
                  {
                    accessor: 'costo',
                    title: t.cost,
                    sortable: false,
                    hidden: hideCols.includes('costo'),
                  },
                  {
                    accessor: 'canStock',
                    title: t.abb_available_quantity,
                    sortable: false,
                    hidden: hideCols.includes('canStock'),
                  },
                  {
                    accessor: 'canMin',
                    title: t.min_quantity,
                    sortable: false,
                    hidden: hideCols.includes('canMin'),
                  },
                  {
                    accessor: 'uniMed',
                    title: t.abb_unit,
                    sortable: false,
                    hidden: hideCols.includes('uniMed'),
                  },
                  {
                    accessor: 'blnPedidoEspecial',
                    title: t.abb_special_order,
                    sortable: false,
                    hidden: hideCols.includes('blnPedidoEspecial'),
                    render: (s) => (
                      (s.PedidoEspecial == 1) ?
                        <span className="badge bg-success">{t.yes}</span>
                        :
                        <span className="badge bg-dark">{t.no}</span>
                    )
                  },
                  {
                    accessor: 'canDias',
                    title: t.abb_special_order_quantity,
                    sortable: false,
                    hidden: hideCols.includes('canDias'),
                  },
                  {
                    accessor: 'blnPedEspecialSinFecha',
                    title: t.abb_special_order_date,
                    sortable: false,
                    hidden: hideCols.includes('blnPedEspecialSinFecha'),
                    render: (s) => (
                      (s.PedEspecialSinFecha == 1) ?
                        <span className="badge bg-success">{t.yes}</span>
                        :
                        <span className="badge bg-dark">{t.no}</span>
                    )
                  },
                  {
                    accessor: 'fecModifica',
                    title: t.date,
                    sortable: false,
                    hidden: hideCols.includes('fecModifica'),
                    render: (s) => (
                  

                      <div className="text-xs space-y-1 leading-tight">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">

                                <div className="flex justify-between">
                                  <span className="text-gray-400">Registrado</span>
                                  <span className="text-gray-500" title={  s.fecRegistraCompleto }>
                                    { s.fecRegistra }
                                  </span>
                                </div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                  { s.usuarioRegistra }
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                                <div className="flex justify-between">
                                  <span className="text-gray-400">Modificado</span>
                                  <span className="text-gray-500" title={ s.fecModificaCompleto }>
                                    { s.fecModifica }
                                  </span>
                                </div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                  { s.usuarioModifica }
                                </div>

                              </div>
                            </div>
                    )
                  },
                  {
                    accessor: 'fecVencimiento',
                    title: t.abb_validity_date,
                    sortable: false,
                    hidden: hideCols.includes('fecVencimiento'),
                    render: (s) => (
                      <span title={ s.fecVencimientoCompleto } >{ s.fecVencimiento }</span>
                    )
                  },
                  {
                    accessor: 'codEstado',
                    title: t.status,
                    sortable: false,
                    hidden: hideCols.includes('codEstado'),
                  }

                ]}
                highlightOnHover
                page={page}
                onPageChange={onPageChange}
                totalRecords={total}
                recordsPerPage={pageSize}
                paginationText={({ from, to, totalRecords }) =>
                  `${from} - ${to} / ${totalRecords}`
                }
              />

            </div>



          </div>)
      }

      {
        value === 'grid' && (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">

              {data.map((s, index) => (

                <div
                  key={index}
                  className="group relative rounded-2xl 
  bg-white dark:bg-gray-900 
  border border-gray-200 dark:border-gray-700
  shadow-sm hover:shadow-lg hover:-translate-y-0.5
  transition-all duration-200 overflow-hidden"
                >

                  {/* HEADER */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">

                    <div className="flex items-center gap-2">

                      {/* NRO PARTE */}
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {s.nroParte}
                      </h3>

                      {/* ICONOS */}
                      <div className="flex items-center gap-1">

                        {(s.tieneImagen) &&
                          <IconPhoto
                            className={`w-6 h-6 text-blue-500`}
                          />
                        }

                        {(s.tieneDocumento) &&
                          <IconFile
                            className={`w-5 h-5 text-indigo-500`}
                          />
                        }

                      </div>

                    </div>

                    {/* BOTONES */}
                    <div className="flex gap-1">

                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => router.push(`/admin/spares/${s.codRepuesto}`)}
                        title="Ver"
                      >
                        <IconEye className="w-4 h-4 text-gray-600" />
                      </button>

                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleEdit(s)}
                        title="Editar"
                      >
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </button>

                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleToggleStatus(s)}
                        title={s.codEstado === 'AC' ? 'Inactivar' : 'Activar'}
                      >
                        {s.codEstado === 'AC'
                          ? <IconToggleOn  className="w-5 h-5 text-green-500" />
                          : <IconToggleOff className="w-5 h-5 text-gray-400" />
                        }
                      </button>

                    </div>

                  </div>

                  {/* DESCRIPCIÓN */}
                  <div className="px-4 pt-3">

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {s.descripcion || "-"}
                    </p>

                  </div>

                  {/* INFO */}
                  <div className="px-4 py-3 space-y-2 text-xs">

                    <div className="flex justify-between">
                      <span className="text-gray-400">Proveedor</span>
                      <span className="font-medium">{s.proveedor}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Marca</span>
                      <span className="font-medium">{s.marca}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Aplicación</span>
                      <span className="font-medium">{s.aplicacion}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo</span>
                      <span className="font-medium">{s.desTipRepuesto}</span>
                    </div>

                  </div>

                  {/* DATOS */}
                  <div className="grid grid-cols-4 text-center border-t border-gray-100 dark:border-gray-700 py-3 text-xs">

                    <div>
                      <div className="text-gray-400">Stock</div>
                      <div className="font-semibold">{s.canStock}</div>
                    </div>

                    <div>
                      <div className="text-gray-400">Min</div>
                      <div className="font-semibold">{s.canMin}</div>
                    </div>

                    <div>
                      <div className="text-gray-400">Unidad</div>
                      <div className="font-semibold">{s.uniMed}</div>
                    </div>

                    <div>
                      <div className="text-gray-400">Peso</div>
                      <div className="font-semibold">{s.peso || "-"}</div>
                    </div>

                  </div>

                  {/* COSTO + ESTADO */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">

                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      ${s.costo}
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                       ${s.codEstado === 'AC'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                        }`}
                    >
                      {s.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                    </span>

                  </div>

                  {/* FOOTER */}


                  <div className="bg-gray-50 dark:bg-gray-800 px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span>
                        Reg: {s.usuarioRegistra || '-'}
                      </span>
                      <span>
                        { s.fecRegistra }
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Mod: { s.usuarioModifica || '-'}
                      </span>
                      <span>
                        { s.fecModifica }
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Vencimiento</span>
                      <span>{ s.fecVencimiento }</span>
                    </div>

                  </div>

                </div>

              ))}

            </div>
            {total > pageSize && (
              <div className="flex justify-center mt-8">
                <Pagination
                  total={Math.ceil(total / pageSize)}
                  value={page}
                  onChange={onPageChange}
                  size="sm"
                  radius="xl"
                />
              </div>
            )}
          </>
        )
      }
    </div >

  );
};

export default DatatablesSpares;