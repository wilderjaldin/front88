// app/admin/register/customers/form/shipping.js
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';
import Swal from 'sweetalert2';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_PAISES   = `/clientes/paises`;
const URL_CIUDADES = (codPais) => `/clientes/ciudades?codPais=${codPais}`;

// ─────────────────────────────────────────────────────────────────────────────
const ShippingForm = ({
  dir        = null,
  cliente    = {},
  isNew      = true,
  urlGuardar = '',
  onCancel   = () => {},
  onSaved    = () => {},
}) => {
  const t = useTranslation();

  const [paises,          setPaises]          = useState([]);
  const [ciudades,        setCiudades]        = useState([]);
  const [loadingPaises,   setLoadingPaises]   = useState(true);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [isUsa,           setIsUsa]           = useState(false);

  const {
    register, reset, control, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      company: '', contact: '', phone: '', email: '',
      country: null, address: '', city: null, state: '', zip: '',
    },
  });

  // País actualmente seleccionado en el form — se pasa a SelectCity → CityForm
  const selectedCountry = watch('country');

  // ── 1. Cargar países permitidos del usuario ───────────────────────────────
  useEffect(() => {
    axiosClient.get(URL_PAISES)
      .then(res => setPaises(res.data ?? []))
      .catch(() => setPaises([]))
      .finally(() => setLoadingPaises(false));
  }, []);

  // ── 2. Precarga al editar — espera a que países estén listos ──────────────
  useEffect(() => {
    if (loadingPaises) return;

    if (!dir) {
      reset({ company: '', contact: '', phone: '', email: '', country: null, address: '', city: null, state: '', zip: '' });
      setCiudades([]);
      setIsUsa(false);
      return;
    }

    const paisObj = paises.find(p => p.value?.toUpperCase() === dir.codPais?.toUpperCase()) ?? null;

    setIsUsa(dir.codPais?.toUpperCase() === 'US');

    reset({
      company: dir.nomEmpresa   ?? '',
      contact: dir.nomContacto  ?? '',
      phone:   dir.numTelefono  ?? '',
      email:   dir.mail         ?? '',
      country: paisObj,
      address: dir.desDireccion ?? '',
      city:    null,
      state:   dir.nomEstado    ?? '',
      zip:     dir.codPostal    ?? '',
    });

    // Cargar ciudades y preseleccionar por nomCiudad (label)
    if (dir.codPais) {
      cargarCiudades(dir.codPais, dir.nomCiudad ?? null);
    }
  }, [dir, loadingPaises]);

  // ── Cargar ciudades — busca por label (nomCiudad) para preseleccionar ──────
  // La tabla no guarda codCiudad, solo nomCiudad, por lo que la búsqueda
  // se hace comparando c.label con el nombre de ciudad guardado.
  const cargarCiudades = async (codPais, preselectNomCiudad = null) => {
    setLoadingCiudades(true);
    setCiudades([]);
    setValue('city', null);
    try {
      const res    = await axiosClient.get(URL_CIUDADES(codPais));
      const lista  = res.data ?? [];
      setCiudades(lista);

      // Preselección por label (nombre), NO por value (código)
      if (preselectNomCiudad && lista.length > 0) {
        const ciudadObj = lista.find(
          c => c.label?.toUpperCase() === preselectNomCiudad.toString().toUpperCase()
        ) ?? null;
        if (ciudadObj) {
          setValue('city', ciudadObj, { shouldValidate: false });
        }
      }
    } catch {
      setCiudades([]);
    } finally {
      setLoadingCiudades(false);
    }
  };

  // ── Al cambiar país manualmente ───────────────────────────────────────────
  const handleCountryChange = (selected) => {
    setIsUsa(selected?.value?.toUpperCase() === 'US');
    setValue('state', '');
    setValue('zip', '');
    if (selected?.value) {
      // Sin preselección al cambiar manualmente
      cargarCiudades(selected.value, null);
    } else {
      setCiudades([]);
      setValue('city', null);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = {
      codRegistro:  dir?.codRegistro  ?? 0,
      codPais:      data.country?.value  ?? '',
      nomCiudad:    data.city?.label     ?? '',
      desDireccion: data.address.trim(),
      nomEmpresa:   data.company.trim(),
      nomContacto:  data.contact.trim(),
      numTelefono:  data.phone?.trim()   ?? '',
      mail:         data.email?.trim()   ?? '',
      nomEstado:    data.state?.trim()   ?? '',
      codPostal:    data.zip?.trim()     ?? '',
    };

    try {
      const res = await axiosClient.post(urlGuardar, payload);
      Swal.fire({
        title: t.success, icon: 'success',
        confirmButtonColor: '#15803d',
        text: isNew ? t.shipping_address_success_save : t.record_updated,
        confirmButtonText: t.close,
      }).then(() => { onSaved(res.data ?? []); onCancel(); });
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (err?.response?.status === 400 && apiErrors) {
        const msgs = Object.values(apiErrors).flat().join('\n');
        Swal.fire({ title: t.error, text: msgs, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
        return;
      }
      Swal.fire({ title: t.error, text: t.shipping_address_error_server, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1" noValidate>

      {/* Empresa */}
      <div className="flex items-start gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.company}
        </label>
        <div className="flex-1">
          <input type="text" autoComplete="off"
            {...register('company', { required: t.required_field })}
            className={`form-input w-full ${errors.company ? 'error' : ''}`} />
          {errors.company && <span className="text-red-400 text-xs mt-1 block">{errors.company.message}</span>}
        </div>
      </div>

      {/* Contacto */}
      <div className="flex items-start gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.contact}
        </label>
        <div className="flex-1">
          <input type="text" autoComplete="off"
            {...register('contact', { required: t.required_field })}
            className={`form-input w-full ${errors.contact ? 'error' : ''}`} />
          {errors.contact && <span className="text-red-400 text-xs mt-1 block">{errors.contact.message}</span>}
        </div>
      </div>

      {/* Teléfono */}
      <div className="flex items-center gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2">{t.phone}</label>
        <input type="text" autoComplete="off" {...register('phone')} className="form-input flex-1" />
      </div>

      {/* Correo */}
      <div className="flex items-center gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2">{t.email}</label>
        <input type="text" autoComplete="off" {...register('email')} className="form-input flex-1" />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700" />

      {/* País */}
      <div className="flex items-start gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.country}
        </label>
        <div className="flex-1">
          <SelectCountry
            t={t}
            options={paises}
            control={control}
            errors={errors}
            setValue={setValue}
            current={dir?.codPais ?? ''}
            isLoading={loadingPaises}
            onChange={handleCountryChange}
            instanceId="select-country-shipping"
            onCountryAdded={({ paises: nuevaLista }) => setPaises(nuevaLista)}
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="flex items-start gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.address}
        </label>
        <div className="flex-1">
          <input type="text" autoComplete="off"
            {...register('address', { required: t.required_field })}
            className={`form-input w-full ${errors.address ? 'error' : ''}`} />
          {errors.address && <span className="text-red-400 text-xs mt-1 block">{errors.address.message}</span>}
        </div>
      </div>

      {/* Ciudad */}
      <div className="flex items-start gap-2">
        <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2 mt-2 required">
          {t.city}
        </label>
        <div className="flex-1">
          <SelectCity
            t={t}
            cities={ciudades}
            control={control}
            errors={errors}
            isLoading={loadingCiudades}
            options_countries={paises}
            instanceId="select-city-shipping"
            selectedCountry={selectedCountry}
            setValue={setValue}
            onCityAdded={({ ciudades: nuevaLista }) => setCiudades(nuevaLista)}
          />
        </div>
      </div>

      {/* Estado + Cod. Postal — solo US */}
      {isUsa && (
        <div className="flex items-center gap-2">
          <label className="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400 text-right pr-2">{t.state}</label>
          <input type="text" autoComplete="off" {...register('state')} placeholder="Ej: California" className="form-input flex-1" />
          <label className="shrink-0 text-sm text-gray-500 dark:text-gray-400 px-2">{t.zip}</label>
          <input type="text" autoComplete="off" {...register('zip')} placeholder="Ej: 90210" className="form-input w-32" />
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.btn_cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : isNew ? t.btn_register_shipping_address : t.btn_update_shipping_address}
        </button>
      </div>
    </form>
  );
};

export default ShippingForm;