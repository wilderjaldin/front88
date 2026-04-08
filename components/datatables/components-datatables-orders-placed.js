'use client';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { customFormat } from '@/app/lib/format';

const ComponentsDatatablesOrdersPlaced = ({ orders = [], verify, t }) => {
  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(orders, 'NroOrden'));
  const [recordsData, setRecordsData] = useState(initialRecords);

  const [search, setSearch] = useState('');

  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'NroOrden',
    direction: 'desc',
  });


  useEffect(() => {
    const sorted = sortBy(orders, 'NroOrden');
    setInitialRecords(sorted);
    setSortStatus({ columnAccessor: 'NroOrden', direction: 'desc' });
  }, [orders]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    setRecordsData([...initialRecords.slice(from, to)]);
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    setPage(1);
  }, [sortStatus]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData(orders.slice(from, to));
  }, [page, pageSize]);

  useEffect(() => {
    setInitialRecords(() => {
      return orders.filter((item) => {
        return (
          item.NomCliente.toLowerCase().includes(search.toLowerCase()) ||
          item.NroOrden.toString().includes(search.toLowerCase()) ||
          item.EstadoOrden.toLowerCase().includes(search.toLowerCase()) ||
          item.FecCotizacion.toLowerCase().includes(search.toLowerCase())
        );
      });
    });
  }, [search]);

  return (
    <div className="datatables">
      <div className="mb-5 block flex-col gap-5 md:flex-row md:items-center">
        <div className="ltr:ml-auto rtl:mr-auto">
          <input type="text" className="form-input w-full border border-dark border-1" placeholder={t.filter} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <DataTable
        //rowKeyAccessor="NroOrden"
        noRecordsText={t.empty_results}
        highlightOnHover
        className="table-hover whitespace-nowrap"
        records={recordsData}
        columns={[
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          {
            accessor: 'NroOrden', title: t.nro_quote, sortable: true,
            render: (order, index) => (
              <button
                key={`row-button-${order.NroOrden}-${index}`}
                onClick={() => verify(order)} title={ t.see_details} className="btn btn-sm btn-outline-info">
                {order.NroOrden}
              </button>
            ),
          },
          { accessor: 'NroItems', title: t.nro_items, sortable: true },
          {
            accessor: 'Total', title: "Total $us.", sortable: true,
            render: (order) => (
              customFormat(order.Total)
            )
          },
          { accessor: 'NomCiudad', title: t.city, sortable: true },
          { accessor: 'EstadoOrden', title: t.status , sortable: true },
          { accessor: 'FecCotizacion', title: t.quote_date, sortable: true },
          { accessor: 'FecOrden', title: t.date_order, sortable: true },
        ]}
        totalRecords={initialRecords.length}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={(p) => setPage(p)}
        recordsPerPageOptions={PAGE_SIZES}
        onRecordsPerPageChange={setPageSize}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        minHeight={200}
        paginationText={({ from = 0, to = 1, totalRecords = 110 }) => `${t.showing}  ${from} ${t.to} ${to} ${t.of} ${totalRecords} ${t.entries}`}

      />

    </div>
  );
};

export default ComponentsDatatablesOrdersPlaced;
