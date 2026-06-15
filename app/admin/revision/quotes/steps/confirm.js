'use client';

import React from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearBuyWizard } from '@/store/buyWizardSlice';
import { customFormat } from '@/app/lib/format';

const URL_CONFIRM = 'cotizaciondetalle/confirmarcot';

const ICON_CHECK    = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X        = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_QUESTION = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const swalSuccess = (title, msg = '') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    ${msg ? `<p style="color:#94a3b8;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.08em">${msg}</p>` : ''}
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0;line-height:1.3">${title}</h2>
  </div>`,
  position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#ef4444',
});

const swalConfirm = (title, msg = '', { confirmText = 'Sí', cancelText = 'Cancelar', confirmColor = '#4f46e5' } = {}) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_QUESTION}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showCancelButton: true, reverseButtons: true,
  confirmButtonText: confirmText, cancelButtonText: cancelText, confirmButtonColor: confirmColor,
});

const ConfirmQuote = ({
  summary, shipping_info, contact, option_payment,
  info_payment, info_contact, token, t, order_id, goTo,
}) => {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const dispatch    = useDispatch();

  const goToQuote = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('step');
    params.set('option', 'quotes');
    router.replace(`/admin/revision/quotes?${params.toString()}`);
  };

  const confirmQuote = () => {
    swalConfirm(t.question_buy_quote, '', {
      confirmText: t.yes_confirm,
      cancelText: t.btn_cancel,
      confirmColor: '#15803d',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.put(URL_CONFIRM, {
          NroCotizacion:     order_id,
          FrmPago:           option_payment,
          DirEntNomPais:     shipping_info.country      ?? '',
          DirEntNomCiudad:   shipping_info.city         ?? '',
          DirEntDireccion:   shipping_info.address      ?? '',
          DirEntNomEmpresa:  shipping_info.company      ?? '',
          DirEntNomContacto: shipping_info.contact      ?? '',
          DirEntNumTelefono: shipping_info.phone        ?? '',
          DirEntMail:        shipping_info.email        ?? '',
          DirEntNomEstado:   shipping_info.state        ?? '',
          DirEntCodPostal:   shipping_info.zip          ?? '',
          CtoNomContacto:    contact.name               ?? '',
          CtoNumTelefono:    contact.phone              ?? '',
          CtoMail:           contact.email              ?? '',
          InsEntrega:        shipping_info.note         ?? '',
          NomTransporte:     shipping_info._transporteLabel ?? '',
          NumCtaTransporte:  shipping_info._cuentaTransporte ?? '',
        });

        if (rs.data.resultado === 'ok') {
          dispatch(clearBuyWizard());
          swalSuccess(rs.data.mensaje ?? t.quote_buy_success).then(() => {
            const customer_id = searchParams.get("customer");
            router.push(`/admin/revision/orders-process?customer=${customer_id}&option=open`);
          });
        }
      } catch (error) {
        const status = error?.response?.status;
        const apiMsg = error?.response?.data?.mensaje;
        if (status === 400) {
          swalError(t.error ?? 'Error', apiMsg ?? t.quote_buy_error, t.close ?? 'Cerrar');
        } else {
          console.error('[confirmarcot 500]', error?.response?.data?.detalle);
          swalError(t.error ?? 'Error', t.quote_buy_success_server ?? 'Error en el servidor, intenta nuevamente.', t.close ?? 'Cerrar');
        }
      }
    });
  };

  const total = summary?.total != null
    ? `${summary.moneda ?? 'USD'} ${customFormat(summary.total)}`
    : '-';

  const SummaryLine = ({ label, value, accent }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-primary' : 'text-gray-800'}`}>{value ?? '-'}</span>
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Columna izquierda — Envío + Pago */}
          <div className="lg:col-span-3 space-y-4">

            {/* Tarjeta Envío */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">{t.shipment} / {t.delivery_place ?? t.delivery_location}</h3>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t.change_delivery_location}
                </button>
              </div>
              <div className="space-y-0.5">
                <SummaryLine label={`${t.country} / ${t.city}`}    value={`${shipping_info.country ?? '-'} / ${shipping_info.city ?? '-'}`} />
                <SummaryLine label={t.address}   value={shipping_info.address} />
                <SummaryLine label={t.company}   value={shipping_info.company} />
                <SummaryLine label={t.contact}   value={shipping_info.contact} />
                <SummaryLine label={t.phone}     value={shipping_info.phone}   />
                <SummaryLine label={t.email}     value={shipping_info.email}   />
                {shipping_info.state && <SummaryLine label={t.state} value={shipping_info.state} />}
                {shipping_info.zip   && <SummaryLine label={t.zip}   value={shipping_info.zip}   />}
                {shipping_info.note  && <SummaryLine label={t.delivery_instruction ?? t.delivery_instructions} value={shipping_info.note} />}
              </div>
            </div>

            {/* Tarjeta Forma de Pago */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">{t.method_of_payment}</h3>
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t.modify_payment_method}
                </button>
              </div>

              {option_payment === 'TB' ? (
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-500 mb-2">{t.by_bank_transfer}:</p>
                  {info_payment.map((banco, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-gray-700">{banco}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{t.send_the_receipt}</p>
                    {info_contact.corEle   && <SummaryLine label={t.email}   value={info_contact.corEle}   accent />}
                    {info_contact.numCelWp && <SummaryLine label="WhatsApp"  value={info_contact.numCelWp} accent />}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-sm text-gray-500 mb-2">{t.we_will_contact}:</p>
                  <SummaryLine label={t.name}  value={contact.name}  />
                  <SummaryLine label={t.email} value={contact.email} />
                  <SummaryLine label={t.phone} value={contact.phone} />
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — Resumen + Confirmar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{t.verify}</h3>
              <div className="space-y-0.5 mb-5">
                <SummaryLine label={t.nro_order ?? t.order_number}   value={summary?.nroCotizacion} />
                <SummaryLine label={t.nro_pedido ?? t.pedido_number} value={summary?.pedido || '-'} />
                <SummaryLine label="Items"                           value={summary?.items} />
              </div>
              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-2xl font-bold text-green-600">{total}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={confirmQuote}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition shadow-sm"
                >
                  {t.confirm}
                </button>
                <button
                  type="button"
                  onClick={goToQuote}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                >
                  {t.modify}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConfirmQuote;
