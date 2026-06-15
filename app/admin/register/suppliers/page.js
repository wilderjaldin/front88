'use client';
import { useEffect, useRef, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useDebounce } from 'use-debounce';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconSearch from '@/components/icon/icon-search';
import IconPlus from '@/components/icon/icon-plus';
import IconX from '@/components/icon/icon-x';
import Modal from '@/components/modal';
import DatatablesSuppliers from './datatables-suppliers';
import SupplierForm from './form/page';
import { useTranslation } from '@/app/locales';
import { usePermissions } from '@/app/hooks/usePermissions';

const URL_BASE  = '/proveedores';
const PAGE_SIZE = 20;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const parseTerm = (raw) => {
  const match = raw.match(/estado:\s*(AC|IN)/i);
  if (match) {
    return { term: raw.replace(match[0], '').trim(), codEst: match[1].toUpperCase() };
  }
  return { term: raw.trim(), codEst: null };
};

export default function SuppliersPage() {
  useDynamicTitle('Proveedores');

  const t                 = useTranslation();
  const { hasPermission } = usePermissions();

  const [suppliers,    setSuppliers]    = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [term,         setTerm]         = useState('');
  const [debouncedTerm] = useDebounce(term, 350);
  const [paises,       setPaises]       = useState([]);
  const [selectedPais, setSelectedPais] = useState(null);
  const [controles,    setControles]    = useState({ paises: [], docTypes: [] });

  // Modal nuevo
  const [showNewModal, setShowNewModal] = useState(false);

  // Modal editar — carga el proveedor desde la API
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [editProveedor,   setEditProveedor]   = useState(null);
  const [loadingEdit,     setLoadingEdit]     = useState(false);

  const selectedPaisRef = useRef(null);

  useEffect(() => {
    axiosClient.get(`${URL_BASE}/controles`)
      .then(res => setControles(res.data))
      .catch(() => {});
  }, []);

  const fetchSuppliers = async (p = 1, rawTerm = '', codPais = null) => {
    setLoading(true);
    try {
      const { term: searchTerm, codEst } = parseTerm(rawTerm);
      const params = { page: p, pageSize: PAGE_SIZE, term: searchTerm };
      if (codPais) params.codPais = codPais;
      if (codEst)  params.codEst  = codEst;
      const res = await axiosClient.get(URL_BASE, { params });
      setSuppliers(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      setPage(p);
      if (p === 1 && res.data.paises) setPaises(res.data.paises);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error cargando proveedores' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1, debouncedTerm, selectedPaisRef.current);
  }, [debouncedTerm]);

  const handleSelectPais = (codPais) => {
    const next = codPais === selectedPaisRef.current ? null : codPais;
    selectedPaisRef.current = next;
    setSelectedPais(next);
    fetchSuppliers(1, debouncedTerm, next);
  };

  const handlePageChange = (p) => {
    fetchSuppliers(p, debouncedTerm, selectedPaisRef.current);
  };

  // Abre modal de edición cargando datos frescos desde la API
  const handleEdit = async (s) => {
    setShowEditModal(true);
    setEditProveedor(null);
    setLoadingEdit(true);
    try {
      const res = await axiosClient.get(`${URL_BASE}/${s.codPrv}`);
      setEditProveedor(res.data);
    } catch {
      Toast.fire({ icon: 'error', title: 'Error cargando datos del proveedor' });
      setShowEditModal(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSaved = () => {
    fetchSuppliers(1, debouncedTerm, selectedPaisRef.current);
    setShowNewModal(false);
    setShowEditModal(false);
    Toast.fire({ icon: 'success', title: t.supplier_success_save });
  };

  const { codEst: activeCodEst } = parseTerm(term);

  return (
    <>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.suppliers}</span>
        </li>
      </ul>

      <div className="pt-5 space-y-4">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t.suppliers}{' '}
              <span className="text-sm font-normal text-gray-400">({total})</span>
            </h2>
            <div className="h-0.5 w-10 rounded bg-primary/60 mt-1" />
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-1.5 min-w-[280px]">
              <div className="relative">
                <input
                  type="text"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="Buscar proveedor..."
                  className={`w-full rounded-lg border px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 ${activeCodEst ? 'border-primary/50' : 'border-gray-300 dark:border-gray-700'}`}
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

              {activeCodEst ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${activeCodEst === 'AC' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Estado: {activeCodEst === 'AC' ? 'Activos' : 'Inactivos'}
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

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-primary/90 transition-all"
            >
              <IconPlus className="h-4 w-4" />
              {t.btn_add_supplier}
            </button>
          </div>
        </div>

        {paises.length === 1 && (
          <div className="flex items-center gap-2">
            <img
              src={`/assets/flags/${paises[0].codPais.toLowerCase()}.svg`}
              alt={paises[0].codPais}
              className="h-4 w-6 rounded-sm object-cover border border-gray-200 dark:border-gray-600"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{paises[0].nomPais}</span>
          </div>
        )}

        {paises.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectPais(null)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all duration-150
                ${selectedPais === null
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:text-primary'}`}
            >
              <span className="text-base leading-none">🌐</span>
              Todos
            </button>
            {paises.map(p => {
              const isSelected = selectedPais === p.codPais;
              return (
                <button
                  key={p.codPais}
                  type="button"
                  onClick={() => handleSelectPais(p.codPais)}
                  title={p.nomPais}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all duration-150
                    ${isSelected
                      ? 'border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10'
                      : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:text-primary'}`}
                >
                  <img
                    src={`/assets/flags/${p.codPais.toLowerCase()}.svg`}
                    alt={p.codPais}
                    className={`h-4 w-6 rounded-sm object-cover border ${isSelected ? 'border-primary/30' : 'border-gray-200 dark:border-gray-600 grayscale opacity-60'}`}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="max-w-[80px] truncate">{p.nomPais}</span>
                </button>
              );
            })}
          </div>
        )}

        <DatatablesSuppliers
          data={suppliers}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          setData={setSuppliers}
          setTotal={setTotal}
          t={t}
          hasPermission={hasPermission}
        />
      </div>

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

      {/* Modal editar */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showEditModal}
        closeModal={() => setShowEditModal(false)}
        title="Editar Proveedor"
      >
        {loadingEdit ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : editProveedor ? (
          <SupplierForm
            proveedor={editProveedor}
            controles={controles}
            onCancel={() => setShowEditModal(false)}
            onSaved={handleSaved}
          />
        ) : null}
      </Modal>
    </>
  );
}