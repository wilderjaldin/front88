'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from '@/components/ui/Select';
import IconSave from '@/components/icon/icon-save';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useTranslation } from '@/app/locales';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';

// Casilla como "chip" clickeable — mismo patrón que los checkboxes del form de repuestos.
// El <label> envuelve el <input>, así que un click en cualquier parte ya lo togglea
// de forma nativa — no hace falta (ni conviene) un onClick propio encima.
const ToggleChip = ({ checked, label, disabled, register }) => (
  <label
    style={{ height: 42, boxSizing: 'border-box' }}
    className={`flex items-center gap-2 rounded-lg border px-3 select-none transition-all m-0
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${checked
        ? 'border-primary bg-primary/5'
        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 hover:border-primary/60'}`}
  >
    <input type="checkbox" disabled={disabled} {...register} className="h-10 w-4 m-0 rounded border-gray-300 accent-primary cursor-pointer disabled:cursor-not-allowed" />
    <span className="text-sm font-medium">{label}</span>
  </label>
);

// Mapea el nombre de campo que devuelve la API (PascalCase, según el DTO del
// backend) al nombre del campo en el formulario — así el error 400 de
// validación se puede mostrar directo bajo el campo correspondiente, además
// del mensaje general.
const API_FIELD_MAP = {
  nomcliente:   'nomCliente',
  tipdocumento: 'tipDocumento',
  numnit:       'numNit',
  codpais:      'country',
  codciudad:    'city',
  dircliente:   'dirCliente',
  sitweb:       'sitWeb',
  actprincipal: 'actPrincipal',
  estado:       'estado',
  zip:          'zip',
  poriva:       'pctIva',
};

const URL_CONTROLES  = '/clientes/controles';
const URL_CIUDADES   = '/ciudades';          // GET /ciudades?codPais=XX
const URL_REGISTRO   = '/clientes/registro';
const URL_EDITAR     = '/clientes/editar';

// labelKey → clave de traducción, resuelta con `t` dentro del componente.
const IDIOMA_OPTIONS_BASE = [
  { value: 'ES', labelKey: 'spanish' },
  { value: 'US', labelKey: 'english' },
];

// Países que además de US muestran los campos Estado/ZIP (codPais 33)
const isEstadoZipCountry = (value) => value === 'US' || value === 33 || value === '33';


const FieldError = ({ error }) =>
  error ? <p className="text-xs text-red-500 mt-1">{error.message}</p> : null;

