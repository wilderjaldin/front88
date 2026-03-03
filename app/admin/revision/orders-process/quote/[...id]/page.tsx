"use client";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { Tab } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import QuotesInit from "./quotes"
export default function Quotes({ params }: { params: { slug: number, id: number } }) {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();


  const {
    register: registerQuote,
    reset: resetQuote,
    formState: { errors: errorsQuote },
    handleSubmit: handleQuoteFormSubmit
  } = useForm()

  const {
    register: registerSearch,
    reset: resetSearch,
    formState: { errors: errorsSearch },
    handleSubmit: handleSearchFormSubmit
  } = useForm()


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const t = useTranslation();



  const handleChangeStatus = (value: any) => {
    if (value) {
      resetQuote({ status: value.value });
    } else {
      resetQuote({ status: null });
    }
  };

  const handleChangeCustomer = (value: any) => {
    if (value) {
      resetQuote({ customer: value.value });
    } else {
      resetQuote({ customer: null });
    }
  };

 

  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            { t.revision }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.orders_in_process }</span>
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.quote }</span>
          </li>
        </ul>
      </div>

      <Tab.Group className={'mt-5'}>
        <Tab.List className="mt-3 flex flex-wrap border-b border-white-light dark:border-[#191e3a]">
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!border-white-light !border-b-white  text-primary !outline-none dark:!border-[#191e3a] dark:!border-b-black' : ''}
                                        dark:hover:border-b-black -mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary`}>
                { t.quotes }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!border-white-light !border-b-white  text-primary !outline-none dark:!border-[#191e3a] dark:!border-b-black' : ''}
                                        dark:hover:border-b-black -mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary`}>
                { t.open_orders }
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`${selected ? '!border-white-light !border-b-white  text-primary !outline-none dark:!border-[#191e3a] dark:!border-b-black' : ''}
                                        dark:hover:border-b-black -mb-[1px] block border border-transparent p-3.5 py-2 hover:text-primary`}>
                { t.completed_order }
              </button>
            )}
          </Tab>

        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <QuotesInit></QuotesInit>
          </Tab.Panel>
          <Tab.Panel>
            <div>
              <div className="flex items-start pt-5">
                <div className="h-20 w-20 flex-none ltr:mr-4 rtl:ml-4">
                  <img src="/assets/images/profile-34.jpeg" alt="img" className="m-0 h-20 w-20 rounded-full object-cover ring-2 ring-[#ebedf2] dark:ring-white-dark" />
                </div>
                <div className="flex-auto">
                  <h5 className="mb-4 text-xl font-medium">Media heading</h5>
                  <p className="text-white-dark">
                    Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin. Cras purus odio, vestibulum in vulputate at, tempus viverra
                    turpis. Fusce condimentum nunc ac nisi vulputate fringilla. Donec lacinia congue felis in faucibus.
                  </p>
                </div>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="pt-5">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </Tab.Panel>
          <Tab.Panel>Disabled</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>




    </>
  );
}