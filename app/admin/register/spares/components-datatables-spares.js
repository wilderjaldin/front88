'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useCallback, useEffect, useMemo, useState } from 'react';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOff from '@/components/icon/icon-toggle-off';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconTrash from '@/components/icon/icon-trash';
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



import { PERMISSIONS } from '@/constants/permissions';

const url_delete_spare = process.env.NEXT_PUBLIC_API_URL + 'repuesto/EliminarRegistroCliente';

const compactSelectStyles = {
  control: (base) => ({ ...base, minHeight: '32px', fontSize: '12.5px' }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: '32px' }),
  dropdownIndicator: (base) => ({ ...base, padding: '4px' }),
  clearIndicator: (base) => ({ ...base, padding: '4px' }),
};

const compactSelectStylesWidth = (width) => ({
  ...compactSelectStyles,
  control: (base) => ({ ...compactSelectStyles.control(base), minWidth: width, width }),
});

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
  typesSpare = [],
  hasPermission = () => false,
}) => {

  const { isMobile } = useDevice();

  const [value, setOptionView] = useState((isMobile) ? 'grid' : 'list');
  const options = [{ value: 0, label: "Todos" }, { value: 1, label: t.min_quantity }, { value: 2, label: t.abb_unit }, { value: 3, label: t.abb_special_order }, { value: 4, label: t.abb_special_order_quantity }, { value: 5, label: t.abb_special_order_date }, { value: 6, label: t.abb_modified_date }, { value: 7, label: t.abb_validity_date }, { value: 8, label: t.status }]
  const [checks, setChecks] = useState([]);
  const [all, setAll] = useState(false);

  const [hideCols, setHideCols] = useState(['canDias', 'blnPedidoEspecial', 'canMin', 'desUniMed', 'canStock', 'blnPedEspecialSinFecha', 'fecModifica', 'fecVencimiento', 'codEstado']);

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
    { accessor: 'desUniMed', title: t.abb_unit },
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
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.spare_parts} <span>({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1"></div>
        </div>

        {/* DERECHA */}
        <div className="flex flex-col gap-3">

          <div className="flex flex-wrap items-end justify-end gap-3">

            <form
              onSubmit={handleSubmit(handleSearch)}
              className="flex items-center gap-2"
            >

              {/* LIST / GRID */}
              <div className="flex h-8 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">

                <button
                  type="button"
                  className={`flex h-8 w-8 items-center justify-center transition
        ${value === 'list'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => setOptionView('list')}
                >
                  <IconListCheck className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  className={`flex h-8 w-8 items-center justify-center transition
        ${value === 'grid'
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => setOptionView('grid')}
                >
                  <IconLayoutGrid className="h-3.5 w-3.5" />
                </button>

              </div>

              {/* INPUT */}
              <input
                type="text"
                placeholder={t.filter}
                {...register("term")}
                className="h-8 w-64 rounded-lg border border-gray-300 dark:border-gray-700
      bg-white dark:bg-gray-900
      px-3 text-xs
      focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              {/* BUSCAR */}
              <button
                type="submit"
                className="flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg
      bg-primary/20 text-primary text-xs font-medium
      hover:bg-primary/40 transition"
                title={t.search}
              >
                <IconSearch className="h-3.5 w-3.5" /> {t.search}
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
                className="flex h-8 items-center justify-center gap-1 rounded-lg
      bg-gray-200 text-gray-700 text-xs font-medium
      hover:bg-gray-300 transition
      dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 px-2.5"
                title={t.btn_clear}
              >
                <IconBackSpace className="h-3.5 w-3.5" />{t.btn_clear}
              </button>

            </form>

            {(hasPermission(PERMISSIONS.REPUESTOS_CREAR)) &&
              <>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-3" />


                <button
                  type="button"
                  onClick={handleNew}
                  className="h-8 rounded-lg bg-primary px-4
            text-white text-xs font-medium
            shadow-sm hover:bg-primary/90 transition"
                >
                  {t.btn_add_spare_parts}
                </button>
              </>
            }

          </div>


          {/* FILA ABAJO — filtros por catálogo */}
          <div className="flex flex-wrap items-center gap-2">

            {/* ESTADO */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Estado</span>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={options_status}
                    value={options_status.find(o => o.value === field.value) ?? null}
                    onChange={(s) => field.onChange(s?.value ?? '')}
                    placeholder="Estado"
                    styles={compactSelectStylesWidth('140px')}
                  />
                )}
              />
            </div>

            {/* PROVEEDOR */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Proveedor</span>
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
                    styles={compactSelectStylesWidth('180px')}
                  />
                )}
              />
            </div>

            {/* MARCA */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Marca</span>
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
                    styles={compactSelectStylesWidth('180px')}
                  />
                )}
              />
            </div>

            {/* APLICACIÓN */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Aplicación</span>
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
                    styles={compactSelectStylesWidth('180px')}
                  />
                )}
              />
            </div>

            {/* TIPO DE REPUESTO — vacío por ahora, listo para cuando se agreguen opciones */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Tipo de Repuesto</span>
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
                    styles={compactSelectStylesWidth('160px')}
                  />

                )}
              />
            </div>

            {value === 'list' && (

              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">Columnas</span>
                <div className="dropdown">
                  <Dropdown
                    placement={`bottom-end`}
                    btnClassName="!flex h-8 items-center btn btn-outline-primary font-medium dark:border-[#253b5c] rounded-lg px-3 text-xs dark:bg-[#1b2e4b] dark:text-white-dark"
                    button={
                      <>
                        <span className="ltr:mr-1 rtl:ml-1">{t.columns}</span>
                        <IconCaretDown className="h-4 w-4" />
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
            )}

          </div>

        </div>




      </div>




      {
        value === 'list' && (
          <div className="panel mt-5 overflow-hidden border-0 p-0">

            <div className="datatables">

              <DataTable
                className="
                  whitespace-nowrap text-xs
                  [&_thead]:bg-gray-50
                  [&_thead]:dark:bg-gray-800
                  [&_thead_th]:text-[11px]
                  [&_thead_th]:font-semibold
                  [&_thead_th]:uppercase
                  [&_thead_th]:tracking-wide
                  [&_thead_th]:text-gray-500
                  [&_thead_th]:dark:text-gray-400
                  [&_tbody_td]:text-xs
                  [&_tbody_td]:text-gray-700
                  [&_tbody_td]:dark:text-gray-300
                  [&_tbody_tr]:transition
                  [&_tbody_tr:hover]:bg-gray-100
                  [&_tbody_tr:hover]:dark:bg-gray-700
                "
                highlightOnHover
                verticalSpacing="xs"
                horizontalSpacing="xs"
                records={data}
                columns={[
                  {
                    title: '',
                    accessor: 'id',
                    width: 84,
                    render: (s) => (
                      <div className="flex gap-0.5">

                        <button
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleView(s)}
                          title="Ver"
                        >
                          <IconEye className="w-4 h-4 text-gray-600" />
                        </button>
                        {(hasPermission(PERMISSIONS.REPUESTOS_MODIFICAR)) &&
                          <button
                            className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800"
                            onClick={() => handleEdit(s)}
                            title="Editar"
                          >
                            <IconPencil className="w-4 h-4 text-blue-500" />
                          </button>
                        }
                        {(hasPermission(PERMISSIONS.REPUESTOS_ELIMINAR)) &&
                          <button
                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800"
                            onClick={() => handleToggleStatus(s)}
                            title={s.codEstado === 'AC' ? 'Eliminar' : 'Activar'}
                          >
                            {s.codEstado === 'AC'
                              ? <IconTrash className="w-4 h-4 text-red-500" />
                              : <IconToggleOn className="w-5 h-5 text-gray-400" />
                            }
                          </button>
                        }

                      </div>
                    )
                  },
                  {
                    accessor: 'files',
                    title: "",
                    sortable: false,
                    width: 48,
                    render: (s) => (
                      <div className="flex items-center gap-1">

                        {(s.tieneImagen) &&
                          <IconPhoto
                            className={`w-4 h-4 text-blue-500`}
                          />
                        }

                        {(s.tieneDocumento) &&
                          <IconFile
                            className={`w-4 h-4 text-indigo-500`}
                          />
                        }

                      </div>
                    )
                  },
                  {
                    accessor: 'nroParte',
                    title: t.nro_part,
                    sortable: false,
                    width: 100,
                    hidden: hideCols.includes('nroParte'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 100 }} title={s.nroParte}>{s.nroParte}</div>
                    ),
                  },
                  {
                    accessor: 'descripcion',
                    title: t.description,
                    sortable: false,
                    width: 180,
                    hidden: hideCols.includes('descripcion'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 180 }} title={s.descripcion}>{s.descripcion}</div>
                    ),
                  },
                  {
                    accessor: 'proveedor',
                    title: t.supplier,
                    sortable: false,
                    width: 130,
                    hidden: hideCols.includes('proveedor'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 130 }} title={s.proveedor}>{s.proveedor}</div>
                    ),
                  },
                  {
                    accessor: 'marca',
                    title: t.brand,
                    sortable: false,
                    width: 110,
                    hidden: hideCols.includes('marca'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 110 }} title={s.marca}>{s.marca}</div>
                    ),
                  },
                  {
                    accessor: 'aplicacion',
                    title: t.application,
                    sortable: false,
                    width: 110,
                    hidden: hideCols.includes('aplicacion'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 110 }} title={s.aplicacion}>{s.aplicacion}</div>
                    ),
                  },
                  {
                    accessor: 'desTipRepuesto',
                    title: t.spare_part_type,
                    sortable: false,
                    width: 100,
                    hidden: hideCols.includes('desTipRepuesto'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 100 }} title={s.desTipRepuesto}>{s.desTipRepuesto}</div>
                    ),
                  },
                  {
                    accessor: 'desEstado',
                    title: t.status,
                    sortable: false,
                    width: 90,
                    hidden: hideCols.includes('desEstado'),
                    render: (s) => (
                      <div className="truncate" style={{ maxWidth: 90 }} title={s.desEstado}>{s.desEstado}</div>
                    ),
                  },
                  {
                    accessor: 'peso',
                    title: `${t.weight} (lb)`,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('peso')
                  },
                  {
                    accessor: 'costo',
                    title: t.cost,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('costo'),
                  },
                  {
                    accessor: 'canStock',
                    title: t.abb_available_quantity,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('canStock'),
                  },
                  {
                    accessor: 'canMin',
                    title: t.min_quantity,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('canMin'),
                  },
                  {
                    accessor: 'desUniMed',
                    title: t.abb_unit,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('desUniMed'),
                  },
                  {
                    accessor: 'blnPedidoEspecial',
                    title: t.abb_special_order,
                    sortable: false,
                    width: 80,
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
                    width: 80,
                    hidden: hideCols.includes('canDias'),
                  },
                  {
                    accessor: 'blnPedEspecialSinFecha',
                    title: t.abb_special_order_date,
                    sortable: false,
                    width: 90,
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
                    width: 140,
                    hidden: hideCols.includes('fecModifica'),
                    render: (s) => (


                      <div className="text-[11px] leading-tight space-y-0.5 text-gray-500 dark:text-gray-400">
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Reg:</span>
                          <span className="truncate">{s.usuarioRegistra || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0" title={s.fecRegistraCompleto}>{s.fecRegistra}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-gray-400 shrink-0">Mod:</span>
                          <span className="truncate">{s.usuarioModifica || '-'}</span>
                          <span className="ml-auto text-gray-400 shrink-0" title={s.fecModificaCompleto}>{s.fecModifica}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    accessor: 'fecVencimiento',
                    title: t.abb_validity_date,
                    sortable: false,
                    width: 90,
                    hidden: hideCols.includes('fecVencimiento'),
                    render: (s) => (
                      <span title={s.fecVencimientoCompleto} >{s.fecVencimiento}</span>
                    )
                  },
                  {
                    accessor: 'codEstado',
                    title: t.status,
                    sortable: false,
                    width: 80,
                    hidden: hideCols.includes('codEstado'),
                    render: (row) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${row.codEstado === 'AC'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                      >
                        {row.codEstado === 'AC' ? t.active : t.inactive}
                      </span>
                    )
                  }

                ]}
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
                    <div className="flex gap-0.5">

                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleView(s)}
                        title="Ver"
                      >
                        <IconEye className="w-4 h-4 text-gray-600" />
                      </button>

                      {(hasPermission(PERMISSIONS.REPUESTOS_MODIFICAR)) &&
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800"
                          onClick={() => handleEdit(s)}
                          title="Editar"
                        >
                          <IconPencil className="w-4 h-4 text-blue-500" />
                        </button>
                      }
                      {(hasPermission(PERMISSIONS.REPUESTOS_ELIMINAR)) &&
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800"
                          onClick={() => handleToggleStatus(s)}
                          title={s.codEstado === 'AC' ? 'Eliminar' : 'Activar'}
                        >
                          {s.codEstado === 'AC'
                            ? <IconTrash className="w-4 h-4 text-red-500" />
                            : <IconToggleOn className="w-5 h-5 text-gray-400" />
                          }
                        </button>
                      }

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
                      <div className="font-semibold">{s.desUniMed || "-"}</div>
                    </div>

                    <div>
                      <div className="text-gray-400">Peso</div>
                      <div className="font-semibold">{s.peso || "-"}</div>
                    </div>

                  </div>

                  {/* PEDIDO ESPECIAL */}
                  <div className="grid grid-cols-3 text-center border-t border-gray-100 dark:border-gray-700 py-3 text-xs">

                    <div className="space-y-1">
                      <div className="text-gray-400">Ped. Especial</div>
                      {(s.PedidoEspecial == 1)
                        ? <span className="badge bg-success">{t.yes}</span>
                        : <span className="badge bg-dark">{t.no}</span>
                      }
                    </div>

                    <div>
                      <div className="text-gray-400">Cant. PedEsp</div>
                      <div className="font-semibold">{s.canDias ?? "-"}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-gray-400">Ped. Esp. S/Fecha</div>
                      {(s.PedEspecialSinFecha == 1)
                        ? <span className="badge bg-success">{t.yes}</span>
                        : <span className="badge bg-dark">{t.no}</span>
                      }
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
                      {s.codEstado === 'AC' ? t.active : t.inactive}
                    </span>

                  </div>

                  {/* FOOTER */}


                  <div className="bg-gray-50 dark:bg-gray-800 px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span>
                        Reg: {s.usuarioRegistra || '-'}
                      </span>
                      <span>
                        {s.fecRegistra}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Mod: {s.usuarioModifica || '-'}
                      </span>
                      <span>
                        {s.fecModifica}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Vencimiento</span>
                      <span>{s.fecVencimiento}</span>
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