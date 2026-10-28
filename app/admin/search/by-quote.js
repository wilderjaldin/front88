'use client';
import Link from 'next/link';
import ResultTable from './result-table';
import { fmtMoney, NameWithFlag, ordenCompraListColumns, recepcionListColumns, embalajeListColumns, despachoListColumns } from './shared';

const ByQuote = ({ results, hasSearched }) => {
  const d = results ?? {};
  const c = d.cotizacion;
  const hayOC = (d.ordenesCompra?.length ?? 0) > 0;

  if (!hasSearched) return null;

  if (!c) {
    return (
      <div className="panel border border-gray-200 dark:border-gray-700 py-10 text-center text-sm text-gray-400">
        Cotización no encontrada o no visible para tu usuario.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cotización</h3>
        </div>
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-4 text-sm">
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Nro. Cotización</p>
                <Link className="font-semibold text-primary hover:underline" href={`/admin/revision/quotes?customer=${c.codCliente}&option=quotes&id=${c.nroCotizacion}`}>{c.nroCotizacion}</Link>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Cliente</p>
                <NameWithFlag name={c.nomCliente} codPais={c.codPais} nomPais={c.nomPais} />
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Estado</p>
                <p className="font-medium">{c.estado}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Fecha Orden</p>
                <p className="font-medium">{c.fecOrden}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Vendedor</p>
                <p className="font-medium">{c.nomVendedor}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Registrado por</p>
                <p className="font-medium">{c.nomUsuRegistra}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Fecha Registro</p>
                <p className="font-medium">{c.fecRegistra}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Nro. de Items</p>
                <p className="font-medium">{c.nroItems}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-400 mb-0.5">Total</p>
                <p className="font-medium">{fmtMoney(c.total)}</p>
              </div>
            </div>
          </>
      </div>

      <ResultTable
        title="Órdenes de Compra"
        hasSearched={hasSearched}
        rows={d.ordenesCompra}
        columns={ordenCompraListColumns}
        scrollable
      />

      {hayOC && (
        <>
          <ResultTable
            title="Recepción"
            hasSearched={hasSearched}
            rows={d.recepciones}
            columns={recepcionListColumns}
            scrollable
          />

          <ResultTable
            title="Embalaje"
            hasSearched={hasSearched}
            rows={d.embalajes}
            columns={embalajeListColumns}
            scrollable
          />

          <ResultTable
            title="Despacho"
            scrollable
            hasSearched={hasSearched}
            rows={d.despachos}
            columns={despachoListColumns}
          />
        </>
      )}
    </div>
  );
};

export default ByQuote;
