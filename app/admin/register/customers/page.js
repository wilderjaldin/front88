"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import ComponentCustomerForm from "@/components/forms/customer-form";
import DatatablesCustomers from "@/components/datatables/components-datatables-customers";
import { useRouter } from 'next/navigation';
import CustomerSettings from "./settings";

import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import { getNameOption, getNameCity } from '@/app/options'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconBackSpace from "@/components/icon/icon-backspace";

const url = process.env.NEXT_PUBLIC_API_URL + 'cliente/ObtenerLista';
//const url_get_customer = process.env.NEXT_PUBLIC_API_URL + 'cliente/RecuperarListaCliente';
const url_get_customer = process.env.NEXT_PUBLIC_API_URL + 'cliente/RecuperarRegistroCliente';
const tabs = { '0': 'general', '1': 'contacts', '2': 'shipping', '3': 'conditions', '4': 'anexos' }
const url_list_control = process.env.NEXT_PUBLIC_API_URL + "cliente/ListaControlesCli"

export default function Customers() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();
  const [show_form, setShowForm] = useState(false);
  let term = searchParams.get("term") || '';

  const option = searchParams.get("option");
  const customer_id = searchParams.get("customer") || 0;
  const current_tab = Object.keys(tabs).find((key) => tabs[key] === option) || 0;
  const [show_labels, setShowLabels] = useState(true)
  const [contacts, setContacts] = useState([])
  const [addresses, setAddresses] = useState([]);
  const locale = useSelector(getLocale);
  const [load_options, setLoadOptions] = useState(true);
  const [docTypesLoaded, setDocTypesLoaded] = useState(false);
  const [doc_types, setDocTypes] = useState([]);
  const [conditions, setConditions] = useState([])
  const [sellers, setSellers] = useState([]);

  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { query: term } });

  const [customer, setCustomer] = useState(null)
  const [customers, setCustomers] = useState(null)


  useEffect(() => {

    async function fetchData() {
      await getCustomers(term);
      await getList();
    }
    fetchData();


  }, [term]);

  const getList = async () => {
    try {
      const rs = await axios.post(url_list_control, { Idioma: locale, ValToken: token });
      if (rs.data.estado === 'OK' && Array.isArray(rs.data.dato1)) {

        const options = rs.data.dato1
          .filter(o => o.CodDoc !== 0)
          .map(o => ({
            value: o.CodDoc,
            label: o.DesDoc
          }));
        setDocTypes(options);
        setDocTypesLoaded(true);
        //conditions
        let options_conditions = [];
        rs.data.dato2.map((o) => {
          options_conditions.push({ value: o.CodCondPago, label: o.DesCondPago })
        });
        setConditions(options_conditions)
        // sellers
        let options_sellers = [];
        rs.data.dato3.map((o) => {
          options_sellers.push({ value: o.CodVendedor, label: o.NomVendedor })
        });
        setSellers(options_sellers)


      } else {
        
      }

    } catch (error) {
      
    }
  }


  useEffect(() => {
    if (customer_id != 0 && docTypesLoaded) {
      getCustomer(customer_id);
      setShowForm(false);
    } else {
      setCustomer(null);
    }
  }, [customers, customer_id, docTypesLoaded]);


  const onSearch = async (data) => {
    router.push(`?term=${data.query}`)
    getCustomers(data.query);
  }

  const clear = () => {
    router.push(`?term=`)
    getCustomers('');
    reset({ query: "" });
  }

  const getCustomers = async (term = '') => {
    
    try {
      const response = await axios.post(url, { Filtro: term, ValToken: token });
      if (response.data.estado == "OK") {
        setCustomers(response.data.dato);
      }

    } catch (error) {
      
    }
  }

  const showSettings = (c) => {
    getCustomer(c.IdCliente)
    setShowLabels(true);
    router.push(`?customer=${c.IdCliente}&option=general`)
  }

  const getLabel = (options, value) => {
    const item = options.find(o => o.value === value);
    return item ? item.label : '';
  };

  const getCustomer = async (id) => {

    try {

      const rs = await axios.post(url_get_customer, { Idioma: locale, CodCliente: id, ValToken: token });

      
      if (rs.data.estado == 'Ok') {

        /*
        if (rs.data.dato[0]?.NomPais == undefined) {
          let country_name = getNameOption("countries", rs.data.dato[0]?.CodPais);
          
          rs.data.dato[0].NomPais = country_name;
        }

        if (rs.data.dato[0].NomCiudad == undefined) {
          let city_name = getNameCity(rs.data.dato[0].CodPais, rs.data.dato[0].CodCiudad)
          
          rs.data.dato[0].NomCiudad = city_name;
        }
        */
        if (rs.data.dato[0].NomDocumento == undefined) {
          let doc_name = getLabel(doc_types, rs.data.dato[0].CodDocumento);
          rs.data.dato[0].NomDocumento = doc_name;
        }
        if (rs.data.dato[0].NomIdioma == undefined) {
          let report_name = getNameOption('reports', rs.data.dato[0].IdiomaRep)

          rs.data.dato[0].NomIdioma = report_name;
        }


        setCustomer(rs.data.dato[0]);
        /*
        setContacts(rs.data.dato2);
        setAddresses(rs.data.dato3);
        */
      } else {
        
        Swal.fire({
          title: t.error,
          text: t.customer_error_get + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      
      Swal.fire({
        title: t.error,
        text: t.customer_error_get_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const updateList = (data) => {

    let exist = false;
    let options = [];

    options = customers.map((cm) => {

      if (cm.IdCliente == data.IdCliente) {
        exist = true;
        cm.NomCliente = data.NomCliente;
        cm.DirCliente = data.DirCliente;
        cm.NomPais = data.NomPais;
        cm.NomCiudad = data.NomCiudad;
        cm.Documento = data.Documento;
        cm.CodPais = data.CodPais;
        cm.CodCiudad = data.CodCiudad;
        cm.TipDocumento = data.TipDocumento;
        cm.NroDocumento = data.NroDocumento;
        cm.SitioWeb = data.SitioWeb;
        cm.ActPrincipal = data.ActPrincipal;
        cm.NomIdioma = data.NomIdioma;
      }
      return cm;
    });
    if (!exist) {
      options = [];
      options.push(...customers, {
        IdCliente: data.IdCliente,
        NomCliente: data.NomCliente,
        DirCliente: data.DirCliente,
        NomPais: data.NomPais,
        NomCiudad: data.NomCiudad,
        Documento: data.Documento,
        CodPais: data.CodPais,
        CodCiudad: data.CodCiudad,
        TipDocumento: data.TipDocumento,
        NroDocumento: data.NroDocumento,
        SitioWeb: data.SitioWeb,
        ActPrincipal: data.ActPrincipal,
        NomIdioma: data.NomIdioma,
        Email: "",
        FecRegistra: "",
        NomContacto: "",
        Telefonos: ""
      }

      );
    }

    setCustomers(options);
  }

  const updateCustomerTradding = (data) => {
    customer.CodConPago = data.condition;
    customer.CodVendedor = data.seller;
    customer.PorUtilidad = data.utility;
  }
  useDynamicTitle(`${t.register} | ${t.customers}`);
  return (
    <>
      {!(customer) &&
        <>
          <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
              <li>
                {t.register}
              </li>
              <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>{t.customers}</span>
              </li>
            </ul>

          </div>

          {!(show_form) &&
            <>
              <div className="grid grid-cols-1 gap-6 pt-5">
                <div className={`panel shadow-lg border bg-gray-200`}>
                  <div className="mb-5">
                    <form className="space-y-5" onSubmit={handleSubmit(onSearch)}>
                      <label htmlFor="search" className="text-sm font-medium text-gray-900 dark:text-white">{t.customer}</label>
                      <div className="relative">
                        <div className="relative mb-4">
                          <div className="absolute inset-y-4 sm:inset-y-0 start-0 flex sm:items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                          </div>
                          <input type="search" {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={t.enter_data_search} />
                          <div className="mt-4 flex items-center text-center sm:absolute sm:end-2.5 sm:bottom-2.5">
                            <button type="button" onClick={() => clear()} className="btn-dark hover:bg-gray-900 text-white mr-2 font-medium rounded-lg text-sm px-2.5 py-1.5"><IconBackSpace className=''></IconBackSpace></button>
                            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
                          </div>
                        </div>
                      </div>
                    </form>

                  </div>
                </div>
              </div>
              <div className="my-5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => { setShowForm(true); setShowLabels(false); }} type="button" className="btn btn-primary">
                    <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                    {t.btn_add_customer}
                  </button>
                </div>
              </div>
            </>
          }
        </>
      }

      {(customer) && <CustomerSettings conditions={conditions} sellers={sellers} setSellers={setSellers} setConditions={setConditions} doc_types={doc_types} updateList={updateList} updateCustomerTradding={updateCustomerTradding} tabs={tabs} _customer={customer} setCustomer={setCustomer} token={token} t={t} contacts={contacts} addresses={addresses}></CustomerSettings>}
      {(show_form) && <ComponentCustomerForm doc_types={doc_types} show_labels_opc={false} customer={customer} action_cancel={() => setShowForm(false)} token={token} updateList={updateList}></ComponentCustomerForm>}
      {(customers && (!customer && !show_form)) && <DatatablesCustomers data={customers} customer={customer} showSettings={showSettings} t={t} token={token} />}

    </>
  );
}