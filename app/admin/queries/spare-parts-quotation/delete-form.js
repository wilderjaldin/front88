'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import ComponentContactForm from '@/components/forms/contact-form';

const URL_CONTROLS   = 'repuestosporcotizar/controles';
const URL_EMAIL_DATA = (codCliente, nroCotizacion) => `repuestosporcotizar/email-data/${codCliente}/${nroCotizacion}`;
const URL_DELETE     = 'repuestosporcotizar/eliminar-items';

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const toFormContact = (c) => ({
  codRegistro: c.codRegistro,
  nomContacto: c.nomContacto,
  nomCargo:    c.nomCargo ?? '',
  correos:     [c.email1, c.email2].filter(Boolean).join(';'),
  telefonos:   '',
});

const buildEntries = (items, overridesFn) => {
  const byQuote = {};
  items.forEach(o => {
    if (!byQuote[o.nroCotizacion]) byQuote[o.nroCotizacion] = [];
    byQuote[o.nroCotizacion].push({ CodRegistro: o.codRegistro, NroParte: o.nroParte });
  });
  return Object.entries(byQuote).map(([nro, qItems]) => ({
    NroCotizacion: Number(nro),
    ...overridesFn(nro),
    Items: qItems,
  }));
};

// ── Paso Cliente: tabla de contactos + email ──────────────────────────────────
const ClienteStep = ({ stepData, onNext, onCancel, sending, de }) => {
  const [contacts,         setContacts]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [asunto,           setAsunto]           = useState('');
  const [cuerpo,           setCuerpo]           = useState('');
  const [para,             setPara]             = useState('');
  const [paraError,        setParaError]        = useState('');
  // undefined = tabla, null = nuevo contacto, objeto = editar contacto
  const [editingContact,   setEditingContact]   = useState(undefined);

  const fetchContacts = () => {
    setLoading(true);
    axiosClient.get(URL_EMAIL_DATA(stepData.codCliente, stepData.items[0]?.nroCotizacion))
      .then(rs => {
        setContacts(rs.data.contactos ?? []);
        setAsunto(rs.data.template?.asunto ?? '');
        setCuerpo(rs.data.template?.cuerpo ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedContacts([]);
    setEditingContact(undefined);
    fetchContacts();
  }, [stepData.codCliente]);

  const toggleContact = (c) =>
    setSelectedContacts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  useEffect(() => {
    const computed = selectedContacts
      .flatMap(c => [c.email1, c.email2].filter(Boolean))
      .join('; ');
    setPara(computed);
  }, [selectedContacts]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleNext = (blnEnviar) => {
    if (blnEnviar) {
      const emails = para.split(';').map(e => e.trim()).filter(Boolean);
      if (emails.length === 0 || emails.some(e => !emailRegex.test(e))) {
        setParaError('Ingrese al menos un correo válido. Separe varios con ";"');
        return;
      }
    }
    setParaError('');
    onNext({ items: stepData.items, blnEnviar, para, asunto, cuerpo });
  };

  const uniqueQuotes = [...new Set(stepData.items.map(o => o.nroCotizacion))];

  return (
    <div>
      {/* Cabecera cliente */}
      <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stepData.nomCliente}</span>
          {uniqueQuotes.map(n => (
            <span key={n} className="text-xs font-bold rounded-full bg-primary text-white px-3 py-0.5">#{n}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Seleccione el destinatario para informar al cliente sobre la actualización del ítem.
        </p>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center gap-3 text-gray-400 text-sm">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block shrink-0" />
          Cargando contactos...
        </div>
      ) : editingContact !== undefined ? (
        /* ── Mini formulario contacto ─────────────────────────────────────── */
        <div className="mb-3">
          <ComponentContactForm
            contact={editingContact}
            isNew={editingContact === null}
            cliente={{ codCliente: stepData.codCliente }}
            onCancel={() => setEditingContact(undefined)}
            onSaved={() => {
              setSelectedContacts([]);
              axiosClient.get(URL_EMAIL_DATA(stepData.codCliente, stepData.items[0]?.nroCotizacion))
                .then(rs => setContacts(rs.data.contactos ?? []))
                .catch(() => {});
            }}
          />
        </div>
      ) : (
        <>
          {/* Tabla de contactos */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-3">
            <table className="w-full text-xs">
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th className="w-8 px-2 py-1.5" />
                  <th className="px-2 py-1.5 text-left font-semibold">Contacto</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Cargo</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Mail 1</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Mail 2</th>
                  <th className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingContact(null)}
                      style={{ backgroundColor: '#334155', color: '#fff' }}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold hover:opacity-80 transition"
                    >
                      + Añadir
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400">Sin contactos registrados</td>
                  </tr>
                ) : contacts.map((c, i) => (
                  <tr key={i}
                    onClick={() => toggleContact(c)}
                    className={`cursor-pointer transition-colors ${
                      selectedContacts.includes(c)
                        ? 'bg-primary/10 dark:bg-primary/15'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="px-2 py-1.5 text-center">
                      <input type="checkbox" className="form-checkbox"
                        checked={selectedContacts.includes(c)}
                        onChange={() => toggleContact(c)}
                        onClick={e => e.stopPropagation()} />
                    </td>
                    <td className="px-2 py-1.5 font-semibold text-gray-800 dark:text-gray-100">{c.nomContacto}</td>
                    <td className="px-2 py-1.5 text-gray-500 dark:text-gray-400">{c.nomCargo}</td>
                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{c.email1}</td>
                    <td className="px-2 py-1.5 text-gray-400 dark:text-gray-500">{c.email2}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setEditingContact(toFormContact(c)); }}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition"
                      >
                        <IconPencil /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Campos Para / De / Asunto */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 divide-y divide-gray-200 dark:divide-gray-700 mb-3">
            <div className="flex items-start gap-3 px-3 py-2">
              <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 pt-1.5">Para:</label>
              <div className="flex-1">
                <input type="text" value={para} onChange={e => { setPara(e.target.value); setParaError(''); }}
                  className={`w-full h-7 rounded border px-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none ${paraError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent'}`} />
                {paraError && <p className="text-[11px] text-red-500 mt-0.5">{paraError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">De:</label>
              <input type="text" readOnly value={de}
                className="flex-1 h-7 rounded border-0 bg-amber-50 dark:bg-amber-900/20 px-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2">
              <label className="w-12 shrink-0 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Asunto:</label>
              <input type="text" value={asunto} onChange={e => setAsunto(e.target.value)}
                className="flex-1 h-7 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          </div>

          {/* Cuerpo */}
          <div className="mb-4">
            <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={8}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={sending} onClick={onCancel}
              className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" disabled={sending} onClick={() => handleNext(false)}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
              <IconTrash />
              No Enviar
            </button>
            <button type="button" disabled={sending} onClick={() => handleNext(true)}
              className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
              <IconMail />
              Enviar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Cotización Usuario: notificación interna ──────────────────────────────────
const UsuarioStep = ({ stepData, onSubmit, onCancel, sending, options, selectedUser, setSelectedUser, userError, setUserError }) => {
  const [message, setMessage] = useState('Listo');
  const uniqueQuotes = [...new Set(stepData.items.map(o => o.nroCotizacion))];

  const handleSubmit = (blnEnviar) => {
    if (!selectedUser) { setUserError(true); return; }
    setUserError(false);
    onSubmit({ items: stepData.items, blnEnviar, usuDestino: Number(selectedUser.value), message });
  };

  return (
    <div>
      {/* Cabecera — igual que ClienteStep */}
      <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Interno</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {stepData.items.length} ítem{stepData.items.length !== 1 ? 's' : ''}
          </span>
          {uniqueQuotes.map(nro => (
            <span key={nro} className="text-xs font-bold rounded-full bg-primary text-white px-3 py-0.5">#{nro}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Seleccione el usuario interno que recibirá la notificación de actualización de ítems.
        </p>
      </div>

      {/* Usuario destino */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Usuario Destino <span className="text-red-500">*</span>
        </label>
        <Select
          options={options}
          value={selectedUser}
          isClearable
          isSearchable
          menuPosition="fixed"
          menuShouldScrollIntoView={false}
          placeholder="Selecciona..."
          onChange={sel => { setSelectedUser(sel); if (sel) setUserError(false); }}
        />
        {userError && (
          <span className="text-red-500 text-xs mt-1 block">Selecciona un usuario destino</span>
        )}
      </div>

      {/* Mensaje */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      {/* Botones — misma estructura que ClienteStep */}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={sending} onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" disabled={sending} onClick={() => handleSubmit(false)}
          className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
          <IconTrash />
          No Notificar
        </button>
        <button type="button" disabled={sending} onClick={() => handleSubmit(true)}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
          <IconMail />
          Notificar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const DeleteForm = ({ selected_orders, action_cancel, onDeleted, users, setUsers, loadUsers, setLoadUsers, setOrdersAssigned }) => {
  const authUser = useSelector(selectUser);
  const deEmail  = authUser?.Email ?? authUser?.email ?? '';

  // Construye pasos: primero un paso por cada codCliente único (creadoPor=1),
  // luego un paso de usuario con todos los ítems creadoPor=0 (si los hay)
  const steps = useMemo(() => {
    const clienteMap = {};
    const usuarioItems = [];

    selected_orders.forEach(o => {
      if (o.creadoPor === 1) {
        if (!clienteMap[o.codCliente])
          clienteMap[o.codCliente] = { type: 'cliente', codCliente: o.codCliente, nomCliente: o.nomCliente, items: [] };
        clienteMap[o.codCliente].items.push(o);
      } else {
        usuarioItems.push(o);
      }
    });

    return [
      ...Object.values(clienteMap),
      ...(usuarioItems.length > 0 ? [{ type: 'usuario', items: usuarioItems }] : []),
    ];
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [accPayload,  setAccPayload]  = useState([]);
  const [sending,     setSending]     = useState(false);

  // Estado del paso Usuario (se carga una sola vez aunque haya múltiples pasos)
  const [options,      setOptions]      = useState(users);
  const [selectedUser, setSelectedUser] = useState(users[0] ?? null);
  const [userError,    setUserError]    = useState(false);

  useEffect(() => {
    if (!steps.some(s => s.type === 'usuario') || !loadUsers) return;
    axiosClient.get(URL_CONTROLS)
      .then(rs => {
        const list = rs.data.usuarios ?? [];
        setUsers(list);
        setOptions(list);
        if (list.length > 0) setSelectedUser(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadUsers(false));
  }, []);

  const submitAll = async (fullPayload) => {
    setSending(true);
    try {
      const rs = await axiosClient.post(URL_DELETE, fullPayload);
      const assigned = (rs.data.asignados ?? rs.data.dato ?? []).map((o, i) => ({ ...o, id: i }));
      const deletedIds = new Set(selected_orders.map(o => o.codRegistro));
      setOrdersAssigned(assigned);
      onDeleted?.(deletedIds);
      swalSuccess('Ítems eliminados correctamente');
      action_cancel();
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo eliminar los ítems.');
    } finally {
      setSending(false);
    }
  };

  const advance = (newEntries) => {
    const newPayload = [...accPayload, ...newEntries];
    if (currentStep + 1 < steps.length) {
      setAccPayload(newPayload);
      setCurrentStep(s => s + 1);
    } else {
      submitAll(newPayload);
    }
  };

  const handleClienteNext = ({ items, blnEnviar, para, asunto, cuerpo }) => {
    advance(buildEntries(items, () => ({
      CodUsuDestino: 0,
      Para:         para,
      Asunto:       asunto,
      Template:     11,
      DescTemplate: '',
      Mensaje:      cuerpo,
      blnEnviar,
    })));
  };

  const handleUsuarioSubmit = ({ items, blnEnviar, usuDestino, message }) => {
    advance(buildEntries(items, (nro) => ({
      CodUsuDestino: usuDestino,
      Para:         '',
      Asunto:       `Actualizacion Cotizacion #${nro}`,
      Template:     0,
      DescTemplate: '',
      Mensaje:      message,
      blnEnviar,
    })));
  };

  const stepData   = steps[currentStep];
  const totalSteps = steps.length;

  if (!stepData) return null;

  return (
    <div className="p-1 relative">

      {/* Overlay de envío */}
      {sending && (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center gap-3">
          <span className="h-9 w-9 rounded-full border-[3px] border-primary border-t-transparent animate-spin inline-block" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Procesando...</p>
        </div>
      )}

      {/* Barra de progreso (solo con más de un paso) */}
      {totalSteps > 1 && (
        <div className="mb-4">
          <div className="flex gap-1 mb-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
          <p className="text-[11px] text-right text-gray-400">
            Cotización {currentStep + 1} de {totalSteps}
            {' · '}
            {stepData.type === 'cliente' ? 'Correo al cliente' : 'Notificación interna'}
          </p>
        </div>
      )}

      {stepData.type === 'cliente' && (
        <ClienteStep
          stepData={stepData}
          onNext={handleClienteNext}
          onCancel={action_cancel}
          sending={sending}
          de={deEmail}
        />
      )}

      {stepData.type === 'usuario' && (
        <UsuarioStep
          stepData={stepData}
          onSubmit={handleUsuarioSubmit}
          onCancel={action_cancel}
          sending={sending}
          options={options}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          userError={userError}
          setUserError={setUserError}
        />
      )}

    </div>
  );
};

export default DeleteForm;
