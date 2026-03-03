"use client";
import { useEffect, useState } from "react";
import axios from 'axios'
import Swal from 'sweetalert2'
import ImportFormulaForm from "@/components/forms/formula-import-form"

const url_get_formula = process.env.NEXT_PUBLIC_API_URL + 'proveedor/MostrarDetalleFormulaPrv';
const url_delete_formula = process.env.NEXT_PUBLIC_API_URL + 'proveedor/EliminarFormulaPrv';

export default function FormulaSupplier({ supplier, token, t, setLoadFormula, loadFormula, formula, setFormula, variables, setVariables }) {

  const [show_form, setShowForm] = useState(false);

  const showFormImportForm = () => {
    setShowForm(true);
  }

  useEffect(() => {
    if(loadFormula){
      getFormula();
    }
  }, []);

  const getFormula = async () => {
    try {
      const rs = await axios.post(url_get_formula, { CodPrv: supplier.CodPrv, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        setFormula(rs.data.dato1);
        setVariables(rs.data.dato2);
        setLoadFormula(false);
      }
    } catch (error) {
      
    }
  }

  const deleteFormula = () => {
    Swal.fire({
      title: t.question_delete_formula,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let rs = await axios.post(url_delete_formula, { CodPrv: supplier.CodPrv, ValToken: token });
          
          if (rs.data.estado == "OK") {
            setFormula(null);
            setVariables([]);
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.formula_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.formula_error_deleted,
              showConfirmButton: false,
              timer: 1500
            });
          }


        } catch (error) {
          
          Swal.fire({
            title: t.error,
            text: t.formula_error_server,
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
      {!(show_form) ?
        <div className="text-center">
          <div className='space-y-4'>
            <div>
              <label htmlFor="nro_part">{ t.import_formula }</label>
              <div className="">
                <label className="text-xl badge bg-secondary shadow-md dark:group-hover:bg-transparent inline-block my-5 p-5">{(formula) ?? t.supplier_without_formula}</label>
              </div>
            </div>
          </div>
          <div className="my-5">

            <div className="flex flex-wrap items-center justify-center gap-2">
              {(formula) &&
                <button type="button" onClick={() => deleteFormula() } className="btn btn-danger">
                  {t.btn_delete}
                </button>
              }

              <button type="button" onClick={() => showFormImportForm()} className="btn btn-success">
                { (formula) ? t.edit_formula : t.create_formula }
              </button>

            </div>
          </div>
        </div>
        :
        <ImportFormulaForm vars={variables} formula={(formula) ?? ''} setFormula={setFormula} updateVariables={setVariables} action_cancel={() => setShowForm(false)} supplier={supplier} token={token} t={t}></ImportFormulaForm>
      }
    </>
  )
}