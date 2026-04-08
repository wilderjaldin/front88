"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import IconCustomer from "@/components/icon/icon-customer";
import IconQuotes from "@/components/icon/icon-quotes";
import IconAutorizeOrder from "@/components/icon/icon-autorize-order";
import IconOrderInProcess from "@/components/icon/icon-orders-in-process";
import IconSuppliers from "@/components/icon/icon-suppliers";
import IconSparePartsToBeQuoted from "@/components/icon/icon-spare-parts-to-be-quoted";
import IconSparePartsToBeIdentified from "@/components/icon/icon-spare-parts-to-be-identified";
import IconNewSpareParts from "@/components/icon/icon-new-spare-parts";
import IconGeneratePurchaseOrder from "@/components/icon/icon-generate-purchase-order";
import IconSearchPurchaseOrder from "@/components/icon/icon-search-purchase-order";
import IconSearchCircle from "@/components/icon/icon-search-circle";
import IconChangeQuote from "@/components/icon/icon-change-quote";
import IconCrossReference from "@/components/icon/icon-cross-reference";
import IconCRM from "@/components/icon/icon-crm";
import IconMessages from "@/components/icon/icon-messages";
import IconReception from "@/components/icon/icon-reception";
import IconPackaging from "@/components/icon/icon-packaging";
import IconShipment from "@/components/icon/icon-shipment";
import SearchCustomerForm from "@/components/forms/search-customer"

import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnNewQuote from "@/components/BtnNewQuote";
import IconSettings from "@/components/icon/icon-settings";
import IconSetting from "@/components/icon/icon-setting";
import { useSearchParams } from "next/navigation";
const url = process.env.NEXT_PUBLIC_API_URL + "cliente/ListaControlesCli"
const url2 = process.env.NEXT_PUBLIC_API_URL + "empresa/ListaControlesEmp"
const url_brands = process.env.NEXT_PUBLIC_API_URL + "cliente/MostrarMarcas"
const url_cities = process.env.NEXT_PUBLIC_API_URL + "empresa/ListaCiudad"


export default function Dashboard() {

  const t = useTranslation();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const start = useRef();
  const end = useRef();

  const [position, setPosition] = useState({ start: { top: 0, left: 0 }, end: { top: 0, left: 0 } })

  let sf = searchParams.get("sf") || false;

  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    if (sf == "true") {
      setShowAdmin(true);
    }
  }, [sf]);


  const calculate = () => {
    setPosition({ start: { top: start.current.getBoundingClientRect().top, left: 50 }, end: { top: end.current.getBoundingClientRect().top, left: end.current.getBoundingClientRect().left - 25 } })
  }

  const loadLists = async () => {
    try {
      const response = await axios.post(url, { ValToken: token });
      /*saveDocTypes(response.data.dato1);
      savePaymentCondition(response.data.dato2);
      saveSellers(response.data.dato3);
      */
      saveCountries(response.data.dato4);
      /*
      const rs = await axios.post(url2, { ValToken: token });
      saveCurrencies(rs.data.dato1);
      
      const response = await axios.post(url_brands, { ValToken: token });
      
      saveBrands(response.data.dato);
      */

    } catch (error) {
    }
  }

  const updateCities = async (countries) => {
    try {
      const rs = await axios.post(url_cities, { ValToken: token });

      if (rs.data.estado === 'OK') {
        const cites_list = {};

        countries.forEach(country => {
          const ciudadesDelPais = rs.data.dato
            .filter(c => c.CodPais === country.value)
            .map(c => ({
              value: Number(c.CodCiudad),
              label: c.NomCiudad
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          if (ciudadesDelPais.length > 0) {
            cites_list[country.value] = ciudadesDelPais;
          }
        });

        await fetch("/api/saveFile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: "cities.json",
            folder: "data-runtime",
            content: cites_list,
          }),
        });

      }
    } catch (error) {
      console.error(error);
    }
  }

  const saveBrands = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodMoneda != '') {
        if (d.CodMarca != 0) {
          array.push({ value: d.CodMarca, label: d.NomMarca });
        }
      }
    }


    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "brands.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  const saveCurrencies = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodMoneda != '') {
        array.push({ value: d.CodMoneda, label: d.DesMoneda });
      }
    }


    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "currencies.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  const saveCountries = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodPais != 0) {
        array.push({ value: d.CodPais, label: d.NomPais });
      }
    }


    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "countries.json",
        folder: "data-runtime",
        content: array,
      }),
    });


    const data_ = await response.json();
    updateCities(array)
  }

  const saveDocTypes = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodDoc != 0) {
        array.push({ value: d.CodDoc, label: d.DesDoc });
      }
    }
    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "doc_types.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  const savePaymentCondition = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodCondPago != '') {
        array.push({ value: d.CodCondPago, label: d.DesCondPago });
      }
    }

    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "payment_conditions.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  const saveSellers = async (data) => {

    let array = []
    for (const d of data) {
      if (d.CodVendedor != 0) {
        array.push({ value: d.CodVendedor, label: d.NomVendedor });
      }
    }

    const response = await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "sellers.json",
        folder: "data-runtime",
        content: array,
      }),
    });
  }

  useDynamicTitle(`${t.dashboard}`);
  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.dashboard}
        </li>
      </ul>
      {(showAdmin) &&
        <div className="bg-dark rounded-lg shadow-xl border-[#b7b7b7] border mt-8 sm:px-20">
          {<button className="btn btn-primary my-4" onClick={() => loadLists()}>Actualizar listados</button>}
        </div>
      }

      <div className="panel shadow-xl border-[#b7b7b7] border mt-8 sm:px-20">
        <div className="text-center  mb-8">
          <h2 className="text-xl font-extrabold uppercase text-[#0050c3]">{t.customers}</h2>
        </div>
        <ul className="grid grid-cols-2 sm:flex sm:justify-between svg-center gap-2">
          <li className="text-center mb-8 sm:mb-0">
            <Link href={'/admin/register/customers'}> <IconCustomer className="drop-shadow-xl"></IconCustomer><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.customers}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <BtnNewQuote token={token} t={t} show_title={true} classNameBtn="" classNameIcon="drop-shadow-xl"></BtnNewQuote>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/queries/orders-placed`}> <IconQuotes className="drop-shadow-xl"></IconQuotes><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.quotes}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/revision/authorize-purchase`}> <IconAutorizeOrder className="drop-shadow-xl"></IconAutorizeOrder><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.authorize_order}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={'/admin/revision/orders-process'}> <IconOrderInProcess className="drop-shadow-xl"></IconOrderInProcess><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.orders_in_process}</span></Link>
          </li>
        </ul>
      </div>

      <div className="panel shadow-xl border-[#b7b7b7] border mt-10 px-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-extrabold uppercase text-[#0050c3]">{t.suppliers}</h2>
        </div>
        <ul className="grid grid-cols-2 sm:flex sm:justify-between svg-center gap-2">
          <li className="text-center mb-8 sm:mb-0">
            <Link href={'/admin/register/suppliers'}><IconSuppliers className="drop-shadow-xl"></IconSuppliers><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.suppliers}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/queries/spare-parts-quotation`}><IconSparePartsToBeQuoted></IconSparePartsToBeQuoted><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.spare_parts_to_be_quoted}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/queries/spare-parts-identified`}><IconSparePartsToBeIdentified></IconSparePartsToBeIdentified><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.spare_parts_to_be_identified}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={'/admin/register/spares?action=new'}><IconNewSpareParts className="drop-shadow-xl"></IconNewSpareParts><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.new_spare_parts}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/purchase-order`}><IconGeneratePurchaseOrder className="drop-shadow-xl"></IconGeneratePurchaseOrder><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.generate_purchase_order}</span></Link>
          </li>
          <li className="text-center mb-8 sm:mb-0">
            <Link href={`/admin/queries/purchase-orders`}><IconSearchPurchaseOrder className="drop-shadow-xl"></IconSearchPurchaseOrder><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.search_purchase_order}</span></Link>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:flex sm:flex-row gap-8">
        <div className="basis-3/5">
          <div className="panel shadow-xl border-[#b7b7b7] border mt-10 px-5">
            <div className="text-center mb-8">
              <h2 className="text-xl font-extrabold uppercase text-[#0050c3]">{t.several}</h2>
            </div>

            <ul className="grid grid-cols-2 sm:flex sm:justify-between svg-center gap-2">
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/search`}><IconSearchCircle className="drop-shadow-xl"></IconSearchCircle><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.search}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/queries/change-quote`}><IconChangeQuote className="drop-shadow-xl"></IconChangeQuote><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.change_quote}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={'/admin/register/reference-change-part'}><IconCrossReference className="drop-shadow-xl"></IconCrossReference><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.cross_reference}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/revision/crm-dashboard`}><IconCRM className="drop-shadow-xl"></IconCRM><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.crm}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/inbox`}><IconMessages className="drop-shadow-xl"></IconMessages><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.message}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/settings`}><IconSetting className="drop-shadow-xl"></IconSetting><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.settings}</span></Link>
              </li>
            </ul>

          </div>

        </div>
        <div className="basis-2/5">
          <div className="panel shadow-xl border-[#b7b7b7] border mt-10 sm:px-10">
            <div className="text-center mb-8">
              <h2 className="text-xl font-extrabold uppercase text-[#0050c3]">{t.deposit}</h2>
            </div>
            <ul className="grid grid-cols-2 sm:flex sm:justify-between svg-center gap-2">
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/purchase-reception`}><IconReception className="drop-shadow-xl"></IconReception><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.reception}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/packaging`}><IconPackaging className="drop-shadow-xl"></IconPackaging><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.packaging}</span></Link>
              </li>
              <li className="text-center mb-8 sm:mb-0">
                <Link href={`/admin/delivery`}><IconShipment className="drop-shadow-xl"></IconShipment><span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.shipment}</span></Link>
              </li>
            </ul>
          </div>
        </div>
      </div>



      {
        (false) &&

        <div className="hidden flex justify-between">
          <div id="mydiv1" onClick={() => calculate()} className="draggable" ref={start} ><div>1</div></div>
          <div id="mydiv2" className="draggable" ref={end}><div>2</div></div>
          <div className="absolute w-full">
            <svg height="80vh" className="w-full">
              <defs>
                <marker id="arrowhead" markerWidth="13" markerHeight="13" refX="10" refY="6" orient="auto">
                  <polygon points="2,1 2,10 10,6" />
                </marker>
              </defs>

              <line x1={position.start.left} y1={position.start.top} x2={position.end.left} y2={position.end.top} />
            </svg>
          </div>
        </div>
      }
    </div>
  );
}