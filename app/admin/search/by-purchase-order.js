'use client';
import Link from 'next/link';
import ResultTable from './result-table';
import { fmtDate, fmtMoney, NameWithFlag, CountryFlag, cotizacionListColumns, embalajeListColumns, despachoListColumns } from './shared';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const ByPurchaseOrder = ({ results, hasSearched }) => {
  const d = results ?? {};
  const oc = d.ordenCompra;
  const prv = d.proveedor;

  if (!hasSearched) return null;

  return (
    <div className="space-y-4">
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Orden de Compra</h3>
        </div>
        {oc ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-4 text-sm">
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Nro. OC</p>
                <p className="font-semibold text-primary">{oc.numOrdenCompra}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Proveedor</p>
                <Link className="font-medium text-primary hover:underline" href={`/admin/register/suppliers/${oc.codPrv}/general`}>{oc.proveedor}</Link>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Estado</p>
                <p className="font-medium">{oc.nomStatus}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Tracking</p>
                <p className="font-medium">{oc.numTracking ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Fecha</p>
                <p className="font-medium">{fmtDate(oc.fecOrdenCompra)}</p>
              </div>
            </div>
            <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-800">
              <table className="w-full border-collapse bg-white dark:bg-gray-900">
                <thead>
                  <tr>
                    <th className={thClass}>Nro. Parte</th>
                    <th className={thClass}>Descripción</th>
                    <th className={`${thClass} text-center`}>Pedida</th>
                    <th className={`${thClass} text-center`}>Comprada</th>
                    <th className={`${thClass} text-center`}>Recibida</th>
                    <th className={`${thClass} text-center`}>Faltante</th>
                    <th className={`${thClass} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(oc.items ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-sm text-gray-400">Sin ítems</td></tr>
                  ) : oc.items.map((it, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className={`${tdClass} font-medium`}>{it.nroParte}</td>
                      <td className={tdClass}>{it.desRepuesto}</td>
                      <td className={`${tdClass} text-center`}>{it.canPedida}</td>
                      <td className={`${tdClass} text-center`}>{it.canComprada}</td>
                      <td className={`${tdClass} text-center`}>{it.canRecibida}</td>
                      <td className={`${tdClass} text-center`}>{it.canFaltante}</td>
                      <td className={`${tdClass} text-right`}>{fmtMoney(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Sin resultados</div>
        )}
      </div>

      <ResultTable
        title="Cotizaciones"
        hasSearched={hasSearched}
        rows={d.ordenes}
        columns={cotizacionListColumns}
      />

      <ResultTable
        title="Recepción"
        hasSearched={hasSearched}
        rows={d.recepciones}
        columns={[
          { key: 'numRecepcion', label: 'Nro. Recepción' },
          { key: 'canRecibida', label: 'Cant. Recibida', className: 'text-center' },
          { key: 'fecRecepcion', label: 'Fecha', render: r => fmtDate(r.fecRecepcion) },
        ]}
      />

      <ResultTable
        title="Clientes"
        hasSearched={hasSearched}
        hideHeader
        rows={d.clientes}
        columns={[
          { key: 'nomCliente', label: 'Cliente', render: r => (
            <div className="inline-flex items-center gap-1.5">
              <CountryFlag codPais={r.codPais} nomPais={r.nomPais} />
              <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
            </div>
          ) },
        ]}
      />

      <ResultTable
        title="Marcas"
        hasSearched={hasSearched}
        hideHeader
        rows={d.marcas}
        columns={[{ key: 'nomMarca', label: 'Marca' }]}
      />

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
              <NameWithFlag name={prv.codPais} codPais={prv.codPais} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Sin resultados</div>
        )}
      </div>

      <ResultTable
        title="Embalaje"
        hasSearched={hasSearched}
        rows={d.embalajes}
        columns={embalajeListColumns}
      />

      <ResultTable
        title="Despacho"
        hasSearched={hasSearched}
        rows={d.despachos}
        columns={despachoListColumns}
      />
    </div>
  );
};

export default ByPurchaseOrder;
