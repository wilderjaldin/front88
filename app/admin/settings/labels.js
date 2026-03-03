"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import IconCaretDown from "@/components/icon/icon-caret-down";
import IconCheck from "@/components/icon/icon-check";
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

export default function Labels({ t }) {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);


  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customers: "",
      suppliers: "",
      spare_parts: "",
      nro_part: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
       
        const res = await fetch('/api/locales', { cache: 'no-store' });

        if (!res.ok) return;

        const data = await res.json();

        reset({
          customers: data.customers || "",
          suppliers: data.suppliers || "",
          spare_parts: data.spare_parts || "",
          nro_part: data.nro_part || "",
        });
      } catch (error) {
        console.error("Error cargando custom.json:", error);
      }
    };

    fetchData();
  }, [reset]);



  const onSave = async (data) => {
    try {
      const jsonData = {};
      if (data.customers?.trim()) {
        jsonData.customers = data.customers;
      }
      if (data.suppliers?.trim()) {
        jsonData.suppliers = data.suppliers;
      }
      if (data["spare_parts"]?.trim()) {
        jsonData.spare_parts = data["spare_parts"];
      }
      if (data.nro_part?.trim()) {
        jsonData.nro_part = data.nro_part;
      }

      if (Object.keys(jsonData).length === 0) {

        //return;
      }

      Swal.fire({
        title: t.updating,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const response = await fetch("/api/saveFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: "custom.json",
          folder: "locales",
          content: jsonData,
        }),
      });

      const result = await response.json();
      Swal.close();

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: t.updated_data,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: t.error_saving_the_file,
      });
    }
  };

  return (
    <>
      

      <div className='bg-gray-200 shadow-lg border p-4'>
        <div className="col-span-4">
          <div className="p-4">
            <form className="space-y-4" onSubmit={handleSubmit(onSave)}>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-end col-span-1">Clientes</label>
                <input
                  type="text"
                  autoComplete="OFF"
                  {...register("customers")}
                  className="form-input col-span-2"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-end col-span-1">{ t.suppliers }</label>
                <input
                  type="text"
                  autoComplete="OFF"
                  {...register("suppliers")}
                  className="form-input col-span-2"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-end col-span-1">{ t.spare_parts }</label>
                <input
                  type="text"
                  autoComplete="OFF"
                  {...register("spare_parts")}
                  className="form-input col-span-2"
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-end col-span-1">{ t.nro_part }</label>
                <input
                  type="text"
                  autoComplete="OFF"
                  {...register("nro_part")}
                  className="form-input col-span-2"
                />
              </div>

              <div className="flex justify-center mt-6">
                <button type="submit" className="btn btn-success">
                  {t.btn_save}
                </button>
              </div>

            </form>
          </div>



        </div>

      </div>

    </>
  );
}