'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useDebounce } from 'use-debounce';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconSearch from '@/components/icon/icon-search';
import IconPlus from '@/components/icon/icon-plus';
import Modal from '@/components/modal';
import DatatablesCustomers from './datatables-customers';
import CustomerForm from './form/page';

const URL_BASE   = '/clientes';
const PAGE_SIZE  = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});


export default function CustomersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const t            = useTranslation();

  useDynamicTitle(t.customers ?? 'Clientes');

  const [clientes, setClientes] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [term, setTerm]         = useState('');
  const [debouncedTerm]         = useDebounce(term, 350);

  // Modal formulario
  const [showModal, setShowModal]     = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const fetchClientes = useCallback(async (p = 1, t = '') => {
    setLoading(true);
    try {
      const res = await axiosClient.get(URL_BASE, {
        params: { page: p, pageSize: PAGE_SIZE, term: t, codEstado: 'AC' },
      });
      setClientes(res.data.data);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error cargando clientes' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes(1, debouncedTerm);
  }, [debouncedTerm, fetchClientes]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openNuevo = () => {
    setClienteEdit(null);
    setShowModal(true);
  };

  const openEditar = (cliente) => {
    setClienteEdit(cliente);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setClienteEdit(null);
  };

  const handleSaved = (res) => {
    setClientes(res.data);
    setTotal(res.total);
    closeModal();
  };

  // ── Paginación ────────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    fetchClientes(newPage, debouncedTerm);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="p-6 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {t.customers ?? 'Clientes'}{' '}
              <span className="text-base font-normal text-gray-400">({total})</span>
            </h1>
            <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
          </div>

          <div className="flex flex-wrap items-start gap-3">

            {/* Buscador */}
            <div className="relative w-72">
              <input
                type="text"
                value={term}
                onChange={e => setTerm(e.target.value)}
                placeholder="Buscar por nombre o documento..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-900
                           px-4 py-2 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400">
                <IconSearch className="h-4 w-4" />
              </span>
            </div>

            {/* Botón nuevo */}
            <button
              type="button"
              onClick={openNuevo}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                         text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              <IconPlus className="h-4 w-4" />
              {t.btn_add_customer ?? 'Nuevo Cliente'}
            </button>

          </div>
        </div>

        {/* ── TABLA ── */}
        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-gray-500">Sin resultados.</p>
        ) : (
          <DatatablesCustomers
            data={clientes}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            onEdit={openEditar}
            setData={setClientes}
            setTotal={setTotal}
          />
        )}

      </div>

      {/* ── MODAL CREAR / EDITAR ── */}
      <Modal
        size="w-full max-w-3xl"
        showModal={showModal}
        closeModal={closeModal}
        title={clienteEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <CustomerForm
          cliente={clienteEdit}
          onCancel={closeModal}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
}