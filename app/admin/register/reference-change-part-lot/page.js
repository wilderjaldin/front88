"use client";
import { useState } from "react";
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import IconHelpCircle from "@/components/icon/icon-help-circle";
import Swal from 'sweetalert2'
import axios from 'axios'
import { useOptionsSelect } from '@/app/options'
import DataTable from "@/app/admin/register/reference-change-part-lot/table"
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_save = process.env.NEXT_PUBLIC_API_URL + 'repuestolote/GuardarReferencia ';

export default function ReferenceChangePartLot() {

  const t = useTranslation();
  const token = useSelector(selectToken);
  const [rowData, setRowData] = useState(null);
  const [show_form, setShowForm] = useState(false);
  const brands = useOptionsSelect("brands") || [];


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();


  const getCodBrand = (brand) => {
    const found = brands.find(
      (u) => u.label.toLowerCase() === brand.toLowerCase()
    );
    return found ? found.value : 0;
  }

  const onSubmit = async (data) => {
    let lines = data.codes.split(/\r\n|\r|\n/);
    let rows = [];
    let incorrect_brands = [];
    for (var line of lines) {
      let spare = line.split(/\t/);
      if (spare.length > 1) {
        let brand_code_1 = getCodBrand(spare[1]);
        let brand_code_2 = getCodBrand(spare[3]);
        if (brand_code_1 == 0) {
          incorrect_brands.push(spare[1]);
        }
        if (brand_code_2 == 0) {
          incorrect_brands.push(spare[3]);
        }
        rows.push({
          nro_part_1: spare[0],
          brand_1: spare[1],
          brand_code_1: brand_code_1,
          nro_part_2: spare[2],
          brand_2: spare[3],
          brand_code_2: brand_code_2
        });
      }
    }
    if (incorrect_brands.length > 0) {
      Swal.fire({
        title: t.error,
        text: `${t.incorrect_brands} [${incorrect_brands.toString()}]`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    if (rows.length == 0) {
      Swal.fire({
        title: t.error,
        text: `${t.data_entered_is_incorrect}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    setRowData(rows);
    setShowForm(true);

  }


  const downloadFile = () => {
    window.open('/assets/files/FormatoIngresoLote.xlsx', '_blank');
  }

  const handleSave = async () => {
    Swal.fire({
      html: t.saving_data,
      timerProgressBar: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let data_send = [];
      
      rowData.map(row => {
        data_send.push(
          {
            NroParte1: row.nro_part_1,
            CodMarca1: row.brand_code_1,
            NroParte2: row.nro_part_2,
            CodMarca2: row.brand_code_2,
            ValToken: token
          }
        );
      });

      const rs = await axios.post(url_save, data_send);
      
      if (rs.data.estado == "OK") {
        Swal.close();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_data_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setValue('codes', "");
          setRowData([]);
          setShowForm(false);
        })
      }
    } catch (error) {
      
    }
  }

  useDynamicTitle(`${t.register} | ${t.change_part_in_lot}` );
  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.register}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span className="font-bold">{ t.change_part_in_lot }</span>
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
                      <button onClick={() => downloadFile()} type="button" className="font-bold flex items-center border"><IconHelpCircle className="h-6 w-6 mr-2" /> { t.download_batch_format }</button>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{ t.import_data }</button>
                    </div>
                  </>
                }
              </form>
            }
            {(rowData && (show_form)) && <DataTable items={rowData} t={t} ></DataTable>}
            {(show_form) &&
              <div className="grid grid-cols-1 gap-6 pt-5">
                <div className={`mt-4`}>
                  <div className="mb-5">


                    <div className="my-5">

                      <div className="flex flex-wrap items-center justify-center gap-2">

                        <button type="button" className="btn btn-outline-danger" onClick={() => setShowForm(false)}>
                          {t.btn_cancel}
                        </button>

                        <button type="button" onClick={() => handleSave()} className="btn btn-success">
                          {t.btn_save}
                        </button>

                      </div>
                    </div>

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