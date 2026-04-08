"use client";
import ComponentSupplierForm from "@/components/forms/supplier-form";


export default function GeneralInformation({ action_cancel, supplier, token, t, updateList, doc_types }) {

  return (
    <>
      <ComponentSupplierForm doc_types={doc_types} supplier={supplier} action_cancel={action_cancel} show_labels_opc={true} token={token} t={t} updateList={updateList}></ComponentSupplierForm>
    </>
  );
}