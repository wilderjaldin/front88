'use client';
import { useState, useEffect } from 'react';
import Select from '@/components/ui/Select';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';

const URL_USUARIOS_HUB  = (codPais) => `paises/${codPais}/usuarios-hub`;
const URL_COTIZAR_ITEMS = 'repuestosporcotizar/cotizar-items';

// ── Paso Ítem: un país de destino puede repetirse entre varios ítems, pero el
// endpoint de usuarios del hub se llama por cada ítem/paso igual, tal como se
// pidió (más adelante puede haber más países además de China/CN). La
// respuesta de cada paso se guarda en el padre (answers) para poder volver
// atrás sin perder lo ya completado. ──────────────────────────────────────
const ItemStep = ({ stepData, savedAnswer, isFirst, onNext, onBack, onCancel }) => {
  const [options,      setOptions]      = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userError,    setUserError]    = useState(false);
  const [message,      setMessage]      = useState(savedAnswer?.mensaje ?? 'Cotizar');

  useEffect(() => {
    setLoadingUsers(true);
    setUserError(false);
    setMessage(savedAnswer?.mensaje ?? 'Cotizar');
    axiosClient.get(URL_USUARIOS_HUB(stepData.codPaisDestino))
      .then(rs => {
        const list = Array.isArray(rs.data) ? rs.data : [];
        setOptions(list);
        // Si ya se había respondido este paso (volviendo con "Anterior"), se
        // restaura esa elección; si no, y hay un solo usuario en el hub, se
        // preselecciona directo porque no hay nada que elegir.
        const preset = savedAnswer?.usuDestino != null
          ? list.find(u => Number(u.value) === Number(savedAnswer.usuDestino))
          : (list.length === 1 ? list[0] : null);
        setSelectedUser(preset ?? null);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoadingUsers(false));
  }, [stepData.codRegistro]);

  const handleNext = () => {
    if (!selectedUser) { setUserError(true); return; }
    setUserError(false);
    onNext({ usuDestino: Number(selectedUser.value), usuarioLabel: selectedUser.label, mensaje: message });
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {stepData.nomPaisDestino ?? stepData.codPaisDestino}
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stepData.nroParte}</span>
          <span className="text-xs font-bold rounded-full bg-primary text-white px-3 py-0.5">#{stepData.nroCotizacion}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Seleccione el usuario del hub de {stepData.nomPaisDestino ?? stepData.codPaisDestino} al que se le asignará este ítem por cotizar.
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
        <button type="button" onClick={isFirst ? onCancel : onBack}
          className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          {isFirst ? 'Cancelar' : 'Anterior'}
        </button>
        <button type="button" disabled={loadingUsers} onClick={handleNext}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Siguiente
        </button>
      </div>
    </div>
  );
};

// ── Paso Resumen: previsualiza todos los ítems con el usuario/mensaje ya
// elegido en cada paso, y recién ahí dispara el envío real a la API. ───────
const PreviewStep = ({ steps, answers, onBack, onSend, sending }) => (
  <div>
    <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Resumen</span>
      <p className="text-xs text-gray-400 mt-1">
        Revise los {steps.length} ítem{steps.length !== 1 ? 's' : ''} antes de enviarlos a cotizar.
      </p>
    </div>

    <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 mb-4 max-h-[320px] overflow-y-auto">
      {steps.map(item => {
        const ans = answers[item.codRegistro];
        return (
          <div key={item.codRegistro} className="px-3 py-2 flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {item.nroParte}
                <span className="text-[11px] font-bold rounded-full bg-primary text-white px-2 py-0.5">#{item.nroCotizacion}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {item.nomPaisDestino ?? item.codPaisDestino} → {ans?.usuarioLabel ?? '—'}
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate shrink-0" title={ans?.mensaje}>
              {ans?.mensaje}
            </div>
          </div>
        );
      })}
    </div>

    <div className="flex justify-between gap-2">
      <button type="button" disabled={sending} onClick={onBack}
        className="h-9 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50">
        Anterior
      </button>
      <button type="button" disabled={sending} onClick={onSend}
        className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
        Enviar Cotización
      </button>
    </div>
  </div>
);

// ── Componente principal — wizard: un paso por ítem + un paso final de
// resumen/envío. No se agrupan ítems por país ni por cotización: cada ítem
// llama su propio GET usuarios-hub. ────────────────────────────────────────
const QuoteToCountryForm = ({ selected_orders, action_cancel, setOrdersAssigned, setOrdersUnassigned }) => {
  const steps = selected_orders;

  const [currentStep, setCurrentStep] = useState(0); // 0..steps.length-1 = ítems, steps.length = resumen
  const [answers,     setAnswers]     = useState({}); // codRegistro -> { usuDestino, usuarioLabel, mensaje }
  const [sending,     setSending]     = useState(false);

  const isPreview  = currentStep === steps.length;
  const totalDots  = steps.length + 1;

  const handleItemNext = (ans) => {
    const item = steps[currentStep];
    setAnswers(prev => ({ ...prev, [item.codRegistro]: ans }));
    setCurrentStep(s => s + 1);
  };

  const handleBack = () => setCurrentStep(s => Math.max(0, s - 1));

  const handleSend = async () => {
    setSending(true);
    try {
      const payload = steps.map(item => ({
        codRegistro:   item.codRegistro,
        codUsuDestino: answers[item.codRegistro]?.usuDestino,
        codPais:       item.codPaisDestino,
        mensaje:       answers[item.codRegistro]?.mensaje ?? '',
      }));
      const rs = await axiosClient.post(URL_COTIZAR_ITEMS, payload);
      // Igual que eliminar-items: la respuesta viene anidada bajo "resultado".
      const resultado = rs.data?.resultado ?? rs.data ?? {};
      setOrdersAssigned?.((resultado.asignados ?? []).map((o, i) => ({ ...o, id: i })));
      setOrdersUnassigned?.((resultado.noAsignados ?? []).map((o, i) => ({ ...o, id: i })));
      swalSuccess('Ítems enviados a cotizar correctamente');
      action_cancel();
    } catch (err) {
      swalError('Error', err?.response?.data?.mensaje ?? 'No se pudo enviar a cotizar.');
    } finally {
      setSending(false);
    }
  };

  if (!steps.length) return null;

  return (
    <div className="p-1 relative">

      {sending && (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center gap-3">
          <span className="h-9 w-9 rounded-full border-[3px] border-primary border-t-transparent animate-spin inline-block" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Procesando...</p>
        </div>
      )}

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex gap-1 mb-1">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>
        <p className="text-[11px] text-right text-gray-400">
          {isPreview ? `Resumen · ${steps.length} ítem${steps.length !== 1 ? 's' : ''}` : `Ítem ${currentStep + 1} de ${steps.length} · Envío a cotizar`}
        </p>
      </div>

      {isPreview ? (
        <PreviewStep steps={steps} answers={answers} onBack={handleBack} onSend={handleSend} sending={sending} />
      ) : (
        <ItemStep
          key={steps[currentStep].codRegistro}
          stepData={steps[currentStep]}
          savedAnswer={answers[steps[currentStep].codRegistro]}
          isFirst={currentStep === 0}
          onNext={handleItemNext}
          onBack={handleBack}
          onCancel={action_cancel}
        />
      )}
    </div>
  );
};

export default QuoteToCountryForm;
