'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Swal from 'sweetalert2';
import Select from 'react-select';

const URL_PAISES   = '/clientes/paises';
const URL_CIUDADES = (codPais) => `/clientes/ciudades?codPais=${codPais}`;
const URL_GUARDAR  = '/proveedores/guardar';

const IDIOMA_OPTIONS = [
  { value: 'ES', label: 'Español' },
  { value: 'US', label: 'Inglés'  },
];

const SupplierForm = ({
  proveedor = null,
  controles = { paises: [], docTypes: [] },
  onCancel  = () => {},
  onSaved   = () => {},
}) => {
  const t      = useTranslation();
  const isEdit = !!proveedor?.codPrv;

  const [paises,          setPaises]          = useState([]);
  const [ciudades,        setCiudades]        = useState([]);
  const [loadingPaises,   setLoadingPaises]   = useState(true);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  const {
    register, reset, control, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nomPrv:              '',
      razSoc:              '',
      dirPrv:              '',
      sitWeb:              '',
      nomChe:              '',
      country:             null,
      city:                null,
      tipDoc:              null,
      numDoc:              '',
      diasProceso:         0,
      diasShipingExpress:  0,
      diasShipingStandard: 0,
      blnStock:            false,
      blnExpress:          false,
      prvIdioma:           IDIOMA_OPTIONS[0],
    },
  });

  const selectedCountry = watch('country');

  useEffect(() => {
    axiosClient.get(URL_PAISES)
      .then(res => setPaises(res.data ?? []))
      .catch(() => setPaises([]))
      .finally(() => setLoadingPaises(false));
  }, []);

  useEffect(() => {
    if (loadingPaises) return;

    if (!proveedor) {
      reset({
        nomPrv: '', razSoc: '', dirPrv: '', sitWeb: '', nomChe: '',
        country: null, city: null, tipDoc: null, numDoc: '',
        diasProceso: 0, diasShipingExpress: 0, diasShipingStandard: 0,
        blnStock: false, blnExpress: false, prvIdioma: IDIOMA_OPTIONS[0],
      });
      setCiudades([]);
      return;
    }

    const paisObj    = paises.find(p => p.value?.toUpperCase() === proveedor.codPais?.toUpperCase()) ?? null;
    const tipDocObj  = controles.docTypes?.find(d => d.value === proveedor.tipDoc) ?? null;
    const idiomaObj  = IDIOMA_OPTIONS.find(i => i.value === proveedor.prvIdioma) ?? IDIOMA_OPTIONS[0];

    reset({
      nomPrv:              proveedor.nomPrv              ?? '',
      razSoc:              proveedor.razSoc              ?? '',
      dirPrv:              proveedor.dirPrv              ?? '',
      sitWeb:              proveedor.sitWeb              ?? '',
      nomChe:              proveedor.nomChe              ?? '',
      country:             paisObj,
      city:                null,
      tipDoc:              tipDocObj,
      numDoc:              proveedor.numDoc              ?? '',
      diasProceso:         proveedor.diasProceso         ?? 0,
      diasShipingExpress:  proveedor.diasShipingExpress  ?? 0,
      diasShipingStandard: proveedor.diasShipingStandard ?? 0,
      blnStock:            proveedor.blnStock            ?? false,
      blnExpress:          proveedor.blnExpress          ?? false,
      prvIdioma:           idiomaObj,
    });

    if (proveedor.codPais) {
      cargarCiudades(proveedor.codPais, proveedor.codCiudad ?? null);
    }
  }, [proveedor, loadingPaises]);

  const cargarCiudades = async (codPais, preselectCodCiudad = null) => {
    setLoadingCiudades(true);
    setCiudades([]);
    setValue('city', null);
    try {
      const res   = await axiosClient.get(URL_CIUDADES(codPais));
      const lista = res.data ?? [];
      setCiudades(lista);
      if (preselectCodCiudad && lista.length > 0) {
        const ciudadObj = lista.find(
          c => c.value?.toUpperCase() === preselectCodCiudad.toString().toUpperCase()
        ) ?? null;
        if (ciudadObj) setValue('city', ciudadObj, { shouldValidate: false });
      }
    } catch {
      setCiudades([]);
    } finally {
      setLoadingCiudades(false);
    }
  };

  const handleCountryChange = (selected) => {
    if (selected?.value) {
      cargarCiudades(selected.value, null);
    } else {
      setCiudades([]);
      setValue('city', null);
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      codPrv:              proveedor?.codPrv        ?? 0,
      nomPrv:              data.nomPrv.trim(),
      razSoc:              data.razSoc?.trim()              ?? '',
      dirPrv:              data.dirPrv?.trim()              ?? '',
      sitWeb:              data.sitWeb?.trim()              ?? '',
      nomChe:              data.nomChe?.trim()              ?? '',
      codPais:             data.country?.value              ?? '',
      codCiudad:           data.city?.value                 ?? '',
      tipDoc:              data.tipDoc?.value                ?? '',
      numDoc:              data.numDoc?.trim()              ?? '',
      diasProceso:         Number(data.diasProceso)         || 0,
      diasShipingExpress:  Number(data.diasShipingExpress)  || 0,
      diasShipingStandard: Number(data.diasShipingStandard) || 0,
      blnStock:            data.blnStock                    ?? false,
      blnExpress:          data.blnExpress                  ?? false,
      prvIdioma:           data.prvIdioma?.value            ?? 'ES',
    };

    try {
      const res = await axiosClient.post(URL_GUARDAR, payload);
      Swal.fire({
        title: t.success, icon: 'success',
        confirmButtonColor: '#15803d',
        text: isEdit ? t.supplier_update_save : t.supplier_success_save,
        confirmButtonText: t.close,
      }).then(() => onSaved(res.data ?? []));
    } catch (err) {
      const status  = err?.response?.status;
      const apiData = err?.response?.data ?? {};
      if (status === 400) {
        if (apiData.errors && typeof apiData.errors === 'object') {
          const msgs = Object.values(apiData.errors).flat().join('\n');
          Swal.fire({ title: t.warning, text: msgs, icon: 'warning', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        } else {
          const msg = apiData.message ?? apiData.mensaje ?? t.save_data_error;
          Swal.fire({ title: t.warning, text: msg, icon: 'warning', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        }
      } else {
        Swal.fire({ title: t.error, text: t.supplier_error_server, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1" noValidate>

      {/* País + Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.country}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <SelectCountry
            t={t}
            options={paises}
            control={control}
            errors={errors}
            setValue={setValue}
            current={proveedor?.codPais ?? ''}
            isLoading={loadingPaises}
            onChange={handleCountryChange}
            instanceId="select-country-supplier"
            onCountryAdded={({ paises: nuevaLista }) => setPaises(nuevaLista)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.city}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <SelectCity
            t={t}
            cities={ciudades}
            control={control}
            errors={errors}
            isLoading={loadingCiudades}
            options_countries={paises}
            instanceId="select-city-supplier"
            selectedCountry={selectedCountry}
            setValue={setValue}
            onCityAdded={({ ciudades: nuevaLista }) => setCiudades(nuevaLista)}
          />
        </div>
      </div>

      {/* Empresa (nomPrv) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.company}<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text" autoComplete="off"
          {...register('nomPrv', { required: { value: true, message: t.required_field } })}
          className={`form-input w-full ${errors.nomPrv ? 'error' : ''}`}
        />
        {errors.nomPrv && <p className="text-red-400 text-xs mt-1">{errors.nomPrv.message}</p>}
      </div>

      {/* Proveedor (razSoc) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.supplier}
        </label>
        <input
          type="text" autoComplete="off"
          {...register('razSoc')}
          className="form-input w-full"
        />
      </div>

      {/* Dirección */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.address}
        </label>
        <input
          type="text" autoComplete="off"
          {...register('dirPrv')}
          className="form-input w-full"
        />
      </div>

      {/* Doc. Type + Num Doc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.doc_type}
          </label>
          <Controller
            name="tipDoc"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={controles.docTypes ?? []}
                isClearable
                placeholder={t.select_option}
                instanceId="select-doctype-supplier"
                classNamePrefix="react-select"
              />
            )}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.nro_nit}
          </label>
          <input
            type="text" autoComplete="off"
            {...register('numDoc')}
            className="form-input w-full"
          />
        </div>
      </div>

      {/* Website + Name check */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.website}
          </label>
          <input
            type="text" autoComplete="off" placeholder="https://..."
            {...register('sitWeb')}
            className="form-input w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name check
          </label>
          <input
            type="text" autoComplete="off"
            {...register('nomChe')}
            className="form-input w-full"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      {/* Días */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.days_of_process}
          </label>
          <input type="number" min="0" {...register('diasProceso')} className="form-input w-full" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Shipping Express Days
          </label>
          <input type="number" min="0" {...register('diasShipingExpress')} className="form-input w-full" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Shipping Standard Days
          </label>
          <input type="number" min="0" {...register('diasShipingStandard')} className="form-input w-full" />
        </div>
      </div>

      {/* Checkboxes + Idioma */}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" {...register('blnStock')} className="form-checkbox" />
          {t.consider_stock}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" {...register('blnExpress')} className="form-checkbox" />
          No Express
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.show_reports_in}
          </label>
          <div className="w-40">
            <Controller
              name="prvIdioma"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={IDIOMA_OPTIONS}
                  isClearable={false}
                  instanceId="select-idioma-supplier"
                  classNamePrefix="react-select"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed">
          {t.btn_cancel}
        </button>
        <button type="submit" disabled={isSubmitting}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.saving_data}
            </span>
          ) : isEdit ? t.btn_update : t.btn_save}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;