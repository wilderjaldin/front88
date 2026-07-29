'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from "react-hook-form"
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess } from '@/app/lib/swal';
import { customFormat } from '@/app/lib/format';

const URL_PROVEEDORES_DISPONIBLES = 'ordenescompra/proveedores-disponibles';
const URL_DIVIDIR_CANTIDAD        = 'ordenescompra/dividir-cantidad';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`text-xs font-semibold ${accent ? 'text-primary' : 'text-gray-800 dark:text-gray-100'}`}>{value ?? '—'}</span>
  </div>
);

const TypeBadge = ({ label }) => (
  !label ? null : (
    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
      {label}
    </span>
  )
);

const mapOpcion = (o) => ({
  CodRepuesto:    o.codRepuesto,
  CodProveedor:   o.codProveedor,
  NomPrv:         o.razSoc,
  NroParteCompra: o.nroParteCompra,
  Aplicacion:     o.aplicacion,
  Tipo:           o.tipo,
  Costo:          o.costo,
});

const DivideQuantity = ({ close, t, item, setItems, order, CadNroOrden, setReload }) => {

  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [original,       setOriginal]       = useState(null);
  const [otherSuppliers, setOtherSuppliers] = useState([]);
  const [rows,           setRows]           = useState([]); // filas adicionales: [{ id, codRepuesto }]
  const nextRowIdRef = React.useRef(1);

  const { register, control, getValues, setValue } = useForm({ defaultValues: { data: {} } });

  useEffect(() => { getSuppliers(); }, [item]);

  const getSuppliers = async () => {
    setLoading(true);
    try {
      const rs = await axiosClient.post(URL_PROVEEDORES_DISPONIBLES, {
        nroParteCompra:     item.NroParteCompra,
        codProveedorActual: item.CodPrv,
        origenCompra:       item.OrigenCompra ?? null,
      });
      setOriginal(rs.data?.actual ? mapOpcion(rs.data.actual) : null);

      // El mismo proveedor puede ofrecer más de una opción (distinto repuesto/costo)
      // para la misma parte — son alternativas válidas, no duplicados. La identidad
      // de cada opción es codRepuesto, no codProveedor.
      setOtherSuppliers((rs.data?.otros ?? []).map(mapOpcion));
      setRows([]);
      nextRowIdRef.current = 1;
    } catch (error) {
      setOriginal(null);
      setOtherSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const watched      = useWatch({ control, name: 'data' }) ?? {};
  const totalOthers   = rows.reduce((sum, r) => sum + (Number(watched?.[r.id]?.quantity) || 0), 0);
  const originalQty   = item.CantFaltante - totalOthers;
  const canAddRow      = rows.length < otherSuppliers.length && originalQty > 1;

  const usedElsewhere = (rowId) => rows.filter(r => r.id !== rowId).map(r => r.codRepuesto);

  const supplierOptionsFor = (row) =>
    otherSuppliers.filter(s => s.CodRepuesto === row.codRepuesto || !usedElsewhere(row.id).includes(s.CodRepuesto));

  const addRow = () => {
    if (!canAddRow) return;
    const used = rows.map(r => r.codRepuesto);
    const next = otherSuppliers.find(s => !used.includes(s.CodRepuesto));
    if (!next) return;
    const id = nextRowIdRef.current++;
    setRows(prev => [...prev, { id, codRepuesto: next.CodRepuesto }]);
    setValue(`data.${id}.quantity`, 1);
  };

  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

  const changeRowSupplier = (id, codRepuesto) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, codRepuesto: Number(codRepuesto) } : r));

  const divide = async () => {
    if (rows.length === 0) {
      swalError(t.error, t.divide_quantity_no_rows ?? 'Agrega al menos una fila para dividir', t.close);
      return;
    }
    if (originalQty < 1) {
      swalError(t.error, t.divide_quantity_original_min ?? 'El proveedor original debe conservar al menos 1 unidad', t.close);
      return;
    }
    const hasInvalid = rows.some(r => Number(getValues(`data.${r.id}.quantity`)) <= 0);
    if (hasInvalid) {
      swalError(t.error, t.divide_quantity_invalid ?? 'Todas las cantidades deben ser mayores a 0', t.close);
      return;
    }

    // Solo las divisiones reales hacia proveedores alternativos — lo que se
    // queda con el proveedor original NO se manda, la API lo calcula sola.
    const divisiones = rows.map(r => {
      const supplier = otherSuppliers.find(s => s.CodRepuesto === r.codRepuesto);
      return {
        codProveedor: supplier?.CodProveedor,
        codRepuesto:  supplier?.CodRepuesto,
        cantidad:     Number(getValues(`data.${r.id}.quantity`)),
      };
    });

    const cadNroCotizacion = (CadNroOrden || String(item.NroOrden ?? ''))
      .toString()
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !Number.isNaN(n));

    // Si el ítem que se está dividiendo es a su vez el resultado de una división
    // previa (origenCompra "AX"), hay que decírselo a la API junto con su propio
    // numCorrelativo (el de la fila padre en vencomempen que se re-divide).
    const esRedivision = item.OrigenCompra === 'AX';

    setSubmitting(true);
    try {
      const rs = await axiosClient.post(URL_DIVIDIR_CANTIDAD, {
        nroCotizacion:    item.NroOrden,
        codItem:          item.CodItem,
        origenCompra:     esRedivision ? 'AX' : null,
        numCorrelativo:   esRedivision ? item.NumCorrelativo : null,
        divisiones,
        nomPrv:           order?.NomPrv,
        cadNroCotizacion,
      });

      // La respuesta es el mismo shape que preview-oc (detalle/contacto/datosAdicionales)
      // con toda la OC en armado ya refrescada — reemplaza la lista completa, no solo
      // la línea dividida.
      const refreshedItems = (rs.data?.detalle ?? []).map(d => ({
        CodRepuesto:           d.codRepuesto,
        CodPrv:                d.codProveedor ?? null,
        CodItem:               d.codItem,
        NroOrden:              d.nroCotizacion,
        NroParteCliente:       d.nroParte,
        NroParteCompra:        d.nroParteCompra,
        Descripcion:           d.desRepuesto,
        NomPrv:                d.razSoc ?? '',
        CantFaltante:          d.canFaltante,
        CantComprada:          d.canComprada,
        CostoSistema:          d.costo,
        CostoReal:             d.costoReal,
        Total:                 d.total,
        OrigenCompra:          d.origenCompra ?? '',
        isDivide:              d.isDivide ?? 0,
        EsDividido:            d.esDividido ?? false,
        NumCorrelativo:        d.numCorrelativo ?? null,
        PuedeDividirCantidad:  d.puedeDividirCantidad  ?? true,
        PuedeCambiarProveedor: d.puedeCambiarProveedor ?? true,
        CambioProveedor:       d.cambioProveedor ?? false,
        CodPrvOriginal:        d.codProveedorOriginal ?? null,
        NomPrvOriginal:        d.razSocOriginal ?? '',
      }));

      setItems(refreshedItems);
      setReload?.();

      swalSuccess(t.divide_quantity_success ?? 'Cantidad dividida correctamente');
      close();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.divide_quantity_error ?? 'No se pudo dividir la cantidad', t.close);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Resumen */}
      <div className="panel border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <InfoRow label={t.nro_part_customer} value={item.NroParteCliente} />
        <InfoRow label={t.nro_part_purchase} value={item.NroParteCompra} accent />
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t.amount}</span>
          <span className="inline-flex items-center rounded-lg bg-primary/10 dark:bg-primary/20 px-3 py-1 text-base font-bold text-primary">
            {item.CantFaltante}
          </span>
        </div>
      </div>

      {/* Tabla editable */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={thClass}>{t.supplier}</th>
                <th className={thClass}>{t.nro_part_purchase}</th>
                <th className={thClass}>{t.application}</th>
                <th className={thClass}>{t.type}</th>
                <th className={`${thClass} text-right`}>{t.cost}</th>
                <th className={`${thClass} text-center`}>{t.quantity}</th>
                <th className={`${thClass} w-10`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Fila fija: proveedor original — la cantidad se recalcula sola */}
              <tr className="bg-primary/5 dark:bg-primary/10">
                <td className={`${tdClass} font-semibold`}>
                  {original?.NomPrv ?? item.NomPrv ?? '—'}
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {t.original_supplier ?? 'Original'}
                  </span>
                </td>
                <td className={`${tdClass} font-medium text-primary`}>{original?.NroParteCompra ?? item.NroParteCompra}</td>
                <td className={tdClass}>{original?.Aplicacion ?? '—'}</td>
                <td className={tdClass}><TypeBadge label={original?.Tipo} /></td>
                <td className={`${tdClass} text-right`}>{customFormat(original?.Costo ?? item.CostoSistema ?? 0)}</td>
                <td className={`${tdClass} text-center font-semibold ${originalQty < 1 ? 'text-red-500' : ''}`}>
                  {originalQty}
                </td>
                <td className={tdClass}></td>
              </tr>

              {rows.map((row) => {
                const supplier = otherSuppliers.find(s => s.CodRepuesto === row.codRepuesto);
                return (
                  <tr key={row.id}>
                    <td className={tdClass}>
                      <select
                        value={row.codRepuesto}
                        onChange={(e) => changeRowSupplier(row.id, e.target.value)}
                        className="h-8 w-full min-w-[220px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {supplierOptionsFor(row).map(s => (
                          <option key={s.CodRepuesto} value={s.CodRepuesto}>
                            {s.NomPrv} — {customFormat(s.Costo)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${tdClass} font-medium text-primary`}>{supplier?.NroParteCompra ?? '—'}</td>
                    <td className={tdClass}>{supplier?.Aplicacion ?? '—'}</td>
                    <td className={tdClass}><TypeBadge label={supplier?.Tipo} /></td>
                    <td className={`${tdClass} text-right`}>{customFormat(supplier?.Costo ?? 0)}</td>
                    <td className={`${tdClass} text-center`}>
                      <input
                        type="number"
                        min={1}
                        defaultValue={1}
                        {...register(`data.${row.id}.quantity`, { valueAsNumber: true })}
                        className="h-8 w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        title={t.delete}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Agregar fila + resumen */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={addRow}
            disabled={!canAddRow}
            title={
              otherSuppliers.length === 0
                ? (t.divide_no_other_suppliers ?? 'No hay otros proveedores disponibles para esta parte')
                : rows.length >= otherSuppliers.length
                  ? (t.divide_no_more_suppliers ?? 'Ya se usaron todos los proveedores disponibles')
                  : originalQty <= 1
                    ? (t.divide_original_min ?? 'El proveedor original ya está en el mínimo (1)')
                    : undefined
            }
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t.btn_add}
          </button>
          <span className={`text-xs font-semibold ${originalQty >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {(t.divide_assigned_amount ?? 'Cantidad asignada')}: {totalOthers} / {Math.max(item.CantFaltante - 1, 0)}
          </span>
        </div>
      </div>

      {otherSuppliers.length === 0 && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t.divide_no_other_suppliers ?? 'No hay otros proveedores disponibles para esta parte.'}
        </p>
      )}

      <div className="flex justify-center mt-6">
        <button
          type="button"
          disabled={submitting || rows.length === 0 || originalQty < 1}
          onClick={divide}
          className="h-10 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          {submitting ? (t.saving ?? 'Guardando…') : t.divide_quantity}
        </button>
      </div>
    </div>
  );
};

export default DivideQuantity;
