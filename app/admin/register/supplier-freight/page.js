"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconPlusCircle from "@/components/icon/icon-plus-circle";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconPencil from "@/components/icon/icon-pencil";
import IconPlus from "@/components/icon/icon-plus";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url = process.env.NEXT_PUBLIC_API_URL + 'flete/MostrarListaZonaFlete';
const url_get_freight = process.env.NEXT_PUBLIC_API_URL + 'flete/RecuperarDatosFlete';
const url_save_freight = process.env.NEXT_PUBLIC_API_URL + 'flete/GuardarFlete';
const url_delete_freight = process.env.NEXT_PUBLIC_API_URL + 'flete/EliminarDatosFlete';

const initial_rows = [
  { CodRango: 1, PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 },
  { CodRango: 2, PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 },
  { CodRango: 3, PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 },
  { CodRango: 4, PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 },
  { CodRango: 5, PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 }
]

export default function SupplierFreight() {


  const token = useSelector(selectToken);
  const t = useTranslation();

  const [current_row, setCurrentRow] = useState(6);

  const [zones, setZones] = useState([]);
  const [freight, setFreight] = useState([]);
  const [show_form, setShowForm] = useState(false);
  const [show_delete, setShowDelete] = useState(false)

  const {
    register, reset,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();


  useEffect(() => {

    async function fetchData() {
      await getZones();
    }
    fetchData();


  }, []);

  const onSubmit = async (data) => {
    let data_rows = [];
    freight.map((r) => {
      data_rows.push(
        {
          "ZonaFleteAnterior": (freight[0].ZonaFlete) ? freight[0].ZonaFlete : getValues('zone'),
          "ZonaFleteActual" : getValues('zone'),
          "CostoMin": getValues('min_cost'),
          "PesoInicial": getValues(`data[${r.CodRango}][pi]`),
          "PesoFinal": getValues(`data[${r.CodRango}][pf]`),
          "CostoLibra": getValues(`data[${r.CodRango}][cl]`),
          "ValToken": token
        }
      )
    });
    try {
      const rs = await axios.post(url_save_freight, data_rows);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.freight_successfully_saved,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          setZones(rs.data.dato);
          cancel();
        });
      }
    } catch (error) {

    }


  }

  const addRow = () => {
    setFreight([...freight, { CodRango: (current_row), PesoInicial: 0, PesoFinal: 0, CostoLibra: 0 }])
    setCurrentRow(current_row + 1);
  }

  const removeRow = (id) => {
    let _rows = freight.filter((r, index) => {
      return id != r.CodRango
    });

    setFreight(_rows);
  }

  const editFreight = (z) => {
    reset({ zone: z.ZonaFlete, min_cost: z.CostoMin })
    getFreight(z);
    setShowForm(true);
    setShowDelete(true);
  }

  const getFreight = async (z) => {
    try {
      const rs = await axios.post(url_get_freight, { ZonaFlete: z.ZonaFlete, ValToken: token });
      if (rs.data.estado == 'OK') {

        setFreight(rs.data.dato);
      }
    } catch (error) {

    }
  }

  const getZones = async () => {
    try {
      const rs = await axios.post(url, { ValToken: token });
      if (rs.data.estado == 'OK') {

        setZones(rs.data.dato);
      }
    } catch (error) {

    }
  }
  const addFreight = () => {
    setFreight(initial_rows);
    reset({ zone: '', min_cost: '' });
    setShowForm(true);

  }

  const cancel = () => {
    setFreight([]);
    reset({ zone: '', min_cost: '' });
    setShowForm(false);
    setShowDelete(false);
  }

  const deleteFreight = () => {
    Swal.fire({
      title: t.question_delete_freight_zone,
      text: freight[0].ZonaFlete,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_freight, { ZonaFlete: freight[0].ZonaFlete, ValToken: token });

          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.freight_zone_deleted,
              showConfirmButton: false,
              timer: 1500
            });

            updateList(() => {
              return zones.filter((item) => {
                return item.ZonaFlete != freight[0].ZonaFlete;
              });
            });

            cancel();
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.freight_zone_deleted_error,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.freight_zone_deleted_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  }

  const updateList = (data) => {
    setZones(data);
  }

  const parseToFloat = (value) => {
    const numero = parseFloat(value.replace(',', '.'));
    if (!isNaN(numero)) {
      e.target.value = numero.toFixed(2);
    }
  }

  useDynamicTitle(`${t.register} | ${t.supplier_freight}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.register}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold">{t.supplier_freight}</span>
          </li>
        </ul>

      </div>
      {!(show_form) &&
        <div className="flex gap-3 mt-8 justify-end">
          <button type="button" className="btn btn-primary" onClick={() => addFreight()}>
            <IconPlus className="ltr:mr-2 rtl:ml-2" />
            {t.btn_add_freight}
          </button>
        </div>
      }

      {(show_form) &&
        <div className="grid grid-cols-1 gap-6 pt-5">
          <div className="panel shadow-lg bg-gray-200">
            <form className="" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="zone">{ t.zone_cost }</label>
                    <div className="relative flex-1">

                      <input type='text' autoComplete='OFF' {...register("zone", { required: { value: true, message: t.required_field } })} aria-invalid={errors.zone ? "true" : "false"} placeholder={t.login.enter_zone} className={`form-input ${errors.zone ? "error" : ""}`} />
                      {errors.zone && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.zone?.message?.toString()}</span>}

                    </div>
                  </div>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="min_cost">{ t.minimum_cost }</label>
                    <div className="relative flex-1">

                      <input type='text' autoComplete='OFF' {...register("min_cost", { required: { value: true, message: t.required_field } })} aria-invalid={errors.min_cost ? "true" : "false"} placeholder={t.login.enter_min_cost} className={`form-input ${errors.min_cost ? "error" : ""}`} />
                      {errors.min_cost && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.min_cost?.message?.toString()}</span>}

                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="table-responsive mb-5">
                    <table className="table-hover bg-white mantine-Table-root mantine-cdbiq">
                      <thead>
                        <tr>
                          <th className="max-w-4">{ t.initial_weight }</th>
                          <th className="max-w-4">{ t.final_weight }</th>
                          <th className="max-w-4">{ t.cost }</th>
                          <th className="text-end">
                            <button onClick={() => addRow()} type="button" title="Agregar" className="btn btn-sm btn-primary w-8 h-8 p-0 "><IconPlusCircle /></button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {freight.map((r, index) => {

                          return (

                            <tr key={index}>
                              <td className="!p-1">
                                <input type='text' defaultValue={r.PesoInicial.toFixed(2)} autoComplete='OFF' {...register(`data[${r.CodRango}][pi]`, {
                                  required: false, onBlur: (e) => {
                                    const valor = e.target.value;
                                    const numero = parseFloat(valor.replace(',', '.'));
                                    if (!isNaN(numero)) {
                                      e.target.value = numero.toFixed(2);
                                      setValue(`data[${r.CodRango}][pi]`, numero.toFixed(2));
                                    }
                                  },
                                })} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                              </td>
                              <td className="!p-1">
                                <input type='text' defaultValue={r.PesoFinal.toFixed(2)} autoComplete='OFF' {...register(`data[${r.CodRango}][pf]`, {
                                  required: false,
                                  onBlur: (e) => {
                                    const valor = e.target.value;
                                    const numero = parseFloat(valor.replace(',', '.'));
                                    if (!isNaN(numero)) {
                                      e.target.value = numero.toFixed(2);
                                      setValue(`data[${r.CodRango}][pf]`, numero.toFixed(2));
                                    }
                                  },
                                })} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                              </td>
                              <td className="!p-1">
                                <input type='text' defaultValue={r.CostoLibra.toFixed(2)} autoComplete='OFF' {...register(`data[${r.CodRango}][cl]`, {
                                  required: false,
                                  onBlur: (e) => {
                                    const valor = e.target.value;
                                    const numero = parseFloat(valor.replace(',', '.'));
                                    if (!isNaN(numero)) {
                                      e.target.value = numero.toFixed(2);
                                      setValue(`data[${r.CodRango}][cl]`, numero.toFixed(2));
                                    }
                                  },
                                })} placeholder={t.login.enter_min_cost} className="form-input !py-1 placeholder:" />
                              </td>
                              <td className="!py-0">
                                {(index > 0) &&
                                  <button type="button" onClick={() => removeRow(r.CodRango)} className="hover:text-red-800 w-8 h-8 p-0 ">
                                    <IconTrashLines />
                                  </button>
                                }
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="my-5">

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {show_delete &&
                    <button onClick={() => deleteFreight()} type="button" className="btn btn-danger">
                      {t.btn_delete}
                    </button>
                  }
                  <button onClick={() => cancel()} type="button" className="btn btn-dark">
                    {t.btn_cancel}
                  </button>
                  <button type="submit" className="btn btn-success">
                    {t.btn_save}
                  </button>

                </div>
              </div>

            </form>
          </div>
        </div>
      }
      {!(show_form) &&
        <div className="table-responsive mt-8 mb-5">
          <table className="bg-white table-hover">
            <thead>
              <tr>
                <th className="bg-gray-400 text-center uppercase">{ t.process_Type }</th>
                <th className="bg-gray-400 text-center uppercase">{ t.zone_cost }</th>
                <th className="bg-gray-400 text-center uppercase">{ t.initial_weight }</th>
                <th className="bg-gray-400 text-center uppercase">{ t.final_weight }</th>
                <th className="bg-gray-400 text-center uppercase">{ t.cost }</th>
                <th className="bg-gray-400 text-center uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z, index) => {
                return (
                  <tr key={index}>
                    <td>STANDARD</td>
                    <td>{z.ZonaFlete}</td>
                    <td>{z.PesoInicial}</td>
                    <td>{z.PesoFinal}</td>
                    <td>{z.CostoLibra}</td>
                    <td>
                      <div className="mx-auto flex w-max items-center gap-2">
                        <button title={t.edit} type="button" className="btn btn-sm btn-info" onClick={() => editFreight(z)}><IconPencil /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
    </>
  );
}