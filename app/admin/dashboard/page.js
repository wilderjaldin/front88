"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import IconCustomer from "@/components/icon/icon-customer";
import IconQuotes from "@/components/icon/icon-quotes";
import IconAutorizeOrder from "@/components/icon/icon-autorize-order";
import IconOrderInProcess from "@/components/icon/icon-orders-in-process";
import IconSuppliers from "@/components/icon/icon-suppliers";
import IconSparePartsToBeQuoted from "@/components/icon/icon-spare-parts-to-be-quoted";
import IconSparePartsToBeIdentified from "@/components/icon/icon-spare-parts-to-be-identified";
import IconNewSpareParts from "@/components/icon/icon-new-spare-parts";
import IconGeneratePurchaseOrder from "@/components/icon/icon-generate-purchase-order";
import IconSearchPurchaseOrder from "@/components/icon/icon-search-purchase-order";
import IconSearchCircle from "@/components/icon/icon-search-circle";
import IconChangeQuote from "@/components/icon/icon-change-quote";
import IconCrossReference from "@/components/icon/icon-cross-reference";
import IconCRM from "@/components/icon/icon-crm";
import IconMessages from "@/components/icon/icon-messages";
import IconReception from "@/components/icon/icon-reception";
import IconPackaging from "@/components/icon/icon-packaging";
import IconShipment from "@/components/icon/icon-shipment";
import IconSetting from "@/components/icon/icon-setting";
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import BtnNewQuote from "@/components/BtnNewQuote";
import { useSearchParams } from "next/navigation";

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

  const t            = useTranslation();
  const searchParams = useSearchParams();
  const token        = useSelector(selectToken);
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

      {/* ── CLIENTES ───────────────────────────────────────────────────────── */}
      <Group title={t.customers}>
        <Item href="/admin/register/customers"       icon={<IconCustomer />}       label={t.customers}         />
        <li className="text-center">
          <BtnNewQuote token={token} t={t} show_title={true} classNameBtn="" classNameIcon="drop-shadow-md" />
        </li>
        <Item href="/admin/queries/orders-placed"         icon={<IconQuotes />}         label={t.quotes}            />
        <Item href="/admin/revision/authorize-purchase"   icon={<IconAutorizeOrder />}  label={t.authorize_order}   />
        <Item href="/admin/revision/orders-process"       icon={<IconOrderInProcess />} label={t.orders_in_process} />
      </Group>

      {/* ── PROVEEDORES ────────────────────────────────────────────────────── */}
      <Group title={t.suppliers}>
        <Item href="/admin/register/suppliers"             icon={<IconSuppliers />}              label={t.suppliers}                  />
        <Item href="/admin/queries/spare-parts-quotation"  icon={<IconSparePartsToBeQuoted />}   label={t.spare_parts_to_be_quoted}   />
        <Item href="/admin/queries/spare-parts-identified" icon={<IconSparePartsToBeIdentified />} label={t.spare_parts_to_be_identified} />
        <Item href="/admin/register/spares?action=new"     icon={<IconNewSpareParts />}          label={t.new_spare_parts}            />
        <Item href="/admin/purchase-order"                 icon={<IconGeneratePurchaseOrder />}  label={t.generate_purchase_order}    />
        <Item href="/admin/queries/purchase-orders"        icon={<IconSearchPurchaseOrder />}    label={t.search_purchase_order}      />
      </Group>

      {/* ── VARIOS + DEPÓSITO ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">

        <Group title={t.several}>
          <Item href="/admin/search"                         icon={<IconSearchCircle />}   label={t.search}          />
          <Item href="/admin/queries/change-quote"           icon={<IconChangeQuote />}    label={t.change_quote}    />
          <Item href="/admin/register/reference-change-part" icon={<IconCrossReference />} label={t.cross_reference} />
          <Item href="/admin/revision/crm-dashboard"         icon={<IconCRM />}            label={t.crm}             />
          <Item href="/admin/inbox"                          icon={<IconMessages />}       label={t.message}         />
          <Item href="/admin/settings"                       icon={<IconSetting />}        label={t.settings}        />
        </Group>

        <Group title={t.deposit} className="lg:min-w-[280px]">
          <Item href="/admin/purchase-reception" icon={<IconReception />} label={t.reception} />
          <Item href="/admin/packaging"          icon={<IconPackaging />} label={t.packaging} />
          <Item href="/admin/delivery"           icon={<IconShipment />}  label={t.shipment}  />
        </Group>

      </div>

    </div>
  );
}