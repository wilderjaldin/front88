"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { customFormat } from '@/app/lib/format';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import dynamic from 'next/dynamic';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconFile from '@/components/icon/icon-file';
import Modal from '@/components/modal';

const ProformaViewer = dynamic(() => import('./ProformaViewer'), { ssr: false });

const URL_COPY = (id) => `cotizaciondetalle/${id}/copia-argentina`;
const URL_UPDATE_COSTO = (id) => `cotizaciondetalle/${id}/copia-argentina/actualizar-costo`;
const URL_PROFORMA = (id) => `cotizaciondetalle/${id}/copia-argentina/proforma`;
const URL_CUSTOMER = (id) => `clientes/ficha/${id}`;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

const InfoField = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-28 shrink-0 text-right">{label}</label>
    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{value || '—'}</span>
  </div>
);

const mapEncabezado = (encabezado, id) => ({
  NroOrden:       encabezado?.nroCotizacion ?? id,
  NroPedido:      encabezado?.nroPedido     ?? '',
  FecCotizacion:  encabezado?.fecCotizacion ?? '',
  FecRegistra:    encabezado?.fecRegistra   ?? '',
  NroItems:       encabezado?.nroItems      ?? 0,
  TotRepuestos:   encabezado?.totalSus      ?? 0,
  MtoIva:         encabezado?.mtoIva        ?? 0,
  Descuento:      encabezado?.mtoDescuento  ?? 0,
  FleteInterno:   encabezado?.mtoFleteUs    ?? 0,
  TipMoneda:      encabezado?.tipMoneda     ?? '',
  TipoCambio:     encabezado?.tipCambio     ?? 0,
  TipEnvio:       encabezado?.preferenciaEnvio ?? '',
  FrmPago:        encabezado?.frmPago       ?? '',
  TipCotizacion:  encabezado?.tipCotizacion ?? '',
  CatCotizacion:  encabezado?.catCotizacion ?? '',
  MarcaEquipo:    encabezado?.marca         ?? '',
  ModeloEquipo:   encabezado?.modelo        ?? '',
  NroSerieEquipo: encabezado?.nroSerie      ?? '',
  AnioEquipo:     encabezado?.anio          ?? '',
  MarcaMotor:     encabezado?.marcaMo       ?? '',
  ModeloMotor:    encabezado?.modeloMo      ?? '',
  NroSerieMotor:  encabezado?.nroSerieMo    ?? '',
});

const mapItems = (detalle) => (detalle ?? []).map(d => ({
  CodItem:      d.codItem,
  Cantidad:     d.cant          ?? 0,
  NroParte:     d.nroParte      ?? '',
  DesRepuesto:  d.desRepuesto   ?? '',
  Peso:         d.peso          ?? 0,
  TipoRepuesto: d.tipRepuesto   ?? '',
  Aplicacion:   d.nomAplicacion ?? '',
  Proveedor:    d.nomMarca      ?? '',
  Costo:        d.costo         ?? 0,
  Total:        d.totSus        ?? 0,
  TiEntrega:    d.desTieEntrega ?? '',
}));

