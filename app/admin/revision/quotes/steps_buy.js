'use client';

import React, { Fragment, useEffect, useState } from 'react';
import axios from 'axios'
import { Tab } from '@headlessui/react';
import VerifyQuote from "@/app/admin/revision/quotes/steps/verify";
import ShippingQuote from "@/app/admin/revision/quotes/steps/shipping"
import MethodPaymentQuote from "@/app/admin/revision/quotes/steps/method_payment"
import ConfirmQuote from "@/app/admin/revision/quotes/steps/confirm"
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, SubmitHandler } from "react-hook-form"

const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarResumenCostos';
import { customFormat } from '@/app/lib/format';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';

const tabs = { '1': 'verify', '2': 'shipping-address', '3': 'metodo', '4': 'confirm' }
const StepsToBuy = ({ close, token, t, _order_, setItems, setOrder }) => {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();



  const [summary, setSummary] = useState([]);
  let option = searchParams.get("option");
  const order_id = searchParams.get("id") || null;
  let step = searchParams.get("step") || '';
  let _tab = Object.keys(tabs).find((key) => tabs[key] === step) || 1;
  const [activeTab, setActiveTab] = useState(Number(_tab));

  //steps
  const [quote_detail, setQuoteDetail] = useState(null);
  const [load_detail, setLoadDetail] = useState(true);
  const [shipping, setShipping] = useState([]);
  const [load_shipping, setLoadShipping] = useState(true);
  const [info_payment, setInfoPayment] = useState([]);
  const [load_payment, setLoadPayment] = useState(true);
  const [info_contact, setInfoContact] = useState([])
  const [option_payment, setOptionPayment] = useState('')
  const [shipping_info, setShippingInfo] = useState([]);
  const [contact, setContact] = useState([])

  const {
    register: registerShipping, reset,
    handleSubmit, setValue, getValues,
    formState: { errors },
  } = useForm();

  const {
    register: registerContact, reset: resetContact,
    handleSubmit: handleSubmitContact, getValues: getValuesContact,
    formState: { errors: errorsContact },
  } = useForm();


  useEffect(() => {
  }, []);

  const prev = () => {
    const index = activeTab - 1;
    setActiveTab(index)

    const params = new URLSearchParams(searchParams.toString())
    params.set('step', tabs[index]) // agrega o reemplaza 'step'
    router.push(`/admin/revision/quotes?${params.toString()}`);

  }

  const next = () => {
    if (activeTab === 2) {
      const values = getValues();
      setShippingInfo({
        company: values.company,
        contact: values.contact,
        phone: values.phone,
        email: values.email,
        country: values.country,
        address: values.address,
        city: values.city,
        state: values.state,
        zip: values.zip,
        note: values.note,
      });
    }
    if (activeTab === 3) {
      if (option_payment == '') {
        Swal.fire({
          title: t.error,
          text: t.payment_option_required,
          icon: 'info',
          confirmButtonText: t.close
        });
        return;
      } else if (option_payment == 'contact') {
        const data_contact = getValuesContact();
        setContact({
          name: data_contact.name,
          email: data_contact.email,
          phone: data_contact.phone
        })
      }
    }
    const index = ((activeTab + 1) <= 4) ? (activeTab + 1) : 4;
    setActiveTab(index)

    const params = new URLSearchParams(searchParams.toString())
    params.set('step', tabs[index]) // agrega o reemplaza 'step'
    router.push(`/admin/revision/quotes?${params.toString()}`);

  }

  const goTo = (index) => {
    setActiveTab(index)
    const params = new URLSearchParams(searchParams.toString())
    params.set('step', tabs[index]) // agrega o reemplaza 'step'
    router.push(`/admin/revision/quotes?${params.toString()}`);
  }

  return (
    <>

      <div className="inline-block w-full">
        <div className='bg-gray-300'>
          <ul className="mb-5 grid grid-cols-4 text-center">
            <li>
              <div
                className={`${activeTab === 1 ? '!bg-yellow-500 text-dark' : ''}
                block rounded-r-full  p-2.5 dark:bg-[#1b2e4b] font-bold`}
                onClick={() => setActiveTab(1)}
              >
                {t.verify}
              </div>
            </li>

            <li>
              <div className={`${activeTab === 2 ? '!bg-yellow-500 text-dark' : ''} block rounded-full  p-2.5 dark:bg-[#1b2e4b] font-bold`} onClick={() => setActiveTab(2)}>
                {t.shipment}/{t.delivery_location}
              </div>
            </li>

            <li>
              <div className={`${activeTab === 3 ? '!bg-yellow-500 text-dark' : ''} block rounded-full  p-2.5 dark:bg-[#1b2e4b] font-bold`} onClick={() => setActiveTab(3)}>
                {t.method_of_payment}
              </div>
            </li>

            <li>
              <div className={`${activeTab === 4 ? '!bg-yellow-500 text-dark' : ''} block rounded-l-full  p-2.5 dark:bg-[#1b2e4b] font-bold`} onClick={() => setActiveTab(4)}>
                {t.confirm}
              </div>
            </li>
          </ul>
        </div>

        <div>
          {activeTab === 1 && <VerifyQuote
            quote_detail={quote_detail}
            setQuoteDetail={setQuoteDetail}
            load_detail={load_detail}
            setLoadDetail={setLoadDetail}
            token={token} t={t}
            order_id={order_id}
          ></VerifyQuote>}

          {activeTab === 2 && <ShippingQuote
            shipping={shipping}
            setShipping={setShipping}
            load_shipping={load_shipping}
            setLoadShipping={setLoadShipping}
            token={token} t={t}
            registerShipping={registerShipping}
            reset={reset}
            getValues={getValues}
            errors={errors}
            order_id={order_id}
          ></ShippingQuote>}

          {activeTab === 3 && <MethodPaymentQuote
            info_payment={info_payment}
            setInfoPayment={setInfoPayment}
            load_payment={load_payment}
            setLoadPayment={setLoadPayment}
            info_contact={info_contact}
            setInfoContact={setInfoContact}
            option_payment={option_payment}
            setOptionPayment={setOptionPayment}
            registerContact={registerContact}
            errorsContact={errorsContact}
            token={token} t={t}
            order_id={order_id}
          ></MethodPaymentQuote>}

          {activeTab === 4 && <ConfirmQuote
            quote_detail={quote_detail}
            setQuoteDetail={setQuoteDetail}
            load_detail={load_detail}
            setLoadDetail={setLoadDetail}
            shipping_info={shipping_info}
            contact={contact}
            option_payment={option_payment}
            info_payment={info_payment}
            info_contact={info_contact}
            token={token} t={t}
            order_id={order_id}
            goTo={goTo}
          ></ConfirmQuote>}

        </div>
        <div className="mt-6 bg-white dark:bg-[#0e1726] border rounded-2xl p-4 flex justify-between items-center shadow-sm">

  {/* PREV */}
  <button
    type="button"
    onClick={prev}
    className={`
      flex items-center gap-2 text-sm font-medium transition
      ${activeTab === 1
        ? 'opacity-0 pointer-events-none'
        : 'text-gray-600 hover:text-black dark:hover:text-white'}
    `}
  >
    <IconArrowBackward className="w-4 h-4" />
    {t.prev}
  </button>

  {/* STEP INDICATOR */}
  <div className="flex items-center gap-2 text-xs text-gray-400">
    <span className="font-medium text-gray-500">
      {t.step} {activeTab}
    </span>
    <span>{t.of}</span>
    <span className="font-semibold">4</span>
  </div>

  {/* NEXT */}
  {activeTab !== 4 && (
    <button
      type="button"
      onClick={next}
      className="
        flex items-center gap-2
        px-6 py-2 rounded-xl
        bg-blue-600 hover:bg-blue-700
        text-white font-semibold
        transition-all duration-200
        shadow-sm hover:shadow-md
      "
    >
      {t.next}
      <IconArrowForward className="w-4 h-4" />
    </button>
  )}
</div>
      </div>


    </>
  );
};

export default StepsToBuy;
