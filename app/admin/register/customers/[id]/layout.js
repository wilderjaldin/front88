// app/admin/register/customers/[id]/layout.js
// Este layout persiste mientras navegas entre tabs del mismo cliente.
// Next.js NO desmonta este componente al cambiar entre /[id]/general, /[id]/contacts, etc.
'use client';
import { useEffect, useState } from 'react';
import { CustomerContext } from './CustomerContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import CustomerForm from '../form/page';
import AccessDenied from '@/components/AccessDenied';

const URL_BASE = '/clientes';

const TABS = [
  { key: 'general',     label: 'Datos Generales'        },
  { key: 'contacts',    label: 'Contactos'               },
  { key: 'shipping',    label: 'Direcciones de Entrega'  },
  { key: 'conditions',  label: 'Condiciones Comerciales' },
  { key: 'attachments', label: 'Anexos'                  },
  { key: 'accounts',    label: 'Cuentas de Usuario'      },
  { key: 'meetings',    label: 'Reuniones'               },
];

export default function CustomerLayout({ children }) {
  const { id, tab } = useParams();
  const router      = useRouter();

  // ── Cliente (ficha: breadcrumb) ───────────────────────────────────────────
  const [cliente,       setCliente]       = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [forbidden,     setForbidden]     = useState(false);

  // ── Modal editar ─────────────────────────────────────────────────────────
  const [controles,        setControles]        = useState(null);
  const [editCliente,      setEditCliente]      = useState(null);
  const [loadingEditData,  setLoadingEditData]  = useState(false);
  const [showModal,        setShowModal]        = useState(false);

  // ── Estado de cada tab — persiste aquí mientras el layout vive ───────────
  const [contacts,        setContacts]        = useState([]);
  const [loadContacts,    setLoadContacts]    = useState(true);

  const [shipping,        setShipping]        = useState([]);
  const [loadShipping,    setLoadShipping]    = useState(true);

  const [conditions,      setConditions]      = useState({});
  const [loadConditions,  setLoadConditions]  = useState(true);

  const [attachments,     setAttachments]     = useState({});
  const [loadAttachments, setLoadAttachments] = useState(true);

  const [accounts,        setAccounts]        = useState([]);
  const [loadAccounts,    setLoadAccounts]    = useState(true);

  const [meetings,        setMeetings]        = useState([]);
  const [loadMeetings,    setLoadMeetings]    = useState(true);

  const [general,         setGeneral]         = useState(null);
  const [loadGeneral,     setLoadGeneral]     = useState(true);

  // ── Carga ficha (breadcrumb: nombre + bandera) ───────────────────────────
  useEffect(() => {
    axiosClient.get(`${URL_BASE}/ficha/${id}`)
      .then(res => setCliente(res.data.cliente ?? res.data))
      .catch((err) => {
        if (err?.response?.status === 403) {
          setForbidden(true);
        } else {
          router.push('/admin/register/customers');
        }
      })
      .finally(() => setLoadingClient(false));
  }, [id]);

  // ── Abrir modal: carga datos completos + controles en paralelo ────────────
  const handleOpenEdit = async () => {
    setShowModal(true);
    setEditCliente(null);
    setLoadingEditData(true);
    try {
      const promises = [axiosClient.get(`${URL_BASE}/${id}`)];
      if (!controles) promises.push(axiosClient.get(`${URL_BASE}/controles`));
      const results = await Promise.all(promises);
      setEditCliente(results[0].data);
      if (!controles) setControles(results[1].data);
    } catch {}
    finally { setLoadingEditData(false); }
  };

  const handleSaved = async () => {
    setShowModal(false);
    setEditCliente(null);
    setLoadGeneral(true);
    try {
      const res = await axiosClient.get(`${URL_BASE}/ficha/${id}`);
      setCliente(res.data.cliente ?? res.data);
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
  if (!cliente) return null;

  const currentTab = TABS.find(t => t.key === tab) ?? TABS[0];

  // ── Todo el estado disponible para los hijos via context ─────────────────
  const contextValue = {
    cliente, setCliente,
    onEdit: handleOpenEdit,
    contacts,    setContacts,    loadContacts,    setLoadContacts,
    shipping,    setShipping,    loadShipping,    setLoadShipping,
    conditions,  setConditions,  loadConditions,  setLoadConditions,
    attachments, setAttachments, loadAttachments, setLoadAttachments,
    accounts,    setAccounts,    loadAccounts,    setLoadAccounts,
    meetings,    setMeetings,    loadMeetings,    setLoadMeetings,
    general,     setGeneral,     loadGeneral,     setLoadGeneral,
  };

  return (
    <CustomerContext.Provider value={contextValue}>
      <div className="space-y-6">

        {/* ── BREADCRUMB ─────────────────────────────────────────────────── */}
        <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>Registrar</li>
          <li className="before:content-['/'] before:mx-2">
            <Link href="/admin/register/customers" className="text-primary hover:underline">
              Clientes
            </Link>
          </li>
          <li className="before:content-['/'] before:mx-2">
            <span
              title={cliente.nomPais || undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5
                         text-xs font-semibold text-primary truncate max-w-[200px]"
            >
              {cliente.codPais && (
                <img
                  src={`/assets/flags/${cliente.codPais.toLowerCase()}.svg`}
                  alt={cliente.nomPais || cliente.codPais}
                  className="h-3.5 w-5 rounded-sm object-cover shrink-0"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {cliente.nomCliente}
            </span>
          </li>
          <li className="before:content-['/'] before:mx-2 text-gray-400">
            {currentTab.label}
          </li>
        </ul>

        {/* ── TAB NAV ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const isActive = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/admin/register/customers/${id}/${t.key}`}
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
            href="/admin/register/customers"
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

        {/* ── CONTENIDO DEL TAB (children = [tab]/page.js) ─────────────── */}
        <div>{children}</div>

      </div>

      {/* ── MODAL EDITAR ─────────────────────────────────────────────────── */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title="Editar Cliente"
      >
        {(loadingEditData || !editCliente) ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <CustomerForm
            cliente={editCliente}
            controles={controles ?? { paises: [], docTypes: [] }}
            onCancel={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        )}
      </Modal>
    </CustomerContext.Provider>
  );
}