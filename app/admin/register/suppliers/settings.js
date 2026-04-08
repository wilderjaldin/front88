"use client";
import React, { Fragment, useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import CompanenSupsetSupplierForm from "@/components/forms/supplier-form";
import DatatablesSuppliers from "@/components/datatables/components-datatables-suppliers";

import IconHorizontalDots from "@/components/icon/icon-horizontal-dots";
import IconCaretDown from "@/components/icon/icon-caret-down";
import { Tab } from '@headlessui/react';
import IconUser from "@/components/icon/icon-user";
import IconHome from "@/components/icon/icon-home";
import IconPhone from "@/components/icon/icon-phone";
import IconSettings from '@/components/icon/icon-settings';
import GeneralInformation from '@/app/admin/register/suppliers/settings/GeneralInformation'
import ContactsSupplier from '@/app/admin/register/suppliers/settings/ContactsSupplier'
import TradingConditionsSupplier from '@/app/admin/register/suppliers/settings/TradingConditionsSupplier'
import AttachmentsSupplier from '@/app/admin/register/suppliers/settings/AttachmentsSupplier'
import FormulaSupplier from '@/app/admin/register/suppliers/settings/FormulaSupplier'
import FreightCost from '@/app/admin/register/suppliers/settings/FreightCost'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SupplierSettings({ _supplier = {}, setSupplier, tabs, token, t, updateList, zones = [], updateConditionSupplier, doc_types }) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [supplier, setSupplierSetting] = useState(_supplier)
  const [current_condition, setCurrentCondition] = useState(null)
  let option = searchParams.get("option");
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;

  const [contacts, setContacts] = useState([]);
  const [loadContacts, setLoadContacts] = useState(true);


  const [conditions, setConditions] = useState([])
  const [loadConditions, setLoadConditions] = useState(true);

  const [loadFormula, setLoadFormula] = useState(true);
  const [formula, setFormula] = useState(null);
  const [variables, setVariables] = useState([]);

  const [brands, setBrands] = useState([]);
  const [loadBrands, setLoadBrands] = useState(true);

  const [freight_zone, setFreightZone] = useState([]);
  const [loadFreightZone, setLoadFreightZone] = useState(true);


  useEffect(() => {
    setSupplierSetting(_supplier)
  }, [_supplier]);

  useEffect(() => {

    if (conditions.length > 0) {
      
      
      conditions.map((c) => {
        if (_supplier.Condicion != '' && _supplier.Condicion == c.value) {
          
          setCurrentCondition({ value: c.value, label: c.label });
        }
      });

    } else {
      
    }
  }, [conditions]);


  const closeSetting = () => {
    setSupplier(null);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("supplier");
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
            <Link href={`/admin/register/suppliers`} className="text-blue-600 hover:underline">{t.suppliers}</Link>
          </li>

          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="badge bg-primary">{supplier.NomPrv}</span>
          </li>
        </ul>

      </div>

      <Tab.Group defaultIndex={current_tab} onChange={(index) => {
        
        
        router.push(`?supplier=${supplier.CodPrv}&option=${tabs[index]}`)
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
                {t.contacts}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.trading_conditions}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                Formula
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.anexos}
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!bg-success text-white !outline-none' : ''}
                                                    flex flex-col items-center justify-center rounded-lg bg-[#f1f2f3] p-7 py-3 hover:!bg-success hover:text-white hover:shadow-[0_5px_15px_0_rgba(0,0,0,0.30)] dark:bg-[#191e3a]`}
              >
                {t.freight_cost}
              </button>
            )}
          </Tab>
        </Tab.List>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button className='btn btn-dark' type='button' onClick={() => closeSetting()}>{t.btn_close_settings}</button>
        </div>
        <Tab.Panels className="panel shadow-lg border bg-gray-200 p-5 mt-5">

          <Tab.Panel>
            <GeneralInformation doc_types={doc_types} supplier={supplier} action_cancel={() => setSupplier(null)} token={token} t={t} updateList={updateList}></GeneralInformation>
          </Tab.Panel>
          <Tab.Panel>
            <ContactsSupplier setLoadContacts={setLoadContacts} loadContacts={loadContacts} contacts={contacts} setContacts={setContacts} supplier={supplier} action_cancel={() => setSupplier(null)} token={token} t={t}></ContactsSupplier>
          </Tab.Panel>
          <Tab.Panel>
            <TradingConditionsSupplier supplier={supplier} action_cancel={() => setSupplier(null)} token={token} t={t} conditions={conditions} setConditions={setConditions} current_condition={current_condition} loadConditions={loadConditions} setLoadConditions={setLoadConditions} updateConditionSupplier={updateConditionSupplier}></TradingConditionsSupplier>
          </Tab.Panel>
          <Tab.Panel>
            <FormulaSupplier supplier={supplier} token={token} t={t} setLoadFormula={setLoadFormula} loadFormula={loadFormula} formula={formula} setFormula={setFormula} variables={variables} setVariables={setVariables} ></FormulaSupplier>
          </Tab.Panel>
          <Tab.Panel>
            <AttachmentsSupplier supplier={supplier} action_cancel={() => setSupplier(null)} token={token} t={t} brands={brands} setBrands={setBrands} loadBrands={loadBrands} setLoadBrands={setLoadBrands}></AttachmentsSupplier>
          </Tab.Panel>
          <Tab.Panel>
            <FreightCost supplier={supplier} action_cancel={() => setSupplier(null)} t={t} token={token} zones={zones} freight_zone={freight_zone} setFreightZone={setFreightZone} loadFreightZone={loadFreightZone} setLoadFreightZone={setLoadFreightZone}></FreightCost>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>



    </>
  );
}