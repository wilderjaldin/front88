'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import SearchFilter from '@/components/SearchFilter';
import { SearchingOverlay } from './shared';
import BySparePart from './by-part';
import ByQuote from './by-quote';
import ByPurchaseOrder from './by-purchase-order';
import BySupplier from './by-supplier';
import ByBrand from './by-brand';

const TAB_KEYS   = ['nroparte', 'nrocotizacion', 'ordencompra', 'proveedor', 'marca'];
const TAB_LABELS = ['Nro. Parte', 'Nro. Cotización', 'Orden de Compra', 'Proveedor', 'Marca'];
const TAB_COMPONENTS = [BySparePart, ByQuote, ByPurchaseOrder, BySupplier, ByBrand];
// proveedor/marca no usan el buscador de texto compartido — tienen su propio
// selector de autocompletar (ver by-supplier.js / by-brand.js).
const TABS_WITH_SEARCH = ['nroparte', 'nrocotizacion', 'ordencompra'];
const TAB_PLACEHOLDERS = {
  nroparte:      'Ingresa el Nro. de Parte',
  nrocotizacion: 'Ingresa el Nro. de Cotización',
  ordencompra:   'Ingresa el Nro. de Orden de Compra',
};

const URL_SEARCH_NRO_PARTE      = 'searches/nro-parte';
const URL_SEARCH_NRO_COTIZACION = (nro) => `searches/nro-cotizacion/${nro}`;
const URL_SEARCH_ORDEN_COMPRA   = (nro) => `searches/orden-compra/${nro}`;

export default function Search() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t             = useTranslation();

  // El buscador global del header (components/layouts/header.tsx) todavía manda
  // el esquema viejo ?term=X&type=part|reference — ambos son formas de buscar
  // por Nro. de Parte, así que se mapean a la tab "nroparte" con el término
  // pre-cargado y la búsqueda disparada automáticamente.
  const legacyTerm = searchParams.get('term');
  const rawType    = searchParams.get('type');
  const option     = (rawType === 'part' || rawType === 'reference') ? 'nroparte' : rawType;
  const activeTab  = Math.max(0, TAB_KEYS.indexOf(option));
  const activeKey  = TAB_KEYS[activeTab];

  const [results,     setResults]     = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const [glider, setGlider] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const handleTabChange = (index) => {
    router.push(`?type=${TAB_KEYS[index]}`, { scroll: false });
    setResults(null);
    setHasSearched(false);
  };

  const handleSearch = async (term) => {
    const value = (term ?? '').trim();
    if (!value) { setResults(null); setHasSearched(false); return; }
    setLoading(true);
    try {
      let rs;
      if (activeKey === 'nroparte') {
        rs = await axiosClient.get(URL_SEARCH_NRO_PARTE, { params: { term: value } });
      } else if (activeKey === 'nrocotizacion') {
        rs = await axiosClient.get(URL_SEARCH_NRO_COTIZACION(value));
      } else if (activeKey === 'ordencompra') {
        rs = await axiosClient.get(URL_SEARCH_ORDEN_COMPRA(value));
      } else {
        return;
      }
      setResults(rs.data ?? null);
    } catch {
      setResults(null);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  const handleClear = () => { setResults(null); setHasSearched(false); };

  useEffect(() => {
    if (legacyTerm) handleSearch(legacyTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyTerm, rawType]);

  useDynamicTitle(`${t.search}`);

  const ActiveTabComponent = TAB_COMPONENTS[activeTab] ?? BySparePart;

  return (
    <>
     
      {/* Tabs con glider */}
      <div className="flex justify-center mb-5">
        <div className="relative flex flex-wrap justify-center rounded-xl border border-gray-200 bg-white dark:border-0 dark:bg-gray-800 p-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-slate-700 dark:bg-slate-500 shadow-sm transition-all duration-200 ease-out"
            style={{ left: glider.left, width: glider.width }}
          />
          {TAB_LABELS.map((label, index) => (
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

      {TABS_WITH_SEARCH.includes(activeKey) && (
        <div className="flex justify-center mb-6">
          <SearchFilter
            t={t}
            value={legacyTerm ?? ''}
            onSearch={handleSearch}
            onClear={handleClear}
            placeholder={TAB_PLACEHOLDERS[activeKey]}
            className="w-full max-w-xl"
          />
        </div>
      )}

      <div className="animate__animated animate__faster animate__fadeIn">
        <ActiveTabComponent results={results ?? {}} hasSearched={hasSearched} />
      </div>

      {loading && <SearchingOverlay />}
    </>
  );
}
