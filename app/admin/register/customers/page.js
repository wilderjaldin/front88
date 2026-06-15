'use client';
import { useCallback, useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useDebounce } from 'use-debounce';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconSearch from '@/components/icon/icon-search';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import Modal from '@/components/modal';
import DatatablesCustomers from './datatables-customers';
import CustomerForm from './form/page';
import { useTranslation } from "@/app/locales";
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from "@/constants/permissions";

const URL_BASE  = '/clientes';
const PAGE_SIZE = 20;

const parseTerm = (raw) => {
  const match = raw.match(/estado:\s*(AC|IN)/i);
  if (match) {
    return { term: raw.replace(match[0], '').trim(), codEst: match[1].toUpperCase() };
  }
  return { term: raw.trim(), codEst: null };
};

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function CustomersPage() {
  useDynamicTitle('Clientes');
  const { hasPermission } = usePermissions();
  const [clientes,     setClientes]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [term,         setTerm]         = useState('');
  const [debouncedTerm] = useDebounce(term, 350);

  const t            = useTranslation();

  // ── Tabs de países ────────────────────────────────────────────────────
  // paises se recibe en page=1 y se persiste — no se vuelve a pedir
  const [paises,       setPaises]       = useState([]);      // [{ codPais, nomPais }]
  const [selectedPais, setSelectedPais] = useState(null);   // null = todos

  // Modal nuevo / editar cliente
  const [showModal,    setShowModal]    = useState(false);
  const [editCliente,  setEditCliente]  = useState(null);


  // ── Carga de listado ───────────────────────────────────────────────────
  const fetchClientes = useCallback(async (p = 1, rawTerm = '', codPais = null) => {
    setLoading(true);
    try {
      const { term: searchTerm, codEst } = parseTerm(rawTerm);
      const params = { page: p, pageSize: PAGE_SIZE, term: searchTerm, codEstado: codEst ?? 'AC' };
      if (codPais) params.codPais = codPais;

      const res = await axiosClient.get(URL_BASE, { params });
      setClientes(res.data.data);
      setTotal(res.data.total);
      setPage(p);

      if (p === 1 && res.data.paises) {
        setPaises(res.data.paises);
      }
    } catch {
      Toast.fire({ icon: 'error', title: 'Error cargando clientes' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch cuando cambia el término buscado
  useEffect(() => {
    fetchClientes(1, debouncedTerm, selectedPais);
  }, [debouncedTerm, fetchClientes]);

  // ── Seleccionar tab de país ───────────────────────────────────────────
  // null = "Todos" (sin filtro de país)
  const handleSelectPais = (codPais) => {
    const next = codPais === selectedPais ? null : codPais; // click en activo = deseleccionar
    setSelectedPais(next);
    fetchClientes(1, debouncedTerm, next);
  };

  // ── Cambio de página ──────────────────────────────────────────────────
  const handlePageChange = (p) => {
    fetchClientes(p, debouncedTerm, selectedPais);
  };

  // ── Abrir modal de edición ────────────────────────────────────────────
  const handleEdit = async (cliente) => {
    try {
      const res = await axiosClient.get(`${URL_BASE}/${cliente.codCliente}`);
      setEditCliente(res.data);
      setShowModal(true);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error cargando datos del cliente' });
    }
  };

  // ── Tras guardar (nuevo o editado) ────────────────────────────────────
  const handleSaved = () => {
    fetchClientes(1, debouncedTerm, selectedPais);
    setShowModal(false);
    setEditCliente(null);
  };

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.customers}</span>
        </li>
      </ul>

      <div className="pt-5 space-y-4">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t.customers}{' '}
              <span className="text-sm font-normal text-gray-400">({total})</span>
            </h2>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="space-y-1">
              <div className="relative w-72">
                <input
                  type="text"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="Buscar por nombre o documento..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700
                             bg-white dark:bg-gray-900 px-4 py-2 pr-10 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40"
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
              {(() => {
                const { codEst } = parseTerm(debouncedTerm);
                return codEst ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${codEst === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Estado: {codEst === 'AC' ? 'Activos' : 'Inactivos'}
                      <button type="button" onClick={() => setTerm(term.replace(/estado:\s*(AC|IN)/i, '').trim())} className="ml-0.5 hover:opacity-70">
                        <IconX className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    Prefijos: <span className="font-mono">estado:AC</span> · <span className="font-mono">estado:IN</span>
                  </p>
                );
              })()}
            </div>
            { (hasPermission(PERMISSIONS.CREAR_CLIENTE)) && 
              <button
                type="button"
                onClick={() => { setEditCliente(null); setShowModal(true); }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                          text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
              >
                <IconPlus className="h-4 w-4" />
                Nuevo Cliente
              </button>
            }
          </div>
        </div>

        {/* ── TABS DE PAÍSES ────────────────────────────────────────────── */}
        {paises.length === 1 ? (
          <div className="flex items-center gap-2">
            <img
              src={`/assets/flags/${paises[0].codPais.trim().toLowerCase()}.svg`}
              alt={paises[0].codPais}
              className="h-4 w-6 rounded-sm object-cover border border-gray-200 dark:border-gray-600"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{paises[0].nomPais}</span>
          </div>
        ) : paises.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">

            {/* Tab "Todos" */}
            <button
              type="button"
              onClick={() => handleSelectPais(null)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
                          border transition-all duration-150
                          ${selectedPais === null
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:text-primary'}`}
            >
              <span className="text-base leading-none">🌐</span>
              Todos
            </button>

            {/* Tabs por país */}
            {paises.map(p => {
              const isSelected = selectedPais === p.codPais;
              return (
                <button
                  key={p.codPais}
                  type="button"
                  onClick={() => handleSelectPais(p.codPais)}
                  title={p.nomPais}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
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
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="max-w-[80px] truncate">{p.nomPais}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── TABLA ────────────────────────────────────────────────────── */}
        <DatatablesCustomers
          data={clientes}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          setData={setClientes}
          t={t}
          hasPermission={hasPermission}
        />

      </div>

      {/* ── MODAL NUEVO / EDITAR CLIENTE ─────────────────────────────── */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => { setShowModal(false); setEditCliente(null); }}
        title={editCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <CustomerForm
          cliente={editCliente}
          onCancel={() => { setShowModal(false); setEditCliente(null); }}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}