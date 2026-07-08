"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Select from 'react-select';
import IconArrowsExchange from '@/components/icon/icon-arrows-exchange';

const URL_CLIENTES = 'cotizaciones/clientes';
const URL_CAMBIAR  = 'cotizaciones/cambiar-cliente';
const MIN_CHARS    = 2;

// Acepta: "*" | "12345" | "123,456,789"
const validarFormatoNro = (val) => {
  const v = val.trim();
  if (v === '*')               return true;
  if (/^\d+$/.test(v))        return true;
  if (/^\d+(,\d+)+$/.test(v)) return true;
  return 'Formato inválido. Use: 12345 · 123,456,789 · *';
};

export default function ChangeQuote() {
  const t = useTranslation();

  const [customers,        setCustomers]       = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [inputActual,      setInputActual]      = useState('');
  const [inputNuevo,       setInputNuevo]       = useState('');
  const [result,           setResult]           = useState(null); // null = form | object = pantalla resultado

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      actual_customer: null,
      new_customer:    null,
      nro_quote:       '',
    },
  });

  useEffect(() => {
    setLoadingCustomers(true);
    axiosClient.get(URL_CLIENTES)
      .then(rs => {
        const lista = rs.data ?? [];
        const seen  = new Set();
        setCustomers(
          lista
            .map(c => ({ value: c.codCliente ?? c.value, label: c.nomCliente ?? c.label ?? '' }))
            .filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true; })
        );
      })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  }, []);

  const getOptions = (input) => {
    if (!input || input.length < MIN_CHARS) return [];
    const lower = input.toLowerCase();
    return customers.filter(c => c.label.toLowerCase().includes(lower));
  };

  const noOptionsMsg = (input) =>
    !input || input.length < MIN_CHARS
      ? `Escriba al menos ${MIN_CHARS} caracteres...`
      : 'Sin resultados';

  const onSubmit = async (data) => {
    const nro = data.nro_quote.trim();

    // Confirmación reforzada cuando se usa "*" (afecta TODAS las cotizaciones)
    if (nro === '*') {
      const { isConfirmed } = await swalConfirm(
        '¿Cambiar TODAS las cotizaciones?',
        `Se moverán TODAS las cotizaciones de "${data.actual_customer.label}" a "${data.new_customer.label}". Esta acción no se puede deshacer.`,
        { confirmText: 'Sí, cambiar todas', confirmColor: '#dc2626' }
      );
      if (!isConfirmed) return;
    } else {
      const { isConfirmed } = await swalConfirm(
        t.question_change_quote ?? '¿Cambiar asignación?',
        `Cotización(es) ${nro} — de "${data.actual_customer.label}" a "${data.new_customer.label}"`
      );
      if (!isConfirmed) return;
    }

    try {
      const payload = {
        codClienteActual: data.actual_customer.value,
        codClienteNuevo:  data.new_customer.value,
        nroCotizacion:    nro,
      };
      const rs = await axiosClient.post(URL_CAMBIAR, payload);
      const { cambiadas, invalidas } = rs.data ?? {};

      reset();
      setInputActual('');
      setInputNuevo('');
      setResult({
        clienteActual: data.actual_customer.label,
        clienteNuevo:  data.new_customer.label,
        nroCotizacion: nro,
        cambiadas:     cambiadas ?? 0,
        invalidas:     invalidas ?? [],
      });
    } catch (err) {
      const status   = err?.response?.status;
      const body     = err?.response?.data ?? {};
      const msg      = body.mensaje ?? body.message;
      const invalidas = body.invalidas;

      if (status === 400) {
        if (invalidas?.length > 0) {
          // El servidor rechazó porque ninguna cotización corresponde al cliente actual
          swalError(
            msg ?? 'Sin cotizaciones válidas',
            `No pertenecen al cliente actual: ${invalidas.join(', ')}`
          );
        } else {
          swalError('Error de validación', msg ?? 'Datos inválidos.');
        }
      } else if (status === 401) {
        swalError('Sin autorización', 'Su sesión ha expirado. Vuelva a iniciar sesión.');
      } else if (status === 403) {
        swalError('Sin permiso', 'No tiene permiso para realizar esta acción.');
      } else {
        swalError('Error', msg ?? 'No se pudo cambiar la asignación. Intente nuevamente.');
      }
    }
  };

  useDynamicTitle(`${t.query} | ${t.change_quote}`);

  // Clase de error siempre presente — invisible mantiene el espacio para no desalinear
  const errMsg = (msg) => (
    <p className={`text-xs mt-1 h-4 leading-4 ${msg ? 'text-red-400' : 'invisible'}`}>
      {msg ?? 'x'}
    </p>
  );

  // ── Pantalla de resultado (reemplaza el formulario tras éxito) ────────────
  if (result) {
    const { clienteActual, clienteNuevo, nroCotizacion, cambiadas, invalidas } = result;
    const hayInvalidas = invalidas.length > 0;

    return (
      <>
        <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
          <li>{t.query}</li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
            {t.change_quote}
          </li>
        </ul>

        <div className="panel p-10 flex flex-col items-center text-center">

          {/* Icono */}
          <div className={`mb-5 h-20 w-20 rounded-full flex items-center justify-center ${hayInvalidas ? 'bg-amber-50' : 'bg-green-50'}`}>
            {hayInvalidas ? (
              <svg className="h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : (
              <svg className="h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            {hayInvalidas ? 'Cambio parcialmente completado' : 'Cambio completado'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {clienteActual}
            <span className="mx-2 text-gray-300">→</span>
            {clienteNuevo}
            {nroCotizacion !== '*' && (
              <span className="ml-2 text-gray-400">· Cot. {nroCotizacion}</span>
            )}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="rounded-xl border border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 px-10 py-5 min-w-[140px]">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{cambiadas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {cambiadas === 1 ? 'Cotización cambiada' : 'Cotizaciones cambiadas'}
              </p>
            </div>
            {hayInvalidas && (
              <div className="rounded-xl border border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 px-10 py-5 min-w-[140px]">
                <p className="text-4xl font-bold text-red-500 dark:text-red-400">{invalidas.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {invalidas.length === 1 ? 'No encontrada' : 'No encontradas'}
                </p>
              </div>
            )}
          </div>

          {/* Detalle de inválidas */}
          {hayInvalidas && (
            <div className="mb-8 w-full max-w-md rounded-xl border border-red-100 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10 px-5 py-4 text-left">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                No pertenecen al cliente seleccionado:
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 font-mono">
                {invalidas.join(', ')}
              </p>
            </div>
          )}

          {/* Acción */}
          <button
            onClick={() => setResult(null)}
            className="h-11 px-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] transition-all"
          >
            Nuevo Cambio
          </button>

        </div>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.change_quote}
        </li>
      </ul>

      <div className="panel p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/*
            items-start: todos los hijos se alinean por arriba.
            El arrow y el botón usan pt-6 para saltar la altura del label
            y quedar a la misma altura visual que los inputs (h-10).
          */}
          <div className="flex items-start gap-3 flex-wrap">

            {/* Cliente actual */}
            <div className="flex-1 min-w-52">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.current_customer ?? 'Cliente Actual'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Controller
                name="actual_customer"
                control={control}
                rules={{ required: { value: true, message: t.required_select } }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    isLoading={loadingCustomers}
                    options={getOptions(inputActual)}
                    inputValue={inputActual}
                    onInputChange={(v, { action }) => { if (action === 'input-change') setInputActual(v); }}
                    onChange={(val) => { field.onChange(val); setInputActual(''); if (getValues('new_customer')) trigger('new_customer'); }}
                    filterOption={null}
                    noOptionsMessage={() => noOptionsMsg(inputActual)}
                    placeholder="Buscar cliente..."
                    instanceId="select-actual-customer"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errMsg(errors.actual_customer?.message)}
            </div>

            {/* Flecha — pt-6 salta el label, h-10 alinea con el input */}
            <div className="shrink-0 pt-6">
              <div className="h-10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cliente nuevo */}
            <div className="flex-1 min-w-52">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.new_customer ?? 'Cliente Nuevo'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Controller
                name="new_customer"
                control={control}
                rules={{
                  required: { value: true, message: t.required_select },
                  validate: (val) => {
                    const actual = getValues('actual_customer');
                    if (actual?.value && val?.value && actual.value === val.value)
                      return 'El cliente nuevo no puede ser igual al cliente actual.';
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    isLoading={loadingCustomers}
                    options={getOptions(inputNuevo)}
                    inputValue={inputNuevo}
                    onInputChange={(v, { action }) => { if (action === 'input-change') setInputNuevo(v); }}
                    onChange={(val) => { field.onChange(val); setInputNuevo(''); }}
                    filterOption={null}
                    noOptionsMessage={() => noOptionsMsg(inputNuevo)}
                    placeholder="Buscar cliente..."
                    instanceId="select-new-customer"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errMsg(errors.new_customer?.message)}
            </div>

            {/* Separador vertical — pt-6 + h-10 para alinearse con inputs */}
            <div className="hidden sm:flex shrink-0 pt-6">
              <div className="h-10 flex items-center">
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Nro. Cotización */}
            <div className="w-56 shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.nro_quote ?? 'Nro. Cotización'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="12345 · 1,2,3 · *"
                {...register("nro_quote", {
                  required: { value: true, message: t.required_field },
                  validate: validarFormatoNro,
                })}
                className={`form-input w-full ${errors.nro_quote ? 'error' : ''}`}
              />
              {errMsg(errors.nro_quote?.message)}
            </div>

            {/* Botón — pt-6 salta el label, alineado con los inputs */}
            <div className="shrink-0 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 inline-flex items-center gap-2 px-5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.saving_data ?? 'Guardando...'}
                  </>
                ) : (
                  <>
                    <IconArrowsExchange className="h-4 w-4" />
                    {t.change_assignment ?? 'Cambiar Asignación'}
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}
