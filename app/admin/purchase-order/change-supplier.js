'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { swalError, swalConfirm, swalSuccess } from '@/app/lib/swal';

const URL_OPCIONES_PROVEEDOR  = 'ordenescompra/opciones-proveedor';
const URL_CAMBIAR_PROVEEDOR   = 'ordenescompra/cambiar-proveedor';
const URL_VERIFICAR_REVERSION = (numCorrelativo) => `ordenescompra/dividir-cantidad/${numCorrelativo}/verificar-reversion`;

const mapOpcionProveedor = (o) => ({
  CodRepuesto:     o.codRepuesto,
  CodProveedor:    o.codProveedor,
  NroParteCompra:  o.nroParteCompra,
  NroParteCliente: o.nroParte,
  Aplicacion:      o.aplicacion,
  TipoRep:         o.tipo,
  Costo:           o.costo,
  NomPrv:          o.razSoc,
});

const mapDetalleItem = (d) => ({
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
});

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const TypeBadge = ({ label }) => (
  !label ? null : (
    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
      {label}
    </span>
  )
);

const ChangeSupplier = ({ CadNroOrden, close, t, item, setItems, setSelectedItems, setReload, order }) => {

  const locale = useSelector(getLocale);

  const [suppliers,  setSuppliers]  = useState([]);
  const [top,        setTop]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected,   setSelected]   = useState(null);

  useEffect(() => { getList(); }, [item]);

  const getList = async () => {
    setLoading(true);
    try {
      const data = {
        nroParte:       item.NroParteCliente,
        nroParteCompra: item.NroParteCompra,
      };
      const codProveedorActual = item?.CodPrv ?? order?.CodPrv;
      if (codProveedorActual) data.codProveedorActual = codProveedorActual;

      const rs = await axiosClient.post(URL_OPCIONES_PROVEEDOR, data, {
        headers: { Idioma: (locale ?? 'es').toUpperCase() },
      });

      setTop(rs.data.actual ? mapOpcionProveedor(rs.data.actual) : null);
      setSuppliers((rs.data.otros ?? []).map(mapOpcionProveedor));
      setSelected(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSupplier = async () => {
    if (!selected) return;

    const cant = item.CantFaltante;

    setSubmitting(true);
    try {
      // Los ítems ya divididos (AX) pasan primero por la verificación de reversión —
      // trae el "motivo" cuando esa fila puntual no admite más cambios.
      if (item.OrigenCompra === 'AX' && item.NumCorrelativo) {
        const verifyRs = await axiosClient.get(URL_VERIFICAR_REVERSION(item.NumCorrelativo));
        if (!verifyRs.data?.puedeRevertir) {
          swalError(t.error ?? 'Error', verifyRs.data?.motivo ?? (t.change_supplier_not_allowed ?? 'Este ítem no admite cambios en este momento.'), t.close ?? 'Cerrar');
          setSubmitting(false);
          return;
        }
      }

      const result = await swalConfirm(
        t.question_change_supplier ?? '¿Cambiar proveedor?',
        `${cant} × ${item.Descripcion ?? item.NroParteCompra} — ${top?.NomPrv ?? item.NomPrv ?? ''} → ${selected.NomPrv}`,
        { confirmText: t.yes ?? 'Sí', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#4f46e5' }
      );
      if (!result.isConfirmed) { setSubmitting(false); return; }

      const cadNroCotizacion = (CadNroOrden || String(item.NroOrden ?? ''))
        .toString()
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !Number.isNaN(n));

      const rs = await axiosClient.post(URL_CAMBIAR_PROVEEDOR, {
        nroCotizacion:    item.NroOrden,
        codItem:          item.CodItem,
        origenCompra:     item.OrigenCompra || 'CT',
        numCorrelativo:   item.OrigenCompra === 'AX' ? item.NumCorrelativo : null,
        codRepuesto:      selected.CodRepuesto,
        cantidad:         cant,
        nomPrv:           order?.NomPrv,
        cadNroCotizacion,
      });

      setItems((rs.data?.detalle ?? []).map(mapDetalleItem));
      setSelectedItems?.([]);
      setReload?.();
      swalSuccess(t.change_supplier_success ?? 'Proveedor actualizado correctamente');
      close();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error ?? 'Error', apiMsg ?? (t.change_supplier_error_server ?? 'No se pudo cambiar el proveedor.'), t.close ?? 'Cerrar');
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
      {/* Selección actual */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          {t.current_supplier ?? 'Proveedor Actual'}
        </p>
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={thClass}>{t.nro_part_customer}</th>
                  <th className={thClass}>{t.nro_part_purchase}</th>
                  <th className={thClass}>{t.application}</th>
                  <th className={`${thClass} text-center`}>{t.amount}</th>
                  <th className={`${thClass} text-right`}>{t.cost}</th>
                  <th className={thClass}>{t.type}</th>
                  <th className={thClass}>{t.supplier}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdClass}>{top?.NroParteCliente ?? item.NroParteCliente}</td>
                  <td className={`${tdClass} font-medium text-primary`}>{top?.NroParteCompra ?? item.NroParteCompra}</td>
                  <td className={tdClass}>{top?.Aplicacion ?? '—'}</td>
                  <td className={`${tdClass} text-center`}>{item.CantFaltante}</td>
                  <td className={`${tdClass} text-right font-medium`}>{customFormat(top?.Costo ?? 0)}</td>
                  <td className={tdClass}><TypeBadge label={top?.TipoRep} /></td>
                  <td className={tdClass}>{top?.NomPrv}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alternativas */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          {t.other_suppliers ?? 'Otros Proveedores'}
        </p>
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-gray-900">
              <thead>
                <tr>
                  <th className={`${thClass} w-10`}></th>
                  <th className={thClass}>{t.nro_part_customer}</th>
                  <th className={thClass}>{t.nro_part_purchase}</th>
                  <th className={thClass}>{t.application}</th>
                  <th className={`${thClass} text-center`}>{t.amount}</th>
                  <th className={`${thClass} text-right`}>{t.cost}</th>
                  <th className={thClass}>{t.type}</th>
                  <th className={thClass}>{t.supplier}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                      {t.no_other_suppliers ?? 'No hay otros proveedores disponibles para esta parte.'}
                    </td>
                  </tr>
                ) : suppliers.map((s, index) => {
                  const isSelected = selected?.CodRepuesto === s.CodRepuesto;
                  return (
                    <tr
                      key={index}
                      onClick={() => setSelected(s)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    >
                      <td className={`${tdClass} text-center`}>
                        <input
                          type="radio"
                          name="supplier"
                          className="accent-primary cursor-pointer"
                          checked={isSelected}
                          onChange={() => setSelected(s)}
                        />
                      </td>
                      <td className={tdClass}>{s.NroParteCliente}</td>
                      <td className={`${tdClass} font-medium text-primary`}>{s.NroParteCompra}</td>
                      <td className={tdClass}>{s.Aplicacion ?? '—'}</td>
                      <td className={`${tdClass} text-center`}>{item.CantFaltante}</td>
                      <td className={`${tdClass} text-right font-medium`}>{customFormat(s.Costo)}</td>
                      <td className={tdClass}><TypeBadge label={s.TipoRep} /></td>
                      <td className={tdClass}>{s.NomPrv}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <button
          disabled={!selected || submitting}
          type="button"
          onClick={handleChangeSupplier}
          className="h-10 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
        >
          {submitting ? (t.saving ?? 'Guardando…') : (t.select ?? 'Seleccionar')}
        </button>
      </div>
    </div>
  );
};

export default ChangeSupplier;