// ─────────────────────────────────────────────────────────────────────────────
const CustomerForm = ({ cliente = null, onCancel, onSaved }) => {
  const t      = useTranslation();
  const isEdit = !!cliente;
  const skipIdiomaRef = useRef(isEdit);

  const IDIOMA_OPTIONS = IDIOMA_OPTIONS_BASE.map(o => ({ value: o.value, label: t[o.labelKey] }));
  const IDIOMA_ES = IDIOMA_OPTIONS[0]; // Español
  const IDIOMA_EN = IDIOMA_OPTIONS[1]; // Inglés

  const [saving, setSaving]         = useState(false);
  const [paises, setPaises]         = useState([]);
  const [ciudades, setCiudades]     = useState([]);
  const [docTypes, setDocTypes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);


  const {
    register, handleSubmit, control, reset, watch, setValue, setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nomCliente:    '',
      tipDocumento:  null,
      numNit:        '',
      country:       null,
      city:          null,
      dirCliente:    '',
      sitWeb:        '',
      actPrincipal:  '',
      cliIdioma:     IDIOMA_ES,
      // US-only
      estado:        '',
      zip:           '',
      // IVA
      pctIva:        0,
      noConsiderarIva: false,
      // Revendedor
      esRevendedor:  false,
    },
  });

  const watchPais         = watch('country');
  const watchNoIva        = watch('noConsiderarIva');
  const watchTipDoc       = watch('tipDocumento');
  const isUS              = isEstadoZipCountry(watchPais?.value);

  // ── Carga controles ───────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res         = await axiosClient.get(URL_CONTROLES);
        const newPaises   = res.data.paises   ?? [];
        const newDocTypes = res.data.docTypes ?? [];
        setPaises(newPaises);
        setDocTypes(newDocTypes);

        // Si solo hay un país disponible y es formulario nuevo, pre-seleccionarlo
        if (!isEdit && newPaises.length === 1) {
          setValue('country', newPaises[0]);
        }

        if (isEdit && cliente) {
          const paisObj = newPaises.find(p => p.value === cliente.codPais) ?? null;

          // Cargar ciudades desde API si hay país
          let ciudadesInit = [];
          if (paisObj) {
            try {
              const cr = await axiosClient.get(URL_CIUDADES, { params: { codPais: paisObj.value } });
              ciudadesInit = cr.data ?? [];
            } catch { /* silencioso */ }
          }
          setCiudades(ciudadesInit);

          reset({
            nomCliente:    cliente.nomCliente   ?? '',
            tipDocumento:  newDocTypes.find(d => d.value === cliente.tipDocumento) ?? null,
            numNit:        cliente.numNit        ?? '',
            country:       paisObj,
            city:          ciudadesInit.find(c => c.value === cliente.codCiudad) ?? null,
            dirCliente:    cliente.dirCliente    ?? '',
            sitWeb:        cliente.sitWeb        ?? '',
            actPrincipal:  cliente.actPrincipal  ?? '',
            cliIdioma:     IDIOMA_OPTIONS.find(o => o.value === cliente.cliIdioma) ?? IDIOMA_ES,
            estado:        cliente.estado        ?? '',
            zip:           cliente.zip           ?? '',
            pctIva:        cliente.porIva         ?? 0,
            noConsiderarIva: cliente.noConsiderarIva ?? false,
            esRevendedor:  cliente.esRevendedor  ?? false,
          });
        }
      } catch {
        swalError(t.loading_error_controls);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cliente]);

  // ── Cargar ciudades desde API al cambiar país ─────────────────────────────
  useEffect(() => {
    if (!watchPais) {
      setCiudades([]);
      return;
    }

    // Ajustar idioma por defecto según país (omitir en la carga inicial al editar)
    if (skipIdiomaRef.current) {
      skipIdiomaRef.current = false;
    } else {
      const idiomaDefault = watchPais.value === 'US' ? IDIOMA_EN : IDIOMA_ES;
      setValue('cliIdioma', idiomaDefault);
    }

    // Limpiar campos Estado/ZIP si cambia a un país que no los usa
    if (!isEstadoZipCountry(watchPais.value)) {
      setValue('estado', '');
      setValue('zip', '');
    }

    // Limpiar ciudad y cargar desde API
    if (!isEdit) setValue('city', null);

    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await axiosClient.get(URL_CIUDADES, { params: { codPais: watchPais.value } });
        setCiudades(res.data ?? []);
      } catch {
        swalError(t.loading_error_cities);
        setCiudades([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [watchPais?.value]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...(isEdit && { codCliente: cliente.codCliente }),
        nomCliente:    data.nomCliente.trim(),
        tipDocumento:  data.tipDocumento?.value ?? '',
        numNit:        data.numNit?.trim()      ?? '',
        codPais:       data.country?.value      ?? '',
        codCiudad:     data.city?.value          ?? '',
        dirCliente:    data.dirCliente?.trim()  || null,
        sitWeb:        data.sitWeb?.trim()      || null,
        actPrincipal:  data.actPrincipal?.trim()|| null,
        cliIdioma:     data.cliIdioma?.value    ?? 'ES',
        // US-only (se envía null si no aplica)
        estado:        isUS ? (data.estado?.trim() || null) : null,
        zip:           isUS ? (data.zip?.trim()    || null) : null,
        // IVA
        PorIva:          data.noConsiderarIva ? null : Number(data.pctIva),
        NoConsiderarIva: data.noConsiderarIva,
        // Revendedor
        esRevendedor:  data.esRevendedor,
      };

      const res = isEdit
        ? await axiosClient.put(URL_EDITAR,    payload)
        : await axiosClient.post(URL_REGISTRO, payload);

      swalSuccess(isEdit ? t.customer_updated : t.customer_registered);
      onSaved?.(res.data);
    } catch (err) {
      // 400 de ASP.NET (ModelState/DataAnnotations): { errors: { Campo: ["mensaje"] } }.
      // Se resalta el campo si se puede mapear y, además, se listan todos los
      // mensajes en el alert — así no queda solo el genérico "Error al guardar".
      const apiErrors = err?.response?.data?.errors;
      if (err?.response?.status === 400 && apiErrors) {
        const msgs = [];
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const list = Array.isArray(messages) ? messages : [messages];
          msgs.push(...list);
          const rhfField = API_FIELD_MAP[field.toLowerCase()];
          if (rhfField) setError(rhfField, { type: 'server', message: list[0] });
        });
        swalError(t.error, msgs.join('\n'), t.close);
        return;
      }
      swalError(err?.response?.data?.message || t.could_not_save);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">{t.loading}</p>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Columna 1 — Cliente + Dirección (formato US) + IVA
            Columna 2 — Documento + datos adicionales + Es Revendedor
            2 columnas independientes, cada una fluye con su propia altura,
            no hay filas compartidas entre ellas así que no hay riesgo de hueco. */}
        <div className="flex flex-col lg:flex-row items-start gap-x-6 gap-y-4">

          {/* Columna 1 */}
          <div className="flex-1 w-full flex flex-col gap-4">

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.customer} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nomCliente', {
                  required: t.customer_name_required,
                  maxLength: { value: 50, message: t.max_n_characters.replace('{n}', 50) },
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-\.\,\&']+$/,
                    message: t.only_letters_numbers_basic,
                  },
                  validate: v => v.trim().length > 0 || t.name_not_empty,
                })}
                placeholder={t.customer_full_name_ph}
                className="form-input w-full"
              />
              <FieldError error={errors.nomCliente} />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.country} <span className="text-red-500">*</span>
              </label>
              <SelectCountry
                t={t}
                options={paises}
                control={control}
                errors={errors}
                setValue={setValue}
                current={cliente?.codPais ?? ''}
                isLoading={loading}
                onChange={(val) => {
                  if (val?.value !== watchPais?.value) {
                    setValue('city', null);
                    setCiudades([]);
                  }
                }}
                instanceId="select-country-customer"
                onCountryAdded={({ paises: nuevaLista }) => setPaises(nuevaLista)}
              />
            </div>

            {/* Dirección (calle) */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.office_address}</label>
              <input
                {...register('dirCliente', {
                  maxLength: { value: 150, message: t.max_n_characters.replace('{n}', 150) },
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\.\,\-\#\/\(\)]+$/,
                    message: t.valid_address_chars,
                  },
                })}
                placeholder={t.office_address_ph}
                className="form-input w-full"
              />
              <FieldError error={errors.dirCliente} />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t.city} <span className="text-red-500">*</span>
              </label>
              <SelectCity
                t={t}
                cities={ciudades}
                control={control}
                errors={errors}
                isLoading={loadingCities}
                instanceId="select-city-customer"
                selectedCountry={watchPais}
                setValue={setValue}
                onCityAdded={({ ciudades: nuevaLista }) => {
                  setCiudades(nuevaLista);
                }}
              />
            </div>

            {/* Estado y Código Postal — aparece con animación suave al seleccionar US */}
            <div
              className={`grid grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ease-in-out
                ${isUS ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
            >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.state} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('estado', {
                      required: isUS ? t.state_required_usa : false,
                      maxLength: { value: 60, message: t.max_n_characters.replace('{n}', 60) },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: t.only_letters,
                      },
                    })}
                    placeholder={t.state_ph}
                    className="form-input w-full"
                  />
                  <FieldError error={errors.estado} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t.zip_code} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('zip', {
                      required: isUS ? t.zip_required_usa : false,
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: t.invalid_zip_format,
                      },
                    })}
                    placeholder={t.zip_ph}
                    className="form-input w-full"
                  />
                  <FieldError error={errors.zip} />
                </div>
            </div>

            {/* % IVA */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.pct_iva_label}</label>
              {/* Altura fijada por inline style en ambos (input y chip): .form-input trae su propio
                  padding/line-height que nunca calzó pixel-a-pixel contra clases de altura (h-[42px]
                  ni items-stretch) frente al chip, que arma la suya solo con utilidades. Un style
                  height explícito en los dos deja el resultado 100% determinista. */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('pctIva', {
                    min: { value: 0,   message: t.min_value_n.replace('{n}', 0)   },
                    max: { value: 100, message: t.max_value_n.replace('{n}', 100) },
                  })}
                  disabled={watchNoIva}
                  style={{ height: 42, boxSizing: 'border-box' }}
                  className="form-input w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <ToggleChip
                  checked={watchNoIva}
                  label={t.no_consider_iva}
                  register={register('noConsiderarIva')}
                />
              </div>
              <FieldError error={errors.pctIva} />
            </div>

          </div>

          {/* Columna 2 */}
          <div className="flex-1 w-full flex flex-col gap-4">

            {/* Tipo de documento + Número — en una sola fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.document_type_full} <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="tipDocumento"
                  control={control}
                  rules={{ required: t.required_select }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={docTypes}
                      placeholder={t.select_option}
                      classNamePrefix="select"
                      className="w-full"
                      isClearable
                      instanceId="doctype"
                      menuPosition="fixed"
                      menuShouldScrollIntoView={false}
                    />
                  )}
                />
                <FieldError error={errors.tipDocumento} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.nit_number_label}</label>
                <input
                  {...register('numNit', {
                    maxLength: { value: 45, message: t.max_n_characters.replace('{n}', 45) },
                    pattern: {
                      value: /^[0-9\-]*$/,
                      message: t.only_numbers_dash,
                    },
                    validate: v => {
                      const tipo = watch('tipDocumento');
                      if (tipo && !v?.trim()) return t.document_number_required;
                      return true;
                    },
                  })}
                  placeholder={watchTipDoc ? t.nro_of.replace('{label}', watchTipDoc.label) : t.document_number}
                  disabled={!watchTipDoc}
                  className="form-input w-full disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {watchTipDoc && <FieldError error={errors.numNit} />}
              </div>
            </div>

            {/* Página web */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.website}</label>
              <input
                {...register('sitWeb', {
                  maxLength: { value: 100, message: t.max_n_characters.replace('{n}', 100) },
                  validate: v => {
                    if (!v || !v.trim()) return true; // opcional
                    try {
                      const url = new URL(v.startsWith('http') ? v : `https://${v}`);
                      return (url.hostname.includes('.')) || t.invalid_url;
                    } catch {
                      return t.invalid_url;
                    }
                  },
                })}
                placeholder={t.website_ph}
                className="form-input w-full"
              />
              <FieldError error={errors.sitWeb} />
            </div>

            {/* Actividad principal */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.main_activity}</label>
              <input
                {...register('actPrincipal', {
                  maxLength: { value: 50, message: t.max_n_characters.replace('{n}', 50) },
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\.\,\-]+$/,
                    message: t.only_letters_numbers_basic,
                  },
                })}
                placeholder={t.main_activity_ph}
                className="form-input w-full"
              />
              <FieldError error={errors.actPrincipal} />
            </div>

            {/* Idioma reporte */}
            <div>
              <label className="block text-sm font-medium mb-1">{t.show_reports_in}</label>
              <Controller
                name="cliIdioma"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={IDIOMA_OPTIONS}
                    classNamePrefix="select"
                    className="w-full"
                    instanceId="idioma"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                )}
              />
            </div>

            {/* Es Revendedor */}
            <div>
              <label className="block text-sm font-medium mb-1">&nbsp;</label>
              <ToggleChip
                checked={watch('esRevendedor')}
                label={t.is_reseller}
                register={register('esRevendedor')}
              />
            </div>

          </div>

        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                       text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {t.btn_cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150">
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.saving}
              </>
            ) : (
              <>
                <IconSave className="h-4 w-4" />
                {isEdit ? t.update : t.save}
              </>
            )}
          </button>
        </div>

      </form>


    </>
  );
};

export default CustomerForm;