'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Modal from '@/components/modal';
import Select from 'react-select';
import { useSearchParams } from 'next/navigation';
import IconPlusProps from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import ShippingForm from '@/app/admin/register/customers/form/shipping';

const URL_OPCIONES  = 'cotizaciondetalle/opciones-envio';
const URL_DIRECCION = 'cotizaciondetalle/direccion-entrega';
const URL_GUARDAR   = (codCliente) => `clientes/${codCliente}/direcciones/guardar`;

const ShippingQuote = ({ token, t, order_id, customer, savedShipping, registerShipping, reset, setValue, errors }) => {
  const searchParams = useSearchParams();
  const customer_id  = searchParams.get("customer");

  const [transportes,   setTransportes]  = useState([]);
  const [direcciones,   setDirecciones]  = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [selTransporte, setSelTransporte] = useState(null);
  const [selDireccion,  setSelDireccion]  = useState(null);
  const [currentDir,    setCurrentDir]   = useState(null);
  const [loadingDir,    setLoadingDir]   = useState(false);
  const [showModal,     setShowModal]    = useState(false);
  const [modalTitle,    setModalTitle]   = useState('');
  const [editDir,       setEditDir]      = useState(null);

  const clienteNorm = {
    codCliente: customer?.CodCliente ?? customer?.codCliente ?? customer_id,
    nomCliente: customer?.NomCliente ?? customer?.nomCliente ?? '',
  };

  useEffect(() => {
    if (!order_id) return;
    axiosClient
      .get(`${URL_OPCIONES}/${order_id}`)
      .then(rs => {
        setTransportes(rs.data.transportes ?? []);
        setDirecciones(rs.data.direcciones ?? []);
      })
      .finally(() => setLoading(false));
  }, [order_id]);

  // Restaurar estado desde Redux cuando los datos ya están cargados
  useEffect(() => {
    if (loading || !savedShipping?.codDireccion) return;

    if (savedShipping.codTransporte) {
      const opt = transportes.find(o => o.value === savedShipping.codTransporte)
        ?? { value: savedShipping.codTransporte, label: savedShipping._transporteLabel ?? '' };
      setSelTransporte(opt);
    }

    const dirOpt = { value: savedShipping.codDireccion, label: savedShipping._direccionLabel ?? savedShipping.address ?? '' };
    setSelDireccion(dirOpt);

    setCurrentDir({
      codPais:      savedShipping.codPais,
      nomPais:      savedShipping.country,
      nomCiudad:    savedShipping.city,
      desDireccion: savedShipping.address,
      nomEmpresa:   savedShipping.company,
      nomContacto:  savedShipping.contact,
      numTelefono:  savedShipping.phone,
      mail:         savedShipping.email,
      nomEstado:    savedShipping.state,
      codPostal:    savedShipping.zip,
    });

    reset({
      codTransporte:    savedShipping.codTransporte    ?? '',
      cuentaTransporte: savedShipping.cuentaTransporte ?? '',
      codDireccion:     savedShipping.codDireccion,
      _transporteLabel: savedShipping._transporteLabel ?? '',
      _direccionLabel:  savedShipping._direccionLabel  ?? '',
      codPais:  savedShipping.codPais  ?? '',
      company: savedShipping.company ?? '', contact: savedShipping.contact ?? '',
      phone:   savedShipping.phone   ?? '', email:   savedShipping.email   ?? '',
      country: savedShipping.country ?? '', address: savedShipping.address ?? '',
      city:    savedShipping.city    ?? '', state:   savedShipping.state   ?? '',
      zip:     savedShipping.zip     ?? '', note:    savedShipping.note    ?? '',
    });
  }, [loading]);

  const handleTransporteChange = (sel) => {
    setSelTransporte(sel);
    setValue('codTransporte',    sel?.value ?? '');
    setValue('_transporteLabel', sel?.label ?? '');
  };

  const handleDireccionChange = async (sel) => {
    setSelDireccion(sel);
    if (!sel) { setCurrentDir(null); return; }

    setLoadingDir(true);
    try {
      const rs = await axiosClient.get(`${URL_DIRECCION}/${sel.value}`, { params: { codCliente: customer_id } });
      const d  = rs.data;
      setCurrentDir(d);
      setValue('_direccionLabel', sel.label ?? '');
      reset({
        codTransporte:    selTransporte?.value ?? '',
        cuentaTransporte: '',
        codDireccion:     sel.value,
        _transporteLabel: selTransporte?.label ?? '',
        _direccionLabel:  sel.label ?? '',
        codPais:  d.codPais      ?? '',
        company: d.nomEmpresa   ?? '', contact: d.nomContacto ?? '',
        phone:   d.numTelefono  ?? '', email:   d.mail        ?? '',
        country: d.nomPais      ?? '', address: d.desDireccion ?? '',
        city:    d.nomCiudad    ?? '', state:   d.nomEstado   ?? '',
        zip:     d.codPostal    ?? '', note:    '',
      });
    } catch {
      setCurrentDir(null);
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

    // Si estábamos editando la dirección actualmente seleccionada, recargar su detalle
    if (editDir && selDireccion) {
      const updated = opts.find(o => o.value === selDireccion.value);
      if (updated) handleDireccionChange(updated);
    }
    setShowModal(false);
  };

  const dirOptions = direcciones.map(d => ({ value: d.value, label: d.label }));

  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">{label}</span>
        <span className="text-sm font-medium text-gray-800 flex-1">{value}</span>
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

          {/* ── Transporte ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              {t.select_transport ?? 'Seleccione el Transporte'}
            </h3>
            <Select
              value={selTransporte}
              onChange={handleTransporteChange}
              options={transportes}
              isLoading={loading}
              placeholder={t.select_option}
              isClearable
            />
            {selTransporte && selTransporte.value !== '1' && (
              <div className="flex items-center gap-3 mt-3">
                <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right">
                  {t.account_number ?? '# Cuenta'}
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  {...registerShipping('cuentaTransporte')}
                  placeholder="—"
                  className="form-input h-9 text-sm flex-1"
                />
              </div>
            )}
            <input type="hidden" {...registerShipping('codTransporte')} />
          </div>

          {/* ── Dirección de entrega ──────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              {t.select_address ?? 'Seleccione una dirección'}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selDireccion}
                  onChange={handleDireccionChange}
                  options={dirOptions}
                  isLoading={loading}
                  placeholder={t.select_option}
                  isClearable
                />
              </div>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition shrink-0"
              >
                <IconPlusProps className="h-4 w-4" />
                {t.btn_add ?? 'Agregar'}
              </button>
            </div>

            {/* Skeleton mientras carga */}
            {loadingDir && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2 animate-pulse">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-3 py-1.5">
                    <div className="h-3.5 w-24 bg-gray-200 rounded ml-auto" />
                    <div className="h-3.5 w-40 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Detalle de la dirección */}
            {!loadingDir && currentDir && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 pt-1 pb-3">
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
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <IconPencil className="h-3.5 w-3.5" />
                    {t.btn_edit ?? 'Editar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Instrucción de entrega ───────────────────────────────────── */}
          <div className="flex items-start gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-gray-400 text-right pt-2">
              {t.delivery_instructions ?? 'Instrucción Entrega'}
            </label>
            <textarea
              rows={3}
              {...registerShipping('note')}
              className="form-input text-sm flex-1 resize-none"
            />
          </div>

          {/* Campos ocultos leídos por getValues en el padre */}
          {['codDireccion','_transporteLabel','_direccionLabel','codPais','company','contact','phone','email','country','address','city','state','zip'].map(f => (
            <input key={f} type="hidden" {...registerShipping(f)} />
          ))}

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
          urlGuardar={URL_GUARDAR(clienteNorm.codCliente)}
          onCancel={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      </Modal>
    </>
  );
};

export default ShippingQuote;
