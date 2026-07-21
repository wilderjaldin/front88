'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import CostSummary from "@/components/cost-summary"
import BtnPrintQuote from "@/components/BtnPrintQuote"
import AttachListView from "@/components/forms/attach-list-view"
import DeliveryAddressForm from "@/components/forms/delivery-address-form"
import { customFormat } from '@/app/lib/format';
import IconAttachment from '@/components/icon/icon-attachment';

const URL_CONTROLES = 'cotizaciones/controles';

const toolbarBtnClass = "h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700";
const pillBtnClass = "h-8 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-[11px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition";
const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5";

const Field = ({ label, value }) => (
  <div>
    <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value || '—'}</p>
  </div>
);

const InfoField = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{label}</label>
    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{value || '—'}</span>
  </div>
);

const resolveLabel = (opts, code) => opts.find(o => o.value?.trim() === code?.trim())?.label ?? code ?? '—';

const getContactPhones = (c) => Array.from(new Set([c?.numTelefono1, c?.numTelefono2, c?.numTelefono3].filter(Boolean)));
const getContactEmails = (c) => Array.from(new Set([c?.email1, c?.email2].filter(Boolean)));

// Mismo modal de detalle de contacto que ContactQuoteSection.openContactInfo
// (components/forms/contact-quote-section.js) — reutilizado tal cual, sin
// variaciones, para que "Información de contacto" se vea siempre igual en
// toda la app.
const ContactDetail = ({ contact }) => {
  const phones = getContactPhones(contact);
  const emails = getContactEmails(contact);
  const initials = (contact?.nomContacto ?? 'C').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();

  return (
    <div className="-mx-1">
      <div className="flex items-center gap-3 px-5 pt-1 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-sm font-bold leading-none select-none">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight truncate">{contact?.nomContacto}</p>
          {contact?.nomCargo
            ? <p className="text-xs text-gray-400 mt-0.5 truncate">{contact.nomCargo}</p>
            : <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Sin cargo</p>}
        </div>
      </div>

      {phones.length > 0 && (
        <div className="px-5 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Teléfono</span>
          </div>
          <div className="space-y-1">
            {phones.map((p, i) => (
              <div key={i} className="flex items-center px-2.5 py-1.5">
                <span className="text-sm font-mono text-gray-700 dark:text-gray-200">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phones.length > 0 && emails.length > 0 && (
        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-5" />
      )}

      {emails.length > 0 && (
        <div className="px-5 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Email</span>
          </div>
          <div className="space-y-1">
            {emails.map((e, i) => (
              <div key={i} className="flex items-center px-2.5 py-1.5">
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{e.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phones.length === 0 && emails.length === 0 && (
        <div className="px-5 py-6 flex flex-col items-center gap-2 text-gray-300 dark:text-gray-600">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
          </svg>
          <p className="text-sm">Sin información de contacto</p>
        </div>
      )}
      <div className="pb-2" />
    </div>
  );
};

// Pantalla puramente informativa — la orden ya fue confirmada y no admite
// modificaciones. Solo quedan disponibles Imprimir, Instrucciones de Entrega,
// Resumen de Costo y la lista de archivos adjuntos (subir/descargar).
const ConfirmedQuoteForm = ({ t, token, _customer_, _order_ = [], _items_ = [], _tracking_ }) => {

  const [show_modal,   setShowModal]   = useState(false);
  const [modal_title,  setModalTitle]  = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size,   setModalSize]   = useState('w-full max-w-5xl');
  const [order, setOrder] = useState(_order_);
  const [items, setItems] = useState(_items_);
  const [optsMoneda,    setOptsMoneda]    = useState([]);
  const [optsTipoEnvio, setOptsTipoEnvio] = useState([]);
  const [optsEstado,    setOptsEstado]    = useState([]);

  useEffect(() => { setOrder(_order_); }, [_order_]);
  useEffect(() => { setItems(_items_); }, [_items_]);

  useEffect(() => {
    if (!order?.NroOrden) return;
    axiosClient.get(URL_CONTROLES, { params: { nroCotizacion: order.NroOrden } })
      .then(rs => {
        setOptsMoneda(rs.data.monedas ?? []);
        setOptsTipoEnvio(rs.data.tiposEnvio ?? []);
        setOptsEstado(rs.data.estados ?? []);
      })
      .catch(() => {});
  }, [order?.NroOrden]);

  const contactInfo = () => {
    setModalTitle('Información de contacto');
    setModalSize('w-full max-w-xs');
    setModalContent(<ContactDetail contact={order.Contacto} />);
    setShowModal(true);
  };

  const instructions = () => {
    setModalTitle(t.delivery_instruction);
    setModalSize('w-full max-w-xl');
    setModalContent(<DeliveryAddressForm close={() => setShowModal(false)} order_id={order.NroOrden} customer={_customer_} t={t} />);
    setShowModal(true);
  };

  const costSummary = () => {
    setModalTitle('');
    setModalSize('w-full max-w-sm');
    setModalContent(<CostSummary close={() => setShowModal(false)} order={order} token={token} t={t} />);
    setShowModal(true);
  };

  const attach = () => {
    setModalTitle('Archivos adjuntos');
    setModalSize('w-full max-w-2xl');
    setModalContent(<AttachListView close={() => setShowModal(false)} nro={order.NroOrden} t={t} />);
    setShowModal(true);
  };

  const Row = ([label, val], i, last) => (
    <div key={i} className={`flex items-center justify-between px-4 py-2 ${last ? '' : 'border-b border-gray-100 dark:border-gray-700/60'}`}>
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 ml-2 text-right">{val}</span>
    </div>
  );

  const colA = [
    [t.nro_quote, <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">{order?.NroOrden}</span>],
    [t.nro_items, order?.NroItems],
    [t.total_weight_lb, customFormat(order?.TotalPeso)],
    ['Tipo de Cotización', order?.TipCotizacion || order?.Categoria || '—'],
  ];
  const colB = [
    ['Vendedor Asignado', order?.Vendedor || '—'],
    ['Fecha de Cotización', order?.FecCotizacion || '—'],
    [t.exchange_rate, order?.TipoCambio],
    [t.quote_total, customFormat(order?.Total)],
  ];

  return (
    <div className="space-y-4">

      {order?.NroOrden ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Datos de la Cotización (solo lectura) */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.quote_data ?? 'Datos de la Cotización'}</p>
              <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
            </div>
            <div className="bg-white dark:bg-gray-900">

              {/* Nro. Pedido */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <label className="text-[11px] text-gray-400 dark:text-gray-500 w-16 shrink-0 text-right">{t.nro_pedido}</label>
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{order.NroPedido || '—'}</span>
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
          </div>

          <div className="space-y-4">

            {/* Resumen */}
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/60">
                <div>{colA.map((r, i) => Row(r, i, i === colA.length - 1))}</div>
                <div>{colB.map((r, i) => Row(r, i, i === colB.length - 1))}</div>
              </div>
            </div>

            {/* Compartir con + Contacto (solo lectura) */}
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/60">
                <div className="flex items-center gap-2 px-4 py-3 min-w-0">
                  <span className="text-sm text-gray-500 shrink-0">{t.share_with}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{_tracking_?.nomUsuario || '—'}</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 min-w-0">
                  <span className="text-sm text-gray-500 shrink-0">{t.contact}</span>
                  {order.Contacto?.nomContacto ? (
                    <button type="button" onClick={contactInfo} title="Ver información de contacto"
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-sky-700/60 dark:hover:bg-sky-900/20 transition min-w-0">
                      <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      </svg>
                      <span className="text-xs font-medium truncate">{order.Contacto.nomContacto}</span>
                      {order.Contacto.nomCargo && (
                        <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">· {order.Contacto.nomCargo}</span>
                      )}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones de reporte */}
            <div className="panel border border-gray-200 dark:border-gray-700 p-0 overflow-hidden">
              <div className="flex items-stretch divide-x divide-gray-100 dark:divide-gray-700/60">

                {/* Columnas a mostrar */}
                <div className="w-1/4 shrink-0 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-center text-gray-400 dark:text-gray-500 mb-2.5">
                    {t.columns_to_show_report ?? 'Columnas a mostrar en el reporte'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { key: 'nro_part', label: 'Nro. Parte', checked: order.MostrarCodigo === 1 },
                      { key: 'peso',     label: 'Peso',       checked: order.MostrarPeso   === 1 },
                    ].map(({ key, label, checked }) => (
                      <span key={key}
                        className={`inline-flex items-center gap-1.5 select-none px-3 py-1.5 rounded-lg border text-xs font-medium
                          ${checked
                            ? 'border-primary/50 bg-primary/10 text-primary dark:bg-primary/15'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                          }`}>
                        <span className={`h-3.5 w-3.5 rounded border-[1.5px] flex items-center justify-center shrink-0
                          ${checked ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                          {checked && (
                            <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                              <path d="M1 3l1.8 2L6 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Configuración de cotización */}
                <div className="flex-1 px-4 py-3 grid grid-cols-3 gap-3">
                  <InfoField label={t.currency ?? 'Moneda'} value={resolveLabel(optsMoneda, order.TipMoneda)} />
                  <InfoField label={t.shipping_type ?? 'Tipo Envío'} value={resolveLabel(optsTipoEnvio, order.TipEnvio)} />
                  <InfoField label={t.status} value={resolveLabel(optsEstado, order.CodEstado)} />
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          <p className="text-sm text-gray-400 text-center py-6 px-4">{t.no_order ?? 'Sin información'}</p>
        </div>
      )}

      {order?.NroOrden && (
        <>
          {/* Toolbar + tabla de ítems */}
          <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <BtnPrintQuote order={order} token={token} className={toolbarBtnClass} />
                <button onClick={attach} title={t.attach} type="button" className={toolbarBtnClass}>
                  <IconAttachment className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={instructions} type="button" className={pillBtnClass}>{t.delivery_instruction}</button>
                <button onClick={costSummary} type="button" className={pillBtnClass}>{t.cost_summary}</button>
              </div>
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
                    <th className={thClass}>{t.brand}</th>
                    <th className={`${thClass} text-right`}>{t.price_unit}</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={thClass}>{t.t_delivery}</th>
                    <th className={`${thClass} text-right`}>{t.days_of_validity}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.CodItem ?? index}
                      className={`transition ${item.ParPrecio
                        ? 'bg-amber-50 dark:bg-amber-900/15'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <td className={`${tdClass} text-center font-medium text-gray-400`}>{item.CodItem ?? index + 1}</td>
                      <td className={`${tdClass} text-center`}>{item.Cantidad}</td>
                      <td className={`${tdClass} whitespace-nowrap font-medium`}>{item.NroParte}</td>
                      <td className={tdClass}>{item.DesRepuesto}</td>
                      <td className={`${tdClass} text-right`}>{customFormat(item.Peso)}</td>
                      <td className={tdClass}>{item.TipoRepuesto}</td>
                      <td className={tdClass}>{item.Aplicacion}</td>
                      <td className={tdClass}>{item.Marca}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{customFormat(item.Precio)}</td>
                      <td className={`${tdClass} text-right tabular-nums font-medium`}>{customFormat(item.Total)}</td>
                      <td className={tdClass}>{item.TiEntrega}</td>
                      <td className={`${tdClass} text-right`}>{item.DiasVigencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.some(i => i.ParPrecio) && (
              <div className="flex items-center gap-2 px-4 pt-2 pb-3">
                <span className="inline-block h-3 w-5 rounded-sm bg-amber-200 dark:bg-amber-700/50 border border-amber-300 dark:border-amber-600 shrink-0" />
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{t.par_precio_legend ?? 'Con parámetro de precio'}</span>
              </div>
            )}
          </div>

          {/* Notas (solo lectura) + Resumen financiero */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.notes ?? 'Notas'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <div className="p-4 space-y-3">
                <Field label={t.note_to_customer} value={order.NotaCliente} />
                <Field label={t.note_to_user} value={order.NotaUsuario} />
              </div>
            </div>

            <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.summary ?? 'Resumen'}</p>
                <div className="h-0.5 w-8 rounded bg-primary/60 mt-0.5" />
              </div>
              <div className="p-4 space-y-0">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.total_spare_parts}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.TotRepuestos)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.freight}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.FleteInterno)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.discount}</span>
                  <span className="text-sm font-semibold text-red-500">{order.Descuento ? `- ${customFormat(order.Descuento)}` : '0.00'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-500">{t.tax}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customFormat(order.MtoIva)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total $us</span>
                  <span className="text-base font-bold text-primary">{customFormat(order.Total)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content} />
    </div>
  );
};

export default ConfirmedQuoteForm;
