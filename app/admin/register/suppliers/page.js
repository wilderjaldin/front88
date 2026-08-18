'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess } from '@/app/lib/swal';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconSearch from '@/components/icon/icon-search-filled';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import Modal from '@/components/modal';
import DatatablesSuppliers from './datatables-suppliers';
import SupplierForm from './form/page';
import { useTranslation } from '@/app/locales';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useDevice } from '@/context/device-context';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';

const URL_BASE  = '/proveedores';
const PAGE_SIZE = 20;

export default function SuppliersPage() {
  useDynamicTitle('Proveedores');

  const router        = useRouter();
  const searchParams  = useSearchParams();
  const t             = useTranslation();
  const { hasPermission } = usePermissions();
  const { isMobile }  = useDevice();

  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  // ── Parámetros actuales de la URL — fuente de verdad, igual que en clientes ──
  const currentPage   = Number(searchParams.get('page')) || 1;
  const currentTerm   = searchParams.get('term')  || '';
  const currentPais   = searchParams.get('pais')  || null;
  const currentEstado = searchParams.get('estado') || 'AC'; // 'AC' | 'IN' | 'ALL'

  const [termInput, setTermInput] = useState(currentTerm);

  const [suppliers, setSuppliers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [paises,    setPaises]    = useState([]);
  const [controles, setControles] = useState({ paises: [], docTypes: [] });
  const [showNewModal, setShowNewModal] = useState(false);

  // El header global es sticky en top:0 — el bloque de título/acciones/filtros se
  // engancha justo debajo de su borde inferior, mismo patrón que clientes/repuestos.
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

  useEffect(() => {
    axiosClient.get(`${URL_BASE}/controles`)
      .then(res => setControles(res.data))
      .catch(() => {});
  }, []);

  // Sincronizar el input si la URL cambia externamente (ej: botón atrás del navegador)
  useEffect(() => { setTermInput(currentTerm); }, [currentTerm]);

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = ({ page = 1, term = currentTerm, pais = currentPais, estado = currentEstado }) => {
    const params = new URLSearchParams();
    if (page > 1)                  params.set('page', page);
    if (term)                      params.set('term', term.trim());
    if (pais)                      params.set('pais', pais);
    if (estado && estado !== 'AC') params.set('estado', estado);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Búsqueda explícita — solo se dispara con Enter o clic en "Buscar"
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    pushFilters({ page: 1, term: termInput });
  };

  // ── Carga de listado — SOLO se dispara cuando cambia la URL ───────────────
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, pageSize: PAGE_SIZE, term: currentTerm };
      if (currentPais) params.codPais = currentPais;
      if (currentEstado !== 'ALL') params.codEst = currentEstado;

      const res = await axiosClient.get(URL_BASE, { params });
      setSuppliers(res.data.data ?? []);
      setTotal(res.data.total ?? 0);

      if (currentPage === 1 && res.data.paises) setPaises(res.data.paises);
    } catch {
      swalError('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentTerm, currentPais, currentEstado]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

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

  const handleSaved = (data) => {
    // guardar (creación) retorna el mismo envelope que GET /proveedores — si no
    // hay filtros activos se usa directo, evitando un fetch redundante.
    const hasFilters = currentTerm.trim() !== '' || !!currentPais || currentEstado !== 'AC';
    if (hasFilters) {
      fetchSuppliers();
    } else {
      setSuppliers(data?.data ?? []);
      setTotal(data?.total ?? 0);
      if (data?.paises) setPaises(data.paises);
    }
    setShowNewModal(false);
    swalSuccess(t.supplier_success_save);
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
          {t.suppliers}
        </li>
      </ul>

      {/* Título + acciones + filtros — sticky justo debajo del header global */}
      <div className="sticky z-30 bg-white dark:bg-[#060818] pb-3" style={{ top: stickyTop }}>

        {/* Título + acciones de página */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t.suppliers} <span className="font-normal text-gray-400">({total})</span>
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

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
            >
              <IconPlus className="h-4 w-4" />
              {t.btn_add_supplier}
            </button>
          </div>
        </div>

        {/* Barra de filtros — País a la izquierda, Buscar → Estado → botón a la derecha */}
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
                placeholder="Buscar proveedor..."
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
      <DatatablesSuppliers
        data={suppliers}
        total={total}
        page={currentPage}
        pageSize={PAGE_SIZE}
        loading={loading}
        onPageChange={handlePageChange}
        setData={setSuppliers}
        setTotal={setTotal}
        t={t}
        hasPermission={hasPermission}
        view={view}
      />

      {/* Modal nuevo */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showNewModal}
        closeModal={() => setShowNewModal(false)}
        title="Nuevo Proveedor"
      >
        <SupplierForm
          proveedor={null}
          controles={controles}
          onCancel={() => setShowNewModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}
