"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import ComponentCustomerForm from "@/components/forms/customer-form";
import Modal from '@/components/modal';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconPencil from "@/components/icon/icon-pencil";
import AddBrandCustomerForm from "@/components/forms/add-brand-customer-form";
import AddEquipmentCustomerForm from "@/components/forms/add-equipment-customer-form";
const url_brands = process.env.NEXT_PUBLIC_API_URL + 'cliente/MostrarMarcaCliente';
const url_equipment = process.env.NEXT_PUBLIC_API_URL + 'cliente/MostrarEquipoCliente';
const url_delete_equipment = process.env.NEXT_PUBLIC_API_URL + 'cliente/EliminarEquipoCliente';
const url_get_equipment = process.env.NEXT_PUBLIC_API_URL + "cliente/RecuperarEquipoCliente";
const url_delete_brand = process.env.NEXT_PUBLIC_API_URL + 'cliente/EliminarMarcaCliente';

export default function AttachmentsCustomer({ action_cancel, customer, token, t, brands, setLoad, load, setBrands, equipments, setEquipments }) {


  //const [brands, setBrands] = useState([])
  //const [equipments, setEquipments] = useState([])

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-lg')



  useEffect(() => {
    if (load) {
      getBrands();
      getEquipment();
    }

  }, []);

  const getBrands = async () => {
    try {
      const rs = await axios.post(url_brands, { CodCliente: customer.IdCliente, ValToken: token });

      setBrands(rs.data.dato);
      setLoad(false);
    } catch (error) {

    }
  }

  const getEquipment = async () => {
    try {
      const rs = await axios.post(url_equipment, { CodCliente: customer.IdCliente, ValToken: token });
      
      setEquipments(rs.data.dato);
      setLoad(false);
    } catch (error) {

    }
  }
  const addBrand = async () => {

    setModalTitle(t.add_brand);
    setModalSize('w-full max-w-lg');
    setModalContent(<AddBrandCustomerForm current_brands={brands} action_cancel={() => setShowModal(false)} customer={customer} token={token} updateListBrands={updateListBrands} t={t} />);
    setShowModal(true);
  }
  const removeBrand = async (b) => {


    Swal.fire({
      title: t.question_delete_brand,
      text: b.NomMarca,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_brand, { CodRegistro: b.CodMarca, ValToken: token });

          if (rs.data.estado == "OK") {
            setBrands(() => {
              return brands.filter((item) => {
                return item.CodMarca != b.CodMarca;
              });
            });
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.brand_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.brand_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.brand_error_delete_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });

  }



  const updateListBrands = (b) => {
    let options = [];
    options.push(...brands, {
      CodMarca: b.value,
      NomMarca: b.label
    }
    );
    setBrands(options);
  }

  const addEquipment = async () => {
    setModalTitle("")
    setModalSize('w-full max-w-2xl');
    setModalContent(<AddEquipmentCustomerForm current_brands={brands} action_cancel={() => setShowModal(false)} customer={customer} token={token} updateListEquipment={updateListEquipment} setEquipments={setEquipments} t={t} />);
    setShowModal(true);
  }

  const editEquipment = async (equipment) => {

    try {
      //revisar
      const rs = await axios.post(url_get_equipment, { CodRegistro: equipment.CodRegistro, ValToken: token });
      if (rs.data.estado == "OK") {
        
        let current_equipment = rs.data.dato[0] || {};
        current_equipment.NomMarca = (equipment.NomMarca) ?? '';
        current_equipment.NomMarcaMotor = (equipment.NomMarcaMotor) ?? '';
        
        setModalTitle(t.edit_equipment)

        setModalContent(<AddEquipmentCustomerForm current={{ value: current_equipment.CodMarca, label: (equipment.NomMarca) ?? '' }} engine_current={{ value: current_equipment.CodMarcaMotor, label: (equipment.NomMarcaMotor) ?? '' }} equipment={current_equipment} current_brands={brands} action_cancel={() => setShowModal(false)} customer={customer} token={token} updateListEquipment={updateListEquipment} setEquipments={setEquipments} t={t} />);
        setShowModal(true);
      }
    } catch (error) {

    }


  }

  const removeEquipment = async (eq) => {


    Swal.fire({
      title: t.question_delete_equipment,
      text: eq.NomMarca,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_equipment, { CodRegistro: eq.CodRegistro, ValToken: token });

          if (rs.data.estado == "OK") {
            setEquipments(() => {
              return equipments.filter((item) => {
                return item.CodRegistro != eq.CodRegistro;
              });
            });
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.equipment_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.equipment_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.brand_error_delete_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });

  }

  const updateListEquipment = (b) => {
    let options = [];
    let exist = false;

    options = equipments.map((e) => {

      if (e.CodRegistro == b.CodRegistro) {
        exist = true;
        e.NomMarca = b.NomMarca;
        e.ModeloEquipo = b.model;
        e.AnioEquipo = b.year;
        e.NroSerieEquipo = b.serie;
      }
      return e;
    });
    if (!exist) {
      options = [];
      options.push(...equipments, {
        NomMarca: b.NomMarca,
        ModeloEquipo: b.model,
        AnioEquipo: b.year,
        NroSerieEquipo: b.serie,
        CodRegistro: b.CodRegistro
      }
      );
    }

    setEquipments(options);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:flex sm:flex-row gap-4">
        <div className="basis-1/4">
          <div className="table-responsive">
            <h2 className="text-lg mb-4 font-bold">{t.brands}</h2>
            <table className="bg-white table-hover">
              <thead>
                <tr className="relative">
                  <th colSpan={2} className="bg-gray-400 text-center uppercase">
                    {t.application}
                    <button className="btn btn-primary btn-sm absolute top-2 right-2" onClick={() => addBrand()}>{t.btn_add}</button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, index) => {
                  return (
                    <tr key={index}>
                      <td className="w-1">
                        <button className="btn btn-sm btn-danger" onClick={() => removeBrand(b)}><IconTrashLines /></button>
                      </td>
                      <td>{b.NomMarca}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="basis-3/4">
          <div className="table-responsive">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th colSpan={4} className="bg-gray-100 text-black text-center uppercase border border-gray-300">
                    { t.equipment_data }
                  </th>
                  <th colSpan={3} className="bg-gray-400 text-black text-center uppercase border border-gray-300">
                    { t.engine_data }
                  </th>
                  <th className=""></th>
                </tr>
                <tr className="bg-gray-200 text-gray-700 uppercase text-center">
                  <th className="!bg-gray-50 border-b">{t.brand}</th>
                  <th className="!bg-gray-50 border-b">{t.model}</th>
                  <th className="!bg-gray-50 border-b">{t.year}</th>
                  <th className="!bg-gray-50 border-b">{t.serie}</th>
                  <th className="!bg-gray-300 border-b">{t.brand}</th>
                  <th className="!bg-gray-300 border-b">{t.model}</th>
                  <th className="!bg-gray-300 border-b">{t.serie}</th>
                  <th className="">
                    <button
                      type="button"
                      onClick={() => addEquipment()}
                      className="btn btn-primary btn-sm"
                    >
                      {t.btn_add}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((e, index) => (
                  <tr key={index} className="text-center hover:bg-gray-50">
                    {/* Bloque Equipo */}
                    <td className="!bg-gray-50">{e.NomMarca}</td>
                    <td className="!bg-gray-50">{e.ModeloEquipo}</td>
                    <td className="!bg-gray-50">{e.AnioEquipo}</td>
                    <td className="!bg-gray-50">{e.NroSerieEquipo}</td>

                    {/* Bloque Motor */}
                    <td className="!bg-gray-300">{e.NomMarcaMotor}</td>
                    <td className="!bg-gray-300">{e.ModeloMotor}</td>
                    <td className="!bg-gray-300">{e.NroSerieMotor}</td>

                    {/* Acciones */}
                    <td className="!bg-gray-50 w-1">
                      <div className="mx-auto flex w-max items-center gap-2">
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => editEquipment(e)}
                        >
                          <IconPencil />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => removeEquipment(e)}
                        >
                          <IconTrashLines />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal closeModal={() => setShowModal(false)} size={modal_size} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}