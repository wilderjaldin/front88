"use client";
import { useEffect, useRef, useState } from "react";
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import ComponentTradingForm from "@/components/forms/trading-form";
import axios from 'axios'
const url = process.env.NEXT_PUBLIC_API_URL + "cliente/ListaControlesCli"

export default function TradingConditionsCustomer({ action_cancel, customer, token, conditions, setConditions, loadConditions, setLoadConditions, sellers, setSeller, updateCustomerTradding }) {

  const [current_condition, setCurrentCondition] = useState(null);
  const [current_seller, setCurrentSeller] = useState(null);
  const locale = useSelector(getLocale);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (loadConditions) {
      getConditions();
    } else {
      let current = Object.keys(conditions).find((key) => conditions[key].value.toUpperCase() === customer.CodConPago.toUpperCase()) || null;
      setCurrentCondition(current);
      current = Object.keys(sellers).find((key) => sellers[key].value == customer.CodVendedor) || null;
      setCurrentSeller(current);
    }

  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    getConditions();
  }, [locale]);

  const getConditions = async () => {
    
    try {
      const rs = await axios.post(url, { CodCliente: customer.IdCliente, Idioma: locale, ValToken: token });
      
      if (rs.data.estado == 'OK') {
        if (rs.data.dato2.length) {
          let options = [];
          rs.data.dato2.map((o) => {
            options.push({ value: o.CodCondPago, label: o.DesCondPago })
          });

          let current = Object.keys(options).find((key) => options[key].value.toUpperCase() === customer.CodConPago.toUpperCase()) || null;
          setCurrentCondition(current);
          setConditions(options)
        }
        if (rs.data.dato3.length) {
          let options = [];
          rs.data.dato3.map((o) => {
            if (o.CodVendedor != 0) {
              options.push({ value: o.CodVendedor, label: o.NomVendedor })
            }
          });
          let current = Object.keys(options).find((key) => options[key].value == customer.CodVendedor) || null;
          setCurrentSeller(current);
          setSeller(options);
        }
        setLoadConditions(false);
      }

    } catch (error) {

    }
  }

  return (
    <>
      <div className="w-full sm:w-1/2 m-auto">
        <ComponentTradingForm
          current_condition={current_condition}
          setCurrentCondition={setCurrentCondition}
          current_seller={current_seller}
          setCurrentSeller={setCurrentSeller}
          conditions={conditions}
          setConditions={setConditions}
          loadConditions={loadConditions}
          setLoadConditions={setLoadConditions}
          sellers={sellers}
          customer={customer}
          action_cancel={action_cancel}
          updateCustomerTradding={updateCustomerTradding}
          token={token} >
        </ComponentTradingForm>
      </div>
    </>
  );
}