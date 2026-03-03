"use client";
import { useEffect, useState } from "react";
import Modal from '@/components/modal';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconTrashLines from "@/components/icon/icon-trash-lines";
import AddBrandSupplierForm from "@/components/forms/add-brand-supplier-form";
const url_brands = process.env.NEXT_PUBLIC_API_URL + 'proveedor/MostrarListaMarcaPrv';
const url_delete_brand = process.env.NEXT_PUBLIC_API_URL + 'proveedor/MostrarListaMarcaPrv';

export default function AttachmentsSupplier({ supplier, token, t, brands, setBrands, loadBrands, setLoadBrands }) {


  

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);


  useEffect(() => {
    if (loadBrands){
      getBrands();
    }
    
  }, []);

  const getBrands = async () => {
    try {
      
      const rs = await axios.post(url_brands, { CodPrv: supplier.CodPrv, ValToken: token });
      
      setBrands(rs.data.dato)
      //setFilteredItems(rs.data.dato)
      setLoadBrands(false);
    } catch (error) {
      
    }
  }


  const addBrand = async () => {

    setModalTitle(t.add_brand);
    setModalContent(<AddBrandSupplierForm current_brands={brands} action_cancel={() => setShowModal(false)} supplier={supplier} token={token} updateListBrands={updateListBrands} t={t} />);
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
      </div>
      <Modal closeModal={() => setShowModal(false)} size={'w-full max-w-lg'} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
}