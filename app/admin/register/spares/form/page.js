'use client';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import FormAddBrand from '@/components/forms/add-brand-form';
import SpareFiles from '../SpareFiles';

const URL_CONTROLS = 'repuestos/controles';
const URL_DETAIL = 'repuestos/detalle';
const URL_SAVE = 'repuestos/registrar';
const URL_UPDATE = 'repuestos/editar';

const UNIT_OPTIONS = [
  { value: 'UNI', label: 'Unidad' },
  { value: 'PAR', label: 'Par' },
  { value: 'JGO', label: 'Juego' },
  { value: 'KIT', label: 'Kit' },
  { value: 'LT', label: 'Litro' },
  { value: 'GL', label: 'Galón' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'MT', label: 'Metro' },
];

const COD_ESTADO_OPTIONS = [
  { value: 'AC', label: 'Activo' },
  { value: 'IN', label: 'Inactivo' },
];

const ASYNC_LIMIT = 20;
const ASYNC_MIN_CHARS = 2;

// Estilos react-select compatibles con dark mode del template.
// El template usa clase "dark" en <html>; react-select no la detecta por si solo,
// por eso pasamos los colores via CSS variables que el template define.
const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--select-bg, white)',
    borderColor: state.isFocused ? '#4361ee' : 'var(--select-border, #e0e6ed)',
    boxShadow: 'none',
    '&:hover': { borderColor: '#4361ee' },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--select-bg, white)',
    border: '1px solid var(--select-border, #e0e6ed)',
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4361ee' : state.isFocused ? '#eaf1ff' : 'transparent',
    color: state.isSelected ? 'white' : 'inherit',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({ ...base, color: 'inherit' }),
  input: (base) => ({ ...base, color: 'inherit' }),
  placeholder: (base) => ({ ...base, color: '#888' }),
  clearIndicator: (base) => ({ ...base, color: '#888', '&:hover': { color: '#e7515a' } }),
  dropdownIndicator: (base) => ({ ...base, color: '#888' }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--select-border, #e0e6ed)' }),
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SpareFormPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslation();

  const id = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const isEdit = !!id;

  useDynamicTitle(isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto');

  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [types, setTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal (Agregar marca/aplicación) ─────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);

  //imagenes
  const [tempToken] = useState(() => crypto.randomUUID());
  
  const openAddApp = () => {
    setModalTitle(t.add_application ?? 'Agregar Aplicación');
    setModalContent(
      <FormAddBrand
        setBrands={setBrands}
        msg_save_success={t.app_save_success}
        msg_save_error={t.app_save_error}
        msg_save_error_server={t.app_save_error_server}
        action_cancel={() => setShowModal(false)}
      />
    );
    setShowModal(true);
  };

  const openAddBrand = () => {
    setModalTitle(t.add_brand ?? 'Agregar Marca');
    setModalContent(
      <FormAddBrand
        setBrands={setBrands}
        msg_save_success={t.brand_save_success}
        msg_save_error={t.brand_save_error}
        msg_save_error_server={t.brand_save_error_server}
        action_cancel={() => setShowModal(false)}
      />
    );
    setShowModal(true);
  };

  // ── AsyncSelect helpers ───────────────────────────────────────────────────
  const filterOpts = (options, input) => {
    const term = input.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return options
      .filter(o => o.label.toLowerCase().includes(term))
      .slice(0, ASYNC_LIMIT);
  };

  const loadSuppliers = useCallback(
    (input, cb) => cb(filterOpts(suppliers, input)), [suppliers]
  );
  const loadBrands = useCallback(
    (input, cb) => cb(filterOpts(brands, input)), [brands]
  );

  const noOptsMsg = ({ inputValue }) =>
    inputValue.length < ASYNC_MIN_CHARS
      ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
      : 'Sin resultados';

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, control, reset, watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nroParte: '',
      nroParte2: '',
      desRepuesto: '',
      codPrv: null,
      codAplicacion: null,
      codMarca: null,
      tipRepuesto: null,
      estado: { value: 'NU', label: 'Nuevo' },
      codEstado: { value: 'AC', label: 'Activo' },
      peso: '0.00',
      costo: '0.00',
      canMin: 1,
      uniMed: { value: 'UNI', label: 'Unidad' },
      blnPedEspecialSinFecha: false,
      blnPedidoEspecial: false,
      canDias: 0,
    }
  });

  const watchPedido = watch('blnPedidoEspecial');

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      Swal.fire({
        title: t.loading ?? 'Cargando...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const rsControls = await axiosClient.get(URL_CONTROLS);
        const newBrands = rsControls.data.marcas ?? [];
        const newSuppliers = rsControls.data.proveedores ?? [];
        setBrands(newBrands);
        setSuppliers(newSuppliers);
        setTypes(rsControls.data.tiposRepuesto ?? []);

        if (isEdit) {
          const rsDetail = await axiosClient.get(`${URL_DETAIL}/${id}`);
          const d = rsDetail.data;

          const bMap = new Map(newBrands.map(b => [Number(b.value), b]));
          const sMap = new Map(newSuppliers.map(s => [Number(s.value), s]));
          const tipMap = new Map(tiposRepuesto.map(o => [o.value, o]));
          console.log('DDTA', d)
          reset({
            nroParte: d.nroParte ?? '',
            nroParte2: d.nroParte2 ?? '',
            desRepuesto: d.desRepuesto ?? '',
            codPrv: sMap.get(Number(d.codPrv)) ?? null,
            codAplicacion: bMap.get(Number(d.codAplicacion)) ?? null,
            codMarca: bMap.get(Number(d.codMarca)) ?? null,
            tipRepuesto: tipMap.get(d.tipRepuesto) ?? null,
            estado: STATUS_OPTIONS.find(o => o.value === d.estado) ?? null,
            codEstado: COD_ESTADO_OPTIONS.find(o => o.value === d.codEstado) ?? null,
            peso: d.peso ?? '0.00',
            costo: d.costo ?? '0.00',
            canMin: d.canMin ?? 1,
            uniMed: UNIT_OPTIONS.find(o => o.value === d.uniMed) ?? null,
            blnPedEspecialSinFecha: !!d.blnPedEspecialSinFecha,
            blnPedidoEspecial: !!d.blnPedidoEspecial,
            canDias: d.canDias ?? 0,
          });
        }
      } catch (err) {
        console.error('Error en carga inicial', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la información',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
      } finally {
        Swal.close();
      }
    };

    init();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsSaving(true);
    Swal.fire({
      title: t.loading ?? 'Guardando...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {

      const payload = {
        ...(isEdit && { codRepuesto: id }),
        nroParte: data.nroParte.trim(),
        nroParte2: data.nroParte2?.trim() || null,
        desRepuesto: data.desRepuesto.trim(),
        codPrv: data.codPrv?.value ?? null,
        codAplicacion: data.codAplicacion?.value ?? null,
        codMarca: data.codMarca?.value ?? null,
        tipRepuesto: data.tipRepuesto?.value || null,
        estado: data.estado?.value ?? null,
        codEstado: data.codEstado?.value ?? 'AC',
        peso: Number(data.peso) || 0,
        costo: Number(data.costo) || 0,
        canMin: Number(data.canMin) || 1,
        uniMed: data.uniMed?.value ?? 'UNI',
        blnPedEspecialSinFecha: data.blnPedEspecialSinFecha ? 1 : 0,
        blnPedidoEspecial: data.blnPedidoEspecial ? 1 : 0,
        canDias: data.blnPedidoEspecial
          ? (Number(data.canDias) || null)
          : null,
      };

      const method = isEdit ? 'put' : 'post';
      const url = isEdit ? URL_UPDATE : URL_SAVE;
      await axiosClient[method](url, payload);

      Swal.fire({
        title: t.success ?? '¡Guardado!',
        text: isEdit
          ? 'Repuesto actualizado correctamente'
          : 'Repuesto registrado correctamente',
        icon: 'success',
        confirmButtonColor: '#15803d',
        confirmButtonText: t.close ?? 'Cerrar',
      }).then(() => router.push('/admin/register/spares'));

    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close ?? 'Cerrar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helper error ──────────────────────────────────────────────────────────
  const FieldError = ({ name }) =>
    errors[name]
      ? <span className="text-red-500 text-xs mt-1 block">{errors[name].message}</span>
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
        <li className="text-sm text-gray-500">Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-500">
          <button
            type="button"
            className="hover:text-primary transition"
            onClick={() => router.push('/admin/register/spares')}
          >
            Repuestos
          </button>
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          {isEdit ? 'Editar' : 'Nuevo'}
        </li>
      </ul>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </h1>
          <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/register/spares')}
          className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300
          dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <IconArrowBackward className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* ── Formulario ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* CSS vars para react-select dark mode */}
        <style>{`
          :root { --select-bg: #fff; --select-border: #e0e6ed; }
          .dark  { --select-bg: #1b2e4b; --select-border: #17263c; }
        `}</style>
        <div className="panel bg-gray-100">



          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">

            {/* ── FILA 1 ─────────────────────────────────────────────── */}

            {/* 1. Nro. Parte */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.nro_part ?? 'Nro. Parte'} <span className="text-red-500">*</span>
              </label>
              <input
                tabIndex={1}
                type="text"
                autoComplete="off"
                placeholder="Ej: 3415661"
                {...register('nroParte', { required: 'Campo requerido' })}
                className={`form-input ${errors.nroParte ? 'border-red-500' : ''}`}
              />
              <FieldError name="nroParte" />
            </div>

            {/* 2. Aplicación */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.application ?? 'Aplicación'} <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <Controller
                  name="codAplicacion"
                  control={control}
                  rules={{ required: 'Seleccione una aplicación' }}
                  render={({ field }) => (
                    <AsyncSelect
                      tabIndex={2}
                      loadOptions={loadBrands}
                      defaultOptions={false}
                      value={field.value}
                      onChange={(s) => field.onChange(s ?? null)}
                      placeholder="Buscar aplicación..."
                      noOptionsMessage={noOptsMsg}
                      isClearable
                      cacheOptions
                      className="flex-1"
                      classNamePrefix="select"
                      styles={selectStyles}
                    />
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={openAddApp}
                  className="btn bg-gray-400 text-white shadow-none ltr:rounded-l-none rtl:rounded-r-none whitespace-nowrap"
                >
                  <IconPlus className="h-4 w-4 ltr:mr-1 rtl:ml-1 shrink-0" />
                  {t.btn_add ?? 'Agregar'}
                </button>
              </div>
              <FieldError name="codAplicacion" />
            </div>

            {/* 3. Peso */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.weight ?? 'Peso (lb)'}
              </label>
              <input
                tabIndex={3}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('peso')}
                className="form-input"
              />
            </div>

            {/* ── FILA 2 ─────────────────────────────────────────────── */}

            {/* 4. Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.description ?? 'Descripción'} <span className="text-red-500">*</span>
              </label>
              <input
                tabIndex={4}
                type="text"
                autoComplete="off"
                placeholder="Descripción del repuesto"
                {...register('desRepuesto', { required: 'Campo requerido' })}
                className={`form-input ${errors.desRepuesto ? 'border-red-500' : ''}`}
              />
              <FieldError name="desRepuesto" />
            </div>

            {/* 5. Tipo de Repuesto */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.spare_part_type ?? 'Tipo de Repuesto'}
              </label>
              <Controller
                name="tipRepuesto"
                control={control}
                render={({ field }) => (
                  <Select
                    tabIndex={5}
                    options={types}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Tipo de repuesto"
                    isClearable
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* 6. Costo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.cost ?? 'Costo'}
              </label>
              <input
                tabIndex={6}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('costo')}
                className="form-input"
              />
            </div>

            {/* ── FILA 3 ─────────────────────────────────────────────── */}

            {/* 7. Proveedor */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.supplier ?? 'Proveedor'} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="codPrv"
                control={control}
                rules={{ required: 'Seleccione un proveedor' }}
                render={({ field }) => (
                  <AsyncSelect
                    tabIndex={7}
                    loadOptions={loadSuppliers}
                    defaultOptions={false}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Buscar proveedor..."
                    noOptionsMessage={noOptsMsg}
                    isClearable
                    cacheOptions
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
              <FieldError name="codPrv" />
            </div>

            {/* 8. Marca */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.brand ?? 'Marca'} <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <Controller
                  name="codMarca"
                  control={control}
                  rules={{ required: 'Seleccione una marca' }}
                  render={({ field }) => (
                    <AsyncSelect
                      tabIndex={8}
                      loadOptions={loadBrands}
                      defaultOptions={false}
                      value={field.value}
                      onChange={(s) => field.onChange(s ?? null)}
                      placeholder="Buscar marca..."
                      noOptionsMessage={noOptsMsg}
                      isClearable
                      cacheOptions
                      className="flex-1"
                      classNamePrefix="select"
                      styles={selectStyles}
                    />
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={openAddBrand}
                  className="btn bg-gray-400 text-white shadow-none ltr:rounded-l-none rtl:rounded-r-none whitespace-nowrap"
                >
                  <IconPlus className="h-4 w-4 ltr:mr-1 rtl:ml-1 shrink-0" />
                  {t.btn_add ?? 'Agregar'}
                </button>
              </div>
              <FieldError name="codMarca" />
            </div>

            {/* 9. Cant. Mínima + Unidad */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.min_quantity ?? 'Cant. Mínima'}
                  </label>
                  <input
                    tabIndex={9}
                    type="number"
                    min="0"
                    placeholder="1"
                    {...register('canMin')}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.unit ?? 'Unidad'} <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="uniMed"
                    control={control}
                    rules={{ required: 'Requerido' }}
                    render={({ field }) => (
                      <Select
                        tabIndex={10}
                        options={UNIT_OPTIONS}
                        value={field.value}
                        onChange={(s) => field.onChange(s ?? null)}
                        placeholder="UNI"
                        classNamePrefix="select"
                        styles={selectStyles}
                        className="w-full"
                      />
                    )}
                  />
                  <FieldError name="uniMed" />
                </div>
              </div>
            </div>

            {/* ── FILA 4 ─────────────────────────────────────────────── */}

            {/* 10. Estado del repuesto (NU/OR/RE...) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.status ?? 'Estado'} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="estado"
                control={control}
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <Select
                    tabIndex={11}
                    options={[]}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Seleccionar..."
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
              <FieldError name="estado" />
            </div>

            {/* 11. Estado Código (AC/IN) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.status_code ?? 'Estado Código'}
              </label>
              <Controller
                name="codEstado"
                control={control}
                render={({ field }) => (
                  <Select
                    tabIndex={12}
                    options={COD_ESTADO_OPTIONS}
                    value={field.value}
                    onChange={(s) => field.onChange(s ?? null)}
                    placeholder="Seleccionar..."
                    classNamePrefix="select"
                    styles={selectStyles}
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* col 3 vacía — fila 4 */}
            <div />

            {/* ── FILA 5 — Pedido Especial ────────────────────────────── */}

            {/* 12. Pedido especial sin fecha — col 1 */}
            <div>
              <label className="block text-sm font-medium mb-1 invisible">
                &nbsp;
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none h-10">
                <input
                  tabIndex={13}
                  type="checkbox"
                  {...register('blnPedEspecialSinFecha')}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium">
                  {t.order_special_without_date ?? 'Pedido especial sin Fecha'}
                </span>
              </label>
            </div>

            {/* 13. Pedido especial + días — col 2 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.special_order ?? 'Pedido especial'}
              </label>
              <div className="flex">
                <div className="flex items-center px-3
                  bg-white dark:bg-[#1b2e4b]
                  border border-r-0 border-white-light dark:border-[#17263c]
                  rounded-l-md">
                  <input
                    tabIndex={14}
                    type="checkbox"
                    {...register('blnPedidoEspecial')}
                    className="form-checkbox"
                  />
                </div>
                <input
                  tabIndex={15}
                  type="number"
                  step="any"
                  min="0"
                  defaultValue={0}
                  placeholder="0"
                  disabled={!watchPedido}
                  {...register('canDias')}
                  className="form-input ltr:rounded-l-none rtl:rounded-r-none flex-1
                  disabled:pointer-events-none disabled:bg-[#eee]
                  dark:disabled:bg-[#1b2e4b] disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* col 3 vacía — fila 5 */}
            <div />

          </div>{/* fin grid */}
          
        </div>{/* fin panel */}

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            tabIndex={18}
            onClick={() => router.push('/admin/register/spares')}
            className="btn btn-dark"
          >
            {t.btn_cancel ?? 'Cancelar'}
          </button>
          <button
            type="submit"
            tabIndex={19}
            disabled={isSaving}
            className="btn btn-success disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <IconSave className="h-4 w-4" />
            {isEdit ? (t.btn_update ?? 'Actualizar') : (t.btn_save ?? 'Guardar')}
          </button>
        </div>

      </form>

      {/* Modal agregar marca/aplicación */}
      <Modal
        showModal={showModal}
        title={modalTitle}
        content={modalContent}
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
      />

    </div>
  );
}