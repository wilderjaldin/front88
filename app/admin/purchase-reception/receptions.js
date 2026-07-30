'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Pagination } from '@mantine/core';
import IconBackSpace from "@/components/icon/icon-backspace";
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useForm } from "react-hook-form"
import Swal from 'sweetalert2'
import axios from 'axios'

const url_verify = process.env.NEXT_PUBLIC_API_URL + 'recepcion/ValidarDatosRecepcion';
const URL_SAVE_ITEMS = 'recepcion/guardar-items';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";
const inputClass = "h-8 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30";

const Receptions = ({ token, t, data, setReceptions, selected_orders, onRefresh }) => {

  const [filter, setFilter] = useState('');
  const [page,   setPage]   = useState(1);
  const [saving, setSaving] = useState(false);

  const {
    register,
    getValues,
    setValue,
  } = useForm()

  useEffect(() => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CanRecibida || '');
      setValue(`orders_${o.id}_origen`, o.Origen);
      setValue(`orders_${o.id}_code`, o.HCode);
      setValue(`orders_${o.id}_material`, o.Material);
      setValue(`orders_${o.id}_presentacion`, o.Presentacion);
      setValue(`orders_${o.id}_note`, o.NotaItem);
    });
  }, [data]);

  useEffect(() => { setPage(1); }, [data]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return data;
    const f = filter.trim().toLowerCase();
    return data.filter(o =>
      (o.NumOrdenCompra ?? '').toString().toLowerCase().includes(f) ||
      (o.NroOrden ?? '').toString().toLowerCase().includes(f) ||
      (o.NomCliente ?? '').toLowerCase().includes(f) ||
      (o.NroParte ?? '').toString().toLowerCase().includes(f)
    );
  }, [data, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData    = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReceiveAll = () => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CantFaltante);
    })
  }

  const handleSaveChanges = async () => {
    if (data.length > 0) {
      const is_valid = await verify(data);
      if (is_valid) {
        saveDataReception();
      } else {
        Swal.fire({
          title: t.error,
          text: t.attached_tems_does_not_match_the_orders,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    }
  }

  const verify = async (data) => {
    try {
      let NumOrdenCompra = [];

      selected_orders.map(o => {
        NumOrdenCompra.push(`${o.NumOrdenCompra}`);
      });
      let CadNroOrdenCompra = NumOrdenCompra.join(",");

      let data_send = {
        CadNroOrdenCompra: CadNroOrdenCompra,
        CantItems: data.length,
        ValToken: token
      }

      const rs = await axios.post(url_verify, data_send);
      if (rs.data.estado == 'Ok') {
        return true;
      } else {
        return false;
      }
    } catch (error) {

      return false;
    }
  }

  const saveDataReception = async () => {
    setSaving(true);
    try {
      let items = [];
      let different = false;
      data.map((o) => {
        if (getValues(`orders_${o.id}_amount`) < 1 || getValues(`orders_${o.id}_amount`) > o.CantFaltante) {
          different = true;
        }
        items.push(
          {
            NumOrdenCompra: o.NumOrdenCompra,
            nroCotizacion: o.NroOrden,
            CodItem: o.CodItem,
            CodRepuesto: o.CodRepuesto,
            // NroParte/NroParteCompra en el payload corresponden a los campos crudos del backend
            // (nroParte/nroParteCompra), invertidos respecto a como se mapean en pantalla.
            NroParte: o.NroParteCliente,
            NroParteCompra: o.NroParte,
            CanRecibida: getValues(`orders_${o.id}_amount`),
            DesRepuesto: o.Descripcion,
            Nota: getValues(`orders_${o.id}_note`),
            Presentacion: getValues(`orders_${o.id}_presentacion`),
            Material: getValues(`orders_${o.id}_material`),
            Origen: getValues(`orders_${o.id}_origen`),
            HCode: getValues(`orders_${o.id}_code`),
          }
        );
      });

      if (different) {
        Swal.fire({
          icon: "error",
          title: t.save_puschase_receipt_amount_error
        });
        setSaving(false);
        return;
      }

      await axiosClient.post(URL_SAVE_ITEMS, { items });

      swalSuccess(t.save_puschase_receipt_success);
      setReceptions([]);
      onRefresh?.();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_puschase_receipt_error, t.close);
    }
    setSaving(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.purchase_reception}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro local */}
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            placeholder={t.filter}
            className="h-10 w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {filter && (
            <button onClick={() => setFilter('')} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
              <IconBackSpace className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={data.length === 0 || saving}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {saving ? (t.saving ?? 'Guardando…') : t.btn_save_changes}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleReceiveAll}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          {t.receive_all}
        </button>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} text-center`}>{t.nro_purchase_order}</th>
                <th className={`${thClass} text-center`}>{t.nro_order}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.nro_part}</th>
                <th className={thClass}>{t.nro_part_customer}</th>
                <th className={thClass}>{t.description}</th>
                <th className={`${thClass} text-center`}>{t.missing_amount}</th>
                <th className={`${thClass} text-center`}>{t.amount_received}</th>
                <th className={thClass}>Origen</th>
                <th className={thClass}>{t.h_code}</th>
                <th className={thClass}>Material</th>
                <th className={thClass}>{t.presentation}</th>
                <th className={thClass}>{t.note}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o) => {
                const index = o.id ?? data.indexOf(o);
                return (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className={`${tdClass} text-center font-medium`}>{o.NumOrdenCompra}</td>
                  <td className={`${tdClass} text-center`}>{o.NroOrden}</td>
                  <td className={tdClass}>{o.NomCliente}</td>
                  <td className={`${tdClass} text-primary`}>{o.NroParte}</td>
                  <td className={tdClass}>{o.NroParteCliente}</td>
                  <td className={tdClass}>{o.Descripcion}</td>
                  <td className={`${tdClass} text-center`}>{o.CantFaltante}</td>
                  <td className={tdClass}>
                    <input
                      step="any" type="number"
                      {...register(`orders_${index}_amount`)}
                      className={`${inputClass} text-center`}
                    />
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`orders_${index}_origen`)} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`orders_${index}_code`)} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`orders_${index}_material`)} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`orders_${index}_presentacion`)} className={inputClass} />
                  </td>
                  <td className={tdClass}>
                    <input type="text" {...register(`orders_${index}_note`)} className={inputClass} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}
    </div>
  );
};

export default Receptions;
