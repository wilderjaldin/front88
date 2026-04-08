"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import SelectTrading from "@/components/select-trading";



const url = process.env.NEXT_PUBLIC_API_URL + 'proveedor/ModificarCondComercialesPrv';
const url_get_conditions = process.env.NEXT_PUBLIC_API_URL + 'proveedor/MostrarCondComercialesPrv';

export default function TradingConditionsSupplier({  supplier, token, updateConditionSupplier, t, conditions, setConditions, loadConditions, setLoadConditions }) {


  const[current, setCurrent] = useState(conditions.find((key) => key.value === supplier.CodCondPago) || null);

  const locale = useSelector(getLocale);
  const {
    register, reset,
    handleSubmit, control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      condition: (supplier.CodCondPago ?? '')
    }
  });


  useEffect(() => {
    if (loadConditions) {
      getConditions();
    }
  }, []);

  useEffect(() => {
    getConditions();
  }, [locale]);

  const getConditions = async () => {
    try {
      const rs = await axios.post(url_get_conditions, { Idioma: locale, ValToken: token });
      
      if (rs.data.estado == 'Ok') {
        let conditions = [];
        if (rs.data.dato) {
          rs.data.dato.map((c) => {
            if (c.CodCondPago != "") {
              conditions.push({ value: c.CodCondPago, label: c.DesCondPago });
            }
          });
        }
        setCurrent(conditions.find((key) => key.value === supplier.CodCondPago) || null)
        setConditions(conditions);
        setLoadConditions(false);
      }
    } catch (error) {
      
    }
  }
  const onSubmit = async (data) => {
    try {
      const rs = await axios.post(url, { CodPrv: supplier.CodPrv, CodConPago: data.condition, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.condition_supplier_add,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          updateConditionSupplier(data.condition)
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.condition_supplier_add_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      
    }
  }
  const onChangeConditions = (select) => {
    if (select?.value != null) {
      reset({ condition: select.value })
    } else {
      reset({ condition: null })
    }
    setCurrent(select);
  }



  return (
    <div className="flex flex-row gap-10">
      <div className="mx-auto w-full sm:w-1/2">
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="flex sm:flex-row flex-col">
            <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select-condition">{t.terms_of_payment}</label>
            <div className="relative flex-1">
              <SelectTrading t={t} token={token} control={control} errors={errors} options={conditions} setConditions={setConditions}></SelectTrading>
            </div>
          </div>
          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                {t.btn_save}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}