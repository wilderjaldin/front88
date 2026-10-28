'use client';
import Link from 'next/link';
import ResultTable from './result-table';
import { fmtDate, fmtMoney, NameWithFlag, CountryFlag, BoolBadge, ordenCompraListColumns, recepcionListColumns, embalajeListColumns, despachoListColumns, cotizacionListColumns } from './shared';

const repuestoColumns = [
  { key: 'nroParte', label: 'Nro. Parte', render: r => (
    <Link className="font-semibold text-primary hover:underline" href={`/admin/register/spares/${r.codRepuesto}`}>{r.nroParte}</Link>
  ) },
  { key: 'desRepuesto', label: 'Descripción' },
  { key: 'proveedor', label: 'Proveedor', render: r => (
    <Link className="text-primary hover:underline" href={`/admin/register/suppliers/${r.codPrv}/general`}>{r.proveedor}</Link>
  ) },
  { key: 'marca', label: 'Marca' },
  { key: 'aplicacion', label: 'Aplicación' },
  { key: 'tipRepuesto', label: 'Tipo de Repuesto' },
  { key: 'estado', label: 'Estado' },
  { key: 'peso', label: 'Peso (lb)', className: 'text-right' },
  { key: 'costo', label: 'Costo', className: 'text-right', render: r => fmtMoney(r.costo) },
  { key: 'fecVencimiento', label: 'Fec. Vigencia', render: r => fmtDate(r.fecVencimiento) },
];

const BySparePart = ({ results, hasSearched }) => {
  const d = results ?? {};
  const referencias = d.referenciasCruzadas?.referencias ?? [];
  const hayOC = (d.ordenesCompra?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <ResultTable
        title="Cotizaciones"
        hasSearched={hasSearched}
        rows={d.cotizaciones}
        columns={cotizacionListColumns}
      />

      <ResultTable
        title="Órdenes de Compra"
        hasSearched={hasSearched}
        rows={d.ordenesCompra}
        columns={ordenCompraListColumns}
      />

      {hayOC && (
        <>
          <ResultTable
            title="Recepción"
            hasSearched={hasSearched}
            rows={d.recepciones}
            columns={recepcionListColumns}
          />

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
        </>
      )}

      <ResultTable
        title="Repuestos por Cotizar"
        hasSearched={hasSearched}
        rows={d.repuestosPorCotizar}
        columns={[
          { key: 'nroCotizacion', label: 'Nro. Cotización', render: r => (
            <Link className="font-semibold text-primary hover:underline" href={`/admin/revision/quotes?customer=${r.codCliente}&option=quotes&id=${r.nroCotizacion}`}>{r.nroCotizacion}</Link>
          ) },
          { key: 'nroParte', label: 'Nro. Parte' },
          { key: 'cantidad', label: 'Cantidad', className: 'text-center' },
          { key: 'nomCliente', label: 'Cliente', render: r => <NameWithFlag name={r.nomCliente} codPais={r.codPaisCliente} /> },
          { key: 'nomUsuAsignado', label: 'Asignado a' },
          { key: 'fecRegistra', label: 'Fecha', render: r => fmtDate(r.fecRegistra) },
        ]}
      />

      <ResultTable
        title="Repuestos"
        hasSearched={hasSearched}
        rows={d.repuestos}
        columns={repuestoColumns}
      />

      <ResultTable
        title="Referencias Cruzadas"
        hasSearched={hasSearched}
        rows={referencias}
        columns={[
          { key: 'codDax', label: 'Código DAX' },
          { key: 'nroParte', label: 'Nro. Parte' },
          { key: 'aplicacion', label: 'Aplicación' },
          { key: 'blnCambio', label: 'Cambio', render: r => <BoolBadge val={r.blnCambio} /> },
          { key: 'blnReferencia', label: 'Referencia', render: r => <BoolBadge val={r.blnReferencia} /> },
          { key: 'fecRegistra', label: 'Fecha', render: r => fmtDate(r.fecRegistra) },
        ]}
      />

      <ResultTable
        title="Clientes"
        hasSearched={hasSearched}
        rows={d.clientes}
        columns={[
          { key: 'nomCliente', label: 'Cliente', render: r => (
            <div className="inline-flex items-center gap-1.5">
              <CountryFlag codPais={r.codPais} nomPais={r.nomPais} />
              <Link className="text-primary hover:underline" href={`/admin/register/customers/${r.codCliente}/general`}>{r.nomCliente}</Link>
            </div>
          ) },
          { key: 'cotizo', label: 'Cotizó', render: r => <BoolBadge val={r.cotizo} /> },
          { key: 'compro', label: 'Compró', render: r => <BoolBadge val={r.compro} /> },
          { key: 'cantidadCotizaciones', label: 'Cotizaciones', className: 'text-center' },
        ]}
      />

      <ResultTable
        title="Marcas"
        hasSearched={hasSearched}
        hideHeader
        rows={d.marcas}
        columns={[{ key: 'nomMarca', label: 'Marca' }]}
      />

      <ResultTable
        title="Aplicaciones"
        hasSearched={hasSearched}
        hideHeader
        rows={d.aplicaciones}
        columns={[{ key: 'nomMarca', label: 'Aplicación' }]}
      />

      <ResultTable
        title="Proveedores"
        hasSearched={hasSearched}
        rows={d.proveedores}
        columns={[
          { key: 'nomPrv', label: 'Proveedor', render: r => (
            <Link className="font-semibold text-primary hover:underline" href={`/admin/register/suppliers/${r.codPrv}/general`}>{r.nomPrv}</Link>
          ) },
          { key: 'razSoc', label: 'Razón Social' },
          { key: 'codPais', label: 'País', render: r => <NameWithFlag name={r.codPais} codPais={r.codPais} /> },
        ]}
      />
    </div>
  );
};

export default BySparePart;
