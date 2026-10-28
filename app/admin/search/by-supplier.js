'use client';
import { useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/app/lib/axiosClient';
import AsyncSelect from '@/components/ui/AsyncSelect';
import ResultTable from './result-table';
import { NameWithFlag } from './shared';

const URL_SUPPLIERS       = 'proveedores';
const URL_SEARCH_SUPPLIER = (codPrv) => `searches/proveedor/${codPrv}`;
const ASYNC_MIN_CHARS = 2;

const BySupplier = () => {
  const [selected,    setSelected]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadSuppliers = async (inputValue, callback) => {
    if ((inputValue ?? '').trim().length < ASYNC_MIN_CHARS) { callback([]); return; }
    try {
      const rs = await axiosClient.get(URL_SUPPLIERS, { params: { page: 1, pageSize: 20, term: inputValue.trim() } });
      callback((rs.data?.data ?? []).map(s => ({ value: s.codPrv, label: s.nomPrv })));
    } catch { callback([]); }
  };

  const handleSelect = async (option) => {
    setSelected(option);
    if (!option) { setResults(null); setHasSearched(false); return; }
    setHasSearched(true);
    try {
      const rs = await axiosClient.get(URL_SEARCH_SUPPLIER(option.value));
      setResults(rs.data ?? null);
    } catch {
      setResults(null);
    }
  };

  const prv = results?.proveedor;

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-2">
        <div className="w-full max-w-xl">
          <AsyncSelect
            loadOptions={loadSuppliers}
            defaultOptions={false}
            value={selected}
            onChange={handleSelect}
            placeholder="Busca un proveedor por nombre..."
            noOptionsMessage={({ inputValue }) =>
              (inputValue ?? '').length < ASYNC_MIN_CHARS ? `Escribe ${ASYNC_MIN_CHARS}+ caracteres` : 'Sin resultados'}
            isClearable
            cacheOptions
          />
        </div>
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Proveedor</h3>
        </div>
        {prv ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-4 text-sm">
            <div>
              <p className="text-[11px] uppercase text-gray-400 mb-0.5">Proveedor</p>
              <Link className="font-semibold text-primary hover:underline" href={`/admin/register/suppliers/${prv.codPrv}/general`}>{prv.nomPrv}</Link>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-400 mb-0.5">Razón Social</p>
              <p className="font-medium">{prv.razSoc}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-400 mb-0.5">País</p>
              <NameWithFlag name={prv.nomPais} codPais={prv.codPais} nomPais={prv.nomPais} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            {hasSearched ? 'Sin resultados' : 'Selecciona un proveedor para ver el detalle'}
          </div>
        )}
      </div>

      <ResultTable
        title="Marcas Asignadas"
        hasSearched={hasSearched}
        hideHeader
        rows={results?.marcas}
        columns={[{ key: 'nomMarca', label: 'Marca' }]}
      />
    </div>
  );
};

export default BySupplier;
