'use client';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import IconPencil from '../icon/icon-pencil';
import IconTrashLines from '../icon/icon-trash-lines';


const DatatablesSparesLot = ( {t, data = [] }) => {
    const [rowData, setRowData] = useState(data)
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const initialRecords = rowData.slice(0, pageSize);
    const [recordsData, setRecordsData] = useState(initialRecords);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(rowData.slice(from, to));
    }, [page, pageSize]);

    const edit = (row) => {
    }

    return (
        <div className="panel mt-6">
            <h5 className="mb-5 text-lg font-semibold dark:text-white-light">{ t.results }</h5>
            <div className="datatables">
                <DataTable
                    noRecordsText="No results match your search query"
                    highlightOnHover
                    className="table-hover whitespace-nowrap"
                    records={recordsData}
                    columns={[
                        {accessor: 'nro_part', title: t.nro_part },
                        {accessor: 'description', title: t.description },
                        {accessor: 'cost', title: 'Costo' },
                        {accessor: 'weight', title: 'Peso' },
                        {accessor: 'min_amount', title: 'Can. Min.' },
                        {accessor: 'unit', title: 'Uni. Medida' },
                        {accessor: 'special_order', title: 'Ped. Especial' },
                        {accessor: 'days', title: 'Can. Dias' },
                        {accessor: 'special_order_without_date', title: 'Ped. Especial Sin Fecha' },
                        {accessor: 'low_inventory', title: 'Poco Inventario' }
                    ]}
                    totalRecords={rowData.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    minHeight={200}
                    paginationText={({ from=0, to=1, totalRecords=110 }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                />
            </div>
        </div>
    );
};

export default DatatablesSparesLot;
