'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import SelectTrading from '@/components/select-trading';

const URL_GET  = (codPrv) => `/proveedores/${codPrv}/condiciones`;
const URL_SAVE = (codPrv) => `/proveedores/${codPrv}/condiciones/guardar`;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function Conditions() {
  const { proveedor, conditions, setConditions, loadConditions, setLoadConditions } = useSupplier();
  const t = useTranslation();

  const [conditionOptions, setConditionOptions] = useState([]);

  const {
    control, register, reset, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { condition: null, valor: 0 },
  });

  useEffect(() => {
    if (!loadConditions) {
      setConditionOptions(conditions.opciones ?? []);
      reset({
        condition: conditions.opciones?.find(o => o.value === conditions.conPago) ?? null,
        valor:     conditions.mtoCredito ?? 0,
      });
      return;
    }
    axiosClient.get(URL_GET(proveedor.codPrv))
      .then(res => {
        const data = res.data ?? {};
        setConditions(data);
        setConditionOptions(data.opciones ?? []);
        reset({
          condition: data.opciones?.find(o => o.value === data.conPago) ?? null,
          valor:     data.mtoCredito ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoadConditions(false));
  }, []);

  if (loadConditions) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const onSubmit = async (data) => {
    const payload = {
      conPago:    data.condition?.value ?? null,
      mtoCredito: Number(data.valor)     || 0,
    };
    try {
      await axiosClient.put(URL_SAVE(proveedor.codPrv), payload);
      setConditions(prev => ({ ...prev, ...payload }));
      Toast.fire({ icon: 'success', title: t.condition_supplier_add });
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.condition_supplier_add_error;
      Toast.fire({ icon: 'error', title: msg });
    }
  };

  return (
    <div className="space-y-6">

      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {t.trading_conditions}
      </h2>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900
                          shadow-md dark:shadow-gray-900/40
                          p-6 space-y-5">

            {/* Condición de pago */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.terms_of_payment}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <SelectTrading
                t={t}
                control={control}
                errors={errors}
                options={conditionOptions}
                setValue={setValue}
                setConditions={(newOptions) => setConditionOptions(newOptions)}
              />
            </div>

            {/* Valor / Crédito */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.value}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('valor')}
                className="form-input w-full"
              />
            </div>

            {/* Botón */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.updating}
                  </span>
                ) : t.btn_save}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}