"use client";
import React, { Fragment, useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import CompanentCustomerForm from "@/components/forms/customer-form";
import DatatablesCustomers from "@/components/datatables/components-datatables-customers";

import IconHorizontalDots from "@/components/icon/icon-horizontal-dots";
import IconCaretDown from "@/components/icon/icon-caret-down";
import { Tab } from '@headlessui/react';
import IconUser from "@/components/icon/icon-user";
import IconHome from "@/components/icon/icon-home";
import IconPhone from "@/components/icon/icon-phone";
import IconSettings from '@/components/icon/icon-settings';
import GeneralInformation from '@/app/admin/register/customers/settings/GeneralInformation'
import ContactsCustomer from '@/app/admin/register/customers/settings/ContactsCustomer'
import ShippingAddressCustomer from '@/app/admin/register/customers/settings/ShippingAddressCustomer'
import TradingConditionsCustomer from '@/app/admin/register/customers/settings/TradingConditionsCustomer'
import AttachmentsCustomer from '@/app/admin/register/customers/settings/AttachmentsCustomer'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CustomerSettings({ _customer = {}, updateCustomerTradding, setCustomer, tabs, token, t, updateList, doc_types, conditions, setConditions, sellers, setSellers }) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customer, setCustomerSetting] = useState(_customer);
  const [contacts, setContacts] = useState([]);
  const [loadContacts, setLoadContacts] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [loadAddresses, setLoadAddresses] = useState(true);
  //const [sellers, setSellers] = useState([]);
  const [loadConditions, setLoadConditions] = useState( (conditions.lenght == 0) ? true : false );
  const [brands, setBrands] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [load, setLoad] = useState(true);


  let option = searchParams.get("option");
  
  let is_new_contact = searchParams.get("new") || 'false';
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;
  
  
  

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: {} });

  useEffect(() => {
    
    setCustomerSetting(_customer)
  }, [_customer]);

 

  const closeSetting = () => {
    setCustomer(null); 
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("customer");
    nextSearchParams.delete("option");
    router.replace(`${pathname}?${nextSearchParams}`);
  }

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.register}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <Link href={`/admin/register/customers`} className="text-blue-600 hover:underline">{t.customers}</Link>
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="badge bg-primary">{customer?.NomCliente}</span>
          </li>
        </ul>

      </div>

      <Tab.Group defaultIndex={current_tab} onChange={(index) => {
        router.push(`?customer=${customer.IdCliente}&option=${tabs[index]}${ (is_new_contact === 'true') ? ('&new=true') : '' }`)
      }}>
        <Tab.List className="mb-5 mt-3 grid grid-cols-4 gap-2 rtl:space-x-reverse sm:flex sm:flex-wrap sm:justify-center sm:space-x-3">

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.general_data}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.contacts }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.shipping_address }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.trading_conditions }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                { t.anexos }
              </button>
            )}
          </Tab>
        </Tab.List>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button className='btn btn-dark' type='button' onClick={() => closeSetting() }>{t.btn_close_settings}</button>
        </div>
        <Tab.Panels className="panel shadow-lg border bg-gray-200 p-5 mt-5">

          <Tab.Panel>
            <GeneralInformation customer={customer} action_cancel={() => setCustomer(null)} token={token} updateList={updateList} doc_types={doc_types}></GeneralInformation>
          </Tab.Panel>
          <Tab.Panel>
            <ContactsCustomer setLoadContacts={setLoadContacts} loadContacts={loadContacts} contacts={contacts} setContacts={setContacts} customer={customer} action_cancel={() => setCustomer(null)} token={token} t={t}></ContactsCustomer>
          </Tab.Panel>
          <Tab.Panel>
            <ShippingAddressCustomer setLoadAddresses={setLoadAddresses} loadAddresses={loadAddresses} setAddresses={setAddresses} addresses={addresses} customer={customer} action_cancel={() => setCustomer(null)} token={token} t={t} ></ShippingAddressCustomer>
          </Tab.Panel>
          <Tab.Panel>
            <TradingConditionsCustomer conditions={conditions} setConditions={setConditions} loadConditions={loadConditions} setLoadConditions={setLoadConditions} sellers={sellers} setSeller={setSellers} customer={customer} action_cancel={() => setCustomer(null)} token={token} t={t} updateCustomerTradding={updateCustomerTradding}></TradingConditionsCustomer>
          </Tab.Panel>
          <Tab.Panel>
            <AttachmentsCustomer brands={brands} setBrands={setBrands} equipments={equipments} load={load} setLoad={setLoad} setEquipments={setEquipments} customer={customer} action_cancel={() => setCustomer(null)} token={token} t={t}></AttachmentsCustomer>
          </Tab.Panel>
        </Tab.Panels>

      </Tab.Group>



    </>
  );
}