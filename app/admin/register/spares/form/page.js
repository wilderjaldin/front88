'use client';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import AccessDenied from '@/components/AccessDenied';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconSave from '@/components/icon/icon-save';
import SelectBrand from '@/components/select-brand';
import SpareFiles from '../SpareFiles';

const URL_CONTROLS = 'repuestos/controles?incluirEstados=true';
const URL_DETAIL   = 'repuestos/detalle';
const URL_SAVE     = 'repuestos/registrar';
const URL_UPDATE   = 'repuestos/editar';

const ASYNC_LIMIT     = 20;
const ASYNC_MIN_CHARS = 2;

const formatDateTime = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SpareFormPage() {

  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();
  const { hasPermission } = usePermissions();

  const id     = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const isEdit = !!id;

  useDynamicTitle(isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto');

  if (!hasPermission(PERMISSIONS.REPUESTOS_CREAR)) return <AccessDenied />;

  const [brands,      setBrands]      = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [types,       setTypes]       = useState([]);
  const [status,      setStatus]      = useState([]);
  const [units,       setUnits]       = useState([]);
  const [status_code, setStatusCode]  = useState([]);
  const [isSaving,    setIsSaving]    = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);

  const spareFilesRef = useRef(null);

  // ── AsyncSelect helpers ───────────────────────────────────────────────────
  const filterOpts = (options, input) => {
    const term = input.trim().toLowerCase();
    if (term.length < ASYNC_MIN_CHARS) return [];
    return options
      .filter(o =>
        o.label.toLowerCase().includes(term) ||
        o.razSoc?.toLowerCase().includes(term)
      )
      .slice(0, ASYNC_LIMIT);
  };

  const loadSuppliers = useCallback(
    (input, cb) => cb(filterOpts(suppliers, input)), [suppliers]
  );

  const noOptsMsg = ({ inputValue }) =>
    inputValue.length < ASYNC_MIN_CHARS
      ? `Ingresa ${ASYNC_MIN_CHARS} caracteres para buscar`
      : 'Sin resultados';

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, control, reset, watch, setValue, setFocus, getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nroParte:               '',
      desRepuesto:            '',
      codPrv:                 null,
      codAplicacion:          null,
      codMarca:               null,
      tipRepuesto:            null,
      estado:                 { value: 'NU', label: 'NUEVO' },
      estNroParte:            { value: 'VA', label: 'VALIDO' },
      peso:                   '0.00',
      costo:                  '0.00',
      canMin:                 1,
      uniMed:                 { value: 'UNI', label: 'UNIDAD' },
      // Poco Inventario / Pedido especial sin Fecha / Pedido especial forman un grupo
      // mutuamente excluyente (un solo campo). No Express es independiente (ver abajo).
      tipoPedido:             '',
      canDias:                0,
      blnNoExpress:           false,
      notaAdicional:          '',
    }
  });

  const watchTipoPedido = watch('tipoPedido');

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

        const newBrands     = rsControls.data.marcas        ?? [];
        const newSuppliers  = rsControls.data.proveedores   ?? [];
        const newTypes      = rsControls.data.tiposRepuesto ?? [];
        const newStatus     = rsControls.data.estados       ?? [];
        const newUnits      = rsControls.data.unidades      ?? [];
        const newStatusCode = rsControls.data.estado_codigo ?? [];

        setBrands(newBrands);
        setSuppliers(newSuppliers);
        setTypes(newTypes);
        setStatus(newStatus);
        setUnits(newUnits);
        setStatusCode(newStatusCode);

        if (isEdit) {
          const rsDetail = await axiosClient.get(`${URL_DETAIL}/${id}`);
          const d = rsDetail.data;

          const bMap = new Map(newBrands.map(b    => [Number(b.value), b]));
          const sMap = new Map(newSuppliers.map(s => [Number(s.value), s]));

          reset({
            nroParte:               d.nroParte    ?? '',
            desRepuesto:            d.desRepuesto ?? '',
            codPrv:                 sMap.get(Number(d.codPrv))       ?? null,
            codAplicacion:          bMap.get(Number(d.codAplicacion)) ?? null,
            codMarca:               bMap.get(Number(d.codMarca))      ?? null,
            tipRepuesto:            newTypes.find(o      => o.value.trim() === d.tipRepuesto?.trim()) ?? null,
            estado:                 newStatus.find(o     => o.value.trim() === d.estado?.trim())      ?? null,
            uniMed:                 newUnits.find(o      => o.value.trim() === d.uniMed?.trim())      ?? null,
            estNroParte:            newStatusCode.find(o => o.value === d.estNroParte)                ?? null,
            peso:                   d.peso   ?? '0.00',
            costo:                  d.costo  ?? '0.00',
            canMin:                 d.canMin ?? 1,
            tipoPedido:             d.blnPocoInventario      ? 'poco_inventario'
                                   : d.blnPedEspecialSinFecha ? 'sin_fecha'
                                   : d.blnPedidoEspecial      ? 'especial'
                                   : '',
            canDias:                d.canDias ?? 0,
            blnNoExpress:           !!d.blnNoExpress,
          });

          setNotesHistory(d.notasAdicionales ?? []);
        }
      } catch (err) {
        // manejar error silenciosamente o mostrar toast
      } finally {
        Swal.close();
      }
    };

    init();
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  // Mismo modelo para crear y editar: TODO — datos del repuesto, nota adicional
  // e imágenes/documentos (nuevos o "sugeridos" reutilizados de otro repuesto) —
  // va en UN SOLO POST/PUT multipart. Antes edición mandaba 2-3 llamados
  // encadenados (PUT datos → POST nota → POST/DELETE por archivo); ahora la API
  // resuelve todo del mismo payload que registro, solo que con codRepuesto.
  const onSubmit = async (data) => {
    setIsSaving(true);

    try {
      const tipoPedidoFields = {
        blnPocoInventario:      data.tipoPedido === 'poco_inventario',
        blnPedEspecialSinFecha: data.tipoPedido === 'sin_fecha',
        blnPedidoEspecial:      data.tipoPedido === 'especial',
        blnNoExpress:           data.blnNoExpress ? true : false,
        canDias:                data.tipoPedido === 'especial' ? (Number(data.canDias) || null) : null,
      };

      const {
        imagenes = [], documentos = [],
        imagenesAsignadas = [], documentosAsignados = [],
      } = spareFilesRef.current?.getQueuedFiles() ?? {};

      const form = new FormData();
      if (isEdit) form.append('codRepuesto', id);
      form.append('nroParte', data.nroParte.trim());
      form.append('desRepuesto', data.desRepuesto.trim());
      if (data.codPrv?.value)        form.append('codPrv', parseInt(data.codPrv.value));
      if (data.codAplicacion?.value) form.append('codAplicacion', parseInt(data.codAplicacion.value));
      if (data.codMarca?.value)      form.append('codMarca', parseInt(data.codMarca.value));
      if (data.tipRepuesto?.value)   form.append('tipRepuesto', data.tipRepuesto.value);
      if (data.estado?.value)        form.append('estado', data.estado.value);
      form.append('estNroParte', data.estNroParte?.value ?? 'AC');
      form.append('peso', Number(data.peso) || 0);
      form.append('costo', Number(data.costo) || 0);
      form.append('canMin', Number(data.canMin) || 1);
      form.append('uniMed', data.uniMed?.value ?? 'UNI');
      form.append('blnPocoInventario', tipoPedidoFields.blnPocoInventario);
      form.append('blnPedEspecialSinFecha', tipoPedidoFields.blnPedEspecialSinFecha);
      form.append('blnPedidoEspecial', tipoPedidoFields.blnPedidoEspecial);
      form.append('blnNoExpress', tipoPedidoFields.blnNoExpress);
      if (tipoPedidoFields.canDias != null) form.append('canDias', tipoPedidoFields.canDias);

      const nota = data.notaAdicional?.trim();
      if (nota) form.append('nota', nota);

      imagenes.forEach((file) => form.append('imagenes', file));
      documentos.forEach(({ file, nombre }) => {
        form.append('documentos', file);
        form.append('nombresDocumentos', nombre);
      });
      // Archivos "sugeridos" (ya existentes en otro repuesto) elegidos antes de
      // guardar — se asignan por codArchivo, no se vuelven a subir. Sin confirmar
      // todavía si el back acepta estos dos campos en el mismo POST/PUT.
      imagenesAsignadas.forEach((codArchivo) => form.append('imagenesAsignadas', codArchivo));
      documentosAsignados.forEach((codArchivo) => form.append('documentosAsignados', codArchivo));

      // Content-Type NO se fija a mano: axios necesita generar el boundary del
      // multipart automáticamente, si no el backend no puede parsear el body.
      if (isEdit) {
        await axiosClient.put(URL_UPDATE, form, { headers: { 'Content-Type': undefined } });
        await swalSuccess('Repuesto actualizado correctamente');
      } else {
        await axiosClient.post(URL_SAVE, form, { headers: { 'Content-Type': undefined } });
        await swalSuccess('Repuesto registrado correctamente');
      }

      router.push('/admin/register/spares');

    } catch (err) {
      const resData = err?.response?.data ?? {};
      const msg = resData.errors && typeof resData.errors === 'object'
        ? Object.values(resData.errors).flat().join('\n')
        : (resData.message ?? err?.message ?? 'Error al guardar');
      swalError(t.warning ?? 'Advertencia', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helper error inline ───────────────────────────────────────────────────
  const FieldError = ({ name }) =>
    errors[name]
      ? <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors[name].message}
        </span>
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  // .spare-form: los overrides de .form-input/.form-checkbox/.select__* (altura,
  // radio, color de foco) viven en styles/tailwind.css, scopeados a esta clase —
  // ya no en un <style> inyectado acá.
  return (
    <div className="spare-form">

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
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => router.push('/admin/register/spares')}
          className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-300
            dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition"
        >
          <IconArrowBackward className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* ── Formulario ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Panel: fondo blanco, borde sutil, sombra suave */}
        <div className={`
          bg-white dark:bg-[#0e1726]
          border border-gray-200 dark:border-gray-700
          rounded-xl shadow-sm
          p-6
          ${isSaving ? 'form-saving' : ''}
        `}>
          {/* 3 columnas independientes (flex, no grid) — cada una alta según su propio
              contenido, sin que una celda más alta le fuerce espacio en blanco a sus
              vecinas de la misma fila (eso pasaba con CSS Grid + alturas dispares). */}
          <div className="flex flex-col sm:flex-row gap-x-8 gap-y-6 items-start">

            {/* ── COLUMNA 1 ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-y-6 w-full">

              {/* 1. Nro. Parte */}
              <div className="max-w-[50%]">
                <label className="block text-sm font-medium mb-1.5">
                  {t.nro_part ?? 'Nro. Parte'} <span className="text-red-500">*</span>
                </label>
                <input
                  tabIndex={1}
                  type="text"
                  autoComplete="off"
                  placeholder="Ej: 3415661"
                  {...register('nroParte', {
                    required:  'Campo requerido',
                    maxLength: { value: 25, message: 'Máximo 25 caracteres' },
                  })}
                  className={`form-input w-full ${errors.nroParte ? 'error' : ''}`}
                />
                <FieldError name="nroParte" />
              </div>

              {/* 4. Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t.description ?? 'Descripción'} <span className="text-red-500">*</span>
                </label>
                <input
                  tabIndex={5}
                  type="text"
                  autoComplete="off"
                  placeholder="Descripción del repuesto"
                  {...register('desRepuesto', {
                    required:  'Campo requerido',
                    maxLength: { value: 300, message: 'Máximo 300 caracteres' },
                  })}
                  className={`form-input w-full ${errors.desRepuesto ? 'error' : ''}`}
                />
                <FieldError name="desRepuesto" />
              </div>

              {/* 7. Tipo de Repuesto + Estado — juntos en la misma celda */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.spare_part_type ?? 'Tipo de Repuesto'} <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="tipRepuesto"
                      control={control}
                      rules={{ required: 'Seleccione un tipo de repuesto' }}
                      render={({ field }) => (
                        <Select
                          tabIndex={8}
                          options={types}
                          value={field.value}
                          onChange={(s) => field.onChange(s ?? null)}
                          placeholder="Tipo de repuesto"
                          isClearable
                          classNamePrefix="sf-select"
                          className={`w-full ${errors.tipRepuesto ? 'react-select-error' : ''}`}
                        />
                      )}
                    />
                    <FieldError name="tipRepuesto" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.status ?? 'Estado'} <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="estado"
                      control={control}
                      rules={{ required: 'Requerido' }}
                      render={({ field }) => (
                        <Select
                          tabIndex={9}
                          options={status}
                          value={field.value}
                          onChange={(s) => field.onChange(s ?? null)}
                          placeholder="Seleccionar..."
                          classNamePrefix="sf-select"
                          className={`w-full ${errors.estado ? 'react-select-error' : ''}`}
                        />
                      )}
                    />
                    <FieldError name="estado" />
                  </div>
                </div>
              </div>

              {/* 11. Poco Inventario / Pedido especial sin Fecha / Pedido especial — grupo excluyente */}
              <div>
                <div className="flex flex-wrap items-center gap-4">

                  {[
                    { value: 'poco_inventario', tabIndex: 13, label: t.low_inventory ?? 'Poco Inventario' },
                    { value: 'sin_fecha',       tabIndex: 14, label: t.abb_special_order_date ?? 'Ped. Esp. S/Fecha' },
                  ].map((opt) => {
                    const active = watchTipoPedido === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center shrink-0 gap-1 h-[42px] px-2 rounded-lg border cursor-pointer select-none transition m-0
                          ${active
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-400 dark:border-[#17263c] bg-gray-50 dark:bg-[#0b1220] hover:border-primary/60 hover:bg-white dark:hover:bg-[#121e32]'}`}
                      >
                        <input
                          tabIndex={opt.tabIndex}
                          type="radio"
                          name="tipoPedido"
                          checked={active}
                          onChange={() => {}}
                          onClick={() => setValue('tipoPedido', active ? '' : opt.value, { shouldDirty: true })}
                          className="form-radio"
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    );
                  })}

                  {/* Pedido especial: trae su propio input de días, solo habilitado cuando está elegido */}
                  <div
                    className={`flex items-center shrink-0 gap-1.5 h-[42px] px-2 rounded-lg border transition
                      ${watchTipoPedido === 'especial'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-400 dark:border-[#17263c] bg-gray-50 dark:bg-[#0b1220] hover:border-primary/60 hover:bg-white dark:hover:bg-[#121e32]'}`}
                  >
                    <label className="flex items-center gap-1 cursor-pointer select-none m-0">
                      <input
                        tabIndex={15}
                        type="radio"
                        name="tipoPedido"
                        checked={watchTipoPedido === 'especial'}
                        onChange={() => {}}
                        onClick={() => {
                          const next = watchTipoPedido === 'especial' ? '' : 'especial';
                          setValue('tipoPedido', next, { shouldDirty: true });
                          // El input de días recién se habilita en el próximo render — el
                          // foco tiene que esperar a que deje de estar disabled.
                          if (next === 'especial') setTimeout(() => setFocus('canDias'), 0);
                        }}
                        className="form-radio"
                      />
                      <span className="text-sm font-medium">{t.abb_special_order ?? 'Ped. Especial'}</span>
                    </label>
                    <span className="w-px h-5 bg-gray-200 dark:bg-[#17263c] shrink-0" />
                    <input
                      tabIndex={16}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      defaultValue={0}
                      placeholder="0"
                      disabled={watchTipoPedido !== 'especial'}
                      {...register('canDias', {
                        onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); },
                      })}
                      className="w-8 text-center text-sm bg-transparent border-0 p-0 focus:outline-none
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-400 shrink-0">{t.days ?? 'días'}</span>
                  </div>

                </div>
              </div>

            </div>

            {/* ── COLUMNA 2 ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-y-6 w-full">

              {/* 2. Aplicación */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t.application ?? 'Aplicación'} <span className="text-red-500">*</span>
                </label>
                <SelectBrand
                  t={t}
                  name="codAplicacion"
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  brands={brands}
                  current={isEdit ? watch('codAplicacion') : null}
                  required="Seleccione una aplicación"
                  placeholder="Buscar aplicación..."
                  tabIndex={2}
                  instanceId="select-aplicacion"
                  onBrandAdded={({ marcas }) => setBrands(marcas)}
                />
                <FieldError name="codAplicacion" />
              </div>

              {/* 5. Proveedor + 6. Marca — Marca apilada debajo de Proveedor, en la misma celda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t.supplier ?? 'Proveedor'} <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="codPrv"
                    control={control}
                    rules={{ required: 'Seleccione un proveedor' }}
                    render={({ field }) => (
                      <AsyncSelect
                        tabIndex={6}
                        loadOptions={loadSuppliers}
                        defaultOptions={false}
                        value={field.value}
                        onChange={(s) => field.onChange(s ?? null)}
                        placeholder="Buscar proveedor..."
                        noOptionsMessage={noOptsMsg}
                        isClearable
                        cacheOptions
                        classNamePrefix="sf-select"
                        className={`w-full ${errors.codPrv ? 'react-select-error' : ''}`}
                        formatOptionLabel={(opt) => (
                          <span>
                            {opt.label}
                            {opt.razSoc && opt.razSoc !== opt.label && (
                              <span className="text-gray-400"> ({opt.razSoc})</span>
                            )}
                          </span>
                        )}
                      />
                    )}
                  />
                  <FieldError name="codPrv" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t.brand ?? 'Marca'} <span className="text-red-500">*</span>
                  </label>
                  <SelectBrand
                    t={t}
                    name="codMarca"
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    brands={brands}
                    current={isEdit ? watch('codMarca') : null}
                    required="Seleccione una marca"
                    placeholder="Buscar marca..."
                    tabIndex={7}
                    instanceId="select-marca"
                    onBrandAdded={({ marcas }) => setBrands(marcas)}
                  />
                  <FieldError name="codMarca" />
                </div>
              </div>

              {/* 9. Estado Código */}
              <div className="max-w-[50%]">
                <label className="block text-sm font-medium mb-1.5">
                  {t.status_code ?? 'Estado Código'}
                </label>
                <Controller
                  name="estNroParte"
                  control={control}
                  render={({ field }) => (
                    <Select
                      tabIndex={10}
                      options={status_code}
                      value={field.value}
                      onChange={(s) => field.onChange(s ?? null)}
                      placeholder="Seleccionar..."
                      classNamePrefix="sf-select"
                      className="w-full"
                    />
                  )}
                />
              </div>

            </div>

            {/* ── COLUMNA 3 ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-y-6 w-full">

              {/* 3. Peso + Costo */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.weight ?? 'Peso (lb)'}
                    </label>
                    <input
                      tabIndex={3}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      {...register('peso')}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.cost ?? 'Costo'}
                    </label>
                    <input
                      tabIndex={4}
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      {...register('costo')}
                      className="form-input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 10. Cant. Mínima + Unidad */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.min_quantity ?? 'Cant. Mínima'}
                    </label>
                    <input
                      tabIndex={11}
                      type="number"
                      min="0"
                      placeholder="1"
                      {...register('canMin')}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t.unit ?? 'Unidad'} <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="uniMed"
                      control={control}
                      rules={{ required: 'Requerido' }}
                      render={({ field }) => (
                        <Select
                          tabIndex={12}
                          options={units}
                          value={field.value}
                          onChange={(s) => field.onChange(s ?? null)}
                          placeholder={t.unit}
                          classNamePrefix="sf-select"
                          className={`w-full ${errors.uniMed ? 'react-select-error' : ''}`}
                        />
                      )}
                    />
                    <FieldError name="uniMed" />
                  </div>
                </div>
              </div>

              {/* 11. No Express — checkbox suelto, no forma parte del grupo excluyente "Pedidos" */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none h-[42px] m-0">
                  <input
                    tabIndex={17}
                    type="checkbox"
                    {...register('blnNoExpress')}
                    className="form-checkbox"
                  />
                  <span className="text-sm font-medium">
                    {t.no_express ?? 'No Express'}
                  </span>
                </label>
              </div>

            </div>

          </div>{/* fin columnas */}
        </div>{/* fin panel */}

        {/* ── Nota Adicional + Archivos, en 2 columnas para reducir el alto total ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">

          {/* Nota Adicional (endpoint propio; en registro nuevo se envía tras crear el id) */}
          <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            {isEdit && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  {t.history ?? 'Historial'}
                </p>
                {notesHistory.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center">
                    <p className="text-xs text-gray-400">{t.no_matches ?? 'Sin notas registradas'}</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {notesHistory.map((n, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2.5 ${i % 2 === 0 ? 'bg-white dark:bg-[#0e1726]' : 'bg-gray-50 dark:bg-[#0b1220]'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{n.nomUsuario}</span>
                          <span className="text-[11px] text-gray-400">{formatDateTime(n.fecha)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{n.nota}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className={isEdit ? 'mt-4' : ''}>
              <label className="block text-sm font-medium mb-1.5">
                {t.additional_note ?? 'Nota Adicional'}
              </label>
              <textarea
                tabIndex={18}
                rows={2}
                placeholder={t.write_a_note ?? 'Escribe una nota...'}
                {...register('notaAdicional')}
                className="form-textarea w-full resize-none"
              />
            </div>
          </div>

          {/* Archivos: imágenes y documentos (colapsado por defecto para no sobrecargar el form) */}
          <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t.files ?? 'Archivos'} <span className="text-xs text-gray-400 font-normal">({t.optional ?? 'opcional'})</span>
              </span>
              <button
                type="button"
                onClick={() => spareFilesRef.current?.openSuggested()}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium
                  text-primary hover:bg-primary/10 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                Archivos sugeridos
              </button>
            </div>
            {/* Ya no es colapsable: al quedar en una columna angosta al lado de la Nota
                Adicional (en vez de ocupar el ancho completo debajo de todo el form),
                mostrarlo siempre abierto no agrega bulto vertical extra. */}
            <div className="px-6 pb-6">
              <SpareFiles
                ref={spareFilesRef}
                mode={isEdit ? 'edit' : 'new'}
                codRepuesto={isEdit ? id : null}
                getSuggestParams={() => {
                  const v = getValues();
                  return {
                    nroParte: v.nroParte?.trim() || null,
                    codMarca: v.codMarca?.value  || null,
                    codPrv:   v.codPrv?.value    || null,
                  };
                }}
              />
            </div>
          </div>

        </div>

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 mt-6">

          {/* Botón Cancelar */}
          <button
            type="button"
            tabIndex={19}
            disabled={isSaving}
            onClick={() => router.push('/admin/register/spares')}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg
              border border-gray-300 dark:border-gray-600
              text-sm font-medium text-gray-600 dark:text-gray-300
              bg-white dark:bg-transparent
              hover:bg-gray-50 dark:hover:bg-gray-800
              hover:border-gray-400 dark:hover:border-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            {t.btn_cancel ?? 'Cancelar'}
          </button>

          {/* Botón Guardar/Actualizar */}
          <button
            type="submit"
            tabIndex={20}
            disabled={isSaving}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg
              text-sm font-semibold text-white
              bg-primary hover:bg-primary/90
              shadow-md shadow-primary/25
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-150"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving ?? 'Guardando...'}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {isEdit ? (t.btn_update ?? 'Actualizar') : (t.btn_save ?? 'Guardar')}
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
}