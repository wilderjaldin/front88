"use client";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "@/store/authSlice";
import { DataTable } from "mantine-datatable";
import { Pagination } from "@mantine/core";
import axios from "axios";
import Swal from "sweetalert2";
import Link from "next/link";
import IconPencil from "@/components/icon/icon-pencil";
import IconTrashLines from "@/components/icon/icon-trash-lines";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconListCheck from "@/components/icon/icon-list-check";
import IconSearch from "@/components/icon/icon-search";
import IconPlus from "@/components/icon/icon-plus";
import IconX from "@/components/icon/icon-x";
import { useDevice } from "@/context/device-context";

const URL_LIST   = process.env.NEXT_PUBLIC_API_URL + 'transportistas';
const URL_DELETE = process.env.NEXT_PUBLIC_API_URL + 'transportistas/eliminar';

const PAGE_SIZE = 20;

const parseTerm = (raw) => {
  const match = raw.match(/activo:\s*(AC|IN)/i);
  if (match) return { term: raw.replace(match[0], '').trim(), activo: match[1].toUpperCase() };
  return { term: raw.trim(), activo: null };
};

const CarrierCard = ({ c, onDelete }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">{c.NomTransportista}</h3>
        {c.NomContacto && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.NomContacto}</p>}
      </div>
      {c.Pais && (
        <span className="ml-2 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {c.Pais}
        </span>
      )}
    </div>
    <div className="px-4 py-3 space-y-1.5 text-xs">
      {(c.TelefonoCelular || c.TelefonoOficina || c.Correo) && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">📞</span>
          <div className="text-gray-600 dark:text-gray-300">
            {c.TelefonoCelular && <div>{c.TelefonoCelular}</div>}
            {c.TelefonoOficina && <div className="text-gray-400">{c.TelefonoOficina}</div>}
            {c.Correo && <div className="text-gray-400 truncate">{c.Correo}</div>}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {c.Moneda && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800">{c.Moneda}</span>}
        {c.Comision > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Fee {c.Comision}%</span>}
        {c.IVAenPrecio && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600">IVA</span>}
        {c.EsRepresentacion && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">Representación</span>}
      </div>
    </div>
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
      <Link
        href={`/admin/register/carrier/form?id=${c.CodTransportista}`}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <IconPencil className="w-4 h-4 text-blue-500" />
      </Link>
      <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <IconTrashLines className="w-4 h-4 text-red-400" />
      </button>
    </div>
  </div>
);

export default function CarrierList() {
  const token = useSelector(selectToken);
  const { isMobile } = useDevice();

  const [carriers,      setCarriers]      = useState([]);
  const [search,        setSearch]        = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [view,          setView]          = useState(isMobile ? 'grid' : 'list');
  const [page,          setPage]          = useState(1);

  useEffect(() => { loadCarriers(); }, []);

  const loadCarriers = async () => {
    try {
      const rs = await axios.post(URL_LIST, { ValToken: token });
      if (rs.data.estado === 'Ok') setCarriers(rs.data.dato);
    } catch (e) {}
  };

  const { activo } = parseTerm(search);

  const filtered = useMemo(() => {
    let data = [...carriers];
    const { term: searchTerm, activo: act } = parseTerm(search);
    if (act !== null) {
      const isActive = act === 'AC';
      data = data.filter(c => Boolean(c.Activo) === isActive);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(c =>
        c.NomTransportista?.toLowerCase().includes(q) ||
        c.NomContacto?.toLowerCase().includes(q) ||
        c.Pais?.toLowerCase().includes(q)
      );
    }
    if (filterCountry) data = data.filter(c => c.Pais === filterCountry);
    return data;
  }, [search, filterCountry, carriers]);

  const countries  = useMemo(() => [...new Set(carriers.map(c => c.Pais).filter(Boolean))].sort(), [carriers]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch  = (val) => { setSearch(val);        setPage(1); };
  const handleCountry = (val) => { setFilterCountry(val); setPage(1); };

  const handleDelete = (carrier) => {
    Swal.fire({
      title: '¿Eliminar transportista?',
      text: carrier.NomTransportista,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const rs = await axios.post(URL_DELETE, { CodTransportista: carrier.CodTransportista, ValToken: token });
        if (rs.data.estado === 'Ok') {
          await loadCarriers();
          Swal.fire({ title: 'Eliminado', icon: 'success', confirmButtonColor: '#15803d', confirmButtonText: 'Cerrar' });
        }
      } catch (e) {}
    });
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Transportistas{' '}
            <span className="text-base font-normal text-gray-400">({filtered.length})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* Búsqueda */}
          <div className="flex flex-col gap-1.5 min-w-[280px]">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar transportista, contacto, país…"
                className={`w-full rounded-lg border px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 ${activo ? 'border-primary/50' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {search ? (
                <button type="button" onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition">
                  <IconX className="h-4 w-4" />
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400">
                  <IconSearch className="h-4 w-4" />
                </span>
              )}
            </div>
            {activo ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${activo === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Activo: {activo === 'AC' ? 'Activos' : 'Inactivos'}
                  <button type="button" onClick={() => handleSearch(search.replace(/activo:\s*(AC|IN)/i, '').trim())} className="ml-0.5 hover:opacity-70">
                    <IconX className="h-3 w-3" />
                  </button>
                </span>
                <button type="button" onClick={() => handleSearch('')} className="text-[11px] text-primary hover:underline">
                  Limpiar todo
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                Prefijos: <span className="font-mono">activo:AC</span> · <span className="font-mono">activo:IN</span>
              </p>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterCountry}
              onChange={e => handleCountry(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos los países</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button type="button"
                className={`p-2 transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => setView('list')}>
                <IconListCheck className="h-4 w-4" />
              </button>
              <button type="button"
                className={`p-2 transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={() => setView('grid')}>
                <IconLayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/admin/register/carrier/form"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
            >
              <IconPlus className="h-4 w-4" />
              Nuevo
            </Link>
          </div>
        </div>
      </div>

      {/* Vista lista */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="datatables">
            <DataTable
              className="table-hover [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700 whitespace-nowrap"
              idAccessor="CodTransportista"
              records={paginated}
              columns={[
                {
                  title: '', accessor: 'acciones', width: 80,
                  render: (c) => (
                    <div className="flex gap-1">
                      <Link href={`/admin/register/carrier/form?id=${c.CodTransportista}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <IconPencil className="w-4 h-4 text-blue-500" />
                      </Link>
                      <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <IconTrashLines className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ),
                },
                {
                  accessor: 'NomTransportista', title: 'Transportista', sortable: false,
                  render: (c) => <span className="font-medium text-gray-800 dark:text-gray-200">{c.NomTransportista || '—'}</span>,
                },
                {
                  accessor: 'Pais', title: 'País', sortable: false,
                  render: (c) => <span className="text-gray-500">{c.Pais || '—'}</span>,
                },
                {
                  accessor: 'NomContacto', title: 'Contacto', sortable: false,
                  render: (c) => <span className="text-gray-500">{c.NomContacto || '—'}</span>,
                },
                {
                  accessor: 'TelefonoCelular', title: 'Celular', sortable: false,
                  render: (c) => <span className="text-gray-400">{c.TelefonoCelular || '—'}</span>,
                },
                {
                  accessor: 'Correo', title: 'Email', sortable: false,
                  render: (c) => <span className="text-gray-400">{c.Correo || '—'}</span>,
                },
                {
                  accessor: 'flags', title: 'Detalles', sortable: false,
                  render: (c) => (
                    <div className="flex flex-wrap gap-1">
                      {c.Moneda && <span className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-600 dark:bg-gray-800">{c.Moneda}</span>}
                      {c.Comision > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-600">Fee {c.Comision}%</span>}
                      {c.IVAenPrecio && <span className="px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-600">IVA</span>}
                      {c.EsRepresentacion && <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary">Rep.</span>}
                    </div>
                  ),
                },
              ]}
              highlightOnHover
              page={page}
              onPageChange={setPage}
              totalRecords={filtered.length}
              recordsPerPage={PAGE_SIZE}
              paginationText={({ from, to, totalRecords }) => `${from} - ${to} / ${totalRecords}`}
              noRecordsText="Sin registros"
            />
          </div>
        </div>
      )}

      {/* Vista grid */}
      {view === 'grid' && (
        <>
          {paginated.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
              Sin registros
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginated.map((c, i) => (
                <CarrierCard key={i} c={c} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
