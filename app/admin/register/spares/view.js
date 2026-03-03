'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';

import { useOptionsSelect } from '@/app/options';
import { selectToken } from '@/store/authSlice';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const url_list =
  process.env.NEXT_PUBLIC_API_URL + 'repuesto/ListaControlesRepuesto';

/* ===================== */
/* HELPERS               */
/* ===================== */
const getLabel = (list, value) => {
  if (!list?.length) return "Cargando...";
  return list.find(o => String(o.value) === String(value))?.label || '—';
};

const YesNoBadge = ({ value }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300
      ${Number(value) === 1
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-200 text-gray-600'
      }`}
  >
    {Number(value) === 1 ? 'SI' : 'NO'}
  </span>
);

const ComponentSpareView = ({ action_cancel, t, spare = null, locale }) => {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const token = useSelector(selectToken);

  const brandsRaw = useOptionsSelect('brands');
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [types, setTypes] = useState([]);
  const [status, setStatus] = useState([]);
  const [statusCode, setStatusCode] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    getList();
  }, [locale]);
  useEffect(() => {
    if (brandsRaw?.length) {
      setBrands(brandsRaw);
    }
  }, [brandsRaw]);

  const getList = async () => {
    try {
      axios.defaults.timeout = 20000;

      const rs = await axios.post(url_list, {
        Idioma: locale,
        ValToken: token,
      });

      if (rs.data.estado == "OK") {
        setSuppliers(
          rs.data.dato1
            .filter(s => s.CodPrv !== 0)
            .map(s => ({ value: s.CodPrv, label: s.NomPrv }))
        );

        setTypes(
          rs.data.dato2
            .filter(t => t.CodTipRepuesto)
            .map(t => ({
              value: t.CodTipRepuesto,
              label: t.DesTipRepuesto,
            }))
        );

        setStatusCode(
          rs.data.dato3
            .filter(s => s.CodEstRepuesto)
            .map(s => ({
              value: s.CodEstRepuesto,
              label: s.DesEstRepuesto,
            }))
        );

        setStatus(
          rs.data.dato4
            .filter(s => s.CodEstado)
            .map(s => ({ value: s.CodEstado, label: s.DesEstado }))
        );

        setUnits(
          rs.data.dato5
            .filter(u => u.CodUniMed)
            .map(u => ({ value: u.CodUniMed, label: u.DesUniMedida }))
        );
      }

    } catch (err) {
      console.error(err);
    }
  };
  const close_event = () => {
    action_cancel();
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("id");
    nextSearchParams.delete("action");
    router.replace(`${pathname}?${nextSearchParams}`);
  }
  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow-md mt-4 transition-all">

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* INFO GENERAL */}
        <Section title={t.general_information}>
          <Field label={t.nro_part} value={spare?.NroParte} strong />
          <Field label={t.description} value={spare?.DesRepuesto} />
          <Field
            label={t.supplier}
            value={getLabel(suppliers, spare?.CodProveedor)}
          />
          <Field
            label={t.status}
            value={getLabel(status, spare?.CodEstadoCodigo)}
            badge
          />
          <Field label={t.order_special_without_date}>
            <YesNoBadge value={spare?.PedEspecialSinFecha} />
          </Field>
        </Section>

        {/* CLASIFICACIÓN */}
        <Section title={t.classification}>
          <Field
            label={t.application}
            value={getLabel(brands, spare?.CodAplicacion)}
          />
          <Field
            label={t.spare_part_type}
            value={getLabel(types, spare?.CodTipRepuesto)}
          />
          <Field
            label={t.brand}
            value={getLabel(brands, spare?.CodMarca)}
          />
          <Field
            label={t.status_code}
            value={getLabel(statusCode, spare?.CodEstadoRepuesto)}
          />
          <Field label={t.special_order}>
            <YesNoBadge value={spare?.PedidoEspecial} />
          </Field>
        </Section>

        {/* DATOS COMERCIALES */}
        <Section title={t.commercial_data}>
          <div className="grid grid-cols-2 gap-4">
            <Metric label={t.weight} value={spare?.Peso} />
            <Metric label={t.cost} value={spare?.Costo} green />
            <Metric label={t.min_quantity} value={spare?.CanMin} />
            <Metric
              label={t.unit}
              value={getLabel(units, spare?.CodUniMed)}
            />
          </div>
        </Section>
      </div>

      {/* BOTONES */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => close_event()}
          className="px-6 py-2 rounded-lg border border-gray-400 hover:bg-gray-200 transition"
        >
          {t.back_to_parts}
        </button>

        <Link
          href={`/admin/register/spares?id=${spare?.IdRepuesto}&action=edit`}
          className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition text-center"
        >
          {t.btn_edit}
        </Link>
      </div>
    </div>
  );
};

/* ===================== */
/* SUBCOMPONENTES        */
/* ===================== */

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm space-y-4 transition">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">
      {title}
    </h3>
    {children}
  </div>
);

const Field = ({ label, value, strong, badge, children }) => (
  <div>
    <span className="text-xs text-gray-500">{label}</span>
    <div
      className={`mt-1 ${strong ? 'text-lg font-bold text-indigo-600' : 'font-medium'
        }`}
    >
      {children || (
        <span
          className={
            badge
              ? 'inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-700'
              : ''
          }
        >
          {value}
        </span>
      )}
    </div>
  </div>
);

const Metric = ({ label, value, green }) => (
  <div className="text-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg transition">
    <span className="text-xs text-gray-500">{label}</span>
    <div
      className={`text-xl font-bold ${green ? 'text-green-600' : ''
        }`}
    >
      {value}
    </div>
  </div>
);

export default ComponentSpareView;
