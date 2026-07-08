"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalError } from '@/app/lib/swal';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import Select from 'react-select';
import IconArrowsExchange from '@/components/icon/icon-arrows-exchange';

const URL_USUARIOS = 'usuarios/seguimiento';
const URL_CAMBIAR  = 'cotizaciones/cambiar-seguimiento';

// Acepta: "20" | "20,23,25" | "20-25"
const validarFormatoNro = (val) => {
  const v = val.trim();
  if (/^\d+$/.test(v))          return true;
  if (/^\d+(,\d+)+$/.test(v))   return true;
  if (/^\d+-\d+$/.test(v))      return true;
  return 'Formato inválido. Use: 20 · 20,23,25 · 20-25';
};

export default function ChangeAssigned() {
  const t = useTranslation();

  const [usuarios,        setUsuarios]       = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [result,          setResult]         = useState(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { usuario: null, nro_quote: '' },
  });

  useEffect(() => {
    setLoadingUsuarios(true);
    axiosClient.get(URL_USUARIOS)
      .then(rs => {
        setUsuarios(
          (rs.data ?? []).map(u => ({ value: u.codUsuario, label: u.nomUsuario }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingUsuarios(false));
  }, []);


  const onSubmit = async (data) => {
    const nro        = data.nro_quote.trim();
    const nomUsuario = data.usuario.label;

    const { isConfirmed } = await swalConfirm(
      '¿Cambiar usuario asignado?',
      `Cotización(es) ${nro} → "${nomUsuario}"`
    );
    if (!isConfirmed) return;

    try {
      const payload = { codUsuario: data.usuario.value, nroCotizacion: nro };
      const rs = await axiosClient.post(URL_CAMBIAR, payload);
      const { mensaje, nroCotizaciones } = rs.data ?? {};

      reset();
      setResult({ nomUsuario, nroCotizacion: nro, mensaje, nroCotizaciones: nroCotizaciones ?? 0 });
    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.mensaje ?? err?.response?.data?.message;

      if (status === 400)      swalError('Error de validación', msg ?? 'Datos inválidos.');
      else if (status === 401) swalError('Sin autorización', 'Su sesión ha expirado. Vuelva a iniciar sesión.');
      else if (status === 403) swalError('Sin permiso', 'No tiene permiso para realizar esta acción.');
      else                     swalError('Error', msg ?? 'No se pudo cambiar el usuario asignado. Intente nuevamente.');
    }
  };

  useDynamicTitle(`${t.query} | Cambiar Usuario Asignado`);

  const errMsg = (msg) => (
    <p className={`text-xs mt-1 h-4 leading-4 ${msg ? 'text-red-400' : 'invisible'}`}>
      {msg ?? 'x'}
    </p>
  );

  // ── Pantalla de resultado ─────────────────────────────────────────────────
  if (result) {
    const { nomUsuario, nroCotizacion, mensaje, nroCotizaciones } = result;

    return (
      <>
        <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
          <li>{t.query}</li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
            Cambiar Usuario Asignado
          </li>
        </ul>

        <div className="panel p-10 flex flex-col items-center text-center">

          {/* Icono */}
          <div className="mb-5 h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Reasignación completada
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {mensaje ?? `Asignado a `}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{nomUsuario}</span>
            <span className="ml-2 text-gray-400">· Cot. {nroCotizacion}</span>
          </p>

          {/* Stat */}
          <div className="rounded-xl border border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 px-14 py-6 mb-8">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{nroCotizaciones}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {nroCotizaciones === 1 ? 'Cotización reasignada' : 'Cotizaciones reasignadas'}
            </p>
          </div>

          <button
            onClick={() => setResult(null)}
            className="h-11 px-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] transition-all"
          >
            Nueva Reasignación
          </button>
        </div>
      </>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          Cambiar Usuario Asignado
        </li>
      </ul>

      <div className="panel p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex items-start gap-3 flex-wrap">

            {/* Usuario a asignar */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usuario a asignar
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Controller
                name="usuario"
                control={control}
                rules={{ required: { value: true, message: 'Seleccione un usuario.' } }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isClearable
                    isLoading={loadingUsuarios}
                    options={usuarios}
                    onChange={(val) => field.onChange(val)}
                    noOptionsMessage={() => 'Sin resultados'}
                    placeholder="Seleccionar usuario..."
                    instanceId="select-usuario"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errMsg(errors.usuario?.message)}
            </div>

            {/* Separador */}
            <div className="hidden sm:flex shrink-0 pt-6">
              <div className="h-10 flex items-center">
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            {/* Nro. Cotización */}
            <div className="w-56 shrink-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nro. Cotización
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="20 · 20,23,25 · 20-25"
                {...register('nro_quote', {
                  required: { value: true, message: 'Campo requerido.' },
                  validate: validarFormatoNro,
                })}
                className={`form-input w-full ${errors.nro_quote ? 'error' : ''}`}
              />
              {errMsg(errors.nro_quote?.message)}
            </div>

            {/* Botón */}
            <div className="shrink-0 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 inline-flex items-center gap-2 px-5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-150"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <IconArrowsExchange className="h-4 w-4" />
                    Cambiar Asignación
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
