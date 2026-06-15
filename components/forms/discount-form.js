'use client';
import React from 'react';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import { customFormat } from '@/app/lib/format';
import IconSave from '@/components/icon/icon-save';
import axiosClient from '@/app/lib/axiosClient';

const url = 'cotizaciondetalle/adicionar-descuento';

const DiscountForm = ({ close, token, t, order, setItems, setOrder }) => {

  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { amount: '', percentage: '' } });



  const onSearch = async (data) => {
    try {
      const rs = await axiosClient.put(url, {
        NroCotizacion: order.NroOrden,
        MtoDescuento:  parseFloat(data.amount)     || 0,
        PorDescuento:  parseFloat(data.percentage) || 0,
      });
      const { cotizacion, detalle, mensaje } = rs.data;
      if (!cotizacion) {
        Swal.fire({ icon: 'warning', text: mensaje, confirmButtonColor: '#f59e0b', confirmButtonText: t.close ?? 'Cerrar' });
        return;
      }
      close();
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: t.save_discount_quote_success,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        setOrder(prev => ({
          ...prev,
          Total:        cotizacion.totalSus     ?? 0,
          TotRepuestos: cotizacion.totRepuestos ?? 0,
          Descuento:    cotizacion.mtoDescuento ?? 0,
          MtoIva:       cotizacion.mtoIva       ?? 0,
          FleteInterno: cotizacion.mtoFlete     ?? 0,
          TotalPeso:    cotizacion.totPeso      ?? 0,
          TipoCambio:   cotizacion.tipCambio    ?? 0,
          NroItems:     cotizacion.nroItems,
        }));
        setItems((detalle ?? []).map(d => ({
          CodItem:      d.codItem,
          NroParte:     d.nroParte      ?? '',
          Cantidad:     d.cant          ?? 0,
          DesRepuesto:  d.descripcion   ?? '',
          Marca:        d.marca         ?? '',
          Aplicacion:   d.aplicacion    ?? '',
          TipoRepuesto: d.tipoRepuesto  ?? '',
          Precio:       d.preUniSus     ?? 0,
          Total:        d.totSus        ?? 0,
          Peso:         d.peso          ?? 0,
          TiEntrega:    d.desTieEntrega ?? '',
          Indicador:    d.indicador     ?? '',
          Estado:       d.estado        ?? '',
          DiasVigencia: d.diasVigencia  ?? '',
          ParPrecio:    d.parPrecio     ?? false,
        })));
      });
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      Swal.fire({
        title: t.error,
        text: apiMsg ?? t.save_discount_quote_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const changeAmount = (e) => {
    const a = parseFloat(e.target.value) || 0;
    const p = order.TotRepuestos > 0 ? (a * 100) / order.TotRepuestos : 0;
    setValue('percentage', p.toFixed(2));
  }

  const changePercentage = (e) => {
    const p = parseFloat(e.target.value) || 0;
    const a = (order.TotRepuestos * p) / 100;
    setValue('amount', a.toFixed(2));
  }

  const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 text-right pr-3";
  const inputClass = "h-9 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const errorClass = "ml-[7.5rem] mt-0.5 text-[11px] text-red-500";

  return (
    <div className="bg-white dark:bg-gray-900">

      {/* Subtotal referencia */}
      {order.TotRepuestos > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t.total_spare_parts ?? 'Total repuestos'}</span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{customFormat(order.TotRepuestos)}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSearch)}>
        <div className="px-4 py-4 space-y-3">

          {/* Cantidad */}
          <div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>{t.amount ?? 'Cantidad'}</label>
              <input
                onKeyUp={changeAmount}
                type="text"
                autoComplete="off"
                {...register("amount", { required: { value: true, message: t.required_field } })}
                placeholder="0.00"
                className={`${inputClass} ${errors.amount ? 'border-red-400 focus:ring-red-300/30' : ''}`}
              />
            </div>
            {errors.amount && <p className={errorClass}>{errors.amount.message}</p>}
          </div>

          {/* Porcentaje */}
          <div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>{t.percentage ?? 'Porcentaje'}</label>
              <div className="relative flex-1">
                <input
                  onKeyUp={changePercentage}
                  type="text"
                  autoComplete="off"
                  {...register("percentage", { required: { value: true, message: t.required_field } })}
                  placeholder="0.00"
                  className={`${inputClass} w-full pr-8 ${errors.percentage ? 'border-red-400 focus:ring-red-300/30' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
              </div>
            </div>
            {errors.percentage && <p className={errorClass}>{errors.percentage.message}</p>}
          </div>

        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={close} className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150">
            {t.btn_cancel}
          </button>
          <button type="submit" className="btn btn-success inline-flex items-center gap-2">
            <IconSave className="h-4 w-4" />
            {t.btn_save}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DiscountForm;
