'use client';
import React, { useEffect, useState } from 'react';
import IconBackSpace from "@/components/icon/icon-backspace";
import IconArrowDown from "@/components/icon/icon-arrow-down";
import sortBy from 'lodash/sortBy';
import { Checkbox } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import Link from 'next/link';

const QuotesIdentify = ({ t, data, assignOrder }) => {


  const [orders_assigned, setOrdersAssigned] = useState([])

  const [selected_pending, setSelectedPending] = useState([]);
  const [isSelectPending, setIsSelectPending] = useState(false);


  //

  const [page, setPage] = useState(1);
  const PAGE_SIZES = [10, 20, 30, 50, 100];
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [initialRecords, setInitialRecords] = useState(sortBy(data, 'id'));
  const [recordsData, setRecordsData] = useState(initialRecords);


  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortStatus, setSortStatus] = useState({
    columnAccessor: 'id',
    direction: 'asc',
  });


  useEffect(() => {
    setInitialRecords(data);
  }, [data]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    setRecordsData([...initialRecords.slice(from, to)]);
    setSelectedPending([]);
  }, [page, pageSize, initialRecords]);

  useEffect(() => {
    const data = sortBy(initialRecords, sortStatus.columnAccessor);
    setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
  }, [sortStatus]);

  //

  //
  const toggleAll = () => {
    if (selected_pending.length === recordsData.length) {
      setSelectedPending([]);
    } else {
      setSelectedPending(recordsData.map((r) => r));
    }
  };

  const toggleRow = (row) => {
    setSelectedPending((prev) =>
      prev.includes(row) ? prev.filter((x) => x !== row) : [...prev, row]
    );
  };
  useEffect(() => {
    if (selected_pending.length > 0) {
      setIsSelectPending(false)
    } else {
      setIsSelectPending(true);
    }
  }, [selected_pending]);

  useEffect(() => {
    setPage(1);
    setInitialRecords(() => {
      return data.filter((item) => {
        return (
          item.NomCliente.toLowerCase().includes(filter.toLowerCase()) ||
          item.NroOrden.toString().includes(filter.toLowerCase())
        );
      });
    });
  }, [filter]);

 
  return (
    <div className="table-responsive mt-5 shadow-lg border border-gray-400 border-1">
      <div>
        <h2 className="text-xl font-bold text-blue-600 px-4 py-2 mb-4">{ t.quotes_with_codes_to_identify }</h2>
      </div>

      <div className="ml-4 mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button disabled={isSelectPending} onClick={() => assignOrder(selected_pending)} type="button" className="btn enabled:btn-dark disabled:btn-outline-dark hover:disabled:bg-transparent hover:disabled:text-dark">
            { t.assign } <IconArrowDown  className='rotate-90 ml-2'></IconArrowDown>
          </button>

          <div>
            <div className="relative ltr:ml-auto rtl:mr-auto">
              <input type="text" className="form-input w-full border border-dark border-1 pe-10" placeholder={t.filter} value={filter} onChange={(e) => setFilter(e.target.value)} />
              <div className="absolute inset-y-0 end-0 flex items-center pe-3 cursor-pointer" onClick={() => setFilter('')}>
                <IconBackSpace className="fill-dark z-10"></IconBackSpace>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        className="table-hover table-compact whitespace-nowrap"
        records={recordsData}
        columns={[
          {
            accessor: 'select',
            title: (
              <Checkbox
                checked={selected_pending.length === recordsData.length && recordsData.length != 0}
                indeterminate={
                  selected_pending.length > 0 &&
                  selected_pending.length < recordsData.length
                }
                onChange={toggleAll}
              />
            ),
            render: (record) => (
              <Checkbox
                checked={selected_pending.includes(record)}
                onChange={() => toggleRow(record)}
              />
            ),
            textAlign: 'center',
            width: 50,
          },
          { accessor: 'NroOrden', title: t.nro_quote, sortable: true,
            render: (record) => (
              <Link className='btn btn-sm btn-outline-info inline-block' href={`/admin/queries/spare-parts-identified/quotes?customer=${record.CodCliente}&id=${record.NroOrden}`}>{ record.NroOrden }</Link>
            )
          },
          { accessor: 'NomCliente', title: t.customer, sortable: true },
          { accessor: 'AsignadoA', title: "Asignado a", sortable: true },
          { accessor: 'Marca', title: t.brand , sortable: true },
          { accessor: 'Dias', title: t.days, sortable: true },
          { accessor: 'FecCotizacion', title: t.quote_date, sortable: true}
        ]}
        highlightOnHover
        totalRecords={initialRecords.length}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={(p) => setPage(p)}
        recordsPerPageOptions={PAGE_SIZES}
        onRecordsPerPageChange={setPageSize}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        minHeight={200}
        paginationText={({ from, to, totalRecords }) => `${t.showing}  ${from} ${t.to} ${to} ${t.of} ${totalRecords} ${t.entries}`}
      />

    </div>
  );
};

export default QuotesIdentify;
