'use client';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';


const PAGE_SIZES = [10, 20, 30, 50, 100];

const DatatablesSparesLot = ({ t, data = [] }) => {
  const [rowData]   = useState(data);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const paginated = rowData.length > 10;

  const records = paginated
    ? rowData.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    : rowData;

  useEffect(() => { setPage(1); }, [pageSize]);

  return (
    <div className="datatables">
      <DataTable
        noRecordsText="No results match your search query"
        highlightOnHover
        className="table-hover whitespace-nowrap"
        records={records}
        columns={[
          { accessor: 'nro_part',                   title: t.nro_part },
          { accessor: 'description',                title: t.description },
          { accessor: 'cost',                       title: 'Costo' },
          { accessor: 'weight',                     title: 'Peso' },
          { accessor: 'min_amount',                 title: 'Can. Min.' },
          { accessor: 'unit',                       title: 'Uni. Medida' },
          { accessor: 'special_order',              title: 'Ped. Especial' },
          { accessor: 'days',                       title: 'Can. Días' },
          { accessor: 'special_order_without_date', title: 'Ped. Especial Sin Fecha' },
          { accessor: 'low_inventory',              title: 'Poco Inventario' },
        ]}
        minHeight={200}
        {...(paginated ? {
          totalRecords: rowData.length,
          recordsPerPage: pageSize,
          page,
          onPageChange: (p) => setPage(p),
          recordsPerPageOptions: PAGE_SIZES,
          onRecordsPerPageChange: setPageSize,
          paginationText: ({ from = 0, to = 1, totalRecords = 0 }) =>
            `${t.showing} ${from} ${t.to} ${to} ${t.of} ${totalRecords} ${t.entries}`,
        } : {})}
      />
    </div>
  );
};

export default DatatablesSparesLot;