// Vista reducida/solo lectura de la copia Argentina de una cotización — generada
// vía POST cotizaciondetalle/{id}/copiar-argentina desde quote-form.js, mostrada
// aquí vía GET cotizaciondetalle/{id}/copia-argentina.
export default function QuotesArgentinaCopy() {
  const searchParams = useSearchParams();
  const t = useTranslation();

  const id          = searchParams.get("id");
  const customer_id = searchParams.get("customer");

  const [order,    setOrder]    = useState(null);
  const [items,    setItems]    = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadingProforma, setLoadingProforma] = useState(false);
  const [showProforma, setShowProforma] = useState(false);
  const [proformaUrl, setProformaUrl] = useState(null);

  useDynamicTitle(`${t.quote} | Copia Argentina`);

  useEffect(() => {
    if (customer_id) {
      axiosClient.get(URL_CUSTOMER(customer_id))
        .then(rs => {
          const c = rs.data?.cliente;
          if (c) setCustomer({
            NomCliente: c.nomCliente ?? c.NomCliente ?? '',
            NomPais:    c.nomPais    ?? c.NomPais    ?? '',
            CodPais:    c.codPais    ?? c.CodPais    ?? '',
          });
        })
        .catch(() => {});
    }
  }, [customer_id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axiosClient.get(URL_COPY(id))
      .then(rs => {
        const { encabezado, items: detalle } = rs.data ?? {};
        setOrder(mapEncabezado(encabezado, id));
        setItems(mapItems(detalle));
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCostoBlur = async (item, newCosto) => {
    if (isNaN(newCosto) || newCosto < 0 || newCosto === item.Costo) return;
    try {
      const rs = await axiosClient.put(URL_UPDATE_COSTO(id), {
        codItem: item.CodItem,
        costo:   newCosto,
      });
      const { encabezado, items: detalle } = rs.data ?? {};
      setOrder(mapEncabezado(encabezado, id));
      setItems(mapItems(detalle));
    } catch {}
  };

  const handleProforma = async () => {
    if (loadingProforma) return;
    setLoadingProforma(true);
    try {
      const rs = await axiosClient.get(URL_PROFORMA(id), { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([rs.data], { type: 'application/pdf' }));
      setProformaUrl(blobUrl);
      setShowProforma(true);
    } catch {}
    finally { setLoadingProforma(false); }
  };

  const closeProforma = () => {
    setShowProforma(false);
    if (proformaUrl) URL.revokeObjectURL(proformaUrl);
    setProformaUrl(null);
  };

  const backHref = customer_id
    ? `/admin/revision/quotes?customer=${customer_id}&option=quotes&id=${id}`
    : '/admin/revision/orders-process';

  const totalFinal = order?.TotRepuestos ?? 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>{t.revision}</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/revision/orders-process" className="text-primary hover:underline">
              {t.orders_in_process}
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2">
            <Link
              href={`/admin/revision/orders-process?customer=${customer_id}&option=quotes`}
              className="text-primary hover:underline"
            >
              {t.quotes}
            </Link>
          </li>
          {customer?.NomCliente && (
            <li className="before:content-['/'] before:mx-2">
              <span
                title={customer.NomPais || undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5
                  text-xs font-semibold text-primary"
              >
                {customer.CodPais && (
                  <img
                    src={`/assets/flags/${customer.CodPais.toLowerCase()}.svg`}
                    alt={customer.NomPais}
                    className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                  />
                )}
                {customer.NomCliente}
              </span>
            </li>
          )}
        </ul>

        <Link href={backHref}
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
      ) : notFound || !order ? (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <p className="text-sm text-gray-400 text-center py-10 px-4">{t.quote_not_found ?? 'Cotización no encontrada'}</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Fila 1: Cabecera + Resumen */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Cabecera */}
            <div className="xl:col-span-2 panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.quote_data ?? 'Datos de la Cotización'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>

              {/* Equipo + Motor en 2 columnas inline */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-4">

                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-blue-200 dark:bg-blue-800 rounded" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 px-1">{t.equipment_data}</span>
                  <div className="h-px flex-1 bg-blue-200 dark:bg-blue-800 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-violet-200 dark:bg-violet-800 rounded" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 px-1">{t.engine_data}</span>
                  <div className="h-px flex-1 bg-violet-200 dark:bg-violet-800 rounded" />
                </div>

                <InfoField label={t.brand} value={order.MarcaEquipo} />
                <InfoField label={t.brand} value={order.MarcaMotor} />
                <InfoField label={t.model} value={order.ModeloEquipo} />
                <InfoField label={t.model} value={order.ModeloMotor} />
                <InfoField label={t.equipment_serie ?? 'Serie'} value={order.NroSerieEquipo} />
                <InfoField label={t.engine_serie ?? 'Serie'} value={order.NroSerieMotor} />
                <InfoField label={t.year} value={order.AnioEquipo} />
              </div>
            </div>

            {/* Resumen */}
            <div className="flex flex-col panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.summary ?? 'Resumen'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.nro_quote}</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">{order.NroOrden}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.nro_items}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.NroItems}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.nro_pedido}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.NroPedido || '—'}</span>
                </div>
                <div className="flex-1 flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total $us</span>
                  <span className="text-base font-bold text-primary">{customFormat(totalFinal)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Fila 2: Detalle de la cotización (ítems) */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button type="button" onClick={handleProforma} disabled={loadingProforma}
                className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-white shadow-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {loadingProforma
                  ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <IconFile className="h-3.5 w-3.5" />}
                {t.proforma ?? 'Proforma'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr>
                    <th className={`${thClass} w-10 text-center`}>#</th>
                    <th className={`${thClass} w-16 text-center`}>{t.qty}</th>
                    <th className={thClass}>{t.nro_part}</th>
                    <th className={thClass}>{t.description}</th>
                    <th className={`${thClass} text-right`}>{t.weight_unit}</th>
                    <th className={thClass}>{t.spare_part_type}</th>
                    <th className={thClass}>{t.application}</th>
                    <th className={thClass}>{t.supplier ?? 'Proveedor'} / {t.brand}</th>
                    <th className={`${thClass} text-right`}>{t.cost ?? 'Costo'}</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={thClass}>{t.t_delivery}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.CodItem ?? index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className={`${tdClass} text-center font-medium text-gray-400`}>{item.CodItem ?? index + 1}</td>
                      <td className={`${tdClass} text-center`}>{item.Cantidad}</td>
                      <td className={`${tdClass} whitespace-nowrap font-medium`}>{item.NroParte}</td>
                      <td className={tdClass}>{item.DesRepuesto}</td>
                      <td className={`${tdClass} text-right`}>{customFormat(item.Peso)}</td>
                      <td className={tdClass}>{item.TipoRepuesto || '—'}</td>
                      <td className={tdClass}>{item.Aplicacion || 'N/A'}</td>
                      <td className={tdClass}>{item.Proveedor || '—'}</td>
                      <td className={`${tdClass} text-right`}>
                        <input type="number" step="any" defaultValue={item.Costo} key={item.Costo}
                          onBlur={(e) => handleCostoBlur(item, parseFloat(e.target.value))}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                          className="h-8 w-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      </td>
                      <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(item.Total)}</td>
                      <td className={tdClass}>{item.TiEntrega || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      )}

      <Modal size="w-full max-w-4xl" title={t.proforma ?? 'Proforma'}
        showModal={showProforma} closeModal={closeProforma} openModal={() => setShowProforma(true)}
        content={proformaUrl && <ProformaViewer pdfUrl={proformaUrl} fileName={`Proforma-${id}.pdf`} t={t} />} />
    </>
  );
}
