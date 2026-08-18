'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import IconPencil from '@/components/icon/icon-pencil';
import IconToggleOn from '@/components/icon/icon-toggle-on';
import IconTrash from '@/components/icon/icon-trash';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import Dropdown from '@/components/dropdown';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconSearch from '@/components/icon/icon-search-filled';
import IconX from '@/components/icon/icon-x';
import IconBackSpace from '@/components/icon/icon-backspace';
import IconPlus from '@/components/icon/icon-plus';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { Controller, useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';

import { useDevice } from '@/context/device-context';
import IconPhoto from '@/components/icon/icon-photo';
import IconFile from '@/components/icon/icon-file';
import IconEye from '@/components/icon/icon-eye';

import { PERMISSIONS } from '@/constants/permissions';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-2 text-left whitespace-nowrap";
// Para columnas angostas con encabezado largo: el título puede partirse en 2 líneas
// en vez de forzar el ancho de la columna a lo largo del texto del <th>.
const thWrapClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-2 text-left leading-tight";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-2.5 py-1.5 whitespace-nowrap";

// Mismo alto (32px = h-8), mismo borde y mismo radio que el input de texto y los
// botones de la barra — para que los <Select> no se vean "distintos" al resto.
const compactSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '32px',
    height: '32px',
    fontSize: '12.5px',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    // Igual que el input de texto: el borde NO cambia de color al enfocar, solo
    // aparece el halo (ring) — así el foco se ve idéntico en input y <Select>.
    borderColor: 'var(--spares-select-border, #d1d5db)',
    backgroundColor: 'var(--spares-select-bg, #fff)',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(67,97,238,0.3)' : 'none',
    '&:hover': { borderColor: 'var(--spares-select-border, #d1d5db)' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px', height: '30px' }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: '30px' }),
  dropdownIndicator: (base) => ({ ...base, padding: '4px' }),
  clearIndicator: (base) => ({ ...base, padding: '4px' }),
  // Portal (ver más abajo) para que el menú no quede atrás del thead sticky de la tabla.
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const compactSelectStylesWidth = (width) => ({
  ...compactSelectStyles,
  control: (base, state) => ({ ...compactSelectStyles.control(base, state), minWidth: width, width }),
});

// Estado y Tipo de Repuesto se muestran en mayúsculas (catálogos cortos, tipo "código").
const compactSelectStylesWidthUpper = (width) => ({
  ...compactSelectStylesWidth(width),
  singleValue: (base) => ({ ...base, textTransform: 'uppercase' }),
  option: (base) => ({ ...base, textTransform: 'uppercase' }),
});

// El menú se saca del flujo normal con un portal a <body> — si no, el z-index local
// de la tabla (thead sticky) lo tapa aunque el <Select> esté "por encima" en el DOM.
const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const Badge = ({ ok, t }) => (
  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ok
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
  >
    {ok ? t.yes : t.no}
  </span>
);

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

  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  const [hideCols, setHideCols] = useState(['canDias', 'blnPedidoEspecial', 'canMin', 'desUniMed', 'canStock', 'blnPedEspecialSinFecha', 'fecModifica', 'fecVencimiento', 'codEstado']);

  // El header global es sticky en top:0 — el bloque de título/acciones/filtros se
  // engancha justo debajo de su borde inferior para que el usuario no tenga que
  // volver a subir para cambiar de vista o tocar un filtro con la lista larga.
  const [stickyTop, setStickyTop] = useState(0);
  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.getElementById('site-header');
      setStickyTop(header?.getBoundingClientRect().height ?? 0);
    };
    updateStickyTop();
    window.addEventListener('resize', updateStickyTop);
    return () => window.removeEventListener('resize', updateStickyTop);
  }, []);

  const options_status = useMemo(() => [
    { value: '', label: t.all },
    { value: 'AC', label: t.active },
    { value: 'IN', label: t.inactive }
  ], [t]);

  // Lookup O(1) — keys normalizadas a Number para evitar mismatch string vs number
  // (el backend puede devolver value como string "415" pero currentFilters.supplier es Number(415))
  const brandsMap = useMemo(() => new Map(brands.map(b => [Number(b.value), b])), [brands]);
  const suppliersMap = useMemo(() => new Map(suppliers.map(s => [Number(s.value), s])), [suppliers]);

  // ── AsyncSelect: filtra en memoria, sin requests adicionales ────────────
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
    register, reset, watch,
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

  const termValue = watch('term');

  // Sincronizar form cuando la URL cambia externamente (ej: botón atrás del browser)
  useEffect(() => {
    reset({
      term: currentFilters.term ?? '',
      status: currentFilters.status ?? 'AC',
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
  // en objetos {value,label} y setearlos en el form.
  useEffect(() => {
    if (suppliers.length === 0 && brands.length === 0) return;

    reset((prev) => ({
      ...prev,
      supplier: currentFilters.supplier ? suppliersMap.get(currentFilters.supplier) ?? null : prev.supplier,
      brand: currentFilters.brand ? brandsMap.get(currentFilters.brand) ?? null : prev.brand,
      application: currentFilters.application ? brandsMap.get(currentFilters.application) ?? null : prev.application,
    }));
  }, [suppliers.length, brands.length]);

  const clearAll = () => {
    reset({ term: '', status: 'AC', supplier: null, brand: null, application: null, type: null });
    handleClear();
  };

  // ── Definición de columnas ────────────────────────────────────────────────
  // "core": siempre visibles. El resto se puede ocultar/mostrar desde el dropdown "Columnas".
  const coreCols = [
    { key: 'files', title: '', width: 26 },
    { key: 'nroParte', title: t.nro_part, width: 90 },
    { key: 'descripcion', title: t.description, width: 180 },
    { key: 'proveedor', title: t.supplier, width: 120 },
    { key: 'marca', title: t.brand, width: 90 },
    { key: 'aplicacion', title: t.application, width: 90 },
    { key: 'desTipRepuesto', title: t.spare_part_type, width: 90 },
    { key: 'desEstado', title: t.status, width: 70 },
    { key: 'peso', title: `${t.weight} (lb)`, width: 56 },
    { key: 'costo', title: t.cost, width: 56 },
  ];

  // wrapHeader: el título del <th> puede partirse en 2 líneas — así la columna no
  // queda más ancha que su propio contenido (que es corto: "0", "NO", números cortos).
  const toggleCols = [
    { key: 'canStock', title: t.abb_available_quantity, width: 50, wrapHeader: true },
    { key: 'canMin', title: t.min_quantity, width: 48, wrapHeader: true },
    { key: 'desUniMed', title: t.abb_unit, width: 56 },
    { key: 'blnPedidoEspecial', title: t.abb_special_order, width: 56, wrapHeader: true },
    { key: 'canDias', title: t.abb_special_order_quantity, width: 48, wrapHeader: true },
    { key: 'blnPedEspecialSinFecha', title: t.abb_special_order_date, width: 60, wrapHeader: true },
    { key: 'fecModifica', title: t.abb_modified_date, width: 150 },
    { key: 'fecVencimiento', title: t.abb_validity_date, width: 80 },
    { key: 'codEstado', title: t.status, width: 70 },
  ];

  const visibleToggleCols = toggleCols.filter(c => !hideCols.includes(c.key));

  const toggleCol = (key) => {
    setHideCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const renderCell = (key, s) => {
    switch (key) {
      case 'files':
        return (
          <div className="flex items-center gap-1">
            {s.tieneImagen && <IconPhoto className="w-3.5 h-3.5 text-blue-500" />}
            {s.tieneDocumento && <IconFile className="w-3.5 h-3.5 text-indigo-500" />}
          </div>
        );
      case 'nroParte':
        return <div className="truncate" style={{ maxWidth: 100 }} title={s.nroParte}>{s.nroParte}</div>;
      case 'descripcion':
        return <div className="truncate" style={{ maxWidth: 200 }} title={s.descripcion}>{s.descripcion}</div>;
      case 'proveedor':
        return <div className="truncate" style={{ maxWidth: 130 }} title={s.proveedor}>{s.proveedor}</div>;
      case 'marca':
        return <div className="truncate" style={{ maxWidth: 100 }} title={s.marca}>{s.marca}</div>;
      case 'aplicacion':
        return <div className="truncate" style={{ maxWidth: 100 }} title={s.aplicacion}>{s.aplicacion}</div>;
      case 'desTipRepuesto':
        return <div className="truncate" style={{ maxWidth: 100 }} title={s.desTipRepuesto}>{s.desTipRepuesto}</div>;
      case 'desEstado':
        return <div className="truncate" style={{ maxWidth: 90 }} title={s.desEstado}>{s.desEstado}</div>;
      case 'peso':
        return s.peso;
      case 'costo':
        return s.costo;
      case 'canStock':
        return s.canStock;
      case 'canMin':
        return s.canMin;
      case 'desUniMed':
        return s.desUniMed;
      case 'blnPedidoEspecial':
        return <Badge ok={s.PedidoEspecial == 1} t={t} />;
      case 'canDias':
        return s.canDias;
      case 'blnPedEspecialSinFecha':
        return <Badge ok={s.PedEspecialSinFecha == 1} t={t} />;
      case 'fecModifica':
        return (
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
        );
      case 'fecVencimiento':
        return <span title={s.fecVencimientoCompleto}>{s.fecVencimiento}</span>;
      case 'codEstado':
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.codEstado === 'AC'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'}`}
          >
            {s.codEstado === 'AC' ? t.active : t.inactive}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>

      {/* Variables para que el borde/fondo del <Select> (estilos inline, no Tailwind)
          respete el dark mode igual que el input y los botones de al lado. */}
      <style>{`
        :root { --spares-select-border: #d1d5db; --spares-select-bg: #fff; }
        .dark  { --spares-select-border: #374151; --spares-select-bg: #111827; }
      `}</style>

      {/* Título + acciones + filtros — sticky justo debajo del header global,
          así no hay que volver a subir para cambiar de vista o tocar un filtro. */}
      <div className="sticky z-30 bg-white dark:bg-[#060818] pb-3" style={{ top: stickyTop }}>

      {/* Header: título + acciones */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.spare_parts} <span className="font-normal text-gray-400">({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex items-center gap-2">
          {/* LIST / GRID */}
          <div className="flex h-8 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('list')}
              title={t.list ?? 'Lista'}
            >
              <IconListCheck className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setView('grid')}
              title={t.grid ?? 'Cuadrícula'}
            >
              <IconLayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {view === 'list' && (
            <div className="dropdown">
              <Dropdown
                placement="bottom-end"
                btnClassName="!flex h-8 items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                button={<>{t.columns}<IconCaretDown className="h-3.5 w-3.5" /></>}
              >
                <ul className="!min-w-[220px]">
                  {toggleCols.map((col) => (
                    <li key={col.key} className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center px-4 py-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hideCols.includes(col.key)}
                          className="form-checkbox"
                          onChange={() => toggleCol(col.key)}
                        />
                        <span className="ltr:ml-2 rtl:mr-2 text-sm">{col.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </Dropdown>
            </div>
          )}

          {hasPermission(PERMISSIONS.REPUESTOS_CREAR) && (
            <button
              type="button"
              onClick={handleNew}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-xs font-medium shadow-sm hover:bg-primary/90 transition"
            >
              <IconPlus className="h-3.5 w-3.5" />
              {t.btn_add_spare_parts}
            </button>
          )}
        </div>
      </div>

      {/* Barra de filtros */}
      <form
        onSubmit={handleSubmit(handleSearch)}
        className="mt-3 flex flex-wrap items-end justify-end gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm"
      >
        {/* Búsqueda por texto */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.filter}</span>
          <div className="relative w-72">
            <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-gray-400">
              <IconSearch className="h-3 w-3" />
            </span>
            <input
              type="text"
              autoComplete="off"
              placeholder={t.filter}
              {...register('term')}
              className="h-8 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-7 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {termValue && (
              <button
                type="button"
                onClick={() => reset(prev => ({ ...prev, term: '' }))}
                className="absolute inset-y-0 right-1.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <IconX className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ESTADO */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                options={options_status}
                value={options_status.find(o => o.value === field.value) ?? null}
                onChange={(s) => field.onChange(s?.value ?? '')}
                placeholder={t.status}
                menuPortalTarget={portalTarget}
                styles={compactSelectStylesWidthUpper('110px')}
              />
            )}
          />
        </div>

        {/* PROVEEDOR */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.supplier}</span>
          <Controller
            name="supplier"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                loadOptions={loadSuppliers}
                defaultOptions={false}
                value={field.value}
                onChange={(s) => field.onChange(s ?? null)}
                placeholder={`${t.search}...`}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < ASYNC_MIN_CHARS ? `${ASYNC_MIN_CHARS}+` : t.no_matches}
                isClearable
                cacheOptions
                menuPortalTarget={portalTarget}
                styles={compactSelectStylesWidth('270px')}
              />
            )}
          />
        </div>

        {/* MARCA */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.brand}</span>
          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                loadOptions={loadBrands}
                defaultOptions={false}
                value={field.value}
                onChange={(s) => field.onChange(s ?? null)}
                placeholder={`${t.search}...`}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < ASYNC_MIN_CHARS ? `${ASYNC_MIN_CHARS}+` : t.no_matches}
                isClearable
                cacheOptions
                menuPortalTarget={portalTarget}
                styles={compactSelectStylesWidth('270px')}
              />
            )}
          />
        </div>

        {/* APLICACIÓN */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.application}</span>
          <Controller
            name="application"
            control={control}
            render={({ field }) => (
              <AsyncSelect
                loadOptions={loadBrands}
                defaultOptions={false}
                value={field.value}
                onChange={(s) => field.onChange(s ?? null)}
                placeholder={`${t.search}...`}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < ASYNC_MIN_CHARS ? `${ASYNC_MIN_CHARS}+` : t.no_matches}
                isClearable
                cacheOptions
                menuPortalTarget={portalTarget}
                styles={compactSelectStylesWidth('270px')}
              />
            )}
          />
        </div>

        {/* TIPO DE REPUESTO */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">{t.spare_part_type}</span>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                options={typesSpare}
                value={typesSpare.find(o => o.value === field.value) ?? null}
                onChange={(s) => field.onChange(s?.value ?? '')}
                placeholder={`${t.search}...`}
                isClearable
                menuPortalTarget={portalTarget}
                styles={compactSelectStylesWidthUpper('160px')}
              />
            )}
          />
        </div>

        {/* Acciones — juntas, al final del flujo de llenado de filtros */}
        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            title={t.search}
            className="flex h-8 items-center gap-1.5 rounded-lg px-3 bg-primary/20 text-primary text-xs font-medium hover:bg-primary/40 transition"
          >
            <IconSearch className="h-3 w-3" />
            {t.search}
          </button>
          <button
            type="button"
            onClick={clearAll}
            title={t.btn_reset ?? 'Restablecer'}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition"
          >
            <IconBackSpace className="h-3.5 w-3.5" />
            {t.btn_reset ?? 'Restablecer'}
          </button>
        </div>
      </form>
      </div>

      {/* LISTA */}
      {view === 'list' && (
        <div className="panel mt-3 overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="border-collapse table-fixed bg-white dark:bg-gray-900">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-gray-50 dark:bg-gray-800 py-2 w-[54px]"></th>
                  {coreCols.map(c => (
                    <th key={c.key} className={thClass} style={{ width: c.width }}>{c.title}</th>
                  ))}
                  {visibleToggleCols.map(c => (
                    <th
                      key={c.key}
                      className={c.wrapHeader ? thWrapClass : thClass}
                      style={{ width: c.width }}
                    >
                      {c.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((s, index) => (
                  <tr key={index} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-1 py-1.5">
                      <div className="flex gap-0">
                        <button
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleView(s)}
                          title={t.view ?? 'Ver'}
                        >
                          <IconEye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        {hasPermission(PERMISSIONS.REPUESTOS_MODIFICAR) && (
                          <button
                            className="p-0.5 rounded hover:bg-blue-50 dark:hover:bg-gray-800"
                            onClick={() => handleEdit(s)}
                            title={t.edit ?? 'Editar'}
                          >
                            <IconPencil className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        )}
                        {hasPermission(PERMISSIONS.REPUESTOS_ELIMINAR) && (
                          <button
                            className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-gray-800"
                            onClick={() => handleToggleStatus(s)}
                            title={s.codEstado === 'AC' ? (t.delete ?? 'Eliminar') : (t.activate ?? 'Activar')}
                          >
                            {s.codEstado === 'AC'
                              ? <IconTrash className="w-3.5 h-3.5 text-red-500" />
                              : <IconToggleOn className="w-4 h-4 text-gray-400" />}
                          </button>
                        )}
                      </div>
                    </td>
                    {coreCols.map(c => (
                      <td key={c.key} className={c.key === 'files' ? 'px-0.5 py-1.5' : tdClass}>{renderCell(c.key, s)}</td>
                    ))}
                    {visibleToggleCols.map(c => (
                      <td key={c.key} className={tdClass}>{renderCell(c.key, s)}</td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={1 + coreCols.length + visibleToggleCols.length} className="px-3 py-10 text-center text-sm text-gray-400">
                      {t.no_matches ?? 'Sin resultados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRID */}
      {view === 'grid' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.map((s, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.nroParte}</h3>
                  {s.tieneImagen && <IconPhoto className="w-4 h-4 text-blue-500 shrink-0" />}
                  {s.tieneDocumento && <IconFile className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleView(s)} title={t.view ?? 'Ver'}>
                    <IconEye className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  {hasPermission(PERMISSIONS.REPUESTOS_MODIFICAR) && (
                    <button className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800" onClick={() => handleEdit(s)} title={t.edit ?? 'Editar'}>
                      <IconPencil className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.REPUESTOS_ELIMINAR) && (
                    <button className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800" onClick={() => handleToggleStatus(s)} title={s.codEstado === 'AC' ? (t.delete ?? 'Eliminar') : (t.activate ?? 'Activar')}>
                      {s.codEstado === 'AC' ? <IconTrash className="w-3.5 h-3.5 text-red-500" /> : <IconToggleOn className="w-4 h-4 text-gray-400" />}
                    </button>
                  )}
                </div>
              </div>

              <p className="px-3 pt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.2em]">
                {s.descripcion || '-'}
              </p>

              <div className="px-3 py-2 space-y-1 text-xs">
                <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{t.supplier}</span><span className="font-medium truncate">{s.proveedor}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{t.brand}</span><span className="font-medium truncate">{s.marca}</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{t.application}</span><span className="font-medium truncate">{s.aplicacion}</span></div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">${s.costo}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.codEstado === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {s.codEstado === 'AC' ? t.active : t.inactive}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {view === 'grid' && total > pageSize && (
        <div className="flex justify-center mt-6">
          <Pagination total={Math.ceil(total / pageSize)} value={page} onChange={onPageChange} size="sm" radius="xl" />
        </div>
      )}
      {view === 'list' && total > pageSize && (
        <div className="flex justify-center mt-3">
          <Pagination total={Math.ceil(total / pageSize)} value={page} onChange={onPageChange} size="sm" radius="xl" />
        </div>
      )}
    </div>
  );
};

export default DatatablesSpares;
