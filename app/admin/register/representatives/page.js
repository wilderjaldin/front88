'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { useStickyTop } from '@/app/hooks/useStickyTop';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { selectUser } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { swalConfirm, swalSuccess, swalError } from '@/app/lib/swal';
import { useDevice } from '@/context/device-context';
import { Pagination } from '@mantine/core';
import AccessDenied from '@/components/AccessDenied';
import Select from '@/components/ui/Select';
import SearchFilter from '@/components/SearchFilter';
import IconPlus from '@/components/icon/icon-plus';
import IconSettings from '@/components/icon/icon-settings';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';

const URL_LIST   = '/representantes/listar';
const URL_DELETE = '/representantes/eliminar';
const PAGE_SIZE  = 20;

// El menú se saca del flujo normal con un portal a <body> — si no, el z-index
// local de la tabla (thead sticky) lo tapa aunque el <Select> esté "por encima" en el DOM.
const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const EstadoBadge = ({ codEstado, t }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${codEstado === 'AC'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
    }`}>
    {codEstado === 'AC' ? t.active : t.inactive}
  </span>
);

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon({ className = 'h-3 w-3' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} shrink-0`}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────
const RepCard = ({ row, t, onEdit, onDelete }) => (
  <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
    <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {row.razSoc?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{row.razSoc}</h3>
          {(row.docFactura && row.nitEmp) && (
          <div className="flex items-center gap-1 text-xs mt-0.5">
            {row.docFactura && <span className="text-gray-500">{row.docFactura}:</span>}
            {row.nitEmp && <span className="text-gray-700 dark:text-gray-200 font-medium">{row.nitEmp}</span>}
          </div>
          )}
        </div>
      </div>
      <EstadoBadge codEstado={row.codEstado} t={t} />
    </div>
    <div className="px-4 py-3 space-y-1.5 text-xs">
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0">📍</span>
        <div className="min-w-0">
          <div className="text-gray-600 dark:text-gray-300">
            {[row.pais ?? row.codPais, row.ciudad ?? row.codCiudad].filter(Boolean).join(' · ')}
          </div>
          {row.dirEmp && <div className="text-gray-400 truncate" title={row.dirEmp}>{row.dirEmp}</div>}
        </div>
      </div>
      {(row.nomContacto || row.corEle || row.telEmp || row.numCelWp) && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0">👤</span>
          <div className="min-w-0">
            {row.nomContacto && <div className="font-medium text-gray-700 dark:text-gray-200">{row.nomContacto}</div>}
            {row.corEle      && <div className="text-gray-500 truncate">{row.corEle}</div>}
            {row.telEmp      && <div className="text-gray-500">{row.telEmp}</div>}
            {row.numCelWp    && (
              <div className="flex items-center gap-1 text-green-600">
                <WaIcon /> {row.numCelWp}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-gray-100 dark:border-gray-700/50">
        {row.nomMoneda && (
          <div><span className="text-gray-400">Moneda </span><span className="font-medium text-gray-700 dark:text-gray-200">{row.nomMoneda}</span></div>
        )}
        <div><span className="text-gray-400">IVA </span><span className={`font-medium ${row.blnIvaEnPrecio ? 'text-green-600' : 'text-gray-500'}`}>{row.blnIvaEnPrecio ? 'Sí' : 'No'}</span></div>
        {row.porFee > 0 && (
          <div><span className="text-gray-400">Fee </span><span className="font-medium text-amber-600">{row.porFee}%</span></div>
        )}
        {row.nomDestinoEntrega && (
          <div className="col-span-2"><span className="text-gray-400">Destino </span><span className="font-medium text-gray-700 dark:text-gray-200">{row.nomDestinoEntrega}</span></div>
        )}
        <div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
            ${row.blnEsRepresentante ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
            {row.blnEsRepresentante ? 'Es Representante' : 'No es Representante'}
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
      <button onClick={() => onEdit(row)} title="Configurar"
        className="p-1.5 rounded-lg text-gray-400 hover:bg-primary/10 hover:text-primary transition">
        <IconSettings className="w-4 h-4" />
      </button>
      <button onClick={() => onDelete(row)}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
        <IconTrashLines className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const ESTADO_OPTIONS_BASE = [
  { value: 'ALL', label: 'Todos' },
  { value: 'AC',  label: 'Activos' },
  { value: 'IN',  label: 'Inactivos' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RepresentativesPage() {
  const { hasPermission } = usePermissions();
  const user              = useSelector(selectUser);
  const t                 = useTranslation();
  const { isMobile }      = useDevice();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  useDynamicTitle(`${t.register} | Representantes`);

  const isAdmin = hasPermission(PERMISSIONS.MENU_REPRESENTANTES);
  const isRep   = user?.rol === 'Representante';

  // Redirect representante a su propio perfil — salvo que además tenga el
  // permiso de administrador (MENU_REPRESENTANTES), en cuyo caso debe ver el
  // listado completo en vez de su ficha individual.
  useEffect(() => {
    if (!isRep || isAdmin || !user?.countryCode) return;
    axiosClient.get(`/representantes/detalle-por-pais/${user.countryCode}`)
      .then(res => {
        const codEmp = res.data?.codEmp;
        router.replace(
          codEmp
            ? '/admin/register/representative/general'
            : '/admin/register/company/me'
        );
      })
      .catch(() => router.replace('/admin/register/company/me'));
  }, [isRep, user?.countryCode]);

  // ── Parámetros actuales de la URL — fuente de verdad, igual que en clientes ──
  const currentPage   = Number(searchParams.get('page')) || 1;
  const currentTerm   = searchParams.get('term')   || '';
  const currentEstado = searchParams.get('estado') || 'ALL';

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('list');

  useEffect(() => { setView(isMobile ? 'grid' : 'list'); }, [isMobile]);

  // El header global es sticky en top:0 (salvo en modo "Estática") — el bloque
  // de título/acciones/filtros se engancha justo debajo de su borde inferior,
  // mismo patrón que clientes/proveedores.
  const stickyTop = useStickyTop();

  // ── Construir y navegar a la nueva URL ────────────────────────────────────
  const pushFilters = ({ page = 1, term = currentTerm, estado = currentEstado }) => {
    const params = new URLSearchParams();
    if (page > 1)                params.set('page', page);
    if (term)                    params.set('term', term.trim());
    if (estado && estado !== 'ALL') params.set('estado', estado);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, pageSize: PAGE_SIZE, term: currentTerm };
      if (currentEstado !== 'ALL') params.codEstado = currentEstado;
      const rs = await axiosClient.get(URL_LIST, { params });
      setRows(rs.data?.data ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [currentPage, currentTerm, currentEstado]);

  const handleSearch      = (term) => pushFilters({ page: 1, term });
  const handleClearSearch = () => pushFilters({ page: 1, term: '' });
  const handleSelectEstado = (opt) => pushFilters({ page: 1, estado: opt?.value ?? 'ALL' });
  const handleClear = () => pushFilters({ page: 1, term: '', estado: 'ALL' });

  const handlePageChange = (p) => pushFilters({ page: p });

  const openCreate = () => router.push('/admin/register/representatives/form');
  const openEdit   = (row) => router.push(`/admin/register/representatives/${row.codEmp}/general`);

  const handleDelete = (row) => {
    swalConfirm('¿Eliminar representante?', row.razSoc, {
      confirmText: 'Sí, eliminar', cancelText: t.btn_cancel ?? 'Cancelar', confirmColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.delete(`${URL_DELETE}/${row.codEmp}`);
        setRows(rs.data?.data ?? []);
        setTotal(rs.data?.total ?? 0);
        swalSuccess('Representante eliminado');
      } catch (err) {
        swalError(t.error ?? 'Error', err?.response?.data?.message ?? err?.response?.data?.mensaje ?? 'Error al eliminar', t.close);
      }
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Mismo criterio que el useEffect de arriba: isRep muestra este spinner
  // mientras se resuelve el redirect a su ficha propia, pero solo cuando NO
  // es también admin — si no, se quedaba colgado acá para siempre (el
  // useEffect ya no dispara el redirect en ese caso).
  if (isRep && !isAdmin) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!isAdmin) return <AccessDenied />;

  return (
    <div>
      {/* Breadcrumb */}
      <ul className="flex space-x-2 rtl:space-x-reverse mb-4">
        <li className="text-sm text-gray-500">{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-sm text-gray-800 dark:text-gray-100">
          Representantes
        </li>
      </ul>

      {/* Título + acciones + filtros — sticky justo debajo del header global */}
      <div className="z-30 dark:bg-[#060818] pb-3" style={{ top: stickyTop }}>

        {/* Título + acciones de página */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Representantes <span className="font-normal text-gray-400">({total})</span>
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
              onClick={openCreate}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition"
            >
              <IconPlus className="h-4 w-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Barra de filtros — mismo patrón que clientes/proveedores: Estado +
            búsqueda juntos, pegados a la derecha de la barra como bloque. */}
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-end gap-3 ml-auto">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{t.status}</span>
              <Select isClearable={false} options={ESTADO_OPTIONS_BASE}
                value={ESTADO_OPTIONS_BASE.find(o => o.value === currentEstado) ?? null}
                onChange={opt => handleSelectEstado(opt)}
                menuPortalTarget={portalTarget}
                styles={{ control: (b) => ({ ...b, minWidth: '140px', width: '140px' }), menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              />
            </div>

            <SearchFilter t={t} value={currentTerm} onSearch={handleSearch} onClear={handleClearSearch}
              placeholder="Buscar representante..." className="w-64" />
            <button type="button" onClick={handleClear}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t.btn_clear ?? 'Limpiar'}
            </button>
          </div>
        </div>
      </div>

      {/* ── LIST ── */}
      {view === 'list' && (
        <div className="panel mt-3 overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Sin representantes registrados
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white dark:bg-gray-900">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className={`${thClass} w-[70px]`}></th>
                      <th className={thClass}>Representante</th>
                      <th className={thClass}>Ubicación</th>
                      <th className={thClass}>Contacto</th>
                      <th className={thClass}>Comercial</th>
                      <th className={`${thClass} text-center`}>Es Rep.</th>
                      <th className={thClass}>Destino</th>
                      <th className={thClass}>{t.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.map((row) => (
                      <tr key={row.codEmp} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">

                        {/* Acciones */}
                        <td className={`${tdClass} px-2`}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => openEdit(row)}
                              title="Configurar"
                            >
                              <IconSettings className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => handleDelete(row)}
                              title="Eliminar"
                            >
                              <IconTrashLines className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>

                        {/* Representante */}
                        <td className={tdClass}>
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                              {row.razSoc?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[160px]" title={row.razSoc}>{row.razSoc}</p>
                              {(row.docFactura && row.nitEmp) && (
                                <div className="flex items-center gap-1 text-[11px] mt-0.5">
                                  <span className="text-gray-400">{row.docFactura}:</span>
                                  <span className="text-gray-600 dark:text-gray-300 font-medium">{row.nitEmp}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className={tdClass}>
                          <div className="leading-tight">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                              {row.codPais && (
                                <img src={`/assets/flags/${row.codPais.toLowerCase()}.svg`}
                                  alt={row.codPais}
                                  className="h-3.5 w-5 rounded-sm object-cover border border-gray-200 dark:border-gray-600 shrink-0" />
                              )}
                              {[row.pais ?? row.codPais, row.ciudad ?? row.codCiudad].filter(Boolean).join(' · ')}
                            </div>
                            {row.dirEmp && (
                              <div className="text-gray-400 max-w-[200px] truncate" title={row.dirEmp}>{row.dirEmp}</div>
                            )}
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className={tdClass}>
                          {row.nomContacto || row.corEle || row.telEmp || row.numCelWp ? (
                            <div className="leading-tight space-y-0.5">
                              {row.nomContacto && <div className="font-medium text-gray-700 dark:text-gray-200">{row.nomContacto}</div>}
                              {row.corEle      && <div className="text-gray-500 truncate max-w-[180px]">{row.corEle}</div>}
                              {row.telEmp      && <div className="text-gray-500">{row.telEmp}</div>}
                              {row.numCelWp    && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <WaIcon /> {row.numCelWp}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Comercial */}
                        <td className={tdClass}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-14 shrink-0">Moneda</span>
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{row.nomMoneda || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-14 shrink-0">IVA precio</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                ${row.blnIvaEnPrecio
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                {row.blnIvaEnPrecio ? 'Sí' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-14 shrink-0">% Fee</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                ${(row.porFee ?? 0) > 0
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                {row.porFee ?? 0}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Es Representante */}
                        <td className={`${tdClass} text-center`}>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold
                            ${row.blnEsRepresentante
                              ? 'bg-primary/10 text-primary'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                            {row.blnEsRepresentante ? 'Sí' : 'No'}
                          </span>
                        </td>

                        {/* Destino entrega */}
                        <td className={tdClass}>
                          {row.nomDestinoEntrega || <span className="text-gray-300">—</span>}
                        </td>

                        {/* Estado */}
                        <td className={tdClass}>
                          <EstadoBadge codEstado={row.codEstado} t={t} />
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center py-4 border-t border-gray-100 dark:border-gray-700">
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    size="sm"
                    radius="xl"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── GRID ── */}
      {view === 'grid' && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Sin representantes registrados
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {rows.map(row => (
                  <RepCard key={row.codEmp} row={row} t={t} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    size="sm"
                    radius="xl"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
