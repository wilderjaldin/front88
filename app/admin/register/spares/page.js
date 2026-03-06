"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import DatatablesSpares from './components-datatables-spares';
import ComponentSpareForm from "@/components/forms/spare-form";
import ComponentSpareView from "@/app/admin/register/spares/view";
import IconPlusProps from '@/components/icon/icon-plus';
import { getLocale } from '@/store/localeSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axiosClient from "@/app/lib/axiosClient"
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconBackSpace from "@/components/icon/icon-backspace";

const url_list = 'repuestos/listar';

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

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { query: term, show_inactive: (active == 1) ? true : false } });


  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (id) {
      getSpare(id);
    }
  }, [id, action]);

  const onSearch = async (data) => {

    const activeFlag = data.show_inactive ? '1' : '0';

    router.push(`?term=${data.query}&active=${activeFlag}`);

    setPage(1);

    getSpares(data.query, "AC", 1);

  }

  const changePage = (newPage) => {

    setPage(newPage);

    getSpares(term || '', "", newPage);

  }



  const loadInitial = () => {
    getSpares('', "", 1);
  };

  /*
  useEffect(() => {
    if (term != '') {
      getSpares(term, active);
    } else {
      getSpares('%', active);
    }

  }, [term]);
  */


  const clear = () => {
    router.push(`?term=`)
    getSpares('');
    reset({ query: "" });
  }

  const handleSearch = (data) => {
    console.log(data)
    getSpares(data.term, data.status, 1);
  }


  const getSpare = async (id) => {
    setSpare(null);
    setShowForm(false);
    setShowView(false);

    try {
      const rs = await axiosClient.post(url_get_spare, {
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

  const getSpares = async (term = '', status = "AC", pageNumber = 1) => {

    try {

      const rs = await axiosClient.get(url_list, {
        params: {
          page: pageNumber,
          pageSize: pageSize,
          term,
          codEstado: status
        }
      });

      setPage(rs.data.page);
      setTotal(rs.data.total);

      const data = rs.data.data.map((o, index) => ({
        ...o,
        id: index
      }));

      setSpares(data);

    } catch (error) {
      console.log(error);
    }

  };

  const editSparePart = async (s) => {
    setSpare([])
    setShowForm(false);
    try {
      const rs = await axiosClient.post(url_get_spare, { CodRepuesto: s.IdRepuesto, ValToken: token });

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
          
       
        </>
      }
      {(show_form && spare) && <ComponentSpareForm action_cancel={() => setShowForm(false)} token={token} t={t} spare={spare} updateList={updateList}  ></ComponentSpareForm>}
      {(show_view) && <ComponentSpareView action_cancel={() => setShowView(false)} token={token} t={t} spare={spare} updateList={updateList} locale={locale} ></ComponentSpareView>}
      
      <DatatablesSpares
        data={spares}
        t={t}
        editSparePart={editSparePart}
        token={token}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={changePage}
        handleSearch={handleSearch}
      />
      
    </div>
  );
}