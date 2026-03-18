'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';

const URL_CONTROLES = '/clientes/controles';
const URL_REGISTRO  = '/clientes/registro';
const URL_EDITAR    = '/clientes/editar';

const IDIOMA_OPTIONS = [
  { value: 'ES', label: 'Español' },
  { value: 'US', label: 'Inglés' },
];

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const FieldError = ({ error }) =>
  error ? <p className="text-xs text-red-500 mt-1">{error.message}</p> : null;

// ─────────────────────────────────────────────────────────────────────────────
const CustomerForm = ({ cliente = null, onCancel, onSaved }) => {
  const t       = useTranslation();
  const isEdit  = !!cliente;
  const [saving, setSaving]     = useState(false);
  const [paises, setPaises]     = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modales agregar país / ciudad
  const [showModalPais, setShowModalPais]     = useState(false);
  const [showModalCiudad, setShowModalCiudad] = useState(false);
  const [nuevoPais, setNuevoPais]       = useState('');
  const [nuevaCiudad, setNuevaCiudad]   = useState('');
  const [savingPais, setSavingPais]     = useState(false);
  const [savingCiudad, setSavingCiudad] = useState(false);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      nomCliente:   '',
      tipDocumento: null,
      numNit:       '',
      codPais:      null,
      codCiudad:    null,
      dirCliente:   '',
      sitWeb:       '',
      actPrincipal: '',
      cliIdioma:    IDIOMA_OPTIONS[0],
    }
  });

  const watchPais = watch('codPais');

  // ── Carga controles ───────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(URL_CONTROLES);
        const newPaises   = res.data.paises   ?? [];
        const newDocTypes = res.data.docTypes ?? [];
        setPaises(newPaises);
        setDocTypes(newDocTypes);

        if (isEdit && cliente) {
          // Filtrar ciudades del país actual
          const paisObj = newPaises.find(p => p.value === cliente.codPais) ?? null;
          if (paisObj?.ciudades) setCiudades(paisObj.ciudades);

          reset({
            nomCliente:   cliente.nomCliente   ?? '',
            tipDocumento: newDocTypes.find(d => d.value === cliente.tipDocumento) ?? null,
            numNit:       cliente.numNit       ?? '',
            codPais:      paisObj,
            codCiudad:    paisObj?.ciudades?.find(c => c.value === cliente.codCiudad) ?? null,
            dirCliente:   cliente.dirCliente   ?? '',
            sitWeb:       cliente.sitWeb       ?? '',
            actPrincipal: cliente.actPrincipal ?? '',
            cliIdioma:    IDIOMA_OPTIONS.find(o => o.value === cliente.cliIdioma) ?? IDIOMA_OPTIONS[0],
          });
        }
      } catch {
        Toast.fire({ icon: 'error', title: 'Error cargando controles' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cliente]);

  // ── Actualizar ciudades al cambiar país ───────────────────────────────────
  useEffect(() => {
    if (!watchPais) { setCiudades([]); return; }
    setCiudades(watchPais.ciudades ?? []);
    if (!isEdit) setValue('codCiudad', null);
  }, [watchPais?.value]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...(isEdit && { codCliente: cliente.codCliente }),
        nomCliente:   data.nomCliente.trim(),
        tipDocumento: data.tipDocumento?.value ?? '',
        numNit:       data.numNit?.trim() ?? '',
        codPais:      data.codPais?.value ?? '',
        codCiudad:    data.codCiudad?.value ?? '',
        dirCliente:   data.dirCliente?.trim() || null,
        sitWeb:       data.sitWeb?.trim()     || null,
        actPrincipal: data.actPrincipal?.trim() || null,
        cliIdioma:    data.cliIdioma?.value ?? 'ES',
      };

      const res = isEdit
        ? await axiosClient.put(URL_EDITAR, payload)
        : await axiosClient.post(URL_REGISTRO, payload);

      Toast.fire({ icon: 'success', title: isEdit ? 'Cliente actualizado' : 'Cliente registrado' });
      onSaved?.(res.data);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  // ── Agregar país ──────────────────────────────────────────────────────────
  const handleAgregarPais = async () => {
    if (!nuevoPais.trim()) return;
    setSavingPais(true);
    try {
      const res = await axiosClient.post('/paises/registro', { nomPais: nuevoPais.trim() });
      const nuevo = { value: res.data.codPais, label: res.data.nomPais, ciudades: [] };
      setPaises(prev => [...prev, nuevo].sort((a,b) => a.label.localeCompare(b.label)));
      setValue('codPais', nuevo);
      setShowModalPais(false);
      setNuevoPais('');
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al registrar país' });
    } finally {
      setSavingPais(false);
    }
  };

  // ── Agregar ciudad ────────────────────────────────────────────────────────
  const handleAgregarCiudad = async () => {
    if (!nuevaCiudad.trim() || !watchPais) return;
    setSavingCiudad(true);
    try {
      const res = await axiosClient.post('/ciudades/registro', {
        nomCiudad: nuevaCiudad.trim(),
        codPais: watchPais.value,
      });
      const nueva = { value: res.data.codCiudad, label: res.data.nomCiudad };
      setCiudades(prev => [...prev, nueva].sort((a,b) => a.label.localeCompare(b.label)));
      setValue('codCiudad', nueva);
      setShowModalCiudad(false);
      setNuevaCiudad('');
    } catch {
      Toast.fire({ icon: 'error', title: 'Error al registrar ciudad' });
    } finally {
      setSavingCiudad(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">Cargando...</p>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Columna izquierda */}
          <div className="space-y-4">

            {/* Nombre cliente */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nomCliente', {
                  required: 'Requerido',
                  maxLength: { value: 150, message: 'Máximo 150 caracteres' },
                })}
                placeholder="Nombre completo del cliente"
                className="form-input w-full"
              />
              <FieldError error={errors.nomCliente} />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium mb-1">Dir. Oficina Central</label>
              <input
                {...register('dirCliente', {
                  maxLength: { value: 150, message: 'Máximo 150 caracteres' },
                })}
                placeholder="Ej: Av. Flores 545, Edificio Torres"
                className="form-input w-full"
              />
              <FieldError error={errors.dirCliente} />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium mb-1">
                País <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Controller
                  name="codPais"
                  control={control}
                  rules={{ required: 'Requerido' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={paises}
                      placeholder="Seleccionar país..."
                      classNamePrefix="select"
                      className="flex-1"
                      isClearable
                    />
                  )}
                />
                <button type="button" onClick={() => setShowModalPais(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                             border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-200 transition">
                  <IconPlus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              <FieldError error={errors.codPais} />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Controller
                  name="codCiudad"
                  control={control}
                  rules={{ required: 'Requerido' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={ciudades}
                      placeholder={watchPais ? 'Seleccionar ciudad...' : 'Primero selecciona un país'}
                      isDisabled={!watchPais}
                      classNamePrefix="select"
                      className="flex-1"
                      isClearable
                    />
                  )}
                />
                <button type="button" onClick={() => setShowModalCiudad(true)}
                  disabled={!watchPais}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                             border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-200
                             disabled:opacity-40 disabled:cursor-not-allowed transition">
                  <IconPlus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              <FieldError error={errors.codCiudad} />
            </div>

          </div>

          {/* Columna derecha */}
          <div className="space-y-4">

            {/* Documento */}
            <div>
              <label className="block text-sm font-medium mb-1">Num. NIT / CI</label>
              <div className="flex gap-2">
                <Controller
                  name="tipDocumento"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={docTypes}
                      placeholder="Tipo"
                      classNamePrefix="select"
                      className="w-36 shrink-0"
                      isClearable
                    />
                  )}
                />
                <input
                  {...register('numNit', { maxLength: { value: 45, message: 'Máximo 45 caracteres' } })}
                  placeholder="Número de documento"
                  className="form-input flex-1"
                />
              </div>
              <FieldError error={errors.numNit} />
            </div>

            {/* Página web */}
            <div>
              <label className="block text-sm font-medium mb-1">Página web</label>
              <input
                {...register('sitWeb', {
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                  pattern: {
                    value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i,
                    message: 'Ingresa una URL válida',
                  },
                })}
                placeholder="https://ejemplo.com"
                className="form-input w-full"
              />
              <FieldError error={errors.sitWeb} />
            </div>

            {/* Actividad principal */}
            <div>
              <label className="block text-sm font-medium mb-1">Actividad Principal</label>
              <input
                {...register('actPrincipal', {
                  maxLength: { value: 60, message: 'Máximo 60 caracteres' },
                })}
                placeholder="Ej: Comercio de repuestos automotrices"
                className="form-input w-full"
              />
              <FieldError error={errors.actPrincipal} />
            </div>

            {/* Idioma reporte */}
            <div>
              <label className="block text-sm font-medium mb-1">Mostrar reportes en</label>
              <Controller
                name="cliIdioma"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={IDIOMA_OPTIONS}
                    classNamePrefix="select"
                    className="w-full"
                  />
                )}
              />
            </div>

          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                       text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                       text-white text-sm font-medium shadow-sm hover:shadow-md
                       disabled:opacity-50 transition-all">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
          </button>
        </div>

      </form>

      {/* Modal — Agregar país */}
      <Modal showModal={showModalPais} closeModal={() => setShowModalPais(false)} title="Agregar País" size="w-full max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del país</label>
            <input
              value={nuevoPais}
              onChange={e => setNuevoPais(e.target.value)}
              placeholder="Ej: Colombia"
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModalPais(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 transition">
              Cancelar
            </button>
            <button type="button" onClick={handleAgregarPais} disabled={savingPais}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 transition">
              {savingPais ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Agregar ciudad */}
      <Modal showModal={showModalCiudad} closeModal={() => setShowModalCiudad(false)} title="Agregar Ciudad" size="w-full max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la ciudad</label>
            <input
              value={nuevaCiudad}
              onChange={e => setNuevaCiudad(e.target.value)}
              placeholder="Ej: Cochabamba"
              className="form-input w-full"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowModalCiudad(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 transition">
              Cancelar
            </button>
            <button type="button" onClick={handleAgregarCiudad} disabled={savingCiudad}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 transition">
              {savingCiudad ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default CustomerForm;