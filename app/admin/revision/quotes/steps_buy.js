'use client';

import React, { Fragment, useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import VerifyQuote from "@/app/admin/revision/quotes/steps/verify";
import ShippingQuote from "@/app/admin/revision/quotes/steps/shipping";
import MethodPaymentQuote from "@/app/admin/revision/quotes/steps/method_payment";
import ConfirmQuote from "@/app/admin/revision/quotes/steps/confirm";
import Swal from 'sweetalert2';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';
import { selectBuyWizard, setWizardOrder, setWizardShipping, setWizardPayment, setWizardContact } from '@/store/buyWizardSlice';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';
import { usePathname } from 'next/navigation';

const ICON_INFO = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2.5"/><path d="M12 8h.01M12 12v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const swalInfo = (title, msg = '', confirmText = 'Entendido') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(245,158,11,0.3)">${ICON_INFO}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true,
  confirmButtonText: confirmText,
  confirmButtonColor: '#f59e0b',
});

const STEP_KEYS = { 1: 'verify', 2: 'shipping-address', 3: 'metodo', 4: 'confirm' };

const ICON_CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const URL_RESUMEN = 'cotizaciondetalle/resumen';

const StepsToBuy = ({ token, t, _customer_ }) => {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const dispatch    = useDispatch();
  const wizard      = useSelector(selectBuyWizard);

  const order_id    = searchParams.get("id") || null;
  const customer_id = searchParams.get("customer") || null;
  const stepParam   = searchParams.get("step") || 'verify';
  const initTab     = Number(Object.keys(STEP_KEYS).find(k => STEP_KEYS[k] === stepParam) || 1);

  const [summary,        setSummary]        = useState(null);
  const [activeTab,      setActiveTab]      = useState(initTab);
  const [info_payment,   setInfoPayment]    = useState([]);
  const [info_contact,   setInfoContact]    = useState({});
  const [option_payment, setOptionPayment]  = useState(() => wizard.optionPayment ?? '');
  const [shipping_info,  setShippingInfo]   = useState(() => wizard.shippingInfo  ?? {});
  const [contact,        setContact]        = useState(() => wizard.contact       ?? {});

  const { register: registerShipping, reset, getValues, setValue, formState: { errors } } = useForm();
  const { register: registerContact, reset: resetContact, getValues: getValuesContact, trigger: triggerContact, formState: { errors: errorsContact } } = useForm();

  useEffect(() => {
    if (!order_id) return;
    // Si cambió la orden, limpia el wizard persistido
    dispatch(setWizardOrder(order_id));
    axiosClient
      .get(`${URL_RESUMEN}/${order_id}`, { params: { codCliente: customer_id } })
      .then(rs => setSummary(rs.data))
      .catch(() => {});
  }, [order_id]);

  const navigate = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', STEP_KEYS[tab]);
    router.push(`/admin/revision/quotes?${params.toString()}`);
  };

  const prev = () => { if (activeTab > 1) navigate(activeTab - 1); };

  const backToQuote = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('step');
    params.set('option', summary?.categoria === 'MA' ? 'manual' : 'quotes');
    router.push(`${pathname}?${params.toString()}`);
  };

  const next = async () => {
    if (activeTab === 2) {
      const v = getValues();
      if (!v.codDireccion) {
        swalInfo(t.error ?? 'Atención', t.address_required ?? 'Debe seleccionar una dirección de entrega.', t.close ?? 'Entendido');
        return;
      }
      const newShipping = {
        company: v.company, contact: v.contact, phone: v.phone,
        email:   v.email,   country: v.country, address: v.address,
        city:    v.city,    state:   v.state,   zip:    v.zip,
        note:    v.note,
        codPais:            v.codPais,
        codTransporte:      v.codTransporte,
        cuentaTransporte:   v.cuentaTransporte,
        codDireccion:       v.codDireccion,
        _transporteLabel:   v._transporteLabel,
        _direccionLabel:    v._direccionLabel,
      };
      setShippingInfo(newShipping);
      dispatch(setWizardShipping(newShipping));
    }
    if (activeTab === 3) {
      if (!option_payment) {
        swalInfo(t.error ?? 'Atención', t.payment_option_required ?? 'Seleccione una forma de pago.', t.close ?? 'Entendido');
        return;
      }
      if (option_payment === 'CT') {
        const valid = await triggerContact(['name', 'phone']);
        if (!valid) return;
        const d = getValuesContact();
        const newContact = { name: d.name, email: d.email, phone: d.phone };
        setContact(newContact);
        dispatch(setWizardContact(newContact));
      }
      dispatch(setWizardPayment(option_payment));
    }
    const nextTab = activeTab < 4 ? activeTab + 1 : 4;
    navigate(nextTab);
  };

  const STEPS = [
    { label: t.verify },
    { label: `${t.shipment} / ${t.delivery_location}` },
    { label: t.method_of_payment },
    { label: t.confirm },
  ];

  return (
    <div className="w-full">

      {/* ── STEPPER ─────────────────────────────────────────────────── */}
      <div className="flex items-start mb-8 px-2">
        {STEPS.map((s, i) => {
          const n           = i + 1;
          const isCompleted = activeTab > n;
          const isActive    = activeTab === n;
          const isLast      = i === STEPS.length - 1;

          return (
            <Fragment key={n}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => { if (n <= activeTab) navigate(n); }}
                  disabled={n > activeTab}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 disabled:cursor-default
                    ${isCompleted
                      ? 'bg-green-500 text-white shadow-md shadow-green-200/60'
                      : isActive
                        ? 'bg-yellow-400 text-gray-900 shadow-md shadow-yellow-200/60'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
                >
                  {isCompleted ? ICON_CHECK : n}
                </button>
                <span className={`mt-2 text-xs text-center leading-tight px-1 transition-colors
                  ${isActive ? 'text-gray-800 font-semibold' : isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-px mt-5 transition-all duration-300
                  ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* ── CONTENIDO DEL PASO ──────────────────────────────────────── */}
      {activeTab === 1 && (
        <VerifyQuote summary={summary} t={t} />
      )}
      {activeTab === 2 && (
        <ShippingQuote
          token={token} t={t} order_id={order_id}
          customer={_customer_}
          savedShipping={shipping_info}
          registerShipping={registerShipping} reset={reset}
          setValue={setValue} errors={errors}
        />
      )}
      {activeTab === 3 && (
        <MethodPaymentQuote
          info_payment={info_payment}   setInfoPayment={setInfoPayment}
          info_contact={info_contact}   setInfoContact={setInfoContact}
          option_payment={option_payment} setOptionPayment={setOptionPayment}
          savedContact={contact} resetContact={resetContact}
          registerContact={registerContact} errorsContact={errorsContact}
          token={token} t={t} order_id={order_id}
        />
      )}
      {activeTab === 4 && (
        <ConfirmQuote
          summary={summary}
          shipping_info={shipping_info} contact={contact}
          option_payment={option_payment}
          info_payment={info_payment}   info_contact={info_contact}
          token={token} t={t} order_id={order_id}
          goTo={navigate}
        />
      )}

      {/* ── NAVEGACIÓN INFERIOR ─────────────────────────────────────── */}
      <div className="mt-6 flex justify-center">
      <div className="w-full max-w-xl bg-white border border-gray-100 rounded-2xl px-5 py-3.5 flex justify-between items-center shadow-sm">
        {activeTab === 1 ? (
          <button
            type="button"
            onClick={backToQuote}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
          >
            <IconArrowBackward className="h-4 w-4" />
            {t.back}
          </button>
        ) : activeTab < 4 ? (
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-150"
          >
            <IconArrowBackward className="h-4 w-4" />
            {t.prev}
          </button>
        ) : (
          <div className="w-24" />
        )}

        <span className="text-xs text-gray-400 font-medium">
          {t.step} {activeTab} {t.of} 4
        </span>

        {activeTab < 4 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all duration-150 shadow-sm"
          >
            {t.next}
            <IconArrowForward className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-24" />
        )}
      </div>
      </div>

    </div>
  );
};

export default StepsToBuy;
