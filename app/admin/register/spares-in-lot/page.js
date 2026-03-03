"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import { selectToken } from '@/store/authSlice';
import DatatablesSparesLot from "@/components/datatables/components-datatables-spares-lot";
import IconHelpCircle from "@/components/icon/icon-help-circle";
import Select from 'react-select';
import Swal from 'sweetalert2'
import axios from 'axios'
import { useOptionsSelect } from '@/app/options'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_list_selects = process.env.NEXT_PUBLIC_API_URL + 'repuestolote/ObtenerListaControles';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'repuestolote/GuardarRepuestos';

export default function SparesInLot() {

  const t = useTranslation();
  const token = useSelector(selectToken);
  const [rowData, setRowData] = useState(null);
  const [show_form, setShowForm] = useState(false);
  const brands = useOptionsSelect("brands") || [];

  const [suppliers, setSuppliers] = useState([])
  const [types, setTypes] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [units, setUnits] = useState([]);
  const locale = useSelector(getLocale);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    async function fetchData() {
      await onInit();
    }
    fetchData();
  }, []);

  const onInit = async () => {

    try {
      const rs = await axios.post(url_list_selects, { Idioma: locale, ValToken: token });
      
      if (rs.data.estado == "OK") {
        let options = [];
        rs.data.dato1.map((o) => {
          if (o.CodPrv != 0) {
            options.push({ value: o.CodPrv, label: o.NomPrv });
          }
        });
        setSuppliers(options);
        options = [];
        rs.data.dato2.map((o) => {
          if (o.DesTipRepuesto != "") {
            options.push({ value: o.CodTipRepuesto, label: o.DesTipRepuesto });
          }
        });
        setTypes(options);

        options = [];
        rs.data.dato3.map((o) => {
          if (o.DesEstado != "") {
            options.push({ value: o.CodEstado, label: o.DesEstado });
          }
        });
        setConditions(options);
        setUnits(rs.data.dato4);
      }
    } catch (error) {

    }
  }
  const onSubmit = async (data) => {
  try {
    let lines = data.codes.split(/\r\n|\r|\n/);
    let rows = [];
    let incorrect_units = [];
    let invalid_lines = [];

    for (const [index, line] of lines.entries()) {
      if (!line.trim()) continue; // ignorar líneas vacías

      let spare = line.split(/\t/);

      // ✅ Verificar que tenga al menos 10 columnas
      if (spare.length < 10) {
        invalid_lines.push(index + 1); // guardamos el número de línea con error
        continue;
      }

      const unit = spare[5] ? spare[5].toUpperCase() : '';

      // ✅ Validar unidad
      if (!units.some(obj => Object.values(obj).includes(unit))) {
        incorrect_units.push(unit);
      }

      rows.push({
        id: spare[0],
        nro_part: spare[0],
        description: spare[1],
        cost: spare[2],
        weight: spare[3],
        min_amount: spare[4],
        unit,
        special_order: spare[6],
        days: spare[7],
        special_order_without_date: spare[8],
        low_inventory: spare[9]
      });
    }

    // ⚠️ Mostrar advertencias si hay errores
    if (invalid_lines.length > 0) {
      Swal.fire({
        title: t.error,
        text: `${t.invalid_format_lines}: ${invalid_lines.join(', ')}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    if (incorrect_units.length > 0) {
      Swal.fire({
        title: t.error,
        text: `${t.incorrect_units}: [${incorrect_units.join(', ')}]`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    setRowData(rows);
    setShowForm(true);
  } catch (error) {
    console.error('Error parsing data:', error);
    Swal.fire({
      title: t.error,
      text: t.unexpected_error || 'Unexpected error while processing data',
      icon: 'error',
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.close
    });
  }
};

  const handleChange = (select, field) => {
    setValue(field, (select?.value ?? null))
    if (select?.value != null) {
      clearErrors(field);
    }
  }

  const downloadFile = () => {
    window.open('/assets/files/FormatoIngresoLote.xlsx', '_blank');
  }
  const getCodUnit = (unit) => {
    const encontrado = units.find(
      (u) => u.DesUniMedida.toLowerCase() === unit.toLowerCase()
    );
    return encontrado ? encontrado.CodUniMed : "";
  }
  const handleSave = async (data) => {
    try {
      let data_send = [];


      rowData.map(row => {
        data_send.push(
          {
            NroParte: row.nro_part,
            DesRepuesto: row.description,
            CodProveedor: data.supplier,
            CodMarca: data.brand,
            CodAplicacion: data.application,
            CodTipRepuesto: data.type,
            CodEstadoRepuesto: data.condition,
            Peso: row.weight,
            Costo: row.cost,
            CanMin: row.min_amount,
            CodUniMed: getCodUnit(row.unit),
            PedidoEspecial: row.special_order,
            CanDias: row.days,
            PedEspecialSinFecha: row.special_order_without_date,
            CanStock: row.low_inventory,
            ValToken: token
          }

        );
      });

      const rs = await axios.post(url_save, data_send);
      if (rs.data.estado == "OK") {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_data_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setValue('codes', "");
          setValue('supplier', null);
          setValue('type', null);
          setValue('condition', null);
          setValue('application', null);
          setValue('brand', null);
          setRowData([]);
          setShowForm(false);
        })
      }
    } catch (error) {

    }
  }

  useDynamicTitle(`${t.register} | ${t.spare_parts_in_lot}`);

  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.register}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.spare_parts_in_lot}</span>
        </li>
      </ul>

      <div className="grid grid-cols-1 gap-6 pt-5">
        <div className={`panel shadow-lg border bg-gray-200`}>
          <div className="mb-5">
            {!(show_form) &&
              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <div className="relative">
                  <div className="relative mb-4">
                    <textarea rows={6} defaultValue='' {...register("codes", { required: { value: true, message: t.required_field } })} id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                    {errors.codes && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.codes?.message?.toString()}</span>}
                  </div>
                </div>
                {!(show_form) &&
                  <>
                    <div className="flex flex-wrap justify-end">
                      <button onClick={() => downloadFile()} type="button" className="font-bold flex items-center border"><IconHelpCircle className="h-6 w-6 mr-2" /> {t.download_batch_format}</button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{t.import_data}</button>
                    </div>
                  </>
                }
              </form>
            }
            {(rowData && (show_form)) && <DatatablesSparesLot t={t} data={rowData}></DatatablesSparesLot>}
            {(show_form) &&
              <div className="grid grid-cols-1 gap-6 pt-5">
                <div className={`mt-4`}>
                  <div className="mb-5">
                    <form className="" onSubmit={handleSubmit(handleSave)}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className='space-y-4'>


                          <div>
                            <label htmlFor="select_supplier">{t.supplier}</label>
                            <Select instanceId={`supplier`}
                              {...register("supplier", { required: { value: true, message: t.required_select } })}
                              isClearable={true}
                              isSearchable={true}
                              placeholder={t.select_option}
                              className='w-full'
                              options={suppliers}
                              onChange={(select) => handleChange(select, 'supplier')}
                            />
                            {errors.supplier && <span className='relative block text-red-400 error block text-xs mt-1' role="alert">{errors.supplier?.message?.toString()}</span>}
                          </div>

                          <div>
                            <label htmlFor="select_type">{t.spare_part_type}</label>
                            <Select instanceId={`type`}
                              {...register("type", { required: { value: true, message: t.required_select } })}
                              isClearable={true}
                              isSearchable={true}
                              placeholder={t.select_option}
                              className='w-full'
                              options={types}
                              onChange={(select) => handleChange(select, 'type')}
                            />
                            {errors.type && <span className='relative block text-red-400 error block text-xs mt-1' role="alert">{errors.type?.message?.toString()}</span>}
                          </div>


                          <div>
                            <label htmlFor="select_status">{t.status}</label>
                            <Select instanceId={`conditions`}
                              {...register("condition", { required: { value: true, message: t.required_select } })}
                              isClearable={true}
                              isSearchable={true}
                              placeholder={t.select_option}
                              className='w-full'
                              options={conditions}
                              onChange={(select) => handleChange(select, 'condition')}
                            />
                            {errors.condition && <span className='relative block text-red-400 error block text-xs mt-1' role="alert">{errors.condition?.message?.toString()}</span>}
                          </div>

                        </div>
                        <div className='space-y-4'>
                          <div>
                            <label htmlFor="select_app">{t.application}</label>
                            <div className="">
                              <Select instanceId={`application`}
                                {...register("application", { required: { value: true, message: t.required_select } })}
                                isClearable={true}
                                isSearchable={true}
                                placeholder={t.select_option}
                                className='w-full'
                                options={brands}
                                onChange={(select) => handleChange(select, 'application')}
                              />
                              {errors.application && <span className='relative block text-red-400 error block text-xs mt-1' role="alert">{errors.application?.message?.toString()}</span>}
                            </div>
                          </div>


                          <div>
                            <label htmlFor="select_brand">{t.brand}</label>
                            <div className="">
                              <Select instanceId={`brand`}
                                {...register("brand", { required: { value: true, message: t.required_select } })}
                                isClearable={true}
                                isSearchable={true}
                                placeholder={t.select_option}
                                className='w-full'
                                options={brands}
                                onChange={(select) => handleChange(select, 'brand')}
                              />
                              {errors.brand && <span className='relative block text-red-400 error block text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
                            </div>
                          </div>



                        </div>
                      </div>

                      <div className="my-5">

                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button type="button" className="btn btn-outline-danger" onClick={() => setShowForm(false)}>
                            {t.btn_cancel}
                          </button>
                          <button type="submit" className="btn btn-success">
                            {t.btn_update}
                          </button>

                        </div>
                      </div>

                    </form>

                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

    </div>
  );
}