"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
const url = process.env.NEXT_PUBLIC_API_URL + 'proveedor/AdicionarZonaFletePrv';
const url_get_freight_zone = process.env.NEXT_PUBLIC_API_URL + 'proveedor/MostrarZonaFletePrv';
const url_remove = process.env.NEXT_PUBLIC_API_URL + 'proveedor/EliminarZonaFletePrv';

export default function FreightCost({ supplier, token, t, zones, freight_zone, setFreightZone, loadFreightZone, setLoadFreightZone }) {


  const {
    register, setValue, getValues,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      zone: ''
    }
  });


  useEffect(() => {
    if (loadFreightZone) {
      getFreightZone();
    }
  }, []);

  const getFreightZone = async () => {
    try {
      const rs = await axios.post(url_get_freight_zone, { CodPrv: supplier.CodPrv, ValToken: token });
      
      setFreightZone(rs.data.dato)
      setLoadFreightZone(false);
    } catch (error) {
      
    }
  }
  const onSubmit = async (data) => {
    try {

      let zone = data.zone;
      let _zone = freight_zone.filter(f => { return f.ZonaFlete == zone });
      if (_zone.length > 0) {
        Swal.fire({
          title: t.error,
          text: `${t.freight_zone_exist_error} [${zone}]`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

      if(freight_zone.length > 0){
        Swal.fire({
          title: t.error,
          text: `${t.freight_zone_exist_error} [${freight_zone[0].ZonaFlete}]`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }

      const rs = await axios.post(url, { CodPrv: supplier.CodPrv, ZonaFlete: data.zone, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.freight_zone_add,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          setFreightZone(rs.data.dato)
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.freight_zone_add_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {
      
    }
  }
  const onChangeZone = (select) => {
    setValue('zone', ((select?.value) ?? null));
  }
  const removeFreightCost = async () => {

    let zone = getValues('zone');
    let _zone = freight_zone.filter(f => { return f.ZonaFlete == zone });
    
    if (_zone.length == 0) {
      Swal.fire({
        title: t.error,
        text: `${t.freight_zone_dont_exist_error} [${zone}]`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    Swal.fire({
      title: t.question_delete_freight_zone,
      text: zone,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {

        try {
          const rs = await axios.post(url_remove, { CodPrv: supplier.CodPrv, ZonaFlete: zone, ValToken: token });
          
          if (rs.data.estado == "OK") {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.freight_zone_deleted,
              showConfirmButton: false,
              timer: 1500
            }).then(r => { setFreightZone(rs.data.dato) });

          } else {
            Swal.fire({
              title: t.error,
              text: t.freight_zone_deleted_error,
              icon: 'error',
              confirmButtonColor: '#dc2626',
              confirmButtonText: t.close
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
  return (
    <>
      <div className="grid grid-cols-1 sm:flex sm:flex-row gap-4 items-center">
        <div className="basis-1/4">
          <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="select-zone">{t.zone_cost}</label>
              <div className="relative flex-1">
                <Select id='select-zone' {...register('zone', { required: { value: true, message: t.required_select } })} placeholder={t.select_option} className={`w-full`} options={zones} onChange={(e) => onChangeZone(e)} />
                {errors.zone && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.zone?.message?.toString()}</span>}
              </div>
            </div>
            <div className="my-5">

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={handleSubmit(onSubmit)} className="btn btn-success">
                  {t.btn_save}
                </button>
                <button type="button" onClick={() => removeFreightCost()} className="btn btn-danger">{t.btn_delete}</button>
              </div>
            </div>

          </form>
        </div>
        <div className="basis-3/4">
          <div className="table-responsive">
            {(freight_zone.length > 0) &&
              <table className="bg-white table-hover">
                <thead>
                  <tr className="relative !bg-gray-400 text-center uppercase">
                    <th>{t.zone}</th>
                    <th>{t.initial_weight}</th>
                    <th>{t.final_weight}</th>
                    <th>{t.cost_per_pound}</th>
                    <th>{t.minimum_cost}</th>
                  </tr>
                </thead>
                <tbody>
                  {freight_zone.map((z, index) => {
                    return (
                      <tr key={index}>
                        <td>{z.ZonaFlete}</td>
                        <td>{z.PesoInicial}</td>
                        <td>{z.PesoFinal}</td>
                        <td>{z.CostoLibra}</td>
                        <td>{z.CostoMin}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    </>
  );
}