'use client';

import React, { useEffect } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import IconInfoCircle from '@/components/icon/icon-info-circle';

const URL_FORMA_PAGO = 'cotizaciondetalle/forma-pago';

const MethodPaymentQuote = ({
  info_payment, setInfoPayment,
  info_contact, setInfoContact,
  option_payment, setOptionPayment,
  savedContact, resetContact,
  registerContact, errorsContact,
  t, order_id,
}) => {

  useEffect(() => {
    axiosClient
      .get(`${URL_FORMA_PAGO}/${order_id}`)
      .then(rs => {
        setInfoPayment(rs.data.bancos  ?? []);
        setInfoContact(rs.data.contacto ?? {});
      })
      .catch(() => {});
  }, [order_id]);

  useEffect(() => {
    if (savedContact?.name || savedContact?.email || savedContact?.phone) {
      resetContact({ name: savedContact.name ?? '', email: savedContact.email ?? '', phone: savedContact.phone ?? '' });
    }
  }, []);

  const PaymentCard = ({ id, title, subtitle, selected, onSelect }) => (
    <label
      htmlFor={id}
      className={`relative flex flex-col gap-1 p-5 rounded-xl border-2 cursor-pointer transition-all duration-150
        ${selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'}`}
    >
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
      <span className="text-lg font-bold text-gray-800 uppercase">{subtitle}</span>
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <input
        type="radio"
        id={id}
        name="payment"
        value={id}
        checked={selected}
        onChange={() => onSelect(id)}
        className="sr-only"
      />
    </label>
  );

  const InfoLine = ({ label, value, bold }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-200 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ltr:ml-auto rtl:mr-auto ${bold ? 'font-semibold text-primary' : 'text-gray-800'}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        <h2 className="text-base font-semibold text-gray-700 mb-5">{t.select_payment_method}</h2>

        {/* Tarjetas de selección */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <PaymentCard
            id="TB"
            title={t.transfer}
            subtitle={t.banking}
            selected={option_payment === 'TB'}
            onSelect={setOptionPayment}
          />
          <PaymentCard
            id="CT"
            title={t.form}
            subtitle={t.contact}
            selected={option_payment === 'CT'}
            onSelect={setOptionPayment}
          />
        </div>

        {/* Transferencia bancaria */}
        {option_payment === 'TB' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.make_the_deposit}</h3>
              {info_payment.map((banco, i) => (
                <div key={i} className="flex items-center gap-2 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-gray-700">{banco}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t.send_the_receipt}</h3>
              {info_contact.corEle  && <InfoLine label={t.email}    value={info_contact.corEle}  bold />}
              {info_contact.numCelWp && <InfoLine label="WhatsApp"  value={info_contact.numCelWp} bold />}
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-secondary/5 border border-secondary/20 p-4">
              <IconInfoCircle className="text-secondary shrink-0 mt-0.5 h-5 w-5" />
              <p className="text-sm text-gray-600">{t.order_will_be_processed}</p>
            </div>
          </div>
        )}

        {/* Formulario de contacto */}
        {option_payment === 'CT' && (
          <div className="space-y-3">
            {[
              { name: 'name',  label: t.name,  placeholder: t.enter_name,  required: true  },
              { name: 'email', label: t.email, placeholder: t.enter_email, required: false },
              { name: 'phone', label: t.phone, placeholder: t.enter_phone, required: true  },
            ].map(f => (
              <div key={f.name} className="flex items-center gap-3">
                <label className={`w-28 shrink-0 text-sm font-medium text-gray-500 text-right${f.required ? ' required' : ''}`}>{f.label}</label>
                <div className="flex-1">
                  <input
                    type="text"
                    autoComplete="off"
                    {...registerContact(f.name, f.required ? { required: { value: true, message: t.required_field } } : {})}
                    aria-invalid={errorsContact[f.name] ? "true" : "false"}
                    placeholder={f.placeholder}
                    className="form-input h-9 text-sm w-full"
                  />
                  {errorsContact[f.name] && (
                    <span className="text-red-400 text-xs mt-0.5 block pl-0">{errorsContact[f.name]?.message?.toString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MethodPaymentQuote;
