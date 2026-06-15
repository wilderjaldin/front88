'use client';
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import Select from 'react-select';
import IconPlus from '@/components/icon/icon-plus';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconCaretDown from '@/components/icon/icon-caret-down';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function Freight() {
  const { proveedor, freight, setFreight, loadFreight, setLoadFreight } = useSupplier();
  const t = useTranslation();

  const [asignados,         setAsignados]         = useState([]);
  const [tiposProceso,      setTiposProceso]      = useState([]);
  const [selectedTipo,      setSelectedTipo]      = useState(null);
  const [zonaOptions,       setZonaOptions]       = useState([]);
  const [loadingZonas,      setLoadingZonas]      = useState(false);
  const [selectedZona,      setSelectedZona]      = useState(null);
  const [adding,            setAdding]            = useState(false);
  const [openItems,         setOpenItems]         = useState(new Set());

  useEffect(() => {
    if (!loadFreight) {
      setAsignados(freight.asignados ?? []);
      setTiposProceso(freight.tiposProceso ?? []);
      return;
    }
    axiosClient.get(`/proveedores/${proveedor.codPrv}/fletes`)
      .then(res => {
        const data = res.data ?? {};
        setAsignados(data.asignados ?? []);
        setTiposProceso(data.tiposProceso ?? []);
        setFreight(data);
      })
      .catch(() => {})
      .finally(() => setLoadFreight(false));
  }, []);

  if (loadFreight) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleTipoChange = async (option) => {
    setSelectedTipo(option);
    setSelectedZona(null);
    setZonaOptions([]);
    if (!option) return;
    setLoadingZonas(true);
    try {
      const res = await axiosClient.get(
        `/proveedores/${proveedor.codPrv}/fletes/disponibles?tipProceso=${option.value}`
      );
      setZonaOptions((res.data ?? []).map(z => ({ value: z.codFlete, label: z.zonaFlete, detalles: z.detalles })));
    } catch {
      Toast.fire({ icon: 'error', title: t.freight_zone_load_error ?? 'Error al cargar zonas' });
    } finally {
      setLoadingZonas(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedZona) {
      Toast.fire({ icon: 'warning', title: t.required_select }); return;
    }
    setAdding(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/fletes/guardar`, {
        codFlete: selectedZona.value,
      });
      const list = res.data ?? [];
      setAsignados(list);
      setFreight(prev => ({ ...prev, asignados: list }));
      setSelectedTipo(null);
      setSelectedZona(null);
      setZonaOptions([]);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? t.freight_zone_add_error });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (codFlete, nombre) => {
    Swal.fire({
      title: t.question_delete_freight_zone ?? `¿Eliminar "${nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.delete(`/proveedores/${proveedor.codPrv}/fletes/eliminar`, {
          data: { codFlete },
        });
        const list = res.data ?? [];
        setAsignados(list);
        setFreight(prev => ({ ...prev, asignados: list }));
        setOpenItems(prev => { const s = new Set(prev); s.delete(codFlete); return s; });
        Toast.fire({ icon: 'success', title: t.freight_zone_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.freight_zone_deleted_error });
      }
    });
  };

  const toggleItem = (codFlete) => {
    setOpenItems(prev => {
      const s = new Set(prev);
      s.has(codFlete) ? s.delete(codFlete) : s.add(codFlete);
      return s;
    });
  };

  const allOpen = asignados.length > 0 && openItems.size === asignados.length;
  const toggleAll = () => {
    setOpenItems(allOpen ? new Set() : new Set(asignados.map(a => a.codFlete)));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {t.freight_supplier}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Panel izquierdo: controles */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4">

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.process_Type}
            </label>
            <Select
              value={selectedTipo}
              onChange={handleTipoChange}
              options={tiposProceso}
              isClearable
              placeholder={t.select_option}
              instanceId="select-tipo-proceso-freight"
              classNamePrefix="react-select"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.zone_cost}
            </label>
            <Select
              value={selectedZona}
              onChange={setSelectedZona}
              options={zonaOptions}
              isClearable
              isLoading={loadingZonas}
              isDisabled={!selectedTipo}
              placeholder={selectedTipo ? t.select_option : '— selecciona proceso primero —'}
              instanceId="select-zona-flete-freight"
              classNamePrefix="react-select"
            />
          </div>

          {/* Preview detalles de la zona seleccionada */}
          {selectedZona && selectedZona.detalles?.length > 0 && (
            <div className="rounded-lg border border-primary/20 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-primary/5 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-right">{t.initial_weight ?? 'Peso Ini.'}</th>
                    <th className="px-3 py-2 text-right">{t.final_weight ?? 'Peso Fin.'}</th>
                    <th className="px-3 py-2 text-right">{t.cost_per_pound ?? 'Costo/lb'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {selectedZona.detalles.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.pesoInicial}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.pesoFinal}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.costoLibra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !selectedZona}
              className="group flex items-center gap-2 btn btn-primary disabled:opacity-50"
            >
              {adding ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.saving_data}
                </>
              ) : (
                <>
                  <IconPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  {t.btn_add}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel derecho: acordeón */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 overflow-hidden">

          {asignados.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              {t.record_empty}
            </div>
          ) : (
            <>
              {/* header con expand all */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {asignados.length} {asignados.length === 1 ? 'zona' : 'zonas'}
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {allOpen ? t.collapse_all ?? 'Contraer todo' : t.expand_all ?? 'Expandir todo'}
                </button>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
                {asignados.map((a) => {
                  const isOpen = openItems.has(a.codFlete);
                  return (
                    <div key={a.codFlete}>
                      {/* accordion header */}
                      <button
                        type="button"
                        onClick={() => toggleItem(a.codFlete)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition text-left"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {a.zonaFlete}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">{a.nomPais}</span>
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {a.proceso}
                            </span>
                            <span className="text-xs text-gray-400">
                              min: <span className="font-medium text-gray-600 dark:text-gray-300">${a.costoMin}</span>
                            </span>
                          </div>
                        </div>
                        <IconCaretDown
                          className={`h-4 w-4 shrink-0 ml-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* accordion body */}
                      {isOpen && (
                        <div className="px-4 pb-3 space-y-3">
                          {a.detalles?.length > 0 ? (
                            <table className="w-full text-xs border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                                <tr>
                                  <th className="px-3 py-2 text-center">#</th>
                                  <th className="px-3 py-2 text-right">{t.initial_weight ?? 'Peso Ini.'}</th>
                                  <th className="px-3 py-2 text-right">{t.final_weight ?? 'Peso Fin.'}</th>
                                  <th className="px-3 py-2 text-right">{t.cost_per_pound ?? 'Costo/lb'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {a.detalles.map((d) => (
                                  <tr key={d.numCor} className="hover:bg-gray-100 dark:hover:bg-gray-700/60">
                                    <td className="px-3 py-1.5 text-center text-gray-400">{d.numCor}</td>
                                    <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.pesoInicial}</td>
                                    <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.pesoFinal}</td>
                                    <td className="px-3 py-1.5 text-right text-gray-600 dark:text-gray-300">{d.costoLibra}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-gray-400">{t.record_empty}</p>
                          )}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDelete(a.codFlete, a.zonaFlete)}
                              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition"
                            >
                              <IconTrashLines className="h-3.5 w-3.5" />
                              {t.btn_delete}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
