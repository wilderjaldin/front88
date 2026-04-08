"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import IconPencilPaper from "@/components/icon/icon-pencil-paper";
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_data = process.env.NEXT_PUBLIC_API_URL + 'tipcambio/MostrarListaTipoCambio';
const url_save = process.env.NEXT_PUBLIC_API_URL + 'tipcambio/GuardarTipoCambio';


export default function ExchangeRate() {


  const t = useTranslation();
  const token = useSelector(selectToken);
  const [data_rows, setData] = useState([]);

  const [isEdit, setIsEdit] = useState(false)
  const [defaultValueDate, setDefaultValueDate] = useState('');
  const [loaded, setLoaded] = useState(false);
  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (loaded) return;
    getData();
  }, [loaded]);

  const getData = async () => {
    
    try {
      const rs = await axios.post(url_data, { ValToken: token });
      
      if (rs.data.estado == 'OK') {
        setData(rs.data.dato);
      }
    } catch (error) {
      
    }
  }
  const onSubmit = async (data) => {

    
    const formattedDate = parseDateString(toMDYFormat(data.date), "slashFormat");
    let data_save = {
      TipoCambio: data.currency,
      Fecha: formattedDate,
      ValToken: token
    }
    
    try {
      const rs = await axios.post(url_save, data_save);
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: t.currency_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          
          const date_mdy = toMDYFormat(data.date);
          let array = [];
          let exist = false;
          data_rows.map((element) => {
            
            if (element.Fecha == date_mdy) {
              
              element.TipoCambio = data.currency;
              exist = true;
            }
            array.push(element);
          });
          if (!exist) {
            
            array.push({ TipoCambio: data.currency, Fecha: date_mdy });
          }
          
          setData(array);


        })
      } else {
        Swal.fire({
          title: t.error,
          text: t.currency_save_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      
      Swal.fire({
        title: t.error,
        text: t.currency_save_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }



  }

  function parseDateString(input, format = "dashFormat") {
    // Asumimos formato M/D/YYYY
    const [month, day, year] = input.split('/').map(Number);

    // Asegurar que siempre tenga dos dígitos
    const pad = (num) => String(num).padStart(2, '0');

    const yyyy = year;
    const mm = pad(month);
    const dd = pad(day);
    if (format == "dashFormat") { return `${yyyy}-${mm}-${dd}`; }
    if (format == "slashFormat") { return `${yyyy}/${mm}/${dd}`; }
  }

  function toMDYFormat(dateStr) {
    // Soporta tanto "2025-05-01" como "2025/05/01"
    const separator = dateStr.includes('-') ? '-' : '/';
    const [year, month, day] = dateStr.split(separator).map(Number);
    return `${month}/${day}/${year}`; // M/D/YYYY
  }

  const editRow = (row) => {
    
    setIsEdit(true);
    const date = new Date(row.Fecha);
    

    const formattedDate = parseDateString(row.Fecha, 'dashFormat');
    
    

    setDefaultValueDate(formattedDate)
    reset({ date: formattedDate.toString(), currency: row.TipoCambio });
  }

  const cancel = () => {
    setIsEdit(false);
    setDefaultValueDate('')
    reset({ date: '', currency: '' });
  }
  useDynamicTitle(`${t.register} | ${t.exchange_rate}` );
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.register}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span>{ t.exchange_rate }</span>
          </li>
        </ul>

      </div>
      <div className="grid grid-cols-1 gap-6 pt-5">
        <div className="panel shadow-lg bg-gray-200">
          <form className="" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="date">{ t.date }</label>
                  <div className="relative flex-1">

                    <input type='date' defaultValue={defaultValueDate} autoComplete='OFF' {...register("date", { required: { value: true, message: t.required_field } })} aria-invalid={errors.date ? "true" : "false"} placeholder={t.login.enter_date} className={`form-input ${errors.date ? "error" : ""}`} />
                    {errors.date && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.date?.message?.toString()}</span>}

                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="type">{ t.exchange_rate }</label>
                  <div className="relative flex-1">
                    <input type='text' autoComplete='OFF' {...register("currency", { required: { value: true, message: t.required_field } })} aria-invalid={errors.currency ? "true" : "false"} placeholder={t.login.enter_currency} className={`form-input ${errors.currency ? "error" : ""}`} />
                    {errors.currency && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.currency?.message?.toString()}</span>}
                  </div>
                </div>


                <div className="my-5">

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {(isEdit) ?
                      <>
                        <button type="button" onClick={() => cancel()} className="btn btn-dark">
                          { t.btn_cancel }
                        </button>
                        <button type="submit" className="btn btn-success">
                          { t.btn_update }
                        </button>
                      </>
                      :
                      <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                        { t.btn_add }
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
                        <th className="max-w-20">{ t.date }</th>
                        <th className="max-w-16">{ t.exchange_rate }</th>
                        <th className="max-w-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data_rows.map((r, index) => {

                        return (

                          <tr key={index}>
                            <td className="!p-1 text-center">
                              {r.Fecha}
                            </td>
                            <td className="!p-1">
                              {r.TipoCambio}
                            </td>
                            <td className="!py-0">
                              <div className="flex flex-wrap items-end justify-end gap-2">
                                <button onClick={() => editRow(r)} type="button" title="Agregar" className="hover:text-blue-600 w-8 h-8 p-0"><IconPencilPaper /></button>
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