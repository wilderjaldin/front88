"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "mantine-datatable";
import { Pagination } from "@mantine/core";
import axiosClient from "@/app/lib/axiosClient";
import { useDebounce } from "use-debounce";
import Swal from "sweetalert2";
import Link from "next/link";
import IconPencil from "@/components/icon/icon-pencil";
import IconLayoutGrid from "@/components/icon/icon-layout-grid";
import IconListCheck from "@/components/icon/icon-list-check";
import IconSearch from "@/components/icon/icon-search";
import IconPlus from "@/components/icon/icon-plus";
import IconX from "@/components/icon/icon-x";
import { useDevice } from "@/context/device-context";
import Modal from "@/components/modal";
import CategorizationForm from "./form/CategorizationForm";

const URL_BASE  = '/categorizaciones';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const parseTerm = (raw) => {
  const match = raw.match(/estado:\s*(AC|IN)/i);
  if (match) return { term: raw.replace(match[0], '').trim(), codEstado: match[1].toUpperCase() };
  return { term: raw.trim(), codEstado: null };
};

const CategorizationCard = ({ item, onEdit }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
          {item.nomMarca || '—'}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.nomAplicacion || '—'}</p>
      </div>
      <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        item.codEstado === 'AC'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
      }`}>
        {item.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
      </span>
    </div>
    <div className="px-4 py-3 flex flex-wrap gap-1.5 min-h-[44px]">
      {item.nomCategoria && (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {item.nomCategoria}
        </span>
      )}
      {item.blnSeo && (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
          SEO
        </span>
      )}
    </div>
    <div className="flex items-center justify-end px-4 py-2 border-t border-gray-100 dark:border-gray-700">
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <IconPencil className="w-4 h-4 text-blue-500" />
      </button>
    </div>
  </div>
);

export default function CategorizationList() {
  const { isMobile }  = useDevice();
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();

  const initPage  = useRef(Math.max(1, Number(searchParams.get('page')) || 1));
  const initDone  = useRef(false);

  const [data,          setData]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(initPage.current);
  const [loading,       setLoading]       = useState(true);
  const [term,          setTerm]          = useState('');
  const [debouncedTerm] = useDebounce(term, 350);
  const [controles,     setControles]     = useState({ marcas: [], aplicaciones: [], categorias: [] });
  const [codCategoria,  setCodCategoria]  = useState('');
  const [view,          setView]          = useState(isMobile ? 'grid' : 'list');

  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);

  const syncUrl = (p) => {
    const qs = p > 1 ? `?page=${p}` : '';
    router.replace(`${pathname}${qs}`, { scroll: false });
  };

  useEffect(() => {
    axiosClient.get(`${URL_BASE}/controles`)
      .then(res => setControles(res.data))
      .catch(() => {});
  }, []);

  const fetchData = async (p, rawTerm, codCat) => {
    setLoading(true);
    try {
      const { term: searchTerm, codEstado } = parseTerm(rawTerm);
      const params = { page: p, pageSize: PAGE_SIZE };
      if (codCat)     params.codCategoria = codCat;
      if (codEstado)  params.codEstado    = codEstado;
      if (searchTerm) params.term         = searchTerm;
      const res = await axiosClient.get(`${URL_BASE}/listar`, { params });
      setData(res.data.data   ?? []);
      setTotal(res.data.total ?? 0);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initDone.current) {
      initDone.current = true;
      fetchData(initPage.current, debouncedTerm, codCategoria);
    } else {
      syncUrl(1);
      fetchData(1, debouncedTerm, codCategoria);
    }
  }, [debouncedTerm, codCategoria]);

  const handlePageChange = (p) => {
    syncUrl(p);
    fetchData(p, debouncedTerm, codCategoria);
  };

  const handleNew = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    fetchData(page, debouncedTerm, codCategoria);
    Toast.fire({ icon: 'success', title: editItem ? 'Registro actualizado' : 'Registro creado' });
  };

  const { codEstado: activeCodEstado } = parseTerm(term);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>Registrar</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>Categorización</span>
        </li>
      </ul>

      <div className="pt-5 space-y-4">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Categorización{' '}
            <span className="text-sm font-normal text-gray-400">({total})</span>
          </h2>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* Búsqueda */}
          <div className="flex flex-col gap-1.5 min-w-[280px]">
            <div className="relative">
              <input
                type="text"
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Buscar marca, aplicación…"
                className={`w-full rounded-lg border px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeCodEstado ? 'border-primary/50' : 'border-gray-300 dark:border-gray-700'}`}
              />
              {term ? (
                <button type="button" onClick={() => setTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition">
                  <IconX className="h-4 w-4" />
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400">
                  <IconSearch className="h-4 w-4" />
                </span>
              )}
            </div>
            {activeCodEstado ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${activeCodEstado === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Estado: {activeCodEstado === 'AC' ? 'Activos' : 'Inactivos'}
                  <button type="button" onClick={() => setTerm(term.replace(/estado:\s*(AC|IN)/i, '').trim())} className="ml-0.5 hover:opacity-70">
                    <IconX className="h-3 w-3" />
                  </button>
                </span>
                <button type="button" onClick={() => setTerm('')} className="text-[11px] text-primary hover:underline">
                  Limpiar todo
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                Prefijos: <span className="font-mono">estado:AC</span> · <span className="font-mono">estado:IN</span>
              </p>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={codCategoria}
              onChange={e => { setCodCategoria(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todas las categorías</option>
              {(controles.categorias ?? []).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
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

            <button
              type="button"
              onClick={handleNew}
              className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
            >
              <IconPlus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Vista lista */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          <div className="datatables">
            <DataTable
              className="table-hover [&_tbody_tr:hover]:bg-gray-100 [&_tbody_tr:hover]:dark:bg-gray-700 whitespace-nowrap"
              idAccessor="codRegistro"
              records={data}
              fetching={loading}
              columns={[
                {
                  title: '', accessor: 'acciones', width: 60,
                  render: (item) => (
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex"
                    >
                      <IconPencil className="w-4 h-4 text-blue-500" />
                    </button>
                  ),
                },
                {
                  accessor: 'nomMarca', title: 'Marca', sortable: false,
                  render: (item) => (
                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.nomMarca || '—'}</span>
                  ),
                },
                {
                  accessor: 'nomAplicacion', title: 'Aplicación', sortable: false,
                  render: (item) => <span className="text-gray-500">{item.nomAplicacion || '—'}</span>,
                },
                {
                  accessor: 'nomCategoria', title: 'Categoría', sortable: false,
                  render: (item) => <span className="text-gray-500">{item.nomCategoria || '—'}</span>,
                },
                {
                  accessor: 'blnSeo', title: 'SEO', sortable: false,
                  render: (item) => (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.blnSeo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}>
                      {item.blnSeo ? 'SI' : 'NO'}
                    </span>
                  ),
                },
                {
                  accessor: 'codEstado', title: 'Estado', sortable: false,
                  render: (item) => (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.codEstado === 'AC'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {item.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                    </span>
                  ),
                },
              ]}
              highlightOnHover
              page={page}
              onPageChange={handlePageChange}
              totalRecords={total}
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
          {!loading && data.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400">
              Sin registros
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data.map((item) => (
                <CategorizationCard key={item.codRegistro} item={item} onEdit={handleEdit} />
              ))}
            </div>
          )}
          {total > PAGE_SIZE && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(total / PAGE_SIZE)}
                value={page}
                onChange={handlePageChange}
                size="sm"
                radius="xl"
              />
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal
        size="w-full max-w-md"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={editItem ? 'Editar Categorización' : 'Nueva Categorización'}
      >
        <CategorizationForm
          item={editItem}
          controles={controles}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </div>
    </>
  );
}
