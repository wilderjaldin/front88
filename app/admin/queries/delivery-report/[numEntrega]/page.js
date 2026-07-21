"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/locales";
import axiosClient from '@/app/lib/axiosClient';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconArrowBackward from '@/components/icon/icon-arrow-backward';

const URL_ENTREGA = (num) => `entregas/${num}`;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

const InfoField = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-28 shrink-0 text-right">{label}</label>
    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{value || '—'}</span>
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
  TipTransporte:  d?.tipTransporte  ?? '',
  NomTransporte:  d?.nomTransporte  ?? '',
  CondPago:       d?.condPago       ?? '',
  CodMoneda:      d?.codMoneda      ?? '',
  LugEntrega:     d?.lugEntrega     ?? '',
  BlnDespachado:  d?.blnDespachado  ?? false,
  CodEstado:      d?.codEstado      ?? '',
  NomEmpresaEnt:  d?.nomEmpresaEnt  ?? '',
  NomContactoEnt: d?.nomContactoEnt ?? '',
  NomPaisEnt:     d?.nomPaisEnt     ?? '',
  NomCiudadEnt:   d?.nomCiudadEnt   ?? '',
  DireccionEnt:   d?.direccionEnt   ?? '',
  TelefonoEnt:    d?.telefonoEnt    ?? '',
  EmailEnt:       d?.emailEnt       ?? '',
  NomEstadoEnt:   d?.nomEstadoEnt   ?? '',
  CodPostalEnt:   d?.codPostalEnt   ?? '',
});

const mapItems = (items) => (items ?? []).map(i => ({
  NumCorrelativo: i.numCorrelativo ?? '',
  NumEmbalaje:    i.numEmbalaje    ?? '',
  NroCotizacion:  i.nroCotizacion  ?? '',
  CodItem:        i.codItem        ?? '',
  NroParte:       i.nroParte       ?? '',
  NroParteCompra: i.nroParteCompra ?? '',
  DesRepuesto:    i.desRepuesto    ?? '',
  Cantidad:       i.cantidad       ?? 0,
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

  useDynamicTitle(`${t.delivery_report} | ${numEntrega}`);

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

          {/* Fila 1: Datos de la Entrega + Dirección de Entrega */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Datos de la Entrega */}
            <div className="xl:col-span-2 panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
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
                <InfoField label={t.date} value={entrega.FecEntrega} />
                <InfoField label={t.customer} value={entrega.NomCliente} />
                <InfoField label={t.to_customer ?? 'Destino'} value={entrega.Destino} />
                <InfoField label={t.received_by} value={entrega.RecibidoPor} />
                <InfoField label={t.delivered_by} value={entrega.EntregadoPor} />
                <InfoField label={t.transport ?? 'Transporte'} value={entrega.NomTransporte} />
                <InfoField label={t.payment_condition ?? 'Cond. Pago'} value={entrega.CondPago} />
                <InfoField label={t.currency ?? 'Moneda'} value={entrega.CodMoneda} />
                <InfoField label={t.delivery_place ?? 'Lugar Entrega'} value={entrega.LugEntrega} />
              </div>
            </div>

            {/* Dirección de Entrega */}
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.delivery_address ?? 'Dirección de Entrega'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <div className="p-4 space-y-2">
                <InfoField label={t.company ?? 'Empresa'} value={entrega.NomEmpresaEnt} />
                <InfoField label={t.contact} value={entrega.NomContactoEnt} />
                <InfoField label={t.country ?? 'País'} value={entrega.NomPaisEnt} />
                <InfoField label={t.city ?? 'Ciudad'} value={entrega.NomCiudadEnt} />
                <InfoField label={t.state ?? 'Estado'} value={entrega.NomEstadoEnt} />
                <InfoField label={t.zip_code ?? 'Cód. Postal'} value={entrega.CodPostalEnt} />
                <InfoField label={t.address ?? 'Dirección'} value={entrega.DireccionEnt} />
                <InfoField label={t.phone ?? 'Teléfono'} value={entrega.TelefonoEnt} />
                <InfoField label={t.email ?? 'Email'} value={entrega.EmailEnt} />
              </div>
            </div>

          </div>

          {/* Fila 2: Detalle de la entrega (ítems) */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr>
                    <th className={`${thClass} w-10 text-center`}>#</th>
                    <th className={thClass}>{t.nro_part}</th>
                    <th className={thClass}>{t.nro_part_buy ?? 'Nro. Parte Compra'}</th>
                    <th className={thClass}>{t.description}</th>
                    <th className={`${thClass} text-center`}>{t.qty}</th>
                    <th className={thClass}>{t.presentation ?? 'Presentación'}</th>
                    <th className={thClass}>{t.material ?? 'Material'}</th>
                    <th className={thClass}>{t.origin ?? 'Origen'}</th>
                    <th className={thClass}>H Code</th>
                    <th className={`${thClass} text-center`}>{t.nro_quote}</th>
                    <th className={`${thClass} text-center`}>{t.packaging ?? 'Embalaje'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.NumCorrelativo ?? index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className={`${tdClass} text-center font-medium text-gray-400`}>{item.NumCorrelativo ?? index + 1}</td>
                      <td className={`${tdClass} whitespace-nowrap font-medium`}>{item.NroParte}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>{item.NroParteCompra || '—'}</td>
                      <td className={tdClass}>{item.DesRepuesto}</td>
                      <td className={`${tdClass} text-center`}>{item.Cantidad}</td>
                      <td className={tdClass}>{item.Presentacion || '—'}</td>
                      <td className={tdClass}>{item.Material || '—'}</td>
                      <td className={tdClass}>{item.Origen || '—'}</td>
                      <td className={tdClass}>{item.HCode || '—'}</td>
                      <td className={`${tdClass} text-center`}>{item.NroCotizacion || '—'}</td>
                      <td className={`${tdClass} text-center`}>{item.NumEmbalaje || '—'}</td>
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
