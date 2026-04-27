// app/admin/register/customers/[id]/[tab]/tabs/TradingConditions.js
'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import SelectTrading from '@/components/select-trading';

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_CONDICIONES = (codCliente) => `/clientes/${codCliente}/condiciones`;
const URL_GUARDAR     = (codCliente) => `/clientes/${codCliente}/condiciones/guardar`;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

// ─────────────────────────────────────────────────────────────────────────────
export default function TradingConditions({
  cliente,
  conditions, setConditions,
  loadConditions, setLoadConditions, t
}) {

  // ── Opciones para los selects ─────────────────────────────────────────────
  // conditions = {
  //   current: { condition, seller, montoCredito, pctDescuento, pctMargen },
  //   conditionOptions: [{ value, label }],
  //   sellerOptions:    [{ value, label }],
  // }
  const [saving, setSaving] = useState(false);

  const {
    register, handleSubmit, control, reset, setValue, watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      condition:    null,
      seller:       null,
      montoCredito:    '',
      pctDescuento:    '',
      pctMargen:       '',
      noConsiderarIva: false,
    },
  });

  const watchNoIva = watch('noConsiderarIva');

  // ── Carga inicial (respeta el patrón de otros tabs) ───────────────────────
  useEffect(() => {
    if (!loadConditions) {
      // Ya cargado — precarga el form con los valores actuales
      precargarForm(conditions);
      return;
    }

    axiosClient.get(URL_CONDICIONES(cliente.codCliente))
      .then(res => {
        const data = res.data ?? {};
        setConditions(data);
        precargarForm(data);
      })
      .catch(() => {
        Toast.fire({ icon: 'error', title: 'Error al cargar condiciones comerciales' });
        setConditions({});
      })
      .finally(() => setLoadConditions(false));
  }, []);

  // ── Precarga el form con los datos que llegaron de la API ─────────────────
  const precargarForm = (data) => {
    if (!data?.conditionOptions) return;

    const current = data.current ?? {};
    reset({
      condition:    data.conditionOptions.find(o => o.value === current.condition) ?? null,
      seller:       data.sellerOptions?.find(o => o.value === current.seller)     ?? null,
      montoCredito:    current.montoCredito    ?? '',
      pctDescuento:    current.pctDescuento    ?? '',
      pctMargen:       current.pctMargen       ?? '',
      noConsiderarIva: current.noConsiderarIva ?? false,
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await axiosClient.post(URL_GUARDAR(cliente.codCliente), {
        condition:    data.condition?.value    ?? null,
        seller:       data.seller?.value       ?? null,
        montoCredito: data.montoCredito !== '' ? Number(data.montoCredito) : null,
        pctDescuento: data.pctDescuento !== '' ? Number(data.pctDescuento) : null,
        pctMargen:       data.pctMargen    !== '' ? Number(data.pctMargen)    : null,
        noConsiderarIva: data.noConsiderarIva,
      });

      Toast.fire({ icon: 'success', title: t.trading_success_save ?? 'Condiciones guardadas correctamente' });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.mensaje;
      Toast.fire({ icon: 'error', title: msg ?? (t.trading_error_save ?? 'Error al guardar condiciones') });
    } finally {
      setSaving(false);
    }
  };

  // ── Spinner inicial ───────────────────────────────────────────────────────
  if (loadConditions) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const conditionOptions = conditions?.conditionOptions ?? [];
  const sellerOptions    = conditions?.sellerOptions    ?? [];

  return (
    <div className="flex justify-center py-6 px-4">
      <div className="w-full max-w-lg">

        {/* ── Card contenedor ───────────────────────────────────────────── */}
        <div className="panel rounded-2xl border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-900 shadow-sm">

          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t.trading_conditions ?? 'Condiciones Comerciales'}
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4" noValidate>

            {/* ── Condiciones de pago ──────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.terms_of_payment}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <SelectTrading
                t={t}
                control={control}
                errors={errors}
                options={conditionOptions}
                setValue={setValue}
                setConditions={(newOptions) =>
                  setConditions(prev => ({ ...prev, conditionOptions: newOptions }))
                }
              />
            </div>

            {/* ── Vendedor asignado ────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.assigned_seller}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className={errors.seller ? 'react-select-error' : ''}>
                <Controller
                  name="seller"
                  control={control}
                  rules={{ required: { value: true, message: t.required_select } }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={sellerOptions}
                      placeholder={t.select_option}
                      isClearable
                      className="w-full"
                      instanceId="seller-select"
                      menuPosition="fixed"
                      classNamePrefix="select"
                      menuShouldScrollIntoView={false}
                    />
                  )}
                />
              </div>
              {errors.seller && (
                <span className="block text-red-400 text-xs mt-1" role="alert">
                  {errors.seller.message}
                </span>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* ── Monto Crédito + % Descuento (en fila) ───────────────── */}
            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monto Crédito $us.
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  {...register('montoCredito', {
                    pattern: {
                      value: /^\d+(\.\d{0,2})?$/,
                      message: 'Solo números (ej: 1500.00)',
                    },
                  })}
                  className={`form-input w-full ${errors.montoCredito ? 'error' : ''}`}
                />
                {errors.montoCredito && (
                  <span className="text-red-400 text-xs block">{errors.montoCredito.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  % Descuento
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  {...register('pctDescuento', {
                    pattern: {
                      value: /^\d+(\.\d{0,2})?$/,
                      message: 'Solo números (ej: 10.00)',
                    },
                    validate: v => {
                      if (!v) return true;
                      const n = Number(v);
                      if (n < 0)   return 'No puede ser negativo';
                      if (n > 100) return 'No puede superar 100%';
                      return true;
                    },
                  })}
                  className={`form-input w-full ${errors.pctDescuento ? 'error' : ''}`}
                />
                {errors.pctDescuento && (
                  <span className="text-red-400 text-xs block">{errors.pctDescuento.message}</span>
                )}
              </div>

            </div>

            {/* ── Utilidad + checkbox NO IVA ───────────────────────────── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.utility} (%)
                  {!watchNoIva && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400
                                  cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    {...register('noConsiderarIva')}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                  />
                  <span className={`transition-colors duration-150 ${watchNoIva ? 'text-primary font-medium' : ''}`}>
                    No Considerar IVA
                  </span>
                </label>
              </div>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                disabled={watchNoIva}
                {...register('pctMargen', {
                  required: { value: !watchNoIva, message: t.required_field },
                  pattern: {
                    value: /^\d+(\.\d{0,2})?$/,
                    message: 'Solo se permiten números (ej: 15.00)',
                  },
                  validate: v => {
                    if (watchNoIva) return true;
                    const n = Number(v);
                    if (n < 0) return 'El margen no puede ser negativo';
                    return true;
                  },
                })}
                className={`form-input w-full transition-opacity duration-150
                  ${watchNoIva ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}
                  ${errors.pctMargen ? 'error' : ''}`}
              />
              {errors.pctMargen && !watchNoIva && (
                <span className="text-red-400 text-xs mt-1 block">{errors.pctMargen.message}</span>
              )}
            </div>

            {/* ── Botón guardar ─────────────────────────────────────────── */}
            <div className="flex justify-center pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.updating ?? 'Guardando...'}
                  </span>
                ) : t.btn_save}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}