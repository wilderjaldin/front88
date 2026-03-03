"use client";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { Tab } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';
import ComponentCompanyForm from "@/components/forms/company-form"
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
const tabs: any = { '0': 'general', '1': 'billing', '2': 'proforma', '3': 'mail', '4': 'bank', 5: 'delivery', '6': 'description' }
export default function Company() {

  const router = useRouter();
  const t = useTranslation();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const [company, setCompany] = useState({});
  const [billing, setBilling] = useState({});
  const [proforma, setProforma] = useState({})
  const [mail, setMail] = useState({});
  const [banks, setBanks] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [description, setDescription] = useState({})
  const [options_template, setOptionsTemplate] = useState([]);
  const [doc_types, setDocTypes] = useState([]);

  let option = searchParams.get("option") || "general";
  const current_tab: any = Object.keys(tabs).find((key) => tabs[key] === option) || 0;
  useEffect(() => {
    getCompany();
  }, []);

  const getCompany = async () => {
    try {
      const response = await axios.post(url, { ValToken: token });

      setCompany({
        name: response.data.dato1[0].NomEmpresa,
        doc_type: response.data.dato1[0].TipDoc,
        doc_number: response.data.dato1[0].NumDoc,
        phone: response.data.dato1[0].NumTelefono,
        whatsapp: response.data.dato1[0].NumWp,
        address: response.data.dato1[0].Direccion,
        website: response.data.dato1[0].SitioWeb,
        email: response.data.dato1[0].Mail,
        country: response.data.dato1[0].Pais,
        city: response.data.dato1[0].Ciudad
      });
      setBilling({
        iva: response.data.dato1[0].PorIva,
        commercial_currency: response.data.dato1[0].CodMonedaComerc,
        reference_currency: response.data.dato1[0].CodMoneda,
        include_iva: response.data.dato1[0].IvaEnPrecio
      });
      setProforma({
        delivery_place: response.data.dato1[0].LugEntrega,
        legends_proforma: response.data.dato1[0].LeyendaProforma
      });
      setMail({
        port: response.data.dato1[0].Port,
        host: response.data.dato1[0].Smtp,
        email: response.data.dato1[0].UsuarioMail,
        password: response.data.dato1[0].PwdMail
      });
      setBanks(response.data.dato2);
      setDelivery(response.data.dato3);

      const options = response.data.dato4
        .filter((o : any) => o.CodDoc !== 0)
        .map((o : any) => ({
          value: o.CodDoc,
          label: o.DesDoc
        }));
      setDocTypes(options);
    } catch (error) {

    }
  }


  useDynamicTitle(`${t.register} | ${t.company} ${t[option] || option}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.register}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{t.company}</span>
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
                        {t.general_data}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.billing}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.proforma}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.mail}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.bank}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.delivery_time}
                      </button>
                    )}
                  </Tab>
                  <Tab as={Fragment}>
                    {({ selected }) => (
                      <button
                        className={`${selected ? 'btn-dark w-full text-[#F5C912] !outline-none before:!h-[80%]' : ''}
                                                    relative text-end -mb-[1px] block w-full border-white-light p-3.5 py-4 before:absolute before:bottom-0 before:top-0 before:m-auto before:inline-block before:h-0 before:w-[1px] before:bg-[#F5C912] before:transition-all before:duration-700 hover:text-black hover:bg-gray-400 hover:before:h-[80%] ltr:border-r ltr:before:-right-[1px] rtl:border-l rtl:before:-left-[1px] dark:border-[#e2a03f]`}
                      >
                        {t.mail_description}
                      </button>
                    )}
                  </Tab>
                </Tab.List>
              </div>
            </div>
            <div className="col-span-10">
              <Tab.Panels>
                <Tab.Panel>
                  {(company) && <ComponentCompanyForm company={company} token={token} show_labels_opc={true} setCompany={setCompany} doc_types={doc_types} setDocTypes={setDocTypes}></ComponentCompanyForm>}
                </Tab.Panel>
                <Tab.Panel>
                  {(billing) && <ComponentBillingForm company={company} billing={billing} token={token} setBilling={setBilling}></ComponentBillingForm>}
                </Tab.Panel>
                <Tab.Panel>
                  {(company) && <ComponentProformaForm company={company} proforma={proforma} token={token} setProforma={setProforma}></ComponentProformaForm>}
                </Tab.Panel>
                <Tab.Panel>
                  {(company) && <ComponentEmailForm company={company} mail={mail} token={token} setMail={setMail}></ComponentEmailForm>}
                </Tab.Panel>
                <Tab.Panel>
                  {(banks) && <ComponentBankAccounts company={company} banks={banks} token={token}></ComponentBankAccounts>}
                </Tab.Panel>
                <Tab.Panel>
                  <ComponentDeliveryTimeForm company={[]} delivery={delivery} token={token}></ComponentDeliveryTimeForm>
                </Tab.Panel>
                <Tab.Panel>
                  <ComponentEmailDescriptionForm setOptionsTemplate={setOptionsTemplate} options_template={options_template} token={token}></ComponentEmailDescriptionForm>
                </Tab.Panel>
              </Tab.Panels>
            </div>
          </div>


        </Tab.Group>
      </div>
    </>
  );
}