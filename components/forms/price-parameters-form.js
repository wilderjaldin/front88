'use client';
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import Swal from 'sweetalert2';
import axiosClient from '@/app/lib/axiosClient';
import IconSave from '@/components/icon/icon-save';
import IconBackSpace from '@/components/icon/icon-backspace';

const ICON_CHECK = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_INFO  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 16v-4M12 8h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const swalInfo = (title, msg = '', confirmText = 'Entendido') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(245,158,11,0.3)">${ICON_INFO}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#f59e0b',
});

const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#ef4444',
});

const sanitizeDecimal = (val) => {
  const clean = val.replace(/[^0-9.]/g, '');
  const dot = clean.indexOf('.');
  return dot === -1 ? clean : clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '');
};

const sanitizePositions = (val) => val.replace(/[^0-9,\-]/g, '');

const buildPositionsString = (positions) => {
  if (!positions.length) return '';
  const sorted = [...positions].sort((a, b) => a - b);
  const groups = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      groups.push(end > start ? `${start}-${end}` : `${start}`);
      start = sorted[i]; end = sorted[i];
    }
  }
  groups.push(end > start ? `${start}-${end}` : `${start}`);
  return groups.join(',');
};

const validatePositions = (str, maxCount) => {
  const clean = (str ?? '').replace(/\s/g, '');
  if (!clean) return 'Campo requerido';

  if (/[^0-9,\-]/.test(clean))           return 'Solo se permiten números, comas y guiones';
  if (clean.startsWith(',') || clean.endsWith(',')) return 'No puede iniciar o terminar con coma';

  const segments = clean.split(',');
  if (segments.some(s => s === ''))       return 'Segmentos vacíos no permitidos (ej: 1,,2)';

  const expanded = [];

  for (const seg of segments) {
    const dashCount = (seg.match(/-/g) || []).length;

    if (dashCount > 1)                    return `Rango inválido: "${seg}"`;
    if (dashCount === 1) {
      const parts = seg.split('-');
      if (!parts[0] || !parts[1])         return `Rango incompleto: "${seg}"`;
      const a = Number(parts[0]), b = Number(parts[1]);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return `Rango inválido: "${seg}"`;
      if (a < 1 || b > maxCount)          return `Valores fuera de rango (1–${maxCount}): "${seg}"`;
      if (a >= b)                         return `El inicio debe ser menor al fin: "${seg}"`;
      for (let i = a; i <= b; i++) expanded.push(i);
    } else {
      const n = Number(seg);
      if (!Number.isInteger(n) || String(n) !== seg) return `Número inválido: "${seg}"`;
      if (n < 1 || n > maxCount)          return `Valor fuera de rango (1–${maxCount}): "${seg}"`;
      expanded.push(n);
    }
  }

  const unique = new Set(expanded);
  if (unique.size !== expanded.length)    return 'Existen valores duplicados';

  return true;
};

const parsePositions = (str) => {
  const clean = str.replace(/\s/g, '');
  const result = new Set();
  for (const seg of clean.split(',')) {
    if (seg.includes('-')) {
      const [a, b] = seg.split('-').map(Number);
      for (let i = a; i <= b; i++) result.add(i);
    } else {
      result.add(Number(seg));
    }
  }
  return [...result].sort((a, b) => a - b);
};

const PriceParametersForm = ({ close, token, t, default_value, order, setItems, setOrder, items = [], seleccionados = [] }) => {

  const allSelected = seleccionados.length > 0 && seleccionados.length === items.length;
  const partialSelected = seleccionados.length > 0 && !allSelected;

  const initialPositions = (() => {
    if (!partialSelected) return '';
    const positions = seleccionados
      .map(s => items.findIndex(item => item.CodItem === s.CodItem) + 1)
      .filter(p => p > 0);
    return buildPositionsString(positions);
  })();

  const [applyToAll, setApplyToAll] = useState(!partialSelected);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { utility: '', days: '', tipCambio: '', positions: initialPositions } });

  const utilityValue   = watch('utility');
  const daysValue      = watch('days');
  const tipCambioValue = watch('tipCambio');
  const positionsValue = watch('positions');

  const utilityBlocked   = !!(daysValue || tipCambioValue) && !utilityValue;
  const daysBlocked      = !!(utilityValue || tipCambioValue) && !daysValue;
  const tipCambioBlocked = !!(utilityValue || daysValue) && !tipCambioValue;

  const clearField = (name) => setValue(name, '', { shouldValidate: false });

  const onSave = async (data) => {
    let parsedPositions = null;

    if (!applyToAll) {
      parsedPositions = parsePositions(data.positions);
    }

    try {
      const rs = await axiosClient.post('cotizaciondetalle/cambiar-parametro-precio', {
        NroCotizacion: order.NroOrden,
        PorUtilidad:   data.utility   ? parseFloat(data.utility)   : null,
        TiempoEntrega: data.days      ? data.days.trim()           : null,
        TipCambio:     data.tipCambio ? parseFloat(data.tipCambio) : null,
        Todos:         applyToAll ? 1 : 0,
        Items:         parsedPositions ? parsedPositions.join(',') : '',
      });

      const { cotizacion, detalle, mensaje } = rs.data;

      if (!cotizacion) {
        swalInfo(mensaje ?? t.price_parameters_info ?? 'Revisa los parámetros', '', t.understood ?? 'Entendido');
        return;
      }

      close();
      swalSuccess(t.price_parameters_quote_success ?? 'Parámetros actualizados').then(() => {
        setOrder(prev => ({ ...prev,
          Total:        cotizacion.totalSus     ?? prev.Total,
          TotRepuestos: cotizacion.totRepuestos ?? prev.TotRepuestos,
          Descuento:    cotizacion.mtoDescuento ?? prev.Descuento,
          MtoIva:       cotizacion.mtoIva       ?? prev.MtoIva,
          FleteInterno: cotizacion.mtoFlete     ?? prev.FleteInterno,
          TipoCambio:   cotizacion.tipCambio    ?? prev.TipoCambio,
          NroItems:     cotizacion.nroItems     ?? prev.NroItems,
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
      swalError(t.error ?? 'Error', t.price_parameters_quote_error ?? 'No se pudo guardar', t.close ?? 'Cerrar');
    }
  };

  const inputClass = "h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed";

  const ClearBtn = ({ name, value }) => value ? (
    <button type="button" tabIndex={-1} onClick={() => clearField(name)}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
      <IconBackSpace className="h-3.5 w-3.5" />
    </button>
  ) : null;

  return (
    <div className="bg-white dark:bg-gray-900">
      <form onSubmit={handleSubmit(onSave)}>

        {/* Tabla de parámetros */}
        <div className="pt-4 pb-2">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="pb-2 w-1/3"></th>
                <th className="pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 text-center">Default</th>
                <th className="pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 text-center">{t.modify ?? 'Modificar'}</th>
              </tr>
            </thead>
            <tbody>
              {/* Utilidad */}
              <tr>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 text-right">{t.utility ?? 'Utilidad'}</td>
                <td className="py-2 text-center font-semibold text-gray-700 dark:text-gray-200">{default_value}</td>
                <td className="py-2">
                  {(() => {
                    const { onChange, ...rest } = register("utility", {
                      validate: v => !v || /^\d+(\.\d+)?$/.test(v.trim()) || (t.invalid_decimal ?? 'Valor numérico inválido'),
                    });
                    return (
                      <>
                        <div className="relative">
                          <input type="text" autoComplete="off" {...rest}
                            disabled={utilityBlocked}
                            onChange={(e) => { e.target.value = sanitizeDecimal(e.target.value); onChange(e); }}
                            placeholder="0"
                            className={`${inputClass} w-full pr-8 ${errors.utility ? 'border-red-400 focus:ring-red-300/30' : ''}`}
                          />
                          <ClearBtn name="utility" value={utilityValue} />
                        </div>
                        {errors.utility && <p className="mt-0.5 text-[11px] text-red-500">{errors.utility.message}</p>}
                      </>
                    );
                  })()}
                </td>
              </tr>
              {/* Días */}
              <tr>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 text-right">{t.days ?? 'Días'}</td>
                <td className="py-2 text-center text-gray-400">—</td>
                <td className="py-2">
                  <div className="relative">
                    <input type="text" autoComplete="off"
                      {...register("days")}
                      disabled={daysBlocked}
                      placeholder="—"
                      className={`${inputClass} w-full pr-8`}
                    />
                    <ClearBtn name="days" value={daysValue} />
                  </div>
                </td>
              </tr>
              {/* Tipo de cambio */}
              <tr>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 text-right">{t.exchange_rate ?? 'Tipo Cambio'}</td>
                <td className="py-2 text-center text-gray-400">—</td>
                <td className="py-2">
                  {(() => {
                    const { onChange, ...rest } = register("tipCambio", {
                      validate: v => !v || /^\d+(\.\d+)?$/.test(v.trim()) || (t.invalid_decimal ?? 'Valor decimal inválido'),
                    });
                    return (
                      <>
                        <div className="relative">
                          <input type="text" autoComplete="off" {...rest}
                            disabled={tipCambioBlocked}
                            onChange={(e) => { e.target.value = sanitizeDecimal(e.target.value); onChange(e); }}
                            placeholder="0.00"
                            className={`${inputClass} w-full pr-8 ${errors.tipCambio ? 'border-red-400 focus:ring-red-300/30' : ''}`}
                          />
                          <ClearBtn name="tipCambio" value={tipCambioValue} />
                        </div>
                        {errors.tipCambio && <p className="mt-0.5 text-[11px] text-red-500">{errors.tipCambio.message}</p>}
                      </>
                    );
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700" />

        {/* Toggle Todos / Items */}
        <div className="py-4 space-y-3">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => setApplyToAll(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                applyToAll
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.all ?? 'Todos'}
            </button>
            <button
              type="button"
              onClick={() => setApplyToAll(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                !applyToAll
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Items
            </button>
          </div>

          <div className={`space-y-1 transition-opacity duration-150 ${applyToAll ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {(() => {
              const { onChange, ...rest } = register("positions", {
                validate: v => applyToAll || validatePositions(v, items.length),
              });
              return (
                <div className="relative">
                  <input
                    {...rest}
                    type="text" autoComplete="off"
                    disabled={applyToAll}
                    onChange={(e) => {
                      e.target.value = sanitizePositions(e.target.value);
                      onChange(e);
                    }}
                    placeholder="1,2,5  ó  1-5"
                    className={`${inputClass} w-full pr-8 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed ${errors.positions ? 'border-red-400 focus:ring-red-300/30' : ''}`}
                  />
                  {positionsValue && !applyToAll && (
                    <button
                      type="button"
                      onClick={() => setValue('positions', '', { shouldValidate: false })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      tabIndex={-1}
                    >
                      <IconBackSpace className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })()}
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {t.items_hint ?? 'Individual: 1,2,5 — Rango: 1-5'}
              {items.length > 0 && <span className="ml-1 font-medium">({t.max ?? 'Máx'}: {items.length})</span>}
            </p>
            {errors.positions && <p className="text-[11px] text-red-500">{errors.positions.message}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 py-3 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={close}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150">
            {t.btn_cancel}
          </button>
          <button type="submit" disabled={isSubmitting}
            className="btn btn-success inline-flex items-center gap-2 disabled:opacity-60">
            <IconSave className="h-4 w-4" />
            {t.btn_save}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PriceParametersForm;
