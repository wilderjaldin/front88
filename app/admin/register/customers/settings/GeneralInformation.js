"use client";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import ComponentCustomerForm from "@/components/forms/customer-form";


export default function GeneralInformation({ action_cancel, customer, token, updateList, doc_types }) {

  return (
    <>
      <ComponentCustomerForm doc_types={doc_types} customer={customer} action_cancel={action_cancel} show_labels_opc={true} token={token} updateList={updateList}></ComponentCustomerForm>
    </>
  );
}