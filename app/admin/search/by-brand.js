'use client';
import { useState } from 'react';
import Link from 'next/link';
import axiosClient from '@/app/lib/axiosClient';
import AsyncSelect from '@/components/ui/AsyncSelect';
import ResultTable from './result-table';
import { NameWithFlag } from './shared';

const URL_BRANDS       = 'searches/marcas';
const URL_SEARCH_BRAND = (codMarca) => `searches/marca/${codMarca}`;
const ASYNC_MIN_CHARS = 2;

const ByBrand = () => {
  const [selected,    setSelected]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadBrands = async (inputValue, callback) => {
    if ((inputValue ?? '').trim().length < ASYNC_MIN_CHARS) { callback([]); return; }
    try {
      const rs = await axiosClient.get(URL_BRANDS, { params: { term: inputValue.trim() } });
      callback((rs.data ?? []).map(m => ({ value: m.codMarca, label: m.nomMarca })));
    } catch { callback([]); }
  };

  const handleSelect = async (option) => {
    setSelected(option);
    if (!option) { setResults(null); setHasSearched(false); return; }
    setHasSearched(true);
    try {
      const rs = await axiosClient.get(URL_SEARCH_BRAND(option.value));
      setResults(rs.data ?? null);
    } catch {
      setResults(null);
    }
  };

  const marca = results?.marca;

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-2">
        <div className="w-full max-w-xl">
          <AsyncSelect
            loadOptions={loadBrands}
            defaultOptions={false}
            value={selected}
            onChange={handleSelect}
            placeholder="Busca una marca por nombre..."
            noOptionsMessage={({ inputValue }) =>
              (inputValue ?? '').length < ASYNC_MIN_CHARS ? `Escribe ${ASYNC_MIN_CHARS}+ caracteres` : 'Sin resultados'}
            isClearable
            cacheOptions
          />
        </div>
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Marca</h3>
        </div>
        {marca ? (
          <div className="px-4 py-4 text-sm">
            <p className="font-semibold">{marca.nomMarca}</p>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            {hasSearched ? 'Sin resultados' : 'Selecciona una marca para ver el detalle'}
          </div>
        )}
      </div>

      <ResultTable
        title="Proveedores"
        hasSearched={hasSearched}
        rows={results?.proveedores}
        columns={[
          { key: 'nomPrv', label: 'Proveedor', render: r => (
            <Link className="font-semibold text-primary hover:underline" href={`/admin/register/suppliers/${r.codPrv}/general`}>{r.nomPrv}</Link>
          ) },
          { key: 'razSoc', label: 'Razón Social' },
          { key: 'codPais', label: 'País', render: r => <NameWithFlag name={r.nomPais} codPais={r.codPais} nomPais={r.nomPais} /> },
          { key: 'numDoc', label: 'Documento', render: r => r.numDoc ? `${r.desTipDoc ?? ''} ${r.numDoc}`.trim() : '—' },
          { key: 'dirPrv', label: 'Dirección', render: r => r.dirPrv || '—' },
        ]}
      />
    </div>
  );
};

export default ByBrand;
