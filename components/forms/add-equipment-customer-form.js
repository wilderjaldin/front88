'use client';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'

const url_add_equipment = process.env.NEXT_PUBLIC_API_URL + "cliente/AdicionarEquipoCliente";

const AddEquipmentCustomerForm = ({ equipment = [], current, engine_current, action_cancel, customer, token, updateListEquipment, t, setEquipments }) => {


  const brands = useOptionsSelect("brands") || [];
  const [select, setSelect] = useState({})
  const [engine_select, setEngineSelect] = useState({})
  const {
    register, reset, setValue,
    handleSubmit, setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      brand: equipment.CodMarca,
      model: equipment.ModeloEquipo,
      year: equipment.AnioEquipo,
      serie: equipment.NroSerieEquipo,

      engine_brand: equipment.CodMarcaMotor,
      engine_model: equipment.ModeloMotor,
      engine_serie: equipment.NroSerieMotor,
    }
  });


  const onSubmit = async (data) => {





    try {
      const data_send = {
        CodRegistro: (equipment.CodRegistro) ?? 0,
        CodMarca: data.brand,
        CodCliente: customer.IdCliente,
        ModeloEquipo: data.model,
        AnioEquipo: data.year,
        NroSerieEquipo: data.serie,

        CodMarcaMotor: data.engine_brand,
        ModeloMotor: data.engine_model,
        NroSerieMotor: data.engine_serie,

        ValToken: token
      };

      const rs = await axios.post(url_add_equipment, data_send);


      if (rs.data.estado == 'OK') {

        data.NomMarca = (select.label) ? select.label : current.label;
        data.CodRegistro = (equipment.CodRegistro) ?? rs.data.dato;
        data.NomMarcaMotor = (engine_select.label) ? engine_select.label : engine_current.label;

        //updateListEquipment(data);
        setEquipments(rs.data.dato);
        action_cancel();
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.equipment_add_save,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {

    }
  }


  const handlerOnChange = (value, field) => {
    if (value) {
      setValue(field, value.value)
      if (field == "brand") {
        setSelect(value)
      } else {
        setEngineSelect(value);
      }
    } else {
      setValue(field, null)
      if (field == "brand") {
        setSelect({})
      } else {
        setEngineSelect({});
      }
    }
  }

  return (
    <>
      <form className="" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className='space-y-4'>
            <h2 className={'text-lg font-bold'}>{t.equipment_data}</h2>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="brand-select">{t.brand}</label>
              <div className="relative flex-1">
                {(brands) &&
                  <>
                    <div className={errors.brand ? "react-select-error" : ""}>
                      <Select placeholder={t.select_option} className='w-full'

                        options={brands}
                        defaultValue={current}
                        {...register('brand', { required: { value: true, message: t.required_select } })}
                        isSearchable
                        id="brand-select"
                        instanceId="brand-select"
                        onChange={(e) => handlerOnChange(e, 'brand')}
                        menuPosition={'fixed'}
                        classNamePrefix="select"
                        menuShouldScrollIntoView={false}
                      />
                    </div>
                    {errors.brand && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
                  </>
                }
              </div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="year">{t.year}</label>
              <div className="relative flex-1">
                <input type='text' id='year' autoComplete='OFF' {...register("year", { required: false })} aria-invalid={errors.year ? "true" : "false"} placeholder={t.enter_year} className="form-input placeholder:" />
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="model">{t.model}</label>
              <div className="relative flex-1">
                <input type='text' id='model' autoComplete='OFF' {...register("model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.model ? "true" : "false"} placeholder={t.enter_model} className={`form-input ${errors.model ? "error" : ""}`} />
                {errors.model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.model?.message?.toString()}</span>}
              </div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="serie">{t.serie}</label>
              <div className="relative flex-1">
                <input type='text' id='serie' autoComplete='OFF' {...register("serie", { required: false })} aria-invalid={errors.serie ? "true" : "false"} placeholder={t.enter_serie} className="form-input placeholder:" />
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h2 className={'text-lg font-bold'}>{t.engine_data}</h2>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required">{t.brand}</label>
              <div className="relative flex-1">
                {(brands) &&
                  <>
                    <div className={errors.engine_brand ? "react-select-error" : ""}>
                      <Select placeholder={t.select_option} className='w-full'

                        options={brands}
                        defaultValue={engine_current}
                        {...register('engine_brand', { required: { value: true, message: t.required_select } })}
                        isSearchable
                        id="engine_brand-select"
                        instanceId="engine_brand-select"
                        onChange={(e) => handlerOnChange(e, 'engine_brand')}
                        menuPosition={'fixed'}
                        classNamePrefix="select"
                        menuShouldScrollIntoView={false}
                      />
                    </div>
                    {errors.engine_brand && <span className='text-red-400 error block mb-5 text-xs mt-1' role="alert">{errors.engine_brand?.message?.toString()}</span>}
                  </>
                }
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 required" htmlFor="engine_model">{t.model}</label>
              <div className="relative flex-1">
                <input type='text' id='engine_model' autoComplete='OFF' {...register("engine_model", { required: { value: true, message: t.required_field } })} aria-invalid={errors.engine_model ? "true" : "false"} placeholder={t.enter_engine_model} className={`form-input ${errors.engine_model ? "error" : ""}`} />
                {errors.engine_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_model?.message?.toString()}</span>}
              </div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2" htmlFor="engine_serie">{t.serie}</label>
              <div className="relative flex-1">
                <input type='text' id='engine_serie' autoComplete='OFF' {...register("engine_serie", { required: false })} aria-invalid={errors.engine_serie ? "true" : "false"} placeholder={t.enter_serie} className="form-input placeholder:" />
              </div>
            </div>
          </div>

        </div>



        <div className="my-5">

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => action_cancel()} type="button" className="btn btn-outline-danger">
              {t.btn_cancel}
            </button>

            <button type="submit" className="btn btn-success">
              {t.btn_save}
            </button>

          </div>
        </div>

      </form>

    </>
  );
};

export default AddEquipmentCustomerForm;
