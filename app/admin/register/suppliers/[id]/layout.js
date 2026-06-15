// app/admin/register/suppliers/[id]/layout.js
'use client';
import { useEffect, useState } from 'react';
import { SupplierContext } from './SupplierContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import SupplierForm from '../form/page';
import AccessDenied from '@/components/AccessDenied';

const URL_BASE = '/proveedores';

const TABS = [
  { key: 'general',    label: 'Datos Generales'        },
  { key: 'contacts',   label: 'Contactos'               },
  { key: 'conditions', label: 'Condiciones Comerciales' },
  { key: 'formula',    label: 'Fórmula'                 },
  { key: 'annexes',    label: 'Anexos'                  },
  { key: 'freight',    label: 'Costo Flete'             },
];

export default function SupplierLayout({ children }) {
  const { id, tab } = useParams();
  const router      = useRouter();

  const [proveedor,      setProveedor]      = useState(null);
  const [loadingClient,  setLoadingClient]  = useState(true);
  const [forbidden,      setForbidden]      = useState(false);

  const [controles,        setControles]        = useState(null);
  const [editProveedor,    setEditProveedor]    = useState(null);
  const [loadingEditData,  setLoadingEditData]  = useState(false);
  const [showModal,        setShowModal]        = useState(false);

  // Estado de cada tab
  const [contacts,       setContacts]       = useState([]);
  const [loadContacts,   setLoadContacts]   = useState(true);

  const [conditions,     setConditions]     = useState({});
  const [loadConditions, setLoadConditions] = useState(true);

  const [formula,        setFormula]        = useState(null);
  const [variables,      setVariables]      = useState([]);
  const [loadFormula,    setLoadFormula]    = useState(true);

  const [annexes,        setAnnexes]        = useState({});
  const [loadAnnexes,    setLoadAnnexes]    = useState(true);

  const [freight,        setFreight]        = useState({});
  const [loadFreight,    setLoadFreight]    = useState(true);

  const [general,        setGeneral]        = useState(null);
  const [loadGeneral,    setLoadGeneral]    = useState(true);

  // Carga ficha (breadcrumb + control de acceso por país)
  useEffect(() => {
    axiosClient.get(`${URL_BASE}/ficha/${id}`)
      .then(res => setProveedor(res.data))
      .catch((err) => {
        if (err?.response?.status === 403) {
          setForbidden(true);
        } else {
          router.push('/admin/register/suppliers');
        }
      })
      .finally(() => setLoadingClient(false));
  }, [id]);

  // Abrir modal: carga datos completos + controles en paralelo
  const handleOpenEdit = async () => {
    setShowModal(true);
    setEditProveedor(null);
    setLoadingEditData(true);
    try {
      const promises = [axiosClient.get(`${URL_BASE}/${id}`)];
      if (!controles) promises.push(axiosClient.get(`${URL_BASE}/controles`));
      const results = await Promise.all(promises);
      setEditProveedor(results[0].data);
      if (!controles) setControles(results[1].data);
    } catch {}
    finally { setLoadingEditData(false); }
  };

  const handleSaved = async () => {
    setShowModal(false);
    setEditProveedor(null);
    setLoadGeneral(true);
    try {
      const res = await axiosClient.get(`${URL_BASE}/ficha/${id}`);
      setProveedor(res.data);
    } catch {}
  };

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (forbidden) return <AccessDenied />;
  if (!proveedor) return null;

  const currentTab = TABS.find(t => t.key === tab) ?? TABS[0];

  const contextValue = {
    proveedor, setProveedor,
    onEdit: handleOpenEdit,
    contacts,    setContacts,    loadContacts,    setLoadContacts,
    conditions,  setConditions,  loadConditions,  setLoadConditions,
    formula,     setFormula,     loadFormula,     setLoadFormula,
    variables,   setVariables,
    annexes,     setAnnexes,     loadAnnexes,     setLoadAnnexes,
    freight,     setFreight,     loadFreight,     setLoadFreight,
    general,     setGeneral,     loadGeneral,     setLoadGeneral,
  };

  return (
    <SupplierContext.Provider value={contextValue}>
      <div className="space-y-6">

        {/* BREADCRUMB */}
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>Registrar</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/register/suppliers" className="text-primary hover:underline">
              Proveedores
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2">
            <span
              title={proveedor.nomPais || undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5
                         text-xs font-semibold text-primary truncate max-w-[200px]"
            >
              {proveedor.codPais && (
                <img
                  src={`/assets/flags/${proveedor.codPais.toLowerCase()}.svg`}
                  alt={proveedor.nomPais || proveedor.codPais}
                  className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {proveedor.nomPrv}
            </span>
          </li>
          <li className="before:content-['/'] before:mx-2 text-gray-400">
            {currentTab.label}
          </li>
        </ul>

        {/* TAB NAV */}
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const isActive = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/admin/register/suppliers/${id}/${t.key}`}
                  className={`no-load px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                    ${isActive
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/admin/register/suppliers"
            className="no-load mb-1 flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600
                       px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cerrar configuraciones
          </Link>
        </div>

        {/* CONTENIDO DEL TAB */}
        <div>{children}</div>

      </div>

      {/* MODAL EDITAR */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title="Editar Proveedor"
      >
        {(loadingEditData || !editProveedor) ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <SupplierForm
            proveedor={editProveedor}
            controles={controles ?? { paises: [], docTypes: [] }}
            onCancel={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </SupplierContext.Provider>
  );
}