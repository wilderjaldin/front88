"use client";
import React, { Fragment, useState } from 'react';
import { useForm } from "react-hook-form"
import { Tab } from '@headlessui/react';
import Quotes from '@/app/admin/revision/orders-process/settings/quotes'
import OpenOrders from '@/app/admin/revision/orders-process/settings/open_orders'
import CompletedOrders from '@/app/admin/revision/orders-process/settings/completed_orders'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Settings({ customer_id,  setCustomer, tabs, token, t }) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  

  const [quotes, setQuotes] = useState([]);
  const [loadQuotes, setLoadQuotes] = useState(true);

  const [open_orders, setOpenOrders] = useState([]);
  const [loadOpenOrders, setLoadOpenOrders] = useState(true);

  const [completed_orders, setCompletedOrders] = useState([]);
  const [loadCompletedOrders, setLoadCompletedOrders] = useState(true);


  let option = searchParams.get("option");
  let is_new_contact = searchParams.get("new") || 'false';
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: {} });

 

 

  const closeSetting = () => {
    setCustomer(null); 
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("customer");
    nextSearchParams.delete("option");
    router.replace(`${pathname}?${nextSearchParams}`);
  }

  return (
    <>
      

      <Tab.Group defaultIndex={current_tab} onChange={(index) => {
        router.push(`?customer=${customer_id}&option=${tabs[index]}${ (is_new_contact === 'true') ? ('&new=true') : '' }`)
      }}>
        <Tab.List className="mb-5 mt-3 grid grid-cols-4 gap-2 rtl:space-x-reverse sm:flex sm:flex-wrap sm:justify-center sm:space-x-3">

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.quotes}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.open_orders }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.completed_orders }
              </button>
            )}
          </Tab>
        </Tab.List>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button className='btn btn-outline-dark' type='button' onClick={() => closeSetting() }>{ t.back }</button>
        </div>        
        <Tab.Panels className="panel shadow-lg border px-0 mt-5">

          <Tab.Panel>
            <Quotes customer_id={customer_id} action_cancel={() => setCustomer(null)} token={token} t={t} quotes={quotes} setQuotes={setQuotes} loadQuotes={loadQuotes} setLoadQuotes={setLoadQuotes}></Quotes>
          </Tab.Panel>
          <Tab.Panel>
            <OpenOrders customer_id={customer_id} action_cancel={() => setCustomer(null)} token={token} t={t} open_orders={open_orders} setOpenOrders={setOpenOrders} loadOpenOrders={loadOpenOrders} setLoadOpenOrders={setLoadOpenOrders}></OpenOrders>
          </Tab.Panel>
          <Tab.Panel>
            <CompletedOrders customer_id={customer_id} action_cancel={() => setCustomer(null)} token={token} t={t} setLoadCompletedOrders={setLoadCompletedOrders} loadCompletedOrders={loadCompletedOrders} setCompletedOrders={setCompletedOrders} completed_orders={completed_orders} ></CompletedOrders>
          </Tab.Panel>
        </Tab.Panels>

      </Tab.Group>



    </>
  );
}