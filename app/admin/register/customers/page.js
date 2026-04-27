'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const URL_BASE  = '/clientes';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function CustomersPage() {
  useDynamicTitle('Clientes');

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

  // Modal nuevo cliente
  const [showModal,    setShowModal]    = useState(false);

  // Controles (países, tipos doc) — se cargan una vez y se pasan al form
  const [controles,    setControles]    = useState({ paises: [], docTypes: [] });

  // ── Carga de controles ─────────────────────────────────────────────────
  useEffect(() => {
    axiosClient.get(`${URL_BASE}/controles`)
      .then(res => setControles(res.data))
      .catch(() => {});
  }, []);

  // ── Carga de listado ───────────────────────────────────────────────────
  const fetchClientes = useCallback(async (p = 1, t = '', codPais = null) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: PAGE_SIZE, term: t, codEstado: 'AC' };
      if (codPais) params.codPais = codPais;

      const res = await axiosClient.get(URL_BASE, { params });
      setClientes(res.data.data);
      setTotal(res.data.total);
      setPage(p);

      // Solo en page=1 la API retorna paises — se persisten para no perderlos
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

  // ── Tras guardar nuevo cliente ─────────────────────────────────────────
  const handleSaved = (res) => {
    fetchClientes(1, debouncedTerm, selectedPais);
    setShowModal(false);
    Toast.fire({ icon: 'success', title: 'Cliente registrado' });
  };

  return (
    <>
      <div className="p-6 space-y-6">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Clientes{' '}
              <span className="text-base font-normal text-gray-400">({total})</span>
            </h1>
            <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
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

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                         text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
            >
              <IconPlus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* ── TABS DE PAÍSES ────────────────────────────────────────────── */}
        {paises.length > 0 && (
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
                    src={`/assets/flags/${p.codPais.toLowerCase()}.svg`}
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
          setData={setClientes}
          setTotal={setTotal}
          t={t}
        />

      </div>

      {/* ── MODAL NUEVO CLIENTE ───────────────────────────────────────── */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title="Nuevo Cliente"
      >
        <CustomerForm
          cliente={null}
          controles={controles}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}