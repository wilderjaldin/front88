'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import Modal from '@/components/modal';
import { customFormat } from '@/app/lib/format';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import IconInfoCircle from '../icon/icon-info-circle';

const URL_MARCAS = 'cotizaciones/marcas';
const URL_SEARCH = 'cotizaciondetalle/buscar-parte-lote';

const ASYNC_MIN = 2;
const ASYNC_MAX = 30;

const ICON_ERR = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const swalError = (title) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_ERR}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  confirmButtonText: 'Cerrar', confirmButtonColor: '#ef4444',
});

const selectStyles = {
  control: (base) => ({ ...base, minHeight: '32px', fontSize: '12px', borderColor: '#d1d5db' }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
};

const mapCotizacion = (c) => ({
  Total:          c.totalSus      ?? 0,
  TotRepuestos:   c.totRepuestos  ?? 0,
  TotalPeso:      c.totPeso       ?? 0,
  FleteInterno:   c.mtoFlete      ?? 0,
  TipoCambio:     c.tipCambio     ?? 0,
  MtoIva:         c.mtoIva        ?? 0,
  NroItems:       c.nroItems      ?? 0,
  NroPedido:      c.nroPedido     ?? '',
  MarcaEquipo:    c.marca         ?? '',
  ModeloEquipo:   c.modelo        ?? '',
  AnioEquipo:     c.anio          ?? '',
  NroSerieEquipo: c.nroSerie      ?? '',
  MarcaMotor:     c.marcaMo       ?? '',
  ModeloMotor:    c.modeloMo      ?? '',
  NroSerieMotor:  c.nroSerieMo    ?? '',
});

const mapDetalle = (detalle = []) => detalle.map(d => ({
  CodItem:      d.codItem,
  CodRepuesto:  d.codRepuesto,
  NroParte:     d.nroParte      ?? '',
  Cantidad:     d.cant          ?? 0,
  DesRepuesto:  d.descripcion   ?? '',
  Marca:        d.marca         ?? '',
  Aplicacion:   d.aplicacion    ?? '',
  TipoRepuesto: d.tipoRepuesto  ?? '',
  DiasVigencia: d.diasVigencia  ?? '',
  Precio:       d.preUniSus     ?? 0,
  Total:        d.totSus        ?? 0,
  Peso:         d.peso          ?? 0,
  TiEntrega:    d.desTieEntrega ?? '',
  Indicador:    d.indicador     ?? '',
  Estado:       d.estado        ?? '',
  ParPrecio:    d.parPrecio     ?? false,
}));

const QuoteBatchFormMini = ({ close, t, customer, order, setOrder, setItems, updateInputs }) => {

  const [marcas, setMarcas] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm();

  useEffect(() => {
    axiosClient.get(URL_MARCAS)
      .then(rs => setMarcas(Array.isArray(rs.data) ? rs.data : []))
      .catch(() => {});
  }, []);

  const loadMarcaOptions = useCallback((inputValue, callback) => {
    const term = inputValue?.trim().toLowerCase() ?? '';
    if (term.length < ASYNC_MIN) return callback([]);
    callback(marcas.filter(m => m.label.toLowerCase().includes(term)).slice(0, ASYNC_MAX));
  }, [marcas]);

  const onSearch = async (data) => {
    if (!data.brand) {
      swalError(t.required_select_app ?? 'Selecciona una aplicación');
      return;
    }

    const LINE_RE = /^(\S+)\s+(\d+)$/;
    const nonEmpty = data.batch.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (nonEmpty.length === 0) {
      swalError(t.required_items ?? 'Ingresa al menos un ítem en el área de texto');
      return;
    }

    const invalid = nonEmpty.filter(l => !LINE_RE.test(l));
    if (invalid.length > 0) {
      Swal.fire({
        html: `<div style="padding:12px 0 6px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_ERR}</div>
          <h2 style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 10px">Formato incorrecto</h2>
          <p style="color:#64748b;font-size:12px;margin:0 0 8px">Cada línea debe ser: <b>NroParte Cantidad</b></p>
          <div style="text-align:left;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;max-height:120px;overflow-y:auto">
            ${invalid.map(l => `<code style="display:block;font-size:11px;color:#dc2626;line-height:1.8">${l}</code>`).join('')}
          </div>
        </div>`,
        confirmButtonText: t.close ?? 'Cerrar',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const items = nonEmpty.map(l => {
      const [, NroParte, cant] = LINE_RE.exec(l);
      return { NroParte, Cantidad: parseInt(cant, 10) };
    });

    Swal.fire({
      html: t.searching ?? 'Buscando...',
      allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const rs = await axiosClient.post(URL_SEARCH, {
        NroCotizacion: order?.NroOrden ?? 0,
        CodCliente:    customer?.CodCliente,
        NroPedido:     order?.NroPedido           ?? '',
        MarcaNroParte: data.brand.label,
        MarcaEq:       order?.MarcaEquipo         ?? '',
        ModeloEq:      order?.ModeloEquipo        ?? '',
        NroSerieEq:    order?.NroSerieEquipo      ?? '',
        AnioEq:        order?.AnioEquipo          ?? '',
        MarcaMo:       order?.MarcaMotor          ?? '',
        ModeloMo:      order?.ModeloMotor         ?? '',
        NroSerieMo:    order?.NroSerieMotor       ?? '',
        Items:         items,
      });
      Swal.close();
      if (rs.data.resultado === 'ok') {
        const mapped = mapCotizacion(rs.data.cotizacion);
        setOrder(prev => ({
          ...prev,
          ...mapped,
          NroPedido:      mapped.NroPedido      || prev.NroPedido,
          MarcaEquipo:    mapped.MarcaEquipo    || prev.MarcaEquipo,
          ModeloEquipo:   mapped.ModeloEquipo   || prev.ModeloEquipo,
          AnioEquipo:     mapped.AnioEquipo     || prev.AnioEquipo,
          NroSerieEquipo: mapped.NroSerieEquipo || prev.NroSerieEquipo,
          MarcaMotor:     mapped.MarcaMotor     || prev.MarcaMotor,
          ModeloMotor:    mapped.ModeloMotor    || prev.ModeloMotor,
          NroSerieMotor:  mapped.NroSerieMotor  || prev.NroSerieMotor,
        }));
        const newItems = mapDetalle(rs.data.detalle);
        setItems(newItems);
        updateInputs(newItems);
        close();
      }
    } catch { Swal.close(); }
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="px-4 py-4 space-y-3">
        <textarea
          rows={8}
          {...register('batch', { required: { value: true, message: t.required_field } })}
          placeholder={"01643-32780 2\n19M7824 1\n001811A 3"}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900
            px-3 py-2 text-sm font-mono resize-none
            focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.batch && (
          <span className="text-red-400 text-xs block">{errors.batch.message?.toString()}</span>
        )}

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <IconInfoCircle className="h-3.5 w-3.5" />
          {t.how_to_copy_items ?? '¿Cómo copiar los ítems?'}
        </button>

        <div className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {t.application ?? 'Aplicación'}:
          </label>
          <Controller
            name="brand"
            control={control}
            rules={{ required: { value: true, message: t.required_select } }}
            render={({ field }) => (
              <AsyncSelect
                loadOptions={loadMarcaOptions}
                defaultOptions={false}
                cacheOptions
                isClearable
                placeholder={t.select_option ?? 'Selecciona una opción'}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                noOptionsMessage={({ inputValue }) =>
                  (inputValue?.trim().length ?? 0) < ASYNC_MIN
                    ? `Ingresa ${ASYNC_MIN} caracteres`
                    : (t.no_results ?? 'Sin resultados')
                }
                value={field.value ?? null}
                onChange={opt => field.onChange(opt ?? null)}
                styles={selectStyles}
              />
            )}
          />
          {errors.brand && (
            <span className="text-red-400 text-xs">{errors.brand.message?.toString()}</span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={close}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150">
          {t.btn_cancel ?? 'Cancelar'}
        </button>
        <button type="button" onClick={handleSubmit(onSearch)}
          className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition">
          {t.search ?? 'Buscar'}
        </button>
      </div>

      {/* Modal ayuda */}
      <Modal
        size="w-full max-w-3xl"
        closeModal={() => setShowHelpModal(false)}
        openModal={() => setShowHelpModal(true)}
        showModal={showHelpModal}
        title={t.how_to_copy_items ?? '¿Cómo copiar los ítems?'}
        content={
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-medium">{t.help_quote_batch_title}</p>
            <p>{t.help_quote_batch_steps}</p>
            <p>{t.help_quote_batch_step1}</p>
            <p>{t.help_quote_batch_step2}</p>
            <img src="/assets/images/help-quote.jpg" alt="ayuda cotización lote" className="w-full rounded-lg mt-2" />
          </div>
        }
      />
    </div>
  );
};

export default QuoteBatchFormMini;
