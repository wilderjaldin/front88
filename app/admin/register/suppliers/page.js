"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPlusProps from '@/components/icon/icon-plus';
import DatatablesSuppliers from "@/components/datatables/components-datatables-suppliers";
import SupplierSettings from "./settings";
import ComponentSupplierForm from '@/components/forms/supplier-form'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import { getNameOption, useOptionsSelect } from '@/app/options'
import { useRouter, useSearchParams } from 'next/navigation';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconBackSpace from "@/components/icon/icon-backspace";

const url = process.env.NEXT_PUBLIC_API_URL + 'proveedor/ObtenerLista';
const url_get_supplier = process.env.NEXT_PUBLIC_API_URL + 'proveedor/RecuperarRegistroPrv';
const url_list = process.env.NEXT_PUBLIC_API_URL + "proveedor/ListaControlesPrv";

const tabs = { '0': 'general', '1': 'contacts', '2': 'conditions', '3': 'formula', '4': 'anexos', "5": 'cost' }

export default function Suppliers() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const [supplier, setSupplier] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [zones, setZones] = useState([])

  const [show_form, setShowForm] = useState(false)

  const options_supplier = useOptionsSelect("suppliers");

  const supplier_id = searchParams.get("supplier") || 0;
  let term = searchParams.get("term") || '';

  const locale = useSelector(getLocale);
  const [load_options, setLoadOptions] = useState(true);
  const [docTypesLoaded, setDocTypesLoaded] = useState(false);
  const [doc_types, setDocTypes] = useState([]);


  const {
    register, reset,
    handleSubmit,
    formState: { },
  } = useForm({ defaultValues: { query: '' } });

  useEffect(() => {

    async function fetchData() {
      await getSuppliers(term);
      await getList();
    }
    fetchData();


  }, [term]);


  useEffect(() => {
    if (supplier_id == 0 && docTypesLoaded) {
      setSupplier(null);
    }
  }, [supplier_id, docTypesLoaded]);

  useEffect(() => {
    if (supplier_id != 0) {
      getSupplier(supplier_id);
    }
  }, [suppliers]);


  const onSearch = async (data) => {
    router.push(`?term=${data.query}`)
    getSuppliers(data.query);
  }

  const clear = () => {
    router.push(`?term=`)
    getSuppliers('');
    reset({ query: "" });
  }
  const getList = async () => {
    try {
      const response = await axios.post(url_list, { Idioma: locale, ValToken: token });

      let zones = [];
      if (response.data.dato5) {
        response.data.dato5.map((z) => {
          if (z.NomZona != "") {
            zones.push({ value: z.NomZona, label: z.NomZona });
          }
        });
      }
      setZones(zones);

      if (response.data.estado === 'OK' && Array.isArray(response.data.dato1)) {

        const options = response.data.dato1
          .filter(o => o.CodDoc !== 0)
          .map(o => ({
            value: o.CodDoc,
            label: o.DesDoc
          }));
        setDocTypes(options);
        setDocTypesLoaded(true);
      }

    } catch (error) {

    }
  }
  const getSuppliers = async (term = '') => {
    try {
      const response = await axios.post(url, { Filtro: term, ValToken: token });

      setSuppliers(response.data.dato);

    } catch (error) {

    }
  }

  const getLabel = (options, value) => {

    const item = options.find(o => o.value === value);
    return item ? item.label : '';
  };

  const getSupplier = async (id) => {

    try {
      const rs = await axios.post(url_get_supplier, { CodPrv: id, ValToken: token });

      if (rs.data.estado == 'OK') {

        if (rs.data.dato1[0].NomDocumento == undefined) {
          let doc_name = getLabel(doc_types, rs.data.dato1[0].TipDocumento);
          rs.data.dato1[0].NomDocumento = doc_name;
        }


        if (rs.data.dato1[0].NomIdioma == undefined) {
          let report_name = getNameOption('reports', rs.data.dato1[0].IdiomaReporte)
          rs.data.dato1[0].NomIdioma = report_name;
        }


        /*
        if (rs.data.dato1[0].Condicion == undefined) {
          rs.data.dato1[0].Condicion = "C45";
        }
        */

        setSupplier(rs.data.dato1[0]);

      } else {

        Swal.fire({
          title: t.error,
          text: t.supplier_error_get + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.supplier_error_get_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const showSettings = (s) => {
    getSupplier(s.CodPrv);
    //setShowLabels(true);
    router.push(`?supplier=${s.CodPrv}&option=general`)
  }

  const updateList = async (data) => {


    let exist = false;
    let options = [];
    
    options = Array.isArray(suppliers)
      ? suppliers.map((cs) => {
        if (cs.CodPrv == data.CodPrv) {
          exist = true;
          cs.NomPrv = data.NomPrv;
          cs.DirPrv = data.DirPrv;
          cs.NomPais = data.NomPais;
          cs.NomCiudad = data.NomCiudad;
          cs.NumDocumento = data.TipDocumento + ' ' + data.NumDocumento;
          cs.CodPais = data.CodPais;
          cs.CodCiudad = data.CodCiudad;
          cs.TipDocumento = data.TipDocumento;
          cs.NroDocumento = data.NroDocumento;
          cs.SitioWeb = data.SitioWeb;
          cs.DiasProceso = data.DiasProceso;
          cs.DiasShipingStandard = data.DiasShipingStandard;
          cs.IdiomaReporte = data.IdiomaReporte;
          cs.ConsiderarStock = data.TieneStock;
        }
        return cs;
      })
      : [];
    if (!exist) {

      options = [];
      options.push(...suppliers, {
        CodPrv: data.CodPrv,
        NomPrv: data.NomPrv,
        DirPrv: data.DirPrv,
        NomPais: data.NomPais,
        NomCiudad: data.NomCiudad,
        NumDocumento: data.TipDocumento + ' ' + data.NumDocumento,
        CodPais: data.CodPais,
        CodCiudad: data.CodCiudad,
        TipDocumento: data.TipDocumento,
        NroDocumento: data.NroDocumento,
        SitioWeb: data.SitioWeb,
        DiasProceso: data.DiasProceso,
        DiasShipingStandard: data.DiasShipingStandard,
        IdiomaReporte: data.IdiomaReporte,
        ConsiderarStock: data.TieneStock
      }

      );
    } else {
      //actualizar lista de proveedores
      let new_options = [];
      options_supplier.map((s) => {
        if (s.value == data.CodPrv) {
          s.label = data.NomPrv;
        }
        new_options.push(s);
      });
    }

    setSuppliers(options);
  }

  const updateConditionSupplier = (value) => {
    supplier.CodCondPago = value;

    setSupplier(supplier);
  }
  useDynamicTitle(`${t.register} | ${t.suppliers}`);
  return (
    <>
      {!(supplier) &&
        <>
          <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
              <li>
                {t.register}
              </li>
              <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>{t.suppliers}</span>
              </li>
            </ul>

          </div>

          {!(show_form) &&
            <>
              <div className="grid grid-cols-1 gap-6 pt-5">
                <div className={`panel shadow-lg border bg-gray-200`}>
                  <div className="mb-5">
                    <form className="space-y-5" onSubmit={handleSubmit(onSearch)}>
                      <label htmlFor="search" className="text-sm font-medium text-gray-900 dark:text-white">{t.supplier}</label>
                      <div className="relative">
                        <div className="relative mb-4">
                          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                          </div>
                          <input type="search" defaultValue='' {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={t.enter_data_search} required />
                          <div className="mt-4 flex items-center text-center sm:absolute sm:end-2.5 sm:bottom-2.5">
                            <button type="button" onClick={() => clear()} className="btn-dark hover:bg-gray-900 text-white mr-2 font-medium rounded-lg text-sm px-2.5 py-1.5"><IconBackSpace className=''></IconBackSpace></button>
                            <button type="submit" className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
                          </div>
                        </div>
                      </div>
                    </form>

                  </div>
                </div>
              </div>
              <div className="my-5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => setShowForm(true)} type="button" className="btn btn-primary">
                    <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                    {t.btn_add_supplier}
                  </button>
                </div>
              </div>
            </>
          }
        </>
      }

      {(supplier) && <SupplierSettings doc_types={doc_types} _supplier={supplier} setSupplier={setSupplier} updateList={updateList} tabs={tabs} token={token} t={t} zones={zones} updateConditionSupplier={updateConditionSupplier}></SupplierSettings>}
      {(show_form) && <ComponentSupplierForm doc_types={doc_types} how_labels_opc={false} supplier={supplier} action_cancel={() => setShowForm(false)} token={token} updateList={updateList} t={t}></ComponentSupplierForm>}
      {(suppliers && (!supplier && !show_form)) && <DatatablesSuppliers data={suppliers} supplier={supplier} showSettings={showSettings} t={t} token={token} />}


    </>
  );
}