"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnNewQuote from "@/components/BtnNewQuote";
import { useSearchParams } from "next/navigation";
import { usePermissions } from "@/app/hooks/usePermissions";
import { DASHBOARD_GROUPS } from "@/constants/dashboard-items";
import { PERMISSIONS } from "@/constants/permissions";

const url        = process.env.NEXT_PUBLIC_API_URL + "cliente/ListaControlesCli";
const url_cities = process.env.NEXT_PUBLIC_API_URL + "empresa/ListaCiudad";

// ── Item de acceso rápido — mismo patrón que el original ─────────────────────
const Item = ({ href, icon, label }) => (
  <li className="text-center">
    <Link href={href} className="group flex flex-col items-center gap-2">
      <div className="[&_svg]:drop-shadow-md [&_svg]:transition-transform
                      group-hover:[&_svg]:scale-110 duration-200">
        {icon}
      </div>
      <span className="inline-block rounded-full bg-[#1b2e4b] px-4 py-1.5
                       text-xs text-white font-medium
                       group-hover:bg-primary transition-colors duration-200
                       before:inline-block before:h-1.5 before:w-1.5
                       before:rounded-full before:bg-white
                       ltr:before:mr-2 rtl:before:ml-2">
        {label}
      </span>
    </Link>
  </li>
);

// ── Panel de grupo ────────────────────────────────────────────────────────────
const Group = ({ title, children, className = '' }) => (
  <div className={`panel shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="h-5 w-1 rounded-full bg-primary" />
      <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
        {title}
      </h2>
    </div>
    <ul className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-evenly
                   items-end gap-y-6 gap-x-4 svg-center">
      {children}
    </ul>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {

  const t              = useTranslation();
  const searchParams   = useSearchParams();
  const token          = useSelector(selectToken);
  const { hasPermission } = usePermissions();
  const [showAdmin, setShowAdmin] = useState(false);

  const sf = searchParams.get("sf") || false;

  useEffect(() => {
    if (sf === "true") setShowAdmin(true);
  }, [sf]);

  const updateCities = async (countries) => {
    try {
      const rs = await axios.post(url_cities, { ValToken: token });
      if (rs.data.estado === 'OK') {
        const cites_list = {};
        countries.forEach(country => {
          const list = rs.data.dato
            .filter(c => c.CodPais === country.value)
            .map(c => ({ value: Number(c.CodCiudad), label: c.NomCiudad }))
            .sort((a, b) => a.label.localeCompare(b.label));
          if (list.length > 0) cites_list[country.value] = list;
        });
        await fetch("/api/saveFile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: "cities.json", folder: "data-runtime", content: cites_list }),
        });
      }
    } catch (error) { console.error(error); }
  };

  const saveCountries = async (data) => {
    const array = data.filter(d => d.CodPais !== 0).map(d => ({ value: d.CodPais, label: d.NomPais }));
    await fetch("/api/saveFile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: "countries.json", folder: "data-runtime", content: array }),
    });
    updateCities(array);
  };

  const loadLists = async () => {
    try {
      const response = await axios.post(url, { ValToken: token });
      saveCountries(response.data.dato4);
    } catch (error) {}
  };

  useDynamicTitle(`${t.dashboard}`);

  return (
    <div className="space-y-5 pb-6">

      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse text-sm">
        <li className="text-gray-500">{t.dashboard}</li>
      </ul>

      {/* Admin oculto */}
      {showAdmin && (
        <div className="panel border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
          <button className="btn btn-warning btn-sm" onClick={loadLists}>
            Actualizar listados
          </button>
        </div>
      )}

      {/* ── Grupos del panel ─────────────────────────────────────────────── */}
      {(() => {
        const regularGroups  = DASHBOARD_GROUPS.filter(g => !g.compact);
        const compactGroups  = DASHBOARD_GROUPS.filter(g => g.compact);

        const renderItems = (group) =>
          group.items
            .filter(item => !item.permission || hasPermission(item.permission))
            .map(item => {
              if (item.type === 'btn-new-quote') {
                if (!hasPermission(PERMISSIONS.CREAR_COTIZACION)) return null;
                return (
                  <li key={item.key} className="text-center">
                    <BtnNewQuote token={token} t={t} show_title={true} classNameBtn="" classNameIcon="drop-shadow-md" />
                  </li>
                );
              }
              return (
                <Item
                  key={item.key}
                  href={item.href}
                  icon={<item.Icon />}
                  label={t[item.labelKey]}
                />
              );
            });

        const renderedRegular = regularGroups.map(group => {
          const items = renderItems(group);
          if (!items.length) return null;
          return (
            <Group key={group.key} title={t[group.titleKey]}>
              {items}
            </Group>
          );
        });

        const lastRegular = renderedRegular.filter(Boolean).at(-1);
        const compactPairs = compactGroups.map(group => {
          const items = renderItems(group);
          if (!items.length) return null;
          return (
            <Group key={group.key} title={t[group.titleKey]} className="lg:min-w-[280px]">
              {items}
            </Group>
          );
        }).filter(Boolean);

        if (!compactPairs.length) return renderedRegular;

        return (
          <>
            {renderedRegular.slice(0, -1)}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
              {lastRegular}
              {compactPairs}
            </div>
          </>
        );
      })()}

    </div>
  );
}