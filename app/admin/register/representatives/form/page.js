'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import IconSave from '@/components/icon/icon-save';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import axiosClient from '@/app/lib/axiosClient';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Select from 'react-select';
import Swal from 'sweetalert2';

const URL_CIUDADES  = (codPais) => `/representantes/ciudades/${codPais}`;
const URL_CONTROLES = '/representantes/controles';
const URL_DETAIL    = '/representantes/detalle';
const URL_SAVE      = '/representantes/registrar';
const URL_EDIT      = '/representantes/editar';
const URL_LIST      = '/admin/register/representatives';

// ─────────────────────────────────────────────────────────────────────────────
// Acepta props opcionales para uso como componente embebido (modal):
//   representante — datos pre-cargados (modo edición)
//   controles     — controles pre-cargados
//   onCancel      — callback al cancelar
//   onSaved       — callback al guardar exitosamente; si está presente = modo componente
// ─────────────────────────────────────────────────────────────────────────────
export default function RepresentanteFormPage({
  representante: repProp   = null,
  controles:     ctrlProp  = null,
  onCancel:      onCancelProp = null,
  onSaved:       onSavedProp  = null,
}) {
  const isEmbedded = !!onSavedProp;

  const t      = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  const id     = isEmbedded ? String(repProp?.codEmp ?? '') : (params.get('id') ?? '');
  const isEdit = !!id;

  useDynamicTitle(isEmbedded ? '' : (isEdit ? 'Editar Representante' : 'Registrar Representante'));

  const [paises,          setPaises]          = useState([]);
  const [monedas,         setMonedas]         = useState([]);
  const [ciudades,        setCiudades]        = useState([]);
  const [loadingPaises,   setLoadingPaises]   = useState(true);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [loadingInit,     setLoadingInit]     = useState(true);
  const [codPaisActual,   setCodPaisActual]   = useState('');

  const {
    register, control, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      razSoc: '', nitEmp: '', docFactura: '',
      country: null, city: null, estadoEmp: '', codZipEmp: '',
      dirEmp: '', nomContacto: '', telEmp: '', corEle: '',
      numCelWp: '', dirWeb: '', tipMoneda: null, porFee: '',
      blnIvaEnPrecio: false, blnEsRepresentante: false, nomDestinoEntrega: '',
      parSFac: '', parPor: '', parImp: '',
    },
  });

  const selectedCountry = watch('country');
  const isUS = selectedCountry?.value === 'US';

  const populateForm = (ctrl, repres) => {
    const listaP = ctrl.paises  ?? [];
    const listaM = ctrl.monedas ?? [];
    setPaises(listaP); setMonedas(listaM);
    setLoadingPaises(false);

    if (repres) {
      const paisObj   = listaP.find(p => p.value?.toUpperCase() === repres.codPais?.toUpperCase())         ?? null;
      const monedaObj = listaM.find(m => m.value?.trim() === repres.tipMoneda?.trim())                     ?? null;

      setCodPaisActual(repres.codPais ?? '');
      reset({
        razSoc:             repres.razSoc             ?? '',
        nitEmp:             repres.nitEmp             ?? '',
        docFactura:         repres.docFactura          ?? '',
        country:            paisObj,
        city:               null,
        estadoEmp:          repres.estadoEmp           ?? '',
        codZipEmp:          repres.codZipEmp           ?? '',
        dirEmp:             repres.dirEmp              ?? '',
        nomContacto:        repres.nomContacto         ?? '',
        telEmp:             repres.telEmp              ?? '',
        corEle:             repres.corEle              ?? '',
        numCelWp:           repres.numCelWp            ?? '',
        dirWeb:             repres.dirWeb              ?? '',
        tipMoneda:          monedaObj,
        porFee:             repres.porFee != null ? Number(repres.porFee).toFixed(2) : '',
        blnIvaEnPrecio:     repres.blnIvaEnPrecio      ?? false,
        blnEsRepresentante: repres.blnEsRepresentante  ?? false,
        nomDestinoEntrega:  repres.nomDestinoEntrega   ?? '',
        parSFac:            repres.parSFac != null ? Number(repres.parSFac).toFixed(2) : '',
        parPor:             repres.parPor  != null ? Number(repres.parPor).toFixed(2)  : '',
        parImp:             repres.parImp  != null ? Number(repres.parImp).toFixed(2)  : '',
      });
      if (repres.codPais) cargarCiudades(repres.codPais, repres.codCiudad ?? null);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (isEmbedded) {
          populateForm(ctrlProp ?? {}, repProp);
        } else {
          const [ctrlRes, detailRes] = await Promise.all([
            axiosClient.get(URL_CONTROLES),
            isEdit ? axiosClient.get(`${URL_DETAIL}/${id}`) : Promise.resolve(null),
          ]);
          populateForm(ctrlRes.data ?? {}, detailRes?.data ?? null);
        }
      } catch {
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  const cargarCiudades = async (codPais, preselectCodCiudad = null) => {
    setLoadingCiudades(true);
    setCiudades([]);
    setValue('city', null);
    try {
      const res   = await axiosClient.get(URL_CIUDADES(codPais));
      const lista = res.data ?? [];
      setCiudades(lista);
      if (preselectCodCiudad && lista.length > 0) {
        const obj = lista.find(c => c.value?.toUpperCase() === preselectCodCiudad.toString().toUpperCase()) ?? null;
        if (obj) setValue('city', obj, { shouldValidate: false });
      }
    } catch {
      setCiudades([]);
    } finally {
      setLoadingCiudades(false);
    }
  };

  const handleCountryChange = (selected) => {
    if (selected?.value) cargarCiudades(selected.value, null);
    else { setCiudades([]); setValue('city', null); }
  };

  const onSubmit = async (data) => {
    const payload = {
      ...(isEdit ? { codEmp: Number(id) } : {}),
      razSoc:             data.razSoc,
      nitEmp:             data.nitEmp,
      docFactura:         data.docFactura           || null,
      codPais:            data.country?.value       ?? '',
      codCiudad:          data.city?.value          ?? '',
      estadoEmp:          data.estadoEmp            || '',
      codZipEmp:          data.codZipEmp            || null,
      dirEmp:             data.dirEmp,
      nomContacto:        data.nomContacto          || null,
      telEmp:             data.telEmp               || null,
      corEle:             data.corEle               || null,
      numCelWp:           data.numCelWp             || null,
      dirWeb:             data.dirWeb               || null,
      tipMoneda:          data.tipMoneda?.value     ?? 'RF',
      porFee:             data.porFee !== '' ? Number(data.porFee) : 0,
      blnIvaEnPrecio:     data.blnIvaEnPrecio,
      blnEsRepresentante: data.blnEsRepresentante,
      nomDestinoEntrega:  data.nomDestinoEntrega    || null,
      parSFac:            data.parSFac !== '' ? Number(data.parSFac) : 0,
      parPor:             data.parPor  !== '' ? Number(data.parPor)  : 0,
      parImp:             data.parImp  !== '' ? Number(data.parImp)  : 0,
    };

    try {
      await (isEdit
        ? axiosClient.put(URL_EDIT, payload)
        : axiosClient.post(URL_SAVE, payload));

      if (isEmbedded) {
        onSavedProp();
        return;
      }

      await Swal.fire({
        title: t.success, icon: 'success', confirmButtonColor: '#15803d',
        text: isEdit ? 'Representante actualizado correctamente' : 'Representante registrado correctamente',
        confirmButtonText: t.close,
      });
      router.push(URL_LIST);
    } catch (err) {
      const status  = err?.response?.status;
      const apiData = err?.response?.data ?? {};
      if (status === 400) {
        const msgs = apiData.errors
          ? Object.values(apiData.errors).flat().join('\n')
          : (apiData.message ?? apiData.mensaje ?? t.save_data_error);
        Swal.fire({ title: t.warning, text: msgs, icon: 'warning',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      } else {
        Swal.fire({ title: t.error, text: t.save_data_error, icon: 'error',
          confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    }
  };

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Campos del formulario (compartidos entre modos) ───────────────────────
  const formFields = (
    <div className="p-6 space-y-6">

      {/* Identificación */}
      <div className="space-y-4">
        <F label="Razón Social" required error={errors.razSoc}>
          <input
            {...register('razSoc', {
              required:  t.required_field,
              maxLength: { value: 200, message: 'Máximo 200 caracteres' },
            })}
            placeholder="Nombre completo o razón social"
            className="form-input w-full"
          />
        </F>

        <div className="grid grid-cols-3 gap-3">
          <F label="Doc." error={errors.docFactura}>
            <input
              {...register('docFactura', { maxLength: { value: 4, message: 'Máx. 4' } })}
              className="form-input w-full uppercase" placeholder="NIT"
            />
          </F>
          <div className="col-span-2">
            <F label="NIT / Identificación" required error={errors.nitEmp}>
              <input
                {...register('nitEmp', {
                  required:  t.required_field,
                  maxLength: { value: 15, message: 'Máximo 15 caracteres' },
                })}
                className="form-input w-full"
              />
            </F>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <Section label="Ubicación" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              País<span className="text-red-500 ml-0.5">*</span>
            </label>
            <SelectCountry
              t={t} options={paises} control={control} errors={errors}
              setValue={setValue} current={codPaisActual} isLoading={loadingPaises}
              onChange={handleCountryChange} instanceId="select-pais-rep"
              onCountryAdded={({ paises: nueva }) => setPaises(nueva)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Ciudad<span className="text-red-500 ml-0.5">*</span>
            </label>
            <SelectCity
              t={t} cities={ciudades} control={control} errors={errors}
              setValue={setValue} isLoading={loadingCiudades}
              instanceId="select-ciudad-rep" selectedCountry={selectedCountry}
              onCityAdded={({ ciudades: nueva }) => setCiudades(nueva)}
            />
          </div>
        </div>
        {isUS && (
          <div className="grid grid-cols-2 gap-4">
            <F label="Estado / Provincia" error={errors.estadoEmp}>
              <input {...register('estadoEmp', { maxLength: { value: 45, message: 'Máximo 45 caracteres' } })}
                className="form-input w-full" placeholder="CA, TX, NY…" />
            </F>
            <F label="Código ZIP" error={errors.codZipEmp}>
              <input {...register('codZipEmp', { maxLength: { value: 15, message: 'Máximo 15 caracteres' } })}
                className="form-input w-full" />
            </F>
          </div>
        )}
        <F label="Dirección" required error={errors.dirEmp}>
          <input
            {...register('dirEmp', {
              required:  t.required_field,
              maxLength: { value: 125, message: 'Máximo 125 caracteres' },
            })}
            className="form-input w-full"
          />
        </F>
      </div>

      {/* Contacto */}
      <Section label="Contacto" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <F label="Nombre de Contacto" error={errors.nomContacto}>
            <input {...register('nomContacto', { maxLength: { value: 80, message: 'Máximo 80 caracteres' } })}
              className="form-input w-full" />
          </F>
          <F label="Teléfono" error={errors.telEmp}>
            <input {...register('telEmp', { maxLength: { value: 60, message: 'Máximo 60 caracteres' } })}
              className="form-input w-full" />
          </F>
        </div>
        <div className="grid grid-cols-2 gap-4 items-end">
          <F label="Email" error={errors.corEle}>
            <input type="email"
              {...register('corEle', {
                maxLength: { value: 45, message: 'Máximo 45 caracteres' },
                pattern:   { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
              })}
              className="form-input w-full" />
          </F>
          <F label="WhatsApp" error={errors.numCelWp}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
              <input {...register('numCelWp', { maxLength: { value: 45, message: 'Máximo 45 caracteres' } })}
                className="form-input w-full pl-9" />
            </div>
          </F>
        </div>
      </div>

      {/* Comercial */}
      <Section label="Comercial" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 items-end">
          <F label="Moneda" error={errors.tipMoneda}>
            <Controller name="tipMoneda" control={control}
              render={({ field }) => (
                <Select {...field} options={monedas} isClearable
                  placeholder={t.select_option}
                  instanceId="select-moneda-rep" classNamePrefix="react-select"
                />
              )}
            />
          </F>
          <F label="% Fee" error={errors.porFee}>
            <input type="number" step="0.01" min="0" max="100"
              {...register('porFee', {
                min: { value: 0,   message: 'Mínimo 0' },
                max: { value: 100, message: 'Máximo 100' },
              })}
              className="form-input w-full" placeholder="0.00" />
          </F>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Destino de Entrega" error={errors.nomDestinoEntrega}>
            <input {...register('nomDestinoEntrega', { maxLength: { value: 100, message: 'Máximo 100 caracteres' } })}
              className="form-input w-full" />
          </F>
          <F label="Sitio Web" error={errors.dirWeb}>
            <input {...register('dirWeb', { maxLength: { value: 60, message: 'Máximo 60 caracteres' } })}
              className="form-input w-full" placeholder="https://..." />
          </F>
        </div>
      </div>

      {/* Parámetros */}
      <Section label="Parámetros" />
      <div className="grid grid-cols-3 gap-4">
        <F label="Sin Factura" error={errors.parSFac}>
          <input type="number" step="0.01" min="0"
            {...register('parSFac', { min: { value: 0, message: 'Mínimo 0' } })}
            className="form-input w-full" placeholder="0.00" />
        </F>
        <F label="Facturado" error={errors.parPor}>
          <input type="number" step="0.01" min="0"
            {...register('parPor', { min: { value: 0, message: 'Mínimo 0' } })}
            className="form-input w-full" placeholder="0.00" />
        </F>
        <F label="Importación" error={errors.parImp}>
          <input type="number" step="0.01" min="0"
            {...register('parImp', { min: { value: 0, message: 'Mínimo 0' } })}
            className="form-input w-full" placeholder="0.00" />
        </F>
      </div>

      {/* Opciones */}
      <Section label="Opciones" />
      <div className="flex items-center justify-between">

        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <input type="checkbox" id="blnIvaEnPrecio" {...register('blnIvaEnPrecio')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition">
            Incluir IVA en precio
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition">
            Es Representante
          </span>
          <input type="checkbox" id="blnEsRepresentante" {...register('blnEsRepresentante')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        </label>

      </div>

    </div>
  );

  // ── Modo componente (embebido en modal) ───────────────────────────────────
  if (isEmbedded) {
    return (
      <>
        {formFields}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onCancelProp}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {t.btn_cancel}
          </button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving_data}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {t.btn_update}
              </>
            )}
          </button>
        </div>
      </>
    );
  }

  // ── Modo página standalone ────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <li>{t.register}</li>
        <li className="before:content-['/'] before:mx-2">
          <button type="button" onClick={() => router.push(URL_LIST)}
            className="hover:text-primary transition-colors">
            Representantes
          </button>
        </li>
        <li className="before:content-['/'] before:mx-2">{isEdit ? 'Editar' : 'Registrar'}</li>
      </ul>

      {/* Card */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[0_4px_24px_rgba(0,0,0,0.07)] dark:shadow-gray-900/50 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <div>
            <h1 className="text-base font-semibold text-gray-800 dark:text-white">
              {isEdit ? 'Editar Representante' : 'Registrar Representante'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Modifica los datos del representante' : 'Completa los datos para registrar un nuevo representante'}
            </p>
          </div>
          <button type="button" onClick={() => router.push(URL_LIST)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>

        {formFields}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <button type="button" onClick={() => router.push(URL_LIST)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {t.btn_cancel}
          </button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving_data}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {isEdit ? t.btn_update : t.btn_save}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

function F({ label, required, error, children }) {
  return (
    <div className="w-full min-w-0 space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

// Checkbox removed — checkboxes are now rendered inline in the Opciones section
