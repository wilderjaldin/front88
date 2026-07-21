'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import Modal from '@/components/modal';
import Select from 'react-select';
import IconPlusProps from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import ShippingForm from '@/app/admin/register/customers/form/shipping';

// Mismo diseño/funcionalidad que app/admin/revision/quotes/steps/shipping.js
// (paso "Envío / Lugar de Entrega" del wizard de compra), pero como componente
// standalone reutilizable en modal desde cualquier pantalla de cotización.
const URL_OPCIONES  = (id) => `cotizaciondetalle/opciones-envio/${id}`;
const URL_DIRECCION = (codRegistro) => `cotizaciondetalle/direccion-entrega/${codRegistro}`;
const URL_ACTUAL    = (id) => `ordenesenproceso/${id}/instrucciones-entrega`;
const URL_GUARDAR   = (id) => `ordenesenproceso/${id}/guardar-instrucciones-entrega`;
const URL_GUARDAR_DIRECCION_CLIENTE = (codCliente) => `clientes/${codCliente}/direcciones/guardar`;

const DetailRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 truncate">{value}</span>
    </div>
  );
};

const DeliveryAddressForm = ({ close, order_id, customer, t }) => {
  const clienteNorm = {
    codCliente: customer?.CodCliente ?? customer?.codCliente,
    nomCliente: customer?.NomCliente ?? customer?.nomCliente ?? '',
  };

  const [transportes,   setTransportes]   = useState([]);
  const [direcciones,   setDirecciones]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [selTransporte, setSelTransporte] = useState(null);
  const [selDireccion,  setSelDireccion]  = useState(null);
  const [originalDir,   setOriginalDir]   = useState(null); // snapshot congelado de la cotización — nunca se pisa
  const [pickedDir,      setPickedDir]    = useState(null); // dirección real elegida en el <Select>
  const [loadingDir,    setLoadingDir]    = useState(false);
  const [formaPago,     setFormaPago]     = useState(''); // descripción, solo para mostrar
  const [frmPagoCod,    setFrmPagoCod]    = useState(''); // código, se reenvía tal cual al guardar

  // Lo que se muestra: la elegida en el Select si hay una, si no, el snapshot original.
  // Así, si el usuario limpia el Select, se vuelve al dato de la cotización en vez de quedar en blanco.
  const currentDir = pickedDir ?? originalDir;
  const [showModal,     setShowModal]     = useState(false);
  const [modalTitle,    setModalTitle]    = useState('');
  const [editDir,       setEditDir]       = useState(null);

  const { register, reset, getValues } = useForm({
    defaultValues: { cuentaTransporte: '', note: '', name: '', phone_contact: '', email_contact: '' },
  });

  // ── 1. Opciones de transporte/dirección ────────────────────────────────────
  useEffect(() => {
    if (!order_id) return;
    axiosClient.get(URL_OPCIONES(order_id))
      .then(rs => {
        setTransportes(rs.data.transportes ?? []);
        setDirecciones(rs.data.direcciones ?? []);
      })
      .finally(() => setLoading(false));
  }, [order_id]);

  // ── 2. Selección/instrucciones actuales de la orden ────────────────────────
  useEffect(() => {
    if (!order_id || loading) return;
    axiosClient.get(URL_ACTUAL(order_id))
      .then(rs => {
        const d = rs.data ?? {};
        reset({
          cuentaTransporte: d.numCtaCarrier ?? '',
          note: d.insEnvio ?? '',
          name: d.ctoNomCliente ?? '',
          phone_contact: d.ctoNumTelefono ?? '',
          email_contact: d.ctoMail ?? '',
        });
        setFormaPago(d.formPago ?? '');
        setFrmPagoCod(d.frmPago ?? '');

        // El transporte se guarda como texto plano en la cotización (sin código) —
        // se empareja por nombre contra las opciones disponibles.
        if (d.nomCarrier) {
          const opt = transportes.find(o => o.label === d.nomCarrier)
            ?? { value: d.nomCarrier, label: d.nomCarrier };
          setSelTransporte(opt);
        }

        // La dirección de entrega es una copia congelada al momento de cotizar
        // (no tiene codDireccion/codRegistro que la vincule a un registro editable
        // del cliente — si esa dirección cambia después, el histórico de la
        // cotización no debe cambiar). Por eso el <Select> queda sin selección:
        // solo sirve para elegir una dirección distinta si se quiere actualizar.
        setOriginalDir({
          nomPais:      d.dirEntNomPais,
          nomCiudad:    d.dirEntNomCiudad,
          desDireccion: d.dirEnvio,
          nomEmpresa:   d.dirEntNomEmpresa,
          nomContacto:  d.dirEntNomContacto,
          numTelefono:  d.dirEntNumTelefono,
          mail:         d.dirEntMail,
          nomEstado:    d.dirEntNomEstado,
          codPostal:    d.dirEntCodPostal,
        });
      })
      .catch(() => {});
  }, [order_id, loading]);

  const handleTransporteChange = (sel) => setSelTransporte(sel);

  const handleDireccionChange = async (sel) => {
    setSelDireccion(sel);
    // Al limpiar el Select, se vuelve a mostrar el snapshot original (originalDir),
    // no se deja la tarjeta en blanco.
    if (!sel) { setPickedDir(null); return; }

    setLoadingDir(true);
    try {
      const rs = await axiosClient.get(URL_DIRECCION(sel.value), { params: { codCliente: clienteNorm.codCliente } });
      // codRegistro se fuerza explícitamente (no confiar en que el backend lo eche
      // de vuelta) — es lo que distingue "dirección real editable" del snapshot.
      setPickedDir({ ...rs.data, codRegistro: sel.value });
    } catch {
      setPickedDir(null);
    } finally {
      setLoadingDir(false);
    }
  };

  const openAdd = () => {
    setEditDir(null);
    setModalTitle(`${t.add_address ?? 'Agregar Dirección'} — ${clienteNorm.nomCliente}`);
    setShowModal(true);
  };

  const openEdit = () => {
    setEditDir(currentDir);
    setModalTitle(`${t.edit_address ?? 'Editar Dirección'} — ${clienteNorm.nomCliente}`);
    setShowModal(true);
  };

  const handleSaved = (updatedList) => {
    const opts = (updatedList ?? [])
      .filter(d => d.codEstado === 'AC')
      .map(d => ({
        value: d.codRegistro,
        label: [d.nomPais, d.nomCiudad, d.desDireccion].filter(Boolean).join(' · '),
      }));
    setDirecciones(opts);

    if (editDir && selDireccion) {
      const updated = opts.find(o => o.value === selDireccion.value);
      if (updated) handleDireccionChange(updated);
    }
    setShowModal(false);
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Mismo shape que retorna el GET — frmPago se reenvía tal cual (código,
      // no editable acá); los DirEnt* salen de currentDir, que ya resuelve a la
      // dirección recién elegida en el Select o, si no se cambió, al snapshot original.
      await axiosClient.post(URL_GUARDAR(order_id), {
        frmPago:           frmPagoCod,
        dirEnvio:          currentDir?.desDireccion  ?? '',
        dirEntNomPais:     currentDir?.nomPais       ?? '',
        dirEntNomCiudad:   currentDir?.nomCiudad     ?? '',
        dirEntNomEmpresa:  currentDir?.nomEmpresa    ?? '',
        dirEntNomContacto: currentDir?.nomContacto   ?? '',
        dirEntNumTelefono: currentDir?.numTelefono   ?? '',
        dirEntMail:        currentDir?.mail          ?? '',
        dirEntNomEstado:   currentDir?.nomEstado     ?? '',
        dirEntCodPostal:   currentDir?.codPostal     ?? '',
        nomCarrier:        selTransporte?.label      ?? '',
        numCtaCarrier:     getValues('cuentaTransporte') ?? '',
        ctoNomCliente:     getValues('name')          ?? '',
        ctoNumTelefono:    getValues('phone_contact') ?? '',
        ctoMail:           getValues('email_contact') ?? '',
        insEnvio:          getValues('note')          ?? '',
      });
      swalSuccess(t.record_updated ?? 'Datos actualizados');
      close?.();
    } catch (err) {
      swalError(t.error, err?.response?.data?.mensaje ?? t.save_data_error, t.close);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3.5">

        {/* ── Forma de Pago (solo lectura) ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">
            {t.method_of_payment ?? 'Forma de Pago'}
          </label>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 truncate">
            {formaPago || '—'}
          </span>
        </div>

        {/* ── Transporte ──────────────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            {t.select_transport ?? 'Seleccione el Transporte'}
          </h3>
          <Select
            value={selTransporte}
            onChange={handleTransporteChange}
            options={transportes}
            isLoading={loading}
            placeholder={t.select_option}
            isClearable
            styles={{ control: b => ({ ...b, minHeight: '36px', height: '36px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '36px' }) }}
          />
          {selTransporte && selTransporte.value !== '1' && (
            <div className="flex items-center gap-2 mt-1.5">
              <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">
                {t.account_number ?? '# Cuenta'}
              </label>
              <input
                type="text"
                autoComplete="off"
                {...register('cuentaTransporte')}
                placeholder="—"
                className="form-input h-8 text-sm flex-1"
              />
            </div>
          )}
        </div>

        {/* ── Dirección de entrega ──────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            {t.select_address ?? 'Seleccione una dirección'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={selDireccion}
                onChange={handleDireccionChange}
                options={direcciones}
                isLoading={loading}
                placeholder={t.select_option}
                isClearable
                styles={{ control: b => ({ ...b, minHeight: '36px', height: '36px' }), valueContainer: b => ({ ...b, padding: '0 8px' }), indicatorsContainer: b => ({ ...b, height: '36px' }) }}
              />
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition shrink-0"
            >
              <IconPlusProps className="h-3.5 w-3.5" />
              {t.btn_add ?? 'Agregar'}
            </button>
          </div>

          {loadingDir && (
            <div className="mt-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 space-y-1.5 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 py-1">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
                  <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loadingDir && currentDir && (
            <div className="mt-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-0.5">
              <DetailRow
                label={`${t.country ?? 'País'} / ${t.city ?? 'Ciudad'}`}
                value={[currentDir.nomPais, currentDir.nomCiudad].filter(Boolean).join(' - ')}
              />
              <DetailRow label={t.address ?? 'Dirección'}   value={currentDir.desDireccion} />
              <DetailRow label={t.company ?? 'Empresa'}     value={currentDir.nomEmpresa}   />
              <DetailRow label={t.contact ?? 'Contacto'}    value={currentDir.nomContacto}  />
              <DetailRow label={t.phone   ?? 'Teléfono'}    value={currentDir.numTelefono}  />
              <DetailRow label={t.email   ?? 'Mail'}        value={currentDir.mail}         />
              <DetailRow label={t.state   ?? 'Estado'}      value={currentDir.nomEstado}    />
              <DetailRow label={t.zip     ?? 'Cod. Postal'} value={currentDir.codPostal}    />
              {currentDir.codRegistro && (
                <div className="flex justify-end py-1.5">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <IconPencil className="h-3 w-3" />
                    {t.btn_edit ?? 'Editar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contacto de la cotización — solo cuando Forma de Pago es "Contactar" ── */}
        {frmPagoCod === 'CT' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">{t.name ?? 'Nombre'}</label>
              <input type="text" autoComplete="off" {...register('name')} placeholder={t.enter_name ?? 'Ingresa el nombre'}
                className="form-input h-8 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">{t.phone ?? 'Teléfono'}</label>
              <input type="text" autoComplete="off" {...register('phone_contact')}
                className="form-input h-8 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">{t.email ?? 'Correo electrónico'}</label>
              <input type="text" autoComplete="off" {...register('email_contact')}
                className="form-input h-8 text-sm flex-1" />
            </div>
          </div>
        )}

        {/* ── Instrucción de entrega ───────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right pt-2">
            {t.delivery_instructions ?? 'Instrucción Entrega'}
          </label>
          <textarea
            rows={2}
            {...register('note')}
            className="form-input text-sm flex-1 resize-none"
          />
        </div>

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button type="button" onClick={close}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150">
            {t.btn_cancel}
          </button>
          <button type="button" onClick={handleGuardar} disabled={saving}
            className="btn btn-success inline-flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (t.saving ?? 'Guardando...') : t.btn_save}
          </button>
        </div>

      </div>

      {/* ── Modal agregar / editar dirección ─────────────────────────────── */}
      <Modal
        size="w-full max-w-2xl"
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        title={modalTitle}
      >
        <ShippingForm
          dir={editDir}
          cliente={clienteNorm}
          isNew={!editDir}
          urlGuardar={URL_GUARDAR_DIRECCION_CLIENTE(clienteNorm.codCliente)}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
};

export default DeliveryAddressForm;
