'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconSearch from '@/components/icon/icon-search-filled';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import Modal from '@/components/modal';
import DatatablesCustomers from './datatables-customers';
import CustomerForm from './form/page';
import { useTranslation } from "@/app/locales";
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from "@/constants/permissions";
import { useDevice } from '@/context/device-context';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';

const URL_BASE  = '/clientes';
const PAGE_SIZE = 20;

export default function CustomersPage() {
  useDynamicTitle('Clientes');

  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { hasPermission } = usePermissions();
  const t             = useTranslation();
  const { isMobile }  = useDevice();

  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  // ── Parámetros actuales de la URL — fuente de verdad, igual que en repuestos ──
  const currentPage   = Number(searchParams.get('page')) || 1;
  const currentTerm   = searchParams.get('term')  || '';
  const currentPais   = searchParams.get('pais')  || null;
  const currentEstado = searchParams.get('estado') || 'AC'; // 'AC' | 'IN' | 'ALL'

  const [termInput, setTermInput] = useState(currentTerm);

  const [clientes, setClientes] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [paises,   setPaises]   = useState([]);
  const [showModal, setShowModal] = useState(false);

  // El header global es sticky en top:0 — el bloque de título/acciones/filtros se
  // engancha justo debajo de su borde inferior, mismo patrón que el listado de repuestos.
  const [stickyTop, setStickyTop] = useState(0);
  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.getElementById('site-header');
      setStickyTop(header?.getBoundingClientRect().height ?? 0);
    };
    updateStickyTop();
    window.addEventListener('resize', updateStickyTop);
    return () => window.removeEventListener('resize', updateStickyTop);
  }, []);

  // Sincronizar el input si la URL cambia externamente (ej: botón atrás del navegador)
  useEffect(() => { setTermInput(currentTerm); }, [currentTerm]);

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = ({ page = 1, term = currentTerm, pais = currentPais, estado = currentEstado }) => {
    const params = new URLSearchParams();
    if (page > 1)               params.set('page', page);
    if (term)                   params.set('term', term.trim());
    if (pais)                   params.set('pais', pais);
    if (estado && estado !== 'AC') params.set('estado', estado);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Búsqueda explícita — solo se dispara con Enter o clic en "Buscar", no en cada tecla
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    pushFilters({ page: 1, term: termInput });
  };

  // ── Carga de listado — SOLO se dispara cuando cambia la URL ───────────────
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        pageSize: PAGE_SIZE,
        term: currentTerm,
        codEstado: currentEstado === 'ALL' ? '' : currentEstado,
      };
      if (currentPais) params.codPais = currentPais;

      const res = await axiosClient.get(URL_BASE, { params });
      setClientes(res.data.data);
      setTotal(res.data.total);

      if (currentPage === 1 && res.data.paises) setPaises(res.data.paises);
    } catch {
      swalError('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentTerm, currentPais, currentEstado]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  // null = "Todos" los países (sin filtro)
  const handleSelectPais = (pais) => {
    pushFilters({ page: 1, pais: pais === currentPais ? null : pais });
  };

  const handleSelectEstado = (estado) => {
    pushFilters({ page: 1, estado });
  };

  const handlePageChange = (p) => {
    pushFilters({ page: p });
  };

  const handleSaved = () => {
    setShowModal(false);
    fetchClientes();
  };

  const ESTADO_OPTIONS = [
    { value: 'AC',  label: t.active   ?? 'Activos' },
    { value: 'IN',  label: t.inactive ?? 'Inactivos' },
    { value: 'ALL', label: t.all      ?? 'Todos' },
  ];

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          {t.customers}
        </li>
      </ul>

      {/* Título + acciones + filtros — sticky justo debajo del header global */}
      <div className="sticky z-30 bg-white dark:bg-[#060818] pb-3" style={{ top: stickyTop }}>

        {/* Título + acciones de página */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t.customers} <span className="font-normal text-gray-400">({total})</span>
            </h1>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setView('list')}
                title={t.list ?? 'Lista'}
              >
                <IconListCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setView('grid')}
                title={t.grid ?? 'Cuadrícula'}
              >
                <IconLayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {hasPermission(PERMISSIONS.CREAR_CLIENTE) && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
              >
                <IconPlus className="h-4 w-4" />
                Nuevo Cliente
              </button>
            )}
          </div>
        </div>

        {/* Barra de filtros — País a la izquierda, Buscar + Estado agrupados a la derecha */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm">

          {/* País */}
          {paises.length > 1 ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1">País</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPais(null)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium
                              border transition-all duration-150
                              ${currentPais === null
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:text-primary'}`}
                >
                  <span className="text-base leading-none">🌐</span>
                  Todos
                </button>

                {paises.map((p) => {
                  const isSelected = currentPais === p.codPais;
                  return (
                    <button
                      key={p.codPais}
                      type="button"
                      onClick={() => handleSelectPais(p.codPais)}
                      title={p.nomPais}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium
                                  border transition-all duration-150
                                  ${isSelected
                                    ? 'border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10'
                                    : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:text-primary'}`}
                    >
                      <img
                        src={`/assets/flags/${p.codPais.trim().toLowerCase()}.svg`}
                        alt={p.codPais}
                        className={`h-4 w-6 rounded-sm object-cover border
                                    ${isSelected
                                      ? 'border-primary/30'
                                      : 'border-gray-200 dark:border-gray-600 grayscale opacity-60'}`}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="max-w-[80px] truncate">{p.nomPais}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : paises.length === 1 ? (
            <div className="flex items-center gap-2 h-8">
              <img
                src={`/assets/flags/${paises[0].codPais.trim().toLowerCase()}.svg`}
                alt={paises[0].codPais}
                className="h-4 w-6 rounded-sm object-cover border border-gray-200 dark:border-gray-600"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{paises[0].nomPais}</span>
            </div>
          ) : <div />}

          {/* Buscar (input → estados → botón buscar, en ese orden) */}
          <form onSubmit={handleSearchSubmit} className="flex items-end gap-1.5">
            <div className="relative w-64">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-gray-400">
                <IconSearch className="h-3 w-3" />
              </span>
              <input
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                placeholder="Nombre o documento..."
                className="h-8 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-7 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {termInput && (
                <button
                  type="button"
                  onClick={() => { setTermInput(''); pushFilters({ page: 1, term: '' }); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex h-8 items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              {ESTADO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectEstado(opt.value)}
                  className={`h-8 px-3 text-xs font-medium transition ${
                    currentEstado === opt.value
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="flex h-8 items-center gap-1.5 rounded-lg px-3 bg-primary/20 text-primary text-xs font-medium hover:bg-primary/40 transition"
            >
              <IconSearch className="h-3 w-3" />
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* ── TABLA ────────────────────────────────────────────────────── */}
      <DatatablesCustomers
        data={clientes}
        total={total}
        page={currentPage}
        pageSize={PAGE_SIZE}
        loading={loading}
        onPageChange={handlePageChange}
        setData={setClientes}
        t={t}
        hasPermission={hasPermission}
        view={view}
      />

      {/* ── MODAL NUEVO CLIENTE ──────────────────────────────────────── */}
      <Modal
        size="w-full max-w-4xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title="Nuevo Cliente"
      >
        <CustomerForm
          cliente={null}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}
