'use client';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axiosClient from '@/app/lib/axiosClient';
import ComponentContactForm from '@/components/forms/contact-form';
import Modal from '@/components/modal';
import { swalSuccess, swalError, swalConfirm } from '@/app/lib/swal';

const URL_CONTROLES = 'cotizaciones/controles';
const URL_ASIGNAR   = 'cotizaciondetalle/asignar-contacto';

const toContactFormShape = (c) => ({
  codRegistro: c.codRegistro,
  nomContacto: c.nomContacto,
  nomCargo:    c.nomCargo ?? '',
  correos:   c.correos   ?? [c.email1, c.email2].filter(Boolean).join(';'),
  telefonos: c.telefonos ?? [c.numTelefono1, c.numTelefono2, c.numTelefono3].filter(Boolean).join(';'),
});

// ─────────────────────────────────────────────────────────────────────────────
export default function ContactQuoteSection({
  nroCotizacion,
  codCliente,
  codContacto,        // valor actual en el pedido — controla vista vs. botón asignar
  vencido   = false,
  t         = {},
  onContactChange,    // (codContacto: number|null) => void
}) {
  const [contacts,        setContacts]        = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editMode,        setEditMode]        = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [modal,           setModal]           = useState(null); // { title, size, content }

  const closeModal = () => setModal(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nroCotizacion) return;
    loadContacts();
  }, [nroCotizacion]);

  // ── Pre-selecciona el contacto asignado una vez cargada la lista ───────────
  useEffect(() => {
    if (!codContacto || contacts.length === 0) return;
    const pre = contacts.find(c => c.value === codContacto);
    if (pre) setSelectedContact(pre);
  }, [codContacto, contacts]);

  // ── API ───────────────────────────────────────────────────────────────────
  const loadContacts = () => {
    axiosClient.get(URL_CONTROLES, { params: { nroCotizacion } })
      .then(rs => {
        const mapped = (rs.data.contactos ?? []).map(c => ({
          value: c.codRegistro,
          label: c.nomContacto,
          data:  c,
        }));
        setContacts(mapped);
        setSelectedContact(prev => {
          if (!prev) return prev;
          return mapped.find(c => c.value === prev.value) ?? prev;
        });
      })
      .catch(() => {});
  };

  const handleAsignar = async () => {
    if (!selectedContact || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const rs = await axiosClient.put(URL_ASIGNAR, {
        nroCotizacion,
        codContacto: selectedContact.value,
      });
      onContactChange?.(selectedContact.value);
      setEditMode(false);
      swalSuccess(rs.data?.mensaje ?? 'Contacto asignado correctamente');
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? 'No se pudo asignar el contacto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuitar = async () => {
    if (isSubmitting) return;
    const confirmed = await swalConfirm('¿Quitar el contacto asignado?', 'La cotización quedará sin contacto.');
    if (!confirmed) return;
    setIsSubmitting(true);
    try {
      const rs = await axiosClient.put(URL_ASIGNAR, { nroCotizacion, codContacto: null });
      onContactChange?.(null);
      setSelectedContact(null);
      swalSuccess(rs.data?.mensaje ?? 'Contacto removido correctamente');
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? 'No se pudo quitar el contacto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Modales ───────────────────────────────────────────────────────────────
  const openContactInfo = (contact) => {
    const phones = contact.telefonos
      ? contact.telefonos.split(';').map(s => s.trim()).filter(Boolean)
      : [contact.numTelefono1, contact.numTelefono2, contact.numTelefono3].filter(Boolean);
    const emails = contact.correos
      ? contact.correos.split(';').map(s => s.trim()).filter(Boolean)
      : [contact.email1, contact.email2].filter(Boolean);

    const initials = (contact.nomContacto ?? 'C')
      .split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();

    setModal({
      title: 'Información de contacto',
      size:  'w-full max-w-xs',
      content: (
        <div className="-mx-1">
          <div className="flex items-center gap-3 px-5 pt-1 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold leading-none select-none">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight truncate">{contact.nomContacto}</p>
              {contact.nomCargo
                ? <p className="text-xs text-gray-400 mt-0.5 truncate">{contact.nomCargo}</p>
                : <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Sin cargo</p>}
            </div>
          </div>

          {phones.length > 0 && (
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Teléfono</span>
              </div>
              <div className="space-y-1">
                {phones.map((p, i) => (
                  <div key={i} className="flex items-center px-2.5 py-1.5">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-200">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phones.length > 0 && emails.length > 0 && (
            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-5" />
          )}

          {emails.length > 0 && (
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Email</span>
              </div>
              <div className="space-y-1">
                {emails.map((e, i) => (
                  <div key={i} className="flex items-center px-2.5 py-1.5">
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{e.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phones.length === 0 && emails.length === 0 && (
            <div className="px-5 py-6 flex flex-col items-center gap-2 text-gray-300 dark:text-gray-600">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              </svg>
              <p className="text-sm">Sin información de contacto</p>
            </div>
          )}
          <div className="pb-2" />
        </div>
      ),
    });
  };

  const openContactForm = (contact, isNew) => {
    setModal({
      title:   isNew ? 'Agregar Contacto' : `Editar — ${contact.nomContacto}`,
      size:    'w-full max-w-lg',
      content: (
        <div className="px-5 py-4">
          <ComponentContactForm
            contact={isNew ? null : toContactFormShape(contact)}
            cliente={{ codCliente }}
            isNew={isNew}
            onCancel={closeModal}
            onSaved={() => { closeModal(); loadContacts(); }}
          />
        </div>
      ),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isAssigned = codContacto != null && codContacto === selectedContact?.value;

  return (
    <>
      <Modal
        showModal={modal !== null}
        closeModal={closeModal}
        title={modal?.title ?? ''}
        size={modal?.size ?? 'w-full max-w-lg'}
        show_close_button={true}
        show_buttons={false}
      >
        {modal?.content}
      </Modal>

      {/* ── VISTA ─────────────────────────────────────────────────────── */}
      {!editMode ? (
        codContacto && selectedContact ? (
          <>
            <button type="button" onClick={() => openContactInfo(selectedContact.data)}
              title="Ver información de contacto"
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-sky-700/60 dark:hover:bg-sky-900/20 transition max-w-[220px]">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              </svg>
              <span className="text-xs font-medium truncate">{selectedContact.label}</span>
              {selectedContact.data?.nomCargo && (
                <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">· {selectedContact.data.nomCargo}</span>
              )}
            </button>
            {!vencido && (
              <button type="button" onClick={() => setEditMode(true)} title="Modificar contacto asignado"
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-600 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </>
        ) : !vencido ? (
          <button type="button" onClick={() => setEditMode(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 dark:border-gray-600 dark:hover:border-primary/40 transition text-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M1 21v-2a7 7 0 0114 0v2"/>
              <path strokeLinecap="round" d="M19 8v6M22 11h-6"/>
            </svg>
            Asignar contacto
          </button>
        ) : null
      ) : (
        /* ── EDICIÓN ───────────────────────────────────────────────────── */
        <>
          <div className="w-[190px] shrink-0">
            <Select
              options={contacts}
              value={selectedContact}
              isClearable isSearchable
              instanceId={`contact-sel-${nroCotizacion}`}
              menuPosition="fixed"
              menuShouldScrollIntoView={false}
              placeholder="—"
              onChange={sel => setSelectedContact(sel ?? null)}
              noOptionsMessage={() => 'Sin contactos'}
              styles={{
                control:             b => ({ ...b, minHeight: '36px', height: '36px', fontSize: '13px' }),
                valueContainer:      b => ({ ...b, padding: '0 8px' }),
                indicatorsContainer: b => ({ ...b, height: '36px' }),
                menu:                b => ({ ...b, minWidth: '190px' }),
              }}
            />
          </div>

          {selectedContact && (
            <>
              <button type="button" onClick={() => openContactInfo(selectedContact.data)} title="Ver información"
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-500 hover:bg-sky-100 hover:border-sky-300 hover:text-sky-600 dark:border-sky-700/50 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
                </svg>
              </button>
              <button type="button" onClick={() => openContactForm(selectedContact.data, false)} title="Editar datos del contacto"
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-600 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </>
          )}

          <button type="button" onClick={() => openContactForm(null, true)} title="Nuevo contacto"
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M1 21v-2a7 7 0 0114 0v2"/>
              <path strokeLinecap="round" d="M19 8v6M22 11h-6"/>
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />

          {selectedContact && (
            <button type="button" onClick={handleAsignar}
              disabled={isSubmitting || isAssigned}
              title={isAssigned ? 'Este contacto ya está asignado' : 'Asignar a la cotización'}
              className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition disabled:cursor-not-allowed
                ${isAssigned
                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-sm disabled:opacity-50'}`}>
              {isAssigned
                ? <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5"/></svg>Asignado</>
                : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>Asignar</>}
            </button>
          )}

          {codContacto != null && (
            <button type="button" onClick={handleQuitar} disabled={isSubmitting}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 text-xs font-semibold hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 dark:border-rose-700/50 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                <path strokeLinecap="round" d="M18 6L6 18"/>
              </svg>
              Quitar
            </button>
          )}

          <button type="button" onClick={() => setEditMode(false)}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-500 text-xs font-medium hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 transition">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Listo
          </button>
        </>
      )}
    </>
  );
}
