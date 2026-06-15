"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Quotes from '@/app/admin/revision/orders-process/settings/quotes';
import OpenOrders from '@/app/admin/revision/orders-process/settings/open_orders';
import CompletedOrders from '@/app/admin/revision/orders-process/settings/completed_orders';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import { usePermissions } from '@/app/hooks/usePermissions';

const URL_FICHA               = (id) => `clientes/ficha/${id}`;
const URL_COTIZACIONES        = 'cotizaciones';
const URL_ORDENES_ABIERTAS    = 'cotizaciones/ordenes-abiertas';
const URL_ORDENES_COMPLETADAS = 'cotizaciones/ordenes-completadas';

const TAB_KEYS = ['quotes', 'open', 'completed'];

const TAB_URL = {
  quotes:    URL_COTIZACIONES,
  open:      URL_ORDENES_ABIERTAS,
  completed: URL_ORDENES_COMPLETADAS,
};

const PAGE_SIZE = 20;

export default function Settings({ customer_id, setCustomer, onCustomerLoaded, token, t }) {
  const { hasPermission } = usePermissions();

  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const option         = searchParams.get("option");
  const is_new_contact = searchParams.get("new") || 'false';

  // Parámetros reactivos del URL — fuente de verdad para paginación, orden y búsqueda
  const urlPage   = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const urlSort   = searchParams.get("sort")   ?? '';
  const urlDir    = searchParams.get("dir")    ?? 'asc';
  const urlSearch = searchParams.get("term") ?? '';

  const [quotes,           setQuotes]          = useState([]);
  const [open_orders,      setOpenOrders]      = useState([]);
  const [completed_orders, setCompletedOrders] = useState([]);
  const [quotesTotal,      setQuotesTotal]     = useState(0);
  const [openTotal,        setOpenTotal]       = useState(0);
  const [completedTotal,   setCompletedTotal]  = useState(0);
  const [loading,          setLoading]         = useState(false);

  // Guarda los últimos params fetcheados por tab para lazy-loading por igualdad de params
  const lastFetchRef = useRef({});

  const current_tab = Math.max(0, TAB_KEYS.indexOf(option));
  const [activeTab, setActiveTab] = useState(current_tab);
  const [glider,    setGlider]    = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  useEffect(() => {
    setActiveTab(Math.max(0, TAB_KEYS.indexOf(option)));
  }, [option]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  useEffect(() => {
    if (!customer_id) return;
    axiosClient.get(URL_FICHA(customer_id)).then(rs => {
      onCustomerLoaded?.(rs.data.cliente ?? {});
    });
  }, [customer_id]);

  const fetchTab = useCallback(async (tab, page, sort, dir, search = '') => {
    if (!customer_id) return;
    lastFetchRef.current[tab] = { page, sort, dir, search };
    setLoading(true);
    try {
      const params = { codCliente: customer_id, page, term: search };
      if (sort) { params.sort = sort; params.dir = dir; }

      const rs    = await axiosClient.get(TAB_URL[tab], { params });
      const data  = rs.data.datos ?? rs.data.Datos ?? [];
      const total = rs.data.total ?? rs.data.Total ?? 0;

      if (tab === 'quotes')    { setQuotes(data);          setQuotesTotal(total);    }
      else if (tab === 'open') { setOpenOrders(data);      setOpenTotal(total);      }
      else                     { setCompletedOrders(data); setCompletedTotal(total); }
    } catch {}
    finally { setLoading(false); }
  }, [customer_id]);

  // Fetch reactivo: se dispara cuando cambia tab, customer, page, sort, dir o búsqueda.
  // lastFetchRef evita re-fetches cuando los params son idénticos (lazy-loading).
  useEffect(() => {
    const tab = TAB_KEYS[activeTab];
    if (!customer_id) return;
    const last = lastFetchRef.current[tab];
    if (
      last?.page   === urlPage   &&
      last?.sort   === urlSort   &&
      last?.dir    === urlDir    &&
      last?.search === urlSearch
    ) return;
    fetchTab(tab, urlPage, urlSort, urlDir, urlSearch);
  }, [activeTab, customer_id, urlPage, urlSort, urlDir, urlSearch, fetchTab]);

  // Actualiza todos los params en el URL
  const updateUrl = (page, sort, dir, search = '') => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    if (sort)   { params.set("sort", sort); params.set("dir", dir); }
    else        { params.delete("sort"); params.delete("dir"); }
    if (search) params.set("term", search); else params.delete("term");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Búsqueda server-side: resetea página y orden
  const handleSearch = (term) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("sort");
    params.delete("dir");
    const trimmed = term.trim();
    if (trimmed) params.set("term", trimmed); else params.delete("term");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Toggle asc/desc; mantiene la búsqueda activa
  const handleSort = (col) => {
    const newDir = urlSort === col && urlDir === 'asc' ? 'desc' : 'asc';
    updateUrl(1, col, newDir, urlSearch);
  };

  const handleTabChange = (index) => {
    setActiveTab(index);
    // Al cambiar tab: page, sort, dir y buscar se limpian
    const params = new URLSearchParams();
    params.set("customer", customer_id);
    params.set("option", TAB_KEYS[index]);
    if (is_new_contact === 'true') params.set("new", "true");
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeSetting = () => {
    setCustomer(null);
    const next = new URLSearchParams(searchParams.toString());
    ['customer', 'option', 'page', 'sort', 'dir', 'term'].forEach(k => next.delete(k));
    router.replace(`${pathname}?${next}`);
  };

  const tabLabels = [t.quotes, t.open_orders, t.completed_orders];

  const panels = [
    <Quotes
      key="quotes" customer_id={customer_id} token={token} t={t}
      items={quotes} loading={loading} hasPermission={hasPermission}
      page={urlPage} total={quotesTotal} pageSize={PAGE_SIZE}
      sort={urlSort} dir={urlDir}
      search={urlSearch}
      onSort={handleSort}
      onSearch={handleSearch}
      onPageChange={(p) => updateUrl(p, urlSort, urlDir, urlSearch)}
    />,
    <OpenOrders
      key="open" t={t}
      items={open_orders} loading={loading}
      page={urlPage} total={openTotal} pageSize={PAGE_SIZE}
      sort={urlSort} dir={urlDir}
      search={urlSearch}
      onSort={handleSort}
      onSearch={handleSearch}
      onPageChange={(p) => updateUrl(p, urlSort, urlDir, urlSearch)}
    />,
    <CompletedOrders
      key="completed" t={t}
      items={completed_orders} loading={loading}
      page={urlPage} total={completedTotal} pageSize={PAGE_SIZE}
      sort={urlSort} dir={urlDir}
      search={urlSearch}
      onSort={handleSort}
      onSearch={handleSearch}
      onPageChange={(p) => updateUrl(p, urlSort, urlDir, urlSearch)}
    />,
  ];

  return (
    <div>
      <div className="flex items-center mb-5">
        <div className="flex-1 flex justify-center">
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

        <button
          type="button"
          onClick={closeSetting}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3
            text-sm text-gray-600 hover:bg-gray-50 transition
            dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <IconArrowBackward className="h-4 w-4" />
          {t.back}
        </button>
      </div>

      <div key={activeTab} className="animate__animated animate__faster animate__fadeIn">
        {panels[activeTab]}
      </div>
    </div>
  );
}
