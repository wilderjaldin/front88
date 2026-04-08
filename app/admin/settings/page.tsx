"use client";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { Tab } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import Labels from "./labels"
import Brands from "./brands"
import ComponentBillingForm from "@/components/forms/billing-form"
import ComponentProformaForm from "@/components/forms/proforma-form"
import ComponentEmailForm from "@/components/forms/email-form"

import ComponentDeliveryTimeForm from '@/components/forms/delivery-time-form'
import ComponentEmailDescriptionForm from '@/components/forms/email-description-form'
import { useRouter } from 'next/navigation';

import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import ComponentBankAccounts from "@/components/datatables/components-bank-accounts";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'empresa/DatosGenerales';
const tabs: any = { '0': 'labels', '1': 'brands'}
export default function Settings() {

  const router = useRouter();
  const t = useTranslation();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);

  let option = searchParams.get("option") || "labels";
  const current_tab: any = Object.keys(tabs).find((key) => tabs[key] === option) || 0;
  
  useDynamicTitle(`${t.settings}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.settings} </span>
          </li>
        </ul>
      </div>

      <div>
        <Tab.Group defaultIndex={current_tab} onChange={(index) => {

          router.push(`?option=${tabs[index]}`)
        }}>
          <div className="grid grid-cols-12 gap-8 mt-10">
            <div className="col-span-2">
              <div className="mb-5 sm:mb-0">
                <Tab.List className="w-full text-end font-semibold">
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.labels}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.brands}
                      </button>
                    )}
                  </Tab>
                </Tab.List>
              </div>
            </div>
            <div className="col-span-10">
              <Tab.Panels>
                <Tab.Panel>
                  <Labels t={t}></Labels>
                </Tab.Panel>
                <Tab.Panel>
                  <Brands t={t} token={token}></Brands>
                </Tab.Panel>                
              </Tab.Panels>
            </div>
          </div>
        </Tab.Group>
      </div>
    </>
  );
}