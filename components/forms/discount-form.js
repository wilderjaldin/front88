'use client';
import React, { useEffect} from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/AdicionarDescuento';

const DiscountForm = ({ close, token, t, order, setItems, setOrder }) => {



  const {
    register, setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { amount: '', percentage: '' } });


  useEffect(() => {
    if (order.Descuento) {
      var amount = order.Descuento.toFixed(2);
      var percentage = 100 - (((order.TotRepuestos - amount) * 100) / order.TotRepuestos);
      setValue('amount', amount);
      setValue('percentage', percentage.toFixed(2));
    }

  }, [order]);


  const onSearch = async (data) => {
    
    //setRowData(rowDataJson)
    try {
      const rs = await axios.post(url, { NroOrden: order.NroOrden, MtoDescuento: data.amount, PorDescuento: data.percentage, ValToken: token });
      if (rs.data.estado == 'OK') {
        close();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_discount_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.save_discount_quote_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const changeAmount = (e) => {
    var amount = e.target.value;
    var percentage = 100 - (((order.TotRepuestos - amount) * 100) / order.TotRepuestos);
    setValue('percentage', percentage.toFixed(2));
  }

  const changePercentage = (e) => {
    var percentage = e.target.value;
    var amount = (order.TotRepuestos * (percentage / 100));
    setValue('amount', amount.toFixed(2))
  }

  return (
    <>

      <div className='bg-gray-200 shadow-lg border p-4'>

        <div className="grid grid-cols-1 gap-6">
          <div className={``}>
            <div className="mb-5">
              <form className="space-y-4" onSubmit={handleSubmit(onSearch)}>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="amount">{ t.amount }</label>
                  <div className="relative flex-1">

                    <input onKeyUp={changeAmount} type='text' autoComplete='OFF' {...register("amount", { required: { value: true, message: t.required_field } })} aria-invalid={errors.amount ? "true" : "false"} placeholder={t.login.enter_amount} className="form-input placeholder:" />
                    {errors.amount && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.amount?.message?.toString()}</span>}

                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="percentage">{ t.percentage }</label>
                  <div className="relative flex-1">

                    <input onKeyUp={changePercentage} type='text' autoComplete='OFF' {...register("percentage", { required: { value: true, message: t.required_field } })} aria-invalid={errors.percentage ? "true" : "false"} placeholder={t.login.enter_percentage} className="form-input placeholder:" />
                    {errors.percentage && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.percentage?.message?.toString()}</span>}

                  </div>
                </div>

                <div className="my-5">

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button onClick={() => close()} type="button" className="btn btn-dark">
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
        </div>

      </div>
    </>
  );
};

export default DiscountForm;
