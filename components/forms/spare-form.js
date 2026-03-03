'use client';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from "react-hook-form"
import IconPlusProps from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import FormAddBrand from '@/components/forms/add-brand-form';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useOptionsSelect } from '@/app/options'
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
const url_list = process.env.NEXT_PUBLIC_API_URL + 'repuesto/ListaControlesRepuesto';

const url_save = process.env.NEXT_PUBLIC_API_URL + 'repuesto/GuardarNroParte';
const url_brands = process.env.NEXT_PUBLIC_API_URL + "cliente/MostrarMarcas"


const ComponentSpareForm = ({ action_cancel, token, t, spare = [], updateList }) => {
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [enabled_special_order, setEnableSpecialOrder] = useState(spare.PedidoEspecial || false)
  const [modal_content, setModalContent] = useState(null);




  const brandsData = useOptionsSelect("brands");
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([])
  const locale = useSelector(getLocale);
  const [types, setTypes] = useState(useOptionsSelect(`types_spares_${locale.toLowerCase()}`) || [])
  const [status, setStatus] = useState(useOptionsSelect("status_spare") || [])
  const [status_code, setStatusCode] = useState(useOptionsSelect("status_code") || [])
  const [units, setUnits] = useState(useOptionsSelect("units_spare") || [])

  const [current_supplier, setCurrentSupplier] = useState((Object.keys(suppliers).find((key) => suppliers[key].value == spare?.CodProveedor)) || null);
  const [current_status, setCurrentStatus] = useState((Object.keys(status).find((key) => status[key].value?.toUpperCase() == spare?.CodEstadoCodigo?.toUpperCase())) || 1);
  const [current_application, setCurrentApplication] = useState((Object.keys(brands).find((key) => brands[key].value == spare?.CodAplicacion)) || null);
  const [current_type, setCurrentType] = useState((Object.keys(types).find((key) => types[key].value?.toUpperCase() == spare?.CodTipRepuesto?.toUpperCase())) || null);
  const [current_brand, setCurrentBrand] = useState((Object.keys(brands).find((key) => brands[key].value == spare?.CodMarca)) || null);
  const [current_status_code, setCurrentStatusCode] = useState((Object.keys(status_code).find((key) => status_code[key].value == spare?.CodEstadoRepuesto)) || 0);
  const [current_unit, setCurrentUnit] = useState((Object.keys(units).find((key) => units[key].value?.toUpperCase() == spare?.CodUniMed?.toUpperCase())) || 0);

  const [loaded, setLoaded] = useState(false);


  const {
    register,
    handleSubmit, setValue, control, getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nro_part: spare.NroParte,
      description: spare.DesRepuesto,
      supplier: spare.CodProveedor,
      status: (spare.CodEstadoCodigo) || "NU",
      special_order_date: spare.PedEspecialSinFecha,
      application: spare.CodAplicacion,
      spare_part_type: spare.CodTipRepuesto,
      brand: spare.CodMarca,
      status_code: (spare.CodEstadoRepuesto) || 'VA',
      special_order: spare.PedidoEspecial,
      weight: spare.Peso,
      cost: spare.Costo,
      min_quantity: spare.CanMin || 1,
      unit: (spare.CodUniMed) || 'UNI',
      number_of_days: spare.CanDias
    }
  });

  useEffect(() => {
    setBrands(brandsData);
  }, [brandsData]);

  useEffect(() => {
    if (loaded) return;
    getList();
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

    if (spare?.CodProveedor) {
      setValue('supplier', spare.CodProveedor);
    }

    if (spare?.CodMarca) {
      setValue('brand', spare.CodMarca);
    }

    if (spare?.CodUniMed) {
      setValue('unit', spare.CodUniMed);
    }

    if (spare?.CodEstadoRepuesto) {
      setValue('status_code', spare.CodEstadoRepuesto);
    }
  }, [loaded, spare, setValue]);

  useEffect(() => {
    let cs = Object.keys(suppliers).find((key) => suppliers[key].value == spare.CodProveedor) || null;
    setCurrentSupplier(cs);
    cs = Object.keys(status).find((key) => status[key].value.toUpperCase() == spare?.CodEstadoCodigo?.toUpperCase()) || null;
    setCurrentStatus(cs);
    cs = Object.keys(brands).find((key) => brands[key].value == spare?.CodAplicacion) || null;
    setCurrentApplication(cs);
    cs = Object.keys(brands).find((key) => brands[key].value == spare?.CodMarca) || null;
    setCurrentBrand(cs);
    cs = Object.keys(types).find((key) => types[key].value.toUpperCase() == spare?.CodTipRepuesto?.toUpperCase()) || null;
    setCurrentType(cs);
    cs = Object.keys(units).find((key) => units[key].value.toUpperCase() == spare?.CodUniMed?.toUpperCase()) || 0;
    setCurrentUnit(cs);
    cs = Object.keys(status_code).find((key) => status_code[key].value == spare?.CodEstadoRepuesto) || 0;
    setCurrentStatusCode(cs);

  }, [spare]);

  useEffect(() => {
    async function fetchData() {
      await getList();

      // status actualizado después de getList
      const currentSupplier = getValues('supplier');
      const currentValue = getValues('status');
      const currentType = getValues('types');

      if (currentSupplier && suppliers.length > 0) {
        const newOption = suppliers.find(
          o => o.value === currentSupplier.value || o.value === currentSupplier
        );

        if (newOption) {
          setValue('supplier', newOption.value); // <-- guarda el valor
        }
      }

      if (currentValue && status.length > 0) {
        const newOption = status.find(
          o => o.value === currentValue.value || o.value === currentValue
        );

        if (newOption) {
          setValue('status', newOption.value); // <-- guarda el valor
        }
      }

      if (currentType && types.length > 0) {
        const newOptionType = status.find(
          o => o.value === currentType.value || o.value === currentType
        );

        if (newOptionType) {
          setValue('type', newOptionType.value); // <-- guarda el valor
        }
      }

    }

    fetchData();
  }, [t, getValues, setValue]);

  const getList = async () => {

    try {

      axios.defaults.timeout = 20000;
      const rs = await axios.post(url_list, { Idioma: locale, ValToken: token });
      /*
      dato1: muestra lista de Proveedores
      dato2: muestra el Tipo Repuesto
      dato3: muestra el Estado del Código
      dato4: muestra el Estado del Repuesto
      dato5: muestra lista de Unidad de Medida
      */
      let options = [];
      rs.data.dato1.map((s) => {
        if (s.CodPrv != 0) {
          options.push({ value: s.CodPrv, label: s.NomPrv });
        }
      });
      setSuppliers(options);

      options = [];
      rs.data.dato2.map((ty) => {
        if (ty.CodTipRepuesto != "") {
          options.push({ value: ty.CodTipRepuesto, label: ty.DesTipRepuesto });
        }
      });

      setTypes(options);

      options = [];
      rs.data.dato3.map((st) => {
        if (st.CodEstRepuesto != "") {
          options.push({ value: st.CodEstRepuesto, label: st.DesEstRepuesto });
        }
      });
      setStatusCode(options);

      options = [];
      rs.data.dato4.map((st) => {
        if (st.CodEstado != "") {
          options.push({ value: st.CodEstado, label: st.DesEstado });
        }
      });
      setStatus(options);

      options = [];
      rs.data.dato5.map((un) => {
        if (un.CodUniMed != "") {
          options.push({ value: un.CodUniMed, label: un.DesUniMedida });
        }
      });
      setUnits(options);

      setLoaded(true);
      /*
      const response = await axios.post(url_brands, { ValToken: token });

      let _brands = [];

      response.data.dato.map(brand => {
        if (brand.CodMarca > 0) {
          _brands.push({ value: brand.CodMarca, label: brand.NomMarca });
        }
      });
      setBrands(_brands);
      */



    } catch (error) {

    }
  }

  const addApp = () => {
    setModalTitle(t.add_application)
    setModalContent(<FormAddBrand setBrands={setBrands} msg_save_success={t.app_save_success} msg_save_error={t.app_save_error} msg_save_error_server={t.app_save_error_server} action_cancel={() => setShowModal(false)} token={token}></FormAddBrand>);
    setShowModal(true);
  }
  const addBrand = () => {
    setModalTitle(t.add_brand)
    setModalContent(<FormAddBrand setBrands={setBrands} msg_save_success={t.brand_save_success} msg_save_error={t.brand_save_error} msg_save_error_server={t.brand_save_error_server} action_cancel={() => setShowModal(false)} token={token}></FormAddBrand>);
    setShowModal(true);
  }
  const onSubmit = async (data) => {
    try {
      let data_spare = {

        IdRepuesto: (spare.IdRepuesto) ?? 0,
        NroParte: data.nro_part,
        DesRepuesto: data.description,
        CodProveedor: data.supplier,
        CodMarca: data.brand,
        CodAplicacion: data.application,
        CodTipRepuesto: data.spare_part_type,
        CodEstadoRepuesto: data.status,
        CodEstadoNroParte: data.status_code,
        Peso: data.weight,
        Costo: data.cost,
        CanMin: data.min_quantity,
        CodUniMed: data.unit,
        PedidoEspecial: (data.special_order) ? 1 : 0,
        CanDias: data.number_of_days,
        PedEspecialSinFecha: (data.special_order_date) ? 1 : 0,
        ValToken: token
      }


      const rs = await axios.post(url_save, data_spare);


      if (rs.data.estado == 'Ok') {
        Swal.fire({
          title: t.success,
          icon: 'success',
          confirmButtonColor: '#15803d',
          text: (spare?.IdRepuesto) ? t.spare_success_update : t.spare_success_save,
          confirmButtonText: t.close
        }).then(async (r) => {
          data_spare.IdRepuesto = (spare?.IdRepuesto) ?? rs.data.dato;
          data_spare.Aplicacion = brands.find(b => b.value == data.application)?.label || '';
          data_spare.Proveedor = suppliers.find(s => s.value == data.supplier)?.label || '';
          data_spare.Marca = brands.find(b => b.value == data.brand)?.label || '';
          data_spare.Estado = status.find(s => s.value == data.status)?.label || '';
          data_spare.TipRepuesto = types.find(t => t.value == data.spare_part_type)?.label || '';
          //data_spare.CodEstado = status_code.find(s => s.value == data.status_code)?.label || '';
          data_spare.UniMed = units.find(u => u.value == data.unit)?.label || '';
          updateList(data_spare);
          action_cancel();
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.spare_error_save + " - " + rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.spare_error_server + " - " + error.mensaje,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const onChangeSelect = (select, field) => {


    if (select?.value != null) {
      setValue(field, select.value)
    } else {
      setValue(field, null)
    }



  }

  return (
    <>
      <div className='bg-gray-200 shadow-lg border p-4 mt-4 dark:bg-gray-900'>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className='space-y-4'>
              <div>
                <label htmlFor="nro_part" className='required'>{t.nro_part}</label>
                <div className="relative ">
                  <input tabIndex="1" type='text' autoComplete='OFF' defaultValue='' {...register("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_part ? "true" : "false"} placeholder={t.login.enter_nro_part} className={`form-input ${errors.nro_part ? "error" : ""}`} />
                  {errors.nro_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_part?.message?.toString()}</span>}
                </div>
              </div>

              <div>
                <label htmlFor="description" className='required'>{t.description}</label>
                <div className="relative ">
                  <input tabIndex="5" type='text' autoComplete='OFF' defaultValue='' {...register("description", { required: { value: true, message: t.required_field } })} aria-invalid={errors.description ? "true" : "false"} placeholder={t.login.enter_description} className={`form-input ${errors.description ? "error" : ""}`} />
                  {errors.description && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.description?.message?.toString()}</span>}
                </div>
              </div>



              <div>
                <label htmlFor="select_type" className='required'>{t.supplier}</label>
                <div className={errors.supplier ? "react-select-error" : ""}>

                  <Controller
                    name="supplier"
                    control={control}
                    rules={{ required: { value: true, message: t.required_select } }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        id="select_type"
                        placeholder={t.select_option}
                        classNamePrefix="select"
                        className="w-full"
                        options={suppliers}
                        onChange={(selected) => {
                          field.onChange(selected?.value);
                          onChangeSelect(selected, 'supplier');
                        }}
                        value={suppliers.find(o => o.value === field.value) || null}
                      />
                    )}
                  />

                </div>
                {errors.supplier && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.supplier?.message?.toString()}</span>}
              </div>

              <div className={errors.status ? "react-select-error" : ""}>
                <label htmlFor="select_type" className='required'>{t.status}</label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: { value: true, message: t.required_select } }}
                  render={({ field }) => {
                    const selectedOption =
                      status.find((option) => option.value === field.value) || null;

                    return (
                      <Select
                        {...field}
                        id="select-status"
                        placeholder={t.select_option}
                        classNamePrefix="select"
                        className="w-full"
                        options={status}
                        onChange={(selected) => {
                          field.onChange(selected?.value);
                          onChangeSelect(selected, 'status');
                        }}
                        value={selectedOption}
                      />
                    );
                  }}
                />
                {errors.status && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.status?.message?.toString()}</span>}
              </div>

              <div>
                <label className="flex items-center cursor-pointer">
                  <input tabIndex="13" type="checkbox" {...register("special_order_date", { required: false })} className="form-checkbox bg-white" />
                  <span className="">{t.order_special_without_date}</span>
                </label>
              </div>

            </div>
            <div className='space-y-4'>
              <div>
                <label htmlFor="select_app" className='required'>{t.application}</label>
                <div className={errors.application ? "react-select-error" : ""}>
                  <div className="flex flex-1">
                    <Controller
                      name="application"
                      control={control}
                      rules={{ required: { value: true, message: t.required_select } }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          id="select_application"
                          placeholder={t.select_option}
                          classNamePrefix="select"
                          className="w-full"
                          options={brands}
                          onChange={(selected) => {
                            field.onChange(selected?.value);
                            onChangeSelect(selected, 'application');
                          }}
                          value={brands.find(o => o.value === field.value) || null}
                        />
                      )}
                    />
                    <button onClick={() => addApp()} type="button" className="btn bg-gray-400 shadow-none ltr:rounded-l-none rtl:rounded-r-none">
                      <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" /> {t.btn_add}
                    </button>
                  </div>
                  <div className='block'>
                    {errors.application && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.application?.message?.toString()}</span>}
                  </div>

                </div>
              </div>

              <div>

                <label htmlFor="select_type">{t.spare_part_type}</label>
                <Controller
                  name="spare_part_type"
                  control={control}
                  rules={{ required: false }}
                  render={({ field }) => {
                    const selectedOption =
                      types.find((option) => option.value === field.value) || null;

                    return (
                      <Select
                        {...field}
                        id="select-spare_part_type"
                        placeholder={t.select_option}
                        classNamePrefix="select"
                        className="w-full"
                        options={types}
                        onChange={(selected) => {
                          field.onChange(selected?.value);
                          onChangeSelect(selected, 'spare_part_type');
                        }}
                        value={selectedOption}
                      />
                    );
                  }}
                />
              </div>

              <div>
                <label htmlFor="select_brand" className='required'>{t.brand}</label>
                <div className={errors.brand ? "react-select-error" : ""}>
                  <div className="flex flex-1">
                    <Controller
                      name="brand"
                      control={control}
                      rules={{ required: { value: true, message: t.required_select } }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          id="select_brands"
                          placeholder={t.select_option}
                          classNamePrefix="select"
                          className="w-full"
                          options={brands}
                          onChange={(selected) => {
                            field.onChange(selected?.value);
                            onChangeSelect(selected, 'brand');
                          }}
                          value={brands.find(o => o.value === field.value) || null}
                        />
                      )}
                    />

                    <button onClick={() => addBrand()} type="button" className="btn bg-gray-400 shadow-none ltr:rounded-l-none rtl:rounded-r-none">
                      <IconPlusProps className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5" /> {t.btn_add}
                    </button>
                  </div>
                  <div className='block'>
                    {errors.brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.brand?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="select_status_code">{t.status_code}</label>
                <Controller
                  name="status_code"
                  control={control}
                  rules={{ required: { value: true, message: t.required_select } }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="select_status_code"
                      placeholder={t.select_option}
                      classNamePrefix="select"
                      className="w-full"
                      options={status_code}
                      onChange={(selected) => {
                        field.onChange(selected?.value);
                        onChangeSelect(selected, 'status_code');
                      }}
                      value={status_code.find(o => o.value === field.value) || null}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="order_especial">{t.special_order}</label>
                <div className="flex">
                  <div className="bg-white dark:bg-[#1b2e4b] flex justify-center items-center ltr:rounded-l-md rtl:rounded-r-md px-3 font-semibold border ltr:border-r-0 rtl:border-l-0 border-white-light dark:border-[#17263c]">
                    <input tabIndex="14" type="checkbox" {...register("special_order", { required: false })} onChange={() => setEnableSpecialOrder(!enabled_special_order)} className="form-checkbox border-white-light dark:border-white-dark ltr:mr-0 rtl:ml-0" />
                  </div>
                  <input tabIndex="15" {...register("number_of_days", { required: false })} step="any" type="number" defaultValue={0} disabled={!enabled_special_order} placeholder="0" className="form-input ltr:rounded-l-none rtl:rounded-r-none form-input disabled:pointer-events-none disabled:bg-[#eee] dark:disabled:bg-[#1b2e4b] disabled:cursor-not-allowed" />
                </div>
              </div>



            </div>
            <div className='space-y-4'>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label>{t.weight}</label>
                  <div className="relative ">
                    <div className="flex">
                      <input tabIndex="3" step="any" type='number' autoComplete='OFF' defaultValue='0.00' {...register("weight", { required: { value: true, message: t.required_field } })} aria-invalid={errors.weight ? "true" : "false"} placeholder={t.login.enter_weight} className="form-input placeholder:" />
                    </div>
                    {errors.weight && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.weight?.message?.toString()}</span>}
                  </div>
                </div>

                <div>
                  <label>{t.cost}</label>
                  <div className="relative ">
                    <input tabIndex="4" step="any" type='number' autoComplete='OFF' defaultValue='0.00' {...register("cost", { required: { value: true, message: t.required_field } })} aria-invalid={errors.cost ? "true" : "false"} placeholder={t.login.enter_cost} className="form-input placeholder:" />
                    {errors.cost && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.cost?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label>{t.min_quantity}</label>
                  <div className="flex flex-1">
                    <input tabIndex="7" id="btnRight" step="any" type="number" {...register("min_quantity", { required: false })} placeholder="" className="form-input ltr:rounded-r-none rtl:rounded-l-none ltr:border-r-0 rtl:border-l-0" />
                  </div>
                </div>

                <div>
                  <label>{t.unit}</label>
                  <div className="">
                    <div>
                      <Controller
                        name="unit"
                        control={control}
                        rules={{ required: { value: true, message: t.required_select } }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            id="select_unit"
                            placeholder={t.select_option}
                            classNamePrefix="select"
                            className="w-full"
                            options={units}
                            onChange={(selected) => {
                              field.onChange(selected?.value);
                              onChangeSelect(selected, 'unit');
                            }}
                            value={units.find(o => o.value === field.value) || null}
                          />
                        )}
                      />
                      {errors.unit && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.unit?.message?.toString()}</span>}
                    </div>

                  </div>
                </div>

              </div>



            </div>
          </div>

          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => action_cancel()} type="button" className="btn btn-dark">
                {t.btn_cancel}
              </button>

              <button type="submit" className="btn btn-success">
                {t.btn_save}
              </button>

            </div>
          </div>

        </form>
      </div>
      <div className="mb-5">
        <Modal closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
      </div>
    </>
  );
};

export default ComponentSpareForm;
