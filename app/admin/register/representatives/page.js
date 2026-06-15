'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { selectUser } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import { useDebounce } from 'use-debounce';
import { useDevice } from '@/context/device-context';
import { Pagination } from '@mantine/core';
import Swal from 'sweetalert2';
import AccessDenied from '@/components/AccessDenied';
import IconSearch from '@/components/icon/icon-search';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import IconSettings from '@/components/icon/icon-settings';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconListCheck from '@/components/icon/icon-list-check';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';

const URL_LIST   = '/representantes/listar';
const URL_DELETE = '/representantes/eliminar';
const PAGE_SIZE  = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const parseTerm = (raw) => {
  const match = raw.match(/estado:\s*(AC|IN)/i);
  if (match) {
    return { term: raw.replace(match[0], '').trim(), codEstado: match[1].toUpperCase() };
  }
  return { term: raw.trim(), codEstado: null };
};

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
      <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium
        ${row.codEstado === 'AC' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
        {row.codEstado === 'AC' ? t.active : t.inactive}
      </span>
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
        <div><span className="text-gray-400">IVA </span><span className={`font-medium ${row.blnIvaEnPrecio ? 'text-success' : 'text-gray-500'}`}>{row.blnIvaEnPrecio ? 'Sí' : 'No'}</span></div>
        {row.porFee > 0 && (
          <div><span className="text-gray-400">Fee </span><span className="font-medium text-warning">{row.porFee}%</span></div>
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RepresentativesPage() {
  const { hasPermission } = usePermissions();
  const user              = useSelector(selectUser);
  const t                 = useTranslation();
  const { isMobile }      = useDevice();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  useDynamicTitle(`${t.register} | Representantes`);

  const isAdmin = hasPermission(PERMISSIONS.LISTAR_REPRESENTANTES);
  const isRep   = user?.rol === 'Representante';

  // Redirect representante to their own profile
  useEffect(() => {
    if (!isRep || !user?.countryCode) return;
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

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(() => Number(searchParams.get('page')) || 1);
  const [term,    setTerm]    = useState('');
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('list');

  const [debouncedTerm] = useDebounce(term, 350);
  const firstRender      = useRef(true);

  useEffect(() => { setView(isMobile ? 'grid' : 'list'); }, [isMobile]);

  // Reset to page 1 when search changes (skip initial mount)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedTerm]);

  useEffect(() => {
    fetchList(page, debouncedTerm);
  }, [page, debouncedTerm]);

  const fetchList = async (p = 1, raw = '') => {
    setLoading(true);
    try {
      const { term: searchTerm, codEstado } = parseTerm(raw);
      const params = { page: p, pageSize: PAGE_SIZE, term: searchTerm };
      if (codEstado) params.codEstado = codEstado;
      const rs = await axiosClient.get(URL_LIST, { params });
      setRows(rs.data?.data ?? []);
      setTotal(rs.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  const handlePageChange = (p) => {
    setPage(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openCreate = () => router.push('/admin/register/representatives/form');
  const openEdit   = (row) => router.push(`/admin/register/representatives/${row.codEmp}/general`);

  const handleDelete = (row) => {
    Swal.fire({
      title: '¿Eliminar representante?',
      text: row.razSoc, icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const rs = await axiosClient.delete(`${URL_DELETE}/${row.codEmp}`);
        setRows(rs.data?.data ?? []);
        setTotal(rs.data?.total ?? 0);
        Toast.fire({ icon: 'success', title: 'Representante eliminado' });
      } catch (err) {
        Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? err?.response?.data?.mensaje ?? 'Error al eliminar' });
      }
    });
  };

  const { codEstado: activeCodEstado } = parseTerm(debouncedTerm);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isRep) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!isAdmin) return <AccessDenied />;

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <li>{t.register}</li>
        <li className="before:content-['/'] before:mx-2">Representantes</li>
      </ul>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
            Representantes{' '}
            <span className="text-base font-normal text-gray-400">({total})</span>
          </h1>
          <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* Search + hint */}
          <div className="flex flex-col gap-1.5 min-w-[280px]">
            <div className="relative">
              <input
                type="text"
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Buscar representante..."
                className={`w-full rounded-lg border px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900
                  focus:outline-none focus:ring-2 focus:ring-primary/40
                  ${activeCodEstado ? 'border-primary/50' : 'border-gray-300 dark:border-gray-700'}`}
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
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                  ${activeCodEstado === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Estado: {activeCodEstado === 'AC' ? 'Activos' : 'Inactivos'}
                  <button type="button"
                    onClick={() => setTerm(term.replace(/estado:\s*(AC|IN)/i, '').trim())}
                    className="ml-0.5 hover:opacity-70">
                    <IconX className="h-3 w-3" />
                  </button>
                </span>
                <button type="button" onClick={() => setTerm('')}
                  className="text-[11px] text-primary hover:underline">
                  Limpiar todo
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                Prefijos: <span className="font-mono">estado:AC</span> · <span className="font-mono">estado:IN</span>
              </p>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button type="button" onClick={() => setView('list')}
              className={`p-2 transition ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <IconListCheck className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView('grid')}
              className={`p-2 transition ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <IconLayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Add */}
          <button
            type="button"
            onClick={openCreate}
            className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
          >
            <IconPlus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            Agregar
          </button>
        </div>
      </div>

      {/* ── LIST ── */}
      {view === 'list' && (
        <div className="panel mt-5 overflow-hidden border-0 p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Sin representantes registrados
            </div>
          ) : (
            <div className="datatables">
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Representante</th>
                      <th className="px-4 py-3 text-left">Ubicación</th>
                      <th className="px-4 py-3 text-left">Contacto</th>
                      <th className="px-4 py-3 text-left">Comercial</th>
                      <th className="px-4 py-3 text-center">Es Rep.</th>
                      <th className="px-4 py-3 text-left">Destino</th>
                      <th className="px-4 py-3 text-left">{t.status}</th>
                      <th className="px-4 py-3 text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {rows.map((row) => (
                      <tr key={row.codEmp}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                        {/* Representante */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {row.razSoc?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate max-w-[160px]" title={row.razSoc}>{row.razSoc}</p>
                              {(row.docFactura && row.nitEmp) && (
                                <div className="flex items-center gap-1 text-xs mt-0.5">
                                  {row.docFactura && <span className="text-gray-600 dark:text-gray-400">{row.docFactura}:</span>}
                                  {row.nitEmp && <span className="text-gray-700 dark:text-gray-200 font-medium">{row.nitEmp}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-medium">
                              {row.codPais && (
                                <img src={`/assets/flags/${row.codPais.toLowerCase()}.svg`}
                                  alt={row.codPais}
                                  className="h-3.5 w-5 rounded-sm object-cover border border-gray-200 dark:border-gray-600 shrink-0" />
                              )}
                              {[row.pais ?? row.codPais, row.ciudad ?? row.codCiudad].filter(Boolean).join(' · ')}
                            </div>
                            {row.dirEmp && (
                              <div
                                className="text-gray-500 max-w-[200px] truncate cursor-default"
                                title={row.dirEmp}
                              >
                                {row.dirEmp}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-0.5">
                            {row.nomContacto && (
                              <div className="font-medium text-gray-700 dark:text-gray-200">{row.nomContacto}</div>
                            )}
                            {row.corEle && (
                              <div className="text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{row.corEle}</div>
                            )}
                            {row.telEmp && (
                              <div className="text-gray-600 dark:text-gray-400">{row.telEmp}</div>
                            )}
                            {row.numCelWp && (
                              <div className="flex items-center gap-1 text-green-600">
                                <WaIcon /> {row.numCelWp}
                              </div>
                            )}
                            {!row.nomContacto && !row.corEle && !row.telEmp && !row.numCelWp && (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </td>

                        {/* Comercial */}
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-16 shrink-0">Moneda</span>
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{row.nomMoneda || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-16 shrink-0">IVA precio</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                ${row.blnIvaEnPrecio
                                  ? 'bg-success/10 text-success'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                {row.blnIvaEnPrecio ? 'Sí' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 w-16 shrink-0">% Fee</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                ${(row.porFee ?? 0) > 0
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                {row.porFee ?? 0}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Es Representante */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                            ${row.blnEsRepresentante
                              ? 'bg-primary/10 text-primary'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                            {row.blnEsRepresentante ? 'Sí' : 'No'}
                          </span>
                        </td>

                        {/* Destino entrega */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {row.nomDestinoEntrega || '—'}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${row.codEstado === 'AC'
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'}`}>
                            {row.codEstado === 'AC' ? t.active : t.inactive}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => openEdit(row)} title="Configurar"
                              className="p-1.5 rounded-md text-gray-400 hover:bg-warning/10 hover:text-warning transition">
                              <IconSettings className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => handleDelete(row)} title="Eliminar"
                              className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
                              <IconTrashLines className="h-4 w-4" />
                            </button>
                          </div>
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
                    value={page}
                    onChange={handlePageChange}
                    size="sm"
                    radius="xl"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GRID ── */}
      {view === 'grid' && (
        <>
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
                    value={page}
                    onChange={handlePageChange}
                    size="sm"
                    radius="xl"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

    </div>
  );
}
