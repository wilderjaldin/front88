'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { swalError, swalSuccess } from '@/app/lib/swal';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { useStickyTop } from '@/app/hooks/useStickyTop';
import IconPlus from '@/components/icon/icon-plus';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';
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

// El menú se saca del flujo normal con un portal a <body> — si no, el z-index
// local de la tabla (thead sticky) lo tapa aunque el <Select> esté "por encima" en el DOM.
const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

export default function SuppliersPage() {
  useDynamicTitle('Proveedores');

  const router        = useRouter();
  const searchParams  = useSearchParams();
  const t             = useTranslation();
  const { hasPermission } = usePermissions();
  const { isMobile }  = useDevice();
  const user          = useSelector(selectUser);

  // Solo se intenta una vez por carga de página — si el usuario luego elige
  // "Todos" explícitamente, no debe volver a imponerse el país por defecto.
  const defaultCountryApplied = useRef(false);

  const [view, setView] = useState(isMobile ? 'grid' : 'list');

  // ── Parámetros actuales de la URL — fuente de verdad, igual que en clientes ──
  const currentPage   = Number(searchParams.get('page')) || 1;
  const currentTerm   = searchParams.get('term')  || '';
  const currentPais   = searchParams.get('pais')  || null;
  const currentEstado = searchParams.get('estado') || 'AC'; // 'AC' | 'IN' | 'ALL'

  const [suppliers, setSuppliers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [paises,    setPaises]    = useState([]);
  const [controles, setControles] = useState({ paises: [], docTypes: [] });
  const [showNewModal, setShowNewModal] = useState(false);

  // El header global es sticky en top:0 (salvo en modo "Estática") — el bloque
  // de título/acciones/filtros se engancha justo debajo de su borde inferior,
  // mismo patrón que clientes/repuestos.
  const stickyTop = useStickyTop();

  useEffect(() => {
    axiosClient.get(`${URL_BASE}/controles`)
      .then(res => setControles(res.data))
      .catch(() => {});
  }, []);

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = ({ page = 1, term = currentTerm, pais = currentPais, estado = currentEstado }) => {
    const params = new URLSearchParams();
    if (page > 1)                  params.set('page', page);
    if (term)                      params.set('term', term.trim());
    if (pais)                      params.set('pais', pais);
    if (estado && estado !== 'AC') params.set('estado', estado);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Búsqueda explícita — SearchFilter solo dispara con Enter o clic en la lupa
  const handleSearch = (term) => pushFilters({ page: 1, term });
  const handleClearSearch = () => pushFilters({ page: 1, term: '' });

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

      if (currentPage === 1 && res.data.paises) {
        setPaises(res.data.paises);

        // País por defecto = país del usuario logueado, si aparece en el listado.
        if (!defaultCountryApplied.current && !currentPais && user?.countryCode) {
          defaultCountryApplied.current = true;
          const match = res.data.paises.find(
            (p) => p.codPais?.trim().toUpperCase() === user.countryCode?.trim().toUpperCase()
          );
          if (match) {
            pushFilters({ page: 1, pais: match.codPais });
            return;
          }
        }
      }
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

  const handleClear = () => {
    pushFilters({ page: 1, term: '', pais: null, estado: 'AC' });
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
      <div className="z-30 dark:bg-[#060818] pb-3" style={{ top: stickyTop }}>

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

        {/* Barra de filtros — un solo grupo (País, Estado, Buscar, Limpiar
            juntos), pegado a la derecha de la barra como bloque. */}
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm">

          <div className="flex flex-wrap items-end gap-3 ml-auto">
            {/* País — con una sola opción no tiene sentido un <Select>, se fija sola */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.country}</span>
              {paises.length === 1 ? (
                <div
                  className="flex h-10 items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm text-gray-600 dark:text-gray-300"
                  style={{ minWidth: '220px', width: '220px' }}
                >
                  {paises[0].nomPais}
                </div>
              ) : (
                <Select isClearable options={paises.map(p => ({ value: p.codPais, label: p.nomPais }))}
                  value={currentPais ? { value: currentPais, label: paises.find(p => p.codPais === currentPais)?.nomPais } : null}
                  onChange={opt => handleSelectPais(opt?.value ?? null)}
                  placeholder={t.all}
                  menuPortalTarget={portalTarget}
                  styles={{ control: (b) => ({ ...b, minWidth: '220px', width: '220px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                />
              )}
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
              <Select isClearable={false} options={ESTADO_OPTIONS}
                value={ESTADO_OPTIONS.find(o => o.value === currentEstado) ?? null}
                onChange={opt => handleSelectEstado(opt.value)}
                menuPortalTarget={portalTarget}
                styles={{ control: (b) => ({ ...b, minWidth: '140px', width: '140px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              />
            </div>

            <SearchFilter t={t} value={currentTerm} onSearch={handleSearch} onClear={handleClearSearch}
              placeholder="Buscar proveedor..." className="w-64" />
            <button type="button" onClick={handleClear}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t.btn_clear ?? 'Limpiar'}
            </button>
          </div>
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
