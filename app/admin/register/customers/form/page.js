'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useTranslation } from '@/app/locales';
import SelectCountry from '@/components/select-country';
import SelectCity from '@/components/select-city';

const URL_CONTROLES  = '/clientes/controles';
const URL_CIUDADES   = '/ciudades';          // GET /ciudades?codPais=XX
const URL_REGISTRO   = '/clientes/registro';
const URL_EDITAR     = '/clientes/editar';

const IDIOMA_OPTIONS = [
  { value: 'ES', label: 'Español' },
  { value: 'US', label: 'Inglés' },
];

const IDIOMA_ES = IDIOMA_OPTIONS[0]; // Español
const IDIOMA_EN = IDIOMA_OPTIONS[1]; // Inglés

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const FieldError = ({ error }) =>
  error ? <p className="text-xs text-red-500 mt-1">{error.message}</p> : null;

// ─────────────────────────────────────────────────────────────────────────────
const CustomerForm = ({ cliente = null, onCancel, onSaved }) => {
  const t      = useTranslation();
  const isEdit = !!cliente;

  const [saving, setSaving]         = useState(false);
  const [paises, setPaises]         = useState([]);
  const [ciudades, setCiudades]     = useState([]);
  const [docTypes, setDocTypes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);


  const {
    register, handleSubmit, control, reset, watch, setValue,
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
  const isUS              = watchPais?.value === 'US';

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
            pctIva:        cliente.pctIva        ?? 0,
            noConsiderarIva: cliente.noConsiderarIva ?? false,
            esRevendedor:  cliente.esRevendedor  ?? false,
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

  // ── Cargar ciudades desde API al cambiar país ─────────────────────────────
  useEffect(() => {
    if (!watchPais) {
      setCiudades([]);
      return;
    }

    // Ajustar idioma por defecto según país
    const idiomaDefault = watchPais.value === 'US' ? IDIOMA_EN : IDIOMA_ES;
    setValue('cliIdioma', idiomaDefault);

    // Limpiar campos US si cambia de país
    if (watchPais.value !== 'US') {
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
        Toast.fire({ icon: 'error', title: 'Error cargando ciudades' });
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
        pctIva:        data.noConsiderarIva ? null : Number(data.pctIva),
        noConsiderarIva: data.noConsiderarIva,
        // Revendedor
        esRevendedor:  data.esRevendedor,
      };

      const res = isEdit
        ? await axiosClient.put(URL_EDITAR,    payload)
        : await axiosClient.post(URL_REGISTRO, payload);

      Toast.fire({ icon: 'success', title: isEdit ? 'Cliente actualizado' : 'Cliente registrado' });
      onSaved?.(res.data);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">Cargando...</p>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* ── Columna izquierda ── */}
          <div className="space-y-4">

            {/* Nombre cliente */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nomCliente', {
                  required: 'El nombre del cliente es obligatorio',
                  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-\.\,\&']+$/,
                    message: 'Solo se permiten letras, números y caracteres básicos',
                  },
                  validate: v => v.trim().length > 0 || 'El nombre no puede estar vacío',
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
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\.\,\-\#\/\(\)]+$/,
                    message: 'Solo se permiten caracteres válidos para una dirección',
                  },
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
              <SelectCountry
                t={t}
                options={paises}
                control={control}
                errors={errors}
                setValue={setValue}
                current={cliente?.codPais ?? ''}
                isLoading={loading}
                onChange={(val) => {
                  setValue('city', null);
                  setCiudades([]);
                }}
                instanceId="select-country-customer"
                onCountryAdded={({ paises: nuevaLista }) => setPaises(nuevaLista)}
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad <span className="text-red-500">*</span>
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

            {/* Estado y ZIP — aparece con animación suave al seleccionar US */}
            <div
              className={`grid grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ease-in-out
                ${isUS ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
            >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('estado', {
                      required: isUS ? 'El estado es requerido para USA' : false,
                      maxLength: { value: 60, message: 'Máximo 60 caracteres' },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: 'Solo se permiten letras',
                      },
                    })}
                    placeholder="Ej: California"
                    className="form-input w-full"
                  />
                  <FieldError error={errors.estado} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ZIP <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('zip', {
                      required: isUS ? 'El ZIP es requerido para USA' : false,
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: 'Formato inválido. Ej: 90210 o 90210-1234',
                      },
                    })}
                    placeholder="Ej: 90210"
                    className="form-input w-full"
                  />
                  <FieldError error={errors.zip} />
                </div>
            </div>

          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-4">

            {/* Documento — tipo encima, número debajo con placeholder dinámico */}
            <div>
              <label className="block text-sm font-medium mb-1">Num. NIT / CI</label>
              <Controller
                name="tipDocumento"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={docTypes}
                    placeholder="Seleccionar tipo..."
                    classNamePrefix="select"
                    className="w-full mb-2"
                    isClearable
                    instanceId="doctype"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                )}
              />
              <input
                {...register('numNit', {
                  maxLength: { value: 45, message: 'Máximo 45 caracteres' },
                  pattern: {
                    value: /^[0-9\-]*$/,
                    message: 'Solo se permiten números y el carácter -',
                  },
                  validate: v => {
                    const tipo = watch('tipDocumento');
                    if (tipo && !v?.trim()) return 'El número de documento es requerido';
                    return true;
                  },
                })}
                placeholder={watchTipDoc ? `Nro. de ${watchTipDoc.label}` : 'Número de documento'}
                disabled={!watchTipDoc}
                className="form-input w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {watchTipDoc && <FieldError error={errors.numNit} />}
            </div>

            {/* Página web */}
            <div>
              <label className="block text-sm font-medium mb-1">Página web</label>
              <input
                {...register('sitWeb', {
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                  validate: v => {
                    if (!v || !v.trim()) return true; // opcional
                    try {
                      const url = new URL(v.startsWith('http') ? v : `https://${v}`);
                      return (url.hostname.includes('.')) || 'Ingresa una URL válida (ej: https://ejemplo.com)';
                    } catch {
                      return 'Ingresa una URL válida (ej: https://ejemplo.com)';
                    }
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
                  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                  pattern: {
                    value: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\.\,\-]+$/,
                    message: 'Solo se permiten letras, números y caracteres básicos',
                  },
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
                    instanceId="idioma"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                )}
              />
            </div>

            {/* % IVA */}
            <div>
              <label className="block text-sm font-medium mb-1">% IVA</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('pctIva', {
                    min: { value: 0,   message: 'Mínimo 0'   },
                    max: { value: 100, message: 'Máximo 100' },
                  })}
                  disabled={watchNoIva}
                  className="form-input w-28 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('noConsiderarIva')}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                  />
                  No Considerar IVA
                </label>
              </div>
              <FieldError error={errors.pctIva} />
            </div>

            {/* Es Revendedor */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="esRevendedor"
                {...register('esRevendedor')}
                className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
              />
              <label htmlFor="esRevendedor" className="text-sm font-medium cursor-pointer select-none">
                Es Revendedor
              </label>
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
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                       text-white text-sm font-medium shadow-sm hover:shadow-md
                       disabled:opacity-50 transition-all">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
          </button>
        </div>

      </form>


    </>
  );
};

export default CustomerForm;