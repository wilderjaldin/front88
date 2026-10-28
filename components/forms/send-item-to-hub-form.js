'use client';
import { useState, useEffect } from 'react';
import Select from '@/components/ui/Select';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';

const URL_USUARIOS_HUB    = (codPais) => `paises/${codPais}/usuarios-hub`;
const URL_ENVIAR_A_COTIZAR_HUB = 'repuestosporcotizar/enviar-a-cotizar-hub';

// Formulario simple de un solo paso: a diferencia de QuoteToCountryForm (que
// maneja varios ítems de "repuestosporcotizar" con un wizard), acá siempre
// se envía un único ítem de una cotización ya creada, así que no hace falta
// wizard ni vista previa.
const SendItemToHubForm = ({ item, nroCotizacion, codPaisDestino, nomPaisDestino, close, onSent }) => {
  const [options,      setOptions]      = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userError,    setUserError]    = useState(false);
  const [message,      setMessage]      = useState('Cotizar');
  const [sending,      setSending]      = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    axiosClient.get(URL_USUARIOS_HUB(codPaisDestino))
      .then(rs => {
        const list = Array.isArray(rs.data) ? rs.data : [];
        setOptions(list);
        setSelectedUser(list.length === 1 ? list[0] : null);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoadingUsers(false));
  }, [codPaisDestino]);

  const handleSend = async () => {
    if (!selectedUser) { setUserError(true); return; }
    setUserError(false);
    setSending(true);
    try {
      await axiosClient.post(URL_ENVIAR_A_COTIZAR_HUB, {
        nroCotizacion,
        codItem: item.CodItem,
        codUsuDestino: Number(selectedUser.value),
        mensaje: message,
      });
      swalSuccess('Ítem enviado a cotizar correctamente');
      onSent?.();
      close();
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo enviar a cotizar.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-1 relative">
      {sending && (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center gap-3">
          <span className="h-9 w-9 rounded-full border-[3px] border-primary border-t-transparent animate-spin inline-block" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Procesando...</p>
        </div>
      )}

      <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {nomPaisDestino ?? codPaisDestino}
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.NroParte}</span>
          <span className="text-xs font-bold rounded-full bg-primary text-white px-3 py-0.5">#{nroCotizacion}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Seleccione el usuario del hub de {nomPaisDestino ?? codPaisDestino} al que se le asignará este ítem por cotizar.
        </p>
      </div>

      {loadingUsers ? (
        <div className="h-20 flex items-center justify-center gap-3 text-gray-400 text-sm">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block shrink-0" />
          Cargando usuarios...
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuario Destino <span className="text-red-500">*</span>
            </label>
            {options.length === 1 ? (
              <div className="h-[38px] flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 text-sm text-gray-700 dark:text-gray-300">
                {options[0].label}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </>
      )}

      <div className="flex justify-between gap-2">
        <button type="button" disabled={sending} onClick={close}
          className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" disabled={loadingUsers || sending} onClick={handleSend}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Enviar Cotización
        </button>
      </div>
    </div>
  );
};

export default SendItemToHubForm;
