"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Tippy from "@tippyjs/react";
import IconTrash from "@/components/icon/icon-trash";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconPlusCircle from "@/components/icon/icon-plus-circle";
import Select from 'react-select';
import brands from '@/data/brands.json'
import IconPencil from "@/components/icon/icon-pencil";
import IconPencilPaper from "@/components/icon/icon-pencil-paper";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconPlus from "@/components/icon/icon-plus";
import { useOptionsSelect } from '@/app/options'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
const url = process.env.NEXT_PUBLIC_API_URL + 'utilidad/DatosUtilidad';
const url_get_utility = process.env.NEXT_PUBLIC_API_URL + 'utilidad/RecuperarDatoUtilidad';
const url_save_utility = process.env.NEXT_PUBLIC_API_URL + 'utilidad/GuardarDatosUtilidad';
const url_delete_utility = process.env.NEXT_PUBLIC_API_URL + 'utilidad/EliminarUtilidad ';

const types = [{ value: 'OR', label: 'ORIGINAL' }, { value: 'RE', label: 'REEMPLAZO' }];

export default function Ulitity() {


  const t = useTranslation();
  const token = useSelector(selectToken);
  const [isEdit, setIsEdit] = useState(false)
  const [utilities, setUtilities] = useState([]);

  const brands = useOptionsSelect("brands") || [];
  const [current_app, setCurrentApp] = useState(null);
  const [current_type, setCurrentType] = useState(null);
  const [utility, setUtility] = useState([])

  const {
    register, reset, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    getUtilities();
  }, []);

  const onSubmit = async (data) => {

    
    
    try {
      let data_utility = {
        CodRegistro: (utility?.CodRegistro) ?? 0,
        PorUtilidad: data.utility,
        CodAplicacion: (data.app != "") ? data.app : 0,
        CodTipoRepuesto: data.type,
        ValToken: token
      }
      const rs = await axios.post(url_save_utility, data_utility);
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          text: t.utility_save_success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          confirmButtonText: t.close
        }).then(r => {
          if(rs.data.dato.length > 0){
            setUtilities(rs.data.dato);            
          }
          cancel();
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.utility_save_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      
      Swal.fire({
          title: t.error,
          text: t.utility_save_error_server,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
    }
  }


  const removeUtility = async (CodRegistro) => {

    Swal.fire({
      title: t.question_delete_utility,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_delete_utility, { CodRegistro: CodRegistro, ValToken: token });
          
          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.utility_deleted,
              showConfirmButton: false,
              timer: 1500
            });
            
            setUtilities(() => {
              return utilities.filter((item) => {
                return item.CodRegistro != CodRegistro;
              });
            });            

          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.utility_deleted_error,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {
          
          Swal.fire({
            title: t.error,
            text: t.utility_deleted_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  

  
    
  }

  const editUtility = (row) => {
    setIsEdit(true);
    
    let c_app = (brands).find((key) => key.label.toUpperCase() === row.Aplicacion.toUpperCase()) || null;
    setCurrentApp(c_app);
    let c_type = (types).find((key) => key.label.toUpperCase() === row.TipoRepuesto.toUpperCase()) || null;
    setCurrentType(c_type);
    reset({utility: row.PorUtilidad, app: (c_app?.value) ?? '', type: (c_type?.value) ?? '' });
    setUtility(row);

  }

  const cancel = () => {
    setIsEdit(false);
    setCurrentType(null);
    setCurrentApp(null);
    reset({utility: '', app: '', type: '' });
    setUtility([]);
  }

  const getUtilities = async () => {
    
    try {
      const rs = await axios.post(url, { ValToken: token });
      if (rs.data.estado == 'OK') {
        
        setUtilities(rs.data.dato);
      }
    } catch (error) {

    }
  }

  const handleChange = (select, field) => {
    if (select.value) {
      setValue(field, select.value)
      if(field == 'app'){
        setCurrentApp(select);
      } else{
        setCurrentType(select);
      }
    } else {
      setValue(field, null)
      setCurrentApp(null);
      setCurrentType(null);
    }
  }
  useDynamicTitle(`${t.register} | ${t.utility}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
           { t.register }
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.utility }</span>
          </li>
        </ul>

      </div>
      <div className="grid grid-cols-1 gap-6 pt-5">
        <div className="panel shadow-lg bg-gray-200">
          <form className="" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="utility">% {t.utility}</label>
                  <div className="relative flex-1">

                    <input type='text' autoComplete='OFF' {...register("utility", { required: { value: true, message: t.required_field } })} aria-invalid={errors.utility ? "true" : "false"} placeholder={t.login.enter_utility} className={`form-input ${errors.utility ? "error" : ""}`} />
                    {errors.utility && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.utility?.message?.toString()}</span>}

                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="type">{ t.spare_part_type }</label>
                  <div className="flex flex-1">
                    <Select {...register('type')} onChange={(e) => handleChange(e, 'type')} value={current_type} placeholder={t.select_option} className='w-full' options={types} />
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="zone">{ t.application }</label>
                  <div className="flex flex-1">
                    <Select {...register('app')} onChange={(e) => handleChange(e, 'app')} value={current_app} placeholder={t.select_option} className='w-full' options={brands} />
                  </div>
                </div>

                <div className="my-5">

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {(isEdit) ?
                      <>
                        <button type="button" onClick={() => cancel()} className="btn btn-dark">
                          {t.btn_cancel}
                        </button>
                        <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                          { t.btn_update }
                        </button>
                      </>
                      :
                      <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                        {t.btn_add}
                      </button>
                    }
                  </div>
                </div>


              </div>
              <div className="space-y-4">
                <div className="table-responsive mb-5">
                  <table className="table-hover bg-white mantine-Table-root mantine-cdbiq">
                    <thead>
                      <tr>
                        <th className="max-w-20">{ t.is_standard }</th>
                        <th className="max-w-16">% { t.utility }</th>
                        <th className="max-w-20">{ t.spare_part_type }</th>
                        <th>{ t.application }</th>
                        <th className="max-w-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilities.map((u, index) => {

                        return (

                          <tr key={index}>
                            <td className="!p-1 text-center">
                              {(u.EsStandard == "SI") ? <span className="badge bg-success"> {t.yes} </span> : <span className="badge bg-dark">NO</span>}
                            </td>
                            <td className="!p-1 text-center">
                              {u.PorUtilidad}
                            </td>
                            <td className="!p-1">
                              {u.TipoRepuesto}
                            </td>
                            <td>{u.Aplicacion}</td>
                            <td className="!py-0">
                              <div className="flex flex-wrap items-end justify-end gap-2">
                                <button onClick={() => editUtility(u)} type="button" title="Agregar" className="hover:text-blue-600 w-8 h-8 p-0"><IconPencilPaper /></button>
                                <button type="button" onClick={() => removeUtility(u.CodRegistro)} className="hover:text-red-800 w-8 h-8 p-0 ">
                                  <IconTrashLines />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}