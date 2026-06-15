"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/locales";
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import axiosClient from '@/app/lib/axiosClient';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import ItemsUnassigned from './items-unassigned';
import ItemsAssigned from './items-assigned';

const URL_ORDERS         = 'repuestos/por-cotizar';
const url_assign_order   = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/AsignarAUsuario';
const url_unassign_order = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/QuitarAsignacionUsuario';

const TAB_KEYS = ['unassigned', 'assigned'];

export default function SparePartsQuotation() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
  const t            = useTranslation();

  const option     = searchParams.get("option");
  const activeTab  = Math.max(0, TAB_KEYS.indexOf(option));

  const [orders_unassigned, setOrdersUnassigned] = useState([]);
  const [orders_assigned,   setOrdersAssigned]   = useState([]);

  const [glider,  setGlider]  = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useEffect(() => { getLists(); }, []);

  const getLists = async () => {
    try {
      const rs         = await axiosClient.get(URL_ORDERS);
      const unassigned = (rs.data.noAsignados ?? []).map((o, i) => ({ ...o, id: i }));
      const assigned   = (rs.data.asignados   ?? []).map((o, i) => ({ ...o, id: i }));
      setOrdersUnassigned(unassigned);
      setOrdersAssigned(assigned);
    } catch {}
  };

  const assignOrder = async (selected) => {
    try {
      const data = selected.map(o => ({ CodRegistro: o.codRegistro, ValToken: token }));
      const rs   = await axios.post(url_assign_order, data);
      if (rs.data.estado === 'OK') {
        setOrdersUnassigned((rs.data.dato1 ?? []).map((o, i) => ({ ...o, id: i })));
        setOrdersAssigned((rs.data.dato2   ?? []).map((o, i) => ({ ...o, id: i })));
      }
    } catch {}
  };

  const unassignOrder = async (selected) => {
    try {
      const data = selected.map(o => ({ CodRegistro: o.codRegistro, ValToken: token }));
      const rs   = await axios.post(url_unassign_order, data);
      if (rs.data.estado === 'OK') {
        setOrdersUnassigned((rs.data.dato1 ?? []).map((o, i) => ({ ...o, id: i })));
        setOrdersAssigned((rs.data.dato2   ?? []).map((o, i) => ({ ...o, id: i })));
      }
    } catch {}
  };

  const handleTabChange = (index) => {
    router.push(`?option=${TAB_KEYS[index]}`);
  };

  const tabLabels = [t.unassigned_quote_items, t.items_to_be_quoted_assigned];

  useDynamicTitle(`${t.query} | ${t.spare_parts_to_be_quoted}`);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4 text-sm text-gray-500">
        <li>{t.query}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-800 dark:text-gray-100">
          {t.spare_parts_to_be_quoted}
        </li>
      </ul>

      {/* Tabs con glider */}
      <div className="flex justify-center mb-5">
        <div className="relative flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-slate-700 dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out"
            style={{ left: glider.left, width: glider.width }}
          />
          {tabLabels.map((label, index) => (
            <button
              key={label}
              ref={el => { tabRefs.current[index] = el; }}
              type="button"
              onClick={() => handleTabChange(index)}
              className={`relative z-10 px-5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 outline-none whitespace-nowrap
                ${activeTab === index
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate__animated animate__faster animate__fadeIn">
        {activeTab === 0 && (
          <ItemsUnassigned t={t} token={token} data={orders_unassigned} assignOrder={assignOrder} />
        )}
        {activeTab === 1 && (
          <ItemsAssigned t={t} token={token} data={orders_assigned} unassignOrder={unassignOrder} setOrdersAssigned={setOrdersAssigned} />
        )}
      </div>
    </>
  );
}
