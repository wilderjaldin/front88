"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import DatatablesSpares from '@/components/datatables/components-datatables-spares';
import ComponentSpareForm from "@/components/forms/spare-form";
import ComponentSpareView from "@/app/admin/register/spares/view";
import IconPlusProps from '@/components/icon/icon-plus';
import { getLocale } from '@/store/localeSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconBackSpace from "@/components/icon/icon-backspace";
const url = process.env.NEXT_PUBLIC_API_URL + 'repuesto/ObtenerLista';

const url_get_spare = process.env.NEXT_PUBLIC_API_URL + 'repuesto/RecuperarRegistro';


export default function Spares() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();
  const locale = useSelector(getLocale);

  const [rowData, setRowData] = useState(null)

  const [spares, setSpares] = useState([]);
  const [spare, setSpare] = useState(null);

  const term = searchParams.get("term") || '';
  const active = searchParams.get("active") || 0;
  const action = searchParams.get("action") || '';
  const id = searchParams.get("id") || null;

  const [show_form, setShowForm] = useState((action == 'new') ? true : false)
  const [show_view, setShowView] = useState((action == 'view') ? true : false)

  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { query: term, show_inactive: (active == 1) ? true : false } });

  const onSearch = async (data) => {
    router.push(`?term=${data.query}&active=${(data.show_inactive) ? '1' : '0'}`)
    getSpares(data.query, (data.show_inactive) ? '1' : '0');
  }

  useEffect(() => {
    if (term != '') {
      getSpares(term, active);
    } else {
      getSpares('%', active);
    }

  }, [term]);

  useEffect(() => {
    if (id) {
      getSpare(id);
    }
  }, [id, action]);

  const clear = () => {
    router.push(`?term=`)
    getSpares('');
    reset({ query: "" });
  }


  const getSpare = async (id) => {
    setSpare(null);
    setShowForm(false);
    setShowView(false);

    try {
      const rs = await axios.post(url_get_spare, {
        CodRepuesto: id,
        ValToken: token
      });

      setSpare(rs.data.dato[0]);

      if (action === 'edit') {
        setShowForm(true);
      } else if (action === 'view') {
        setShowView(true);
      }

    } catch (error) {
      console.log(error);
    }
  };

  const getSpares = async (term = '', show_inactive = 1) => {


    try {
      const rs = await axios.post(url, { NroParteFiltro: term, Idioma: locale, EstadoFiltro: show_inactive, ValToken: token });


      //setSpares(Array.isArray(rs.data.dato) ? rs.data.dato : []);
      if (rs.data.estado == "OK") {
        setSpares(() => rs.data.dato.map((o, index) => {
          o.id = index;
          return o;
        }));
      }


    } catch (error) {

    }
  }

  const editSparePart = async (s) => {
    setSpare([])
    setShowForm(false);
    try {
      const rs = await axios.post(url_get_spare, { CodRepuesto: s.IdRepuesto, ValToken: token });

      setSpare(rs.data.dato[0]);
      setShowForm(true);
    } catch (error) {

    }
  }

  const updateList = (data) => {

    let exist = false;
    let options = [];

    options = spares.map((cs) => {

      if (cs.IdRepuesto == data.IdRepuesto) {

        exist = true;
        cs.NroParte = data.NroParte;
        cs.DesRepuesto = data.DesRepuesto;
        cs.Proveedor = data.Proveedor;

        cs.Marca = data.Marca;
        cs.Aplicacion = data.Aplicacion;
        cs.TipRepuesto = data.TipRepuesto;
        cs.Estado = data.Estado;
        cs.Peso = data.Peso;
        cs.Costo = data.Costo;
        cs.CanStock = data.CanStock;
        cs.CanMin = data.CanMin;
        cs.UniMed = data.UniMed;
        cs.PedidoEspecial = data.PedidoEspecial;
        cs.PedEspecialSinFecha = data.PedEspecialSinFecha;
        cs.FecModifica = data.FecModifica;
        cs.FecVencimiento = data.FecVencimiento;
        cs.CodEstado = data.CodEstadoNroParte;
      }
      return cs;
    });
    if (!exist) {

      options = [];
      options.push(...spares, {
        IdRepuesto: data.IdRepuesto,
        NroParte: data.NroParte,
        DesRepuesto: data.DesRepuesto,
        Proveedor: data.Proveedor,

        Marca: data.Marca,
        Aplicacion: data.Aplicacion,
        TipRepuesto: data.TipRepuesto,
        Estado: data.Estado,
        Peso: data.Peso,
        Costo: data.Costo,
        CanStock: data.CanStock,
        CanMin: data.CanMin,
        UniMed: data.UniMed,
        PedidoEspecial: data.PedidoEspecial,
        PedEspecialSinFecha: data.PedEspecialSinFecha,
        FecModifica: data.FecModifica,
        FecVencimiento: data.FecVencimiento,
        CodEstado: data.CodEstado
      }

      );
    }

    setSpares(options);
  }

  useDynamicTitle(`${t.register} | ${t.spare_parts}`);

  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.register}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.spare_parts}</span>
        </li>
      </ul>

      {!(show_form || show_view) &&
        <>
          <div className="grid grid-cols-1 gap-6 pt-5">
            <div className={`panel shadow-lg border bg-gray-200`}>
              <div className="mb-5">
                <form className="space-y-5" onSubmit={handleSubmit(onSearch)}>
                  <label htmlFor="search" className="text-sm font-medium text-gray-900 dark:text-white">{t.nro_part}</label>
                  <div className="relative">
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                      </div>
                      <input type="search" defaultValue={term} {...register("query", { required: false })} id="search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder={t.enter_search_spare_parts} required />
                      <div className="mt-4 flex items-center text-center sm:absolute sm:end-2.5 sm:bottom-2.5">
                        <button type="button" onClick={() => clear()} className="btn-dark hover:bg-gray-900 text-white mr-2 font-medium rounded-lg text-sm px-2.5 py-1.5"><IconBackSpace className=''></IconBackSpace></button>
                        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.btn_search}</button>
                      </div>
                    </div>
                    <div>
                      <label className="flex cursor-pointer items-center text-black">
                        <input type="checkbox" {...register("show_inactive")} className="form-checkbox bg-white" />
                        <span className=" text-black dark:text-white-dark">{t.show_inactive}</span>
                      </label>
                    </div>
                  </div>
                </form>

              </div>
            </div>
          </div>
          <div className="my-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => { setSpare([]); setShowForm(true); }} type="button" className="btn btn-primary">
                <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                {t.btn_add_spare_parts}
              </button>
            </div>
          </div>
        </>
      }
      {(show_form && spare) && <ComponentSpareForm action_cancel={() => setShowForm(false)} token={token} t={t} spare={spare} updateList={updateList}  ></ComponentSpareForm>}
      {(show_view) && <ComponentSpareView action_cancel={() => setShowView(false)} token={token} t={t} spare={spare} updateList={updateList} locale={locale} ></ComponentSpareView>}
      {(spares && !(show_form || show_view)) && <DatatablesSpares data={spares} t={t} editSparePart={editSparePart} token={token} />}
    </div>
  );
}