"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Select from 'react-select';
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

const URL_ENTREGA = (num) => `entregas/${num}`;
const URL_CONTROLES = 'entregas/controles';

const resolveByValue = (opts, code) => opts.find(o => String(o.value)?.trim() === String(code)?.trim()) ?? (code ? { value: code, label: code } : null);
const resolveByLabel = (opts, label) => opts.find(o => o.label?.trim().toUpperCase() === label?.trim().toUpperCase()) ?? (label ? { value: label, label } : null);

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";
const cellTdClass = "p-0 border-r border-b border-gray-100 dark:border-gray-700";
const cellInputClass = "h-8 w-full px-2 bg-transparent text-xs border-0 rounded-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50";

const InfoField = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-28 shrink-0 text-right">{label}</label>
    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{value || '—'}</span>
  </div>
);

const EditableField = ({ label, value, onChange, type = 'text' }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-28 shrink-0 text-right">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

const SelectField = ({ label, value, options, onChange, instanceId, selectClass }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-28 shrink-0 text-right">{label}</label>
    <div className="flex-1">
      <Select value={value} options={options} onChange={onChange} instanceId={instanceId} {...selectClass} />
    </div>
  </div>
);

const mapEntrega = (d) => ({
  NumEntrega:     d?.numEntrega     ?? '',
  FecEntrega:     d?.fecEntrega     ?? '',
  CodCliente:     d?.codCliente     ?? '',
  NomCliente:     d?.nomCliente     ?? '',
  Destino:        d?.destino        ?? '',
  RecibidoPor:    d?.recibidoPor    ?? '',
  EntregadoPor:   d?.entregadoPor   ?? '',
  Vendedor:       d?.vendedor ?? d?.nomVendedor ?? '',
  TipTransporte:  d?.tipTransporte  ?? '',
  NomTransporte:  d?.nomTransporte  ?? '',
  CondPago:       d?.condPago       ?? '',
  CodMoneda:      d?.codMoneda      ?? '',
  LugEntrega:     d?.lugEntrega     ?? '',
  BlnDespachado:  d?.blnDespachado  ?? false,
  CodEstado:      d?.codEstado      ?? '',
});

// Columnas editables del detalle, en orden — define tanto el input como la navegación tipo Excel
const ITEM_COLUMNS = [
  { key: 'NroParte',     type: 'text',   widthPx: 120, className: 'font-medium' },
  { key: 'DesRepuesto',  type: 'text' },
  { key: 'Cantidad',     type: 'number', widthPx: 70,  align: 'text-center' },
  { key: 'TipoRepuesto', type: 'text',   widthPx: 120 },
  { key: 'Marca',        type: 'text',   widthPx: 120 },
  { key: 'TiEntrega',    type: 'text',   widthPx: 110 },
  { key: 'Origen',       type: 'text',   widthPx: 90 },
  { key: 'HCode',        type: 'text',   widthPx: 110 },
  { key: 'Material',     type: 'text',   widthPx: 100 },
  { key: 'Presentacion', type: 'text',   widthPx: 110 },
];

const mapItems = (items) => (items ?? []).map(i => ({
  NumCorrelativo: i.numCorrelativo ?? '',
  NumEmbalaje:    i.numEmbalaje    ?? '',
  NroCotizacion:  i.nroCotizacion  ?? '',
  CodItem:        i.codItem        ?? '',
  NroParte:       i.nroParte       ?? '',
  NroParteCompra: i.nroParteCompra ?? '',
  DesRepuesto:    i.desRepuesto    ?? '',
  Cantidad:       i.cantidad       ?? 0,
  TipoRepuesto:   i.tipoRepuesto ?? i.tipRepuesto ?? '',
  Marca:          i.marca ?? i.nomMarca ?? '',
  TiEntrega:      i.tiEntrega ?? i.desTieEntrega ?? '',
  Presentacion:   i.presentacion   ?? '',
  Material:       i.material       ?? '',
  Origen:         i.origen         ?? '',
  HCode:          i.hCode          ?? '',
}));

export default function DeliveryDetail() {
  const { numEntrega } = useParams();
  const t = useTranslation();

  const [entrega,  setEntrega]  = useState(null);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [optsMoneda,      setOptsMoneda]      = useState([]);
  const [optsTransporte,  setOptsTransporte]  = useState([]);
  const [optsCondPago,    setOptsCondPago]    = useState([]);
  const [optsEntregadoPor, setOptsEntregadoPor] = useState([]);
  const [optsVendedores,  setOptsVendedores]  = useState([]);

  useDynamicTitle(`${t.delivery_report} | ${numEntrega}`);

  useEffect(() => {
    axiosClient.get(URL_CONTROLES)
      .then(rs => {
        setOptsMoneda(rs.data?.monedas ?? []);
        setOptsTransporte(rs.data?.transportes ?? []);
        setOptsCondPago(rs.data?.condPago ?? []);
        setOptsEntregadoPor(rs.data?.entregadoPor ?? []);
        setOptsVendedores(rs.data?.vendedores ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!numEntrega) return;
    setLoading(true);
    axiosClient.get(URL_ENTREGA(numEntrega))
      .then(rs => {
        setEntrega(mapEntrega(rs.data));
        setItems(mapItems(rs.data?.items));
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [numEntrega]);

  const setField = (field, value) => setEntrega(prev => ({ ...prev, [field]: value }));

  const selMoneda      = resolveByValue(optsMoneda, entrega?.CodMoneda);
  const selTransporte  = resolveByValue(optsTransporte, entrega?.TipTransporte);
  const selCondPago    = resolveByValue(optsCondPago, entrega?.CondPago);
  const selEntregadoPor = resolveByLabel(optsEntregadoPor, entrega?.EntregadoPor);
  const selVendedor    = resolveByLabel(optsVendedores, entrega?.Vendedor);

  const selectClass = { classNamePrefix: 'react-select', menuPosition: 'fixed', menuShouldScrollIntoView: false };

  const setItemField = (index, field, value) =>
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));

  // Navegación tipo Excel entre celdas del detalle
  const cellRefs = useRef({});
  const focusCell = (row, col) => {
    const el = cellRefs.current[`${row}_${col}`];
    if (el) { el.focus(); el.select?.(); }
  };
  const handleCellKeyDown = (e, row, col) => {
    const lastRow = items.length - 1;
    const lastCol = ITEM_COLUMNS.length - 1;
    const isNumber = e.target.type === 'number';
    const atStart  = isNumber || e.target.selectionStart === 0;
    const atEnd    = isNumber || e.target.selectionStart === e.target.value.length;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (row < lastRow) focusCell(row + 1, col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) focusCell(row - 1, col);
    } else if (e.key === 'ArrowRight' && atEnd) {
      e.preventDefault();
      if (col < lastCol) focusCell(row, col + 1);
    } else if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      if (col > 0) focusCell(row, col - 1);
    }
  };

  // Guardado pendiente — aún no existe el endpoint para persistir estos cambios.
  const handleGuardar = () => {};

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>{t.query}</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/queries/delivery-report" className="text-primary hover:underline">
              {t.delivery_report}
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2 text-gray-800 dark:text-gray-100">
            {t.nro_delivery ?? 'Nro. Entrega'} {numEntrega}
          </li>
        </ul>

        <Link href="/admin/queries/delivery-report"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3
            text-sm text-gray-600 hover:bg-gray-50 transition
            dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800">
          <IconArrowBackward className="h-4 w-4" />
          {t.back}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notFound || !entrega ? (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <p className="text-sm text-gray-400 text-center py-10 px-4">{t.empty_results ?? 'Entrega no encontrada'}</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Datos de la Entrega */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.delivery_data ?? 'Datos de la Entrega'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                entrega.BlnDespachado
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
              }`}>
                {entrega.BlnDespachado ? (t.delivery_dispatched ?? 'Despachado') : (t.delivery_pending ?? 'Pendiente')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-4">
              <InfoField label={t.nro_delivery ?? 'Nro. Entrega'} value={entrega.NumEntrega} />
              <EditableField label={t.date} value={entrega.FecEntrega} onChange={(v) => setField('FecEntrega', v)} />
              <EditableField label={t.received_by} value={entrega.RecibidoPor} onChange={(v) => setField('RecibidoPor', v)} />
              <SelectField label={t.currency ?? 'Moneda'} value={selMoneda} options={optsMoneda} instanceId="sel-moneda" selectClass={selectClass}
                onChange={(opt) => setField('CodMoneda', opt?.value ?? '')} />
              <SelectField label={t.delivered_by} value={selEntregadoPor} options={optsEntregadoPor} instanceId="sel-entregado-por" selectClass={selectClass}
                onChange={(opt) => setField('EntregadoPor', opt?.label ?? '')} />
              <SelectField label={t.transport ?? 'Transporte'} value={selTransporte} options={optsTransporte} instanceId="sel-transporte" selectClass={selectClass}
                onChange={(opt) => { setField('TipTransporte', opt?.value ?? ''); setField('NomTransporte', opt?.label ?? ''); }} />
              <SelectField label={t.vendor ?? 'Vendedor'} value={selVendedor} options={optsVendedores} instanceId="sel-vendedor" selectClass={selectClass}
                onChange={(opt) => setField('Vendedor', opt?.label ?? '')} />
              <SelectField label={t.payment_condition ?? 'Cond. Pago'} value={selCondPago} options={optsCondPago} instanceId="sel-cond-pago" selectClass={selectClass}
                onChange={(opt) => setField('CondPago', opt?.value ?? '')} />
              <EditableField label={t.delivery_place ?? 'Lugar Entrega'} value={entrega.LugEntrega} onChange={(v) => setField('LugEntrega', v)} />
            </div>

            <div className="flex items-center justify-end px-4 pb-4">
              <button type="button" onClick={handleGuardar}
                className="h-9 rounded-lg bg-primary px-5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition">
                {t.btn_save ?? 'Guardar'}
              </button>
            </div>
          </div>

          {/* Fila 2: Detalle de la entrega (ítems) */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr>
                    <th className={`${thClass} text-center`} style={{ width: 44 }}>{t.nro ?? 'Nro.'}</th>
                    <th className={thClass} style={{ width: 120 }}>{t.nro_part}</th>
                    <th className={thClass}>{t.description}</th>
                    <th className={`${thClass} text-center`} style={{ width: 70 }}>{t.qty}</th>
                    <th className={thClass} style={{ width: 120 }}>{t.spare_part_type}</th>
                    <th className={thClass} style={{ width: 120 }}>{t.brand}</th>
                    <th className={thClass} style={{ width: 110 }}>{t.t_delivery}</th>
                    <th className={thClass} style={{ width: 90 }}>{t.origin ?? 'Origen'}</th>
                    <th className={thClass} style={{ width: 110 }}>H Code</th>
                    <th className={thClass} style={{ width: 100 }}>{t.material ?? 'Material'}</th>
                    <th className={thClass} style={{ width: 110 }}>{t.presentation ?? 'Presentación'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, rowIndex) => (
                    <tr key={item.NumCorrelativo ?? rowIndex}>
                      <td className={`${cellTdClass} text-center text-xs font-medium text-gray-400 px-3`}>{item.NumCorrelativo ?? rowIndex + 1}</td>
                      {ITEM_COLUMNS.map((col, colIndex) => (
                        <td key={col.key} className={cellTdClass}>
                          <input
                            type={col.type}
                            value={item[col.key]}
                            onChange={(e) => setItemField(rowIndex, col.key, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                            ref={(el) => { cellRefs.current[`${rowIndex}_${colIndex}`] = el; }}
                            className={`${cellInputClass} ${col.align ?? ''} ${col.className ?? ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
