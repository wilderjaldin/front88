'use client';
// Tab: Costo Flete — basado en captura 5
// Process Type (select), Freight Zone (select), tabla de rangos de flete
// Botones: Add, Delete, Cancel
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import Select from 'react-select';
import IconTrashLines from '@/components/icon/icon-trash-lines';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function Freight() {
  const { proveedor, freight, setFreight, loadFreight, setLoadFreight } = useSupplier();
  const t = useTranslation();

  const [processTypeOptions, setProcessTypeOptions] = useState([]);
  const [freightZoneOptions,  setFreightZoneOptions]  = useState([]);
  const [selectedProcessType, setSelectedProcessType] = useState(null);
  const [selectedZone,        setSelectedZone]        = useState(null);
  const [selectedRow,         setSelectedRow]         = useState(null);
  const [adding,              setAdding]              = useState(false);

  useEffect(() => {
    if (!loadFreight) return;
    axiosClient.get(`/proveedores/${proveedor.codProveedor}/flete`)
      .then(res => {
        const data = res.data ?? {};
        setFreight(data.fletes ?? []);
        setProcessTypeOptions(data.processTypes ?? []);
        setFreightZoneOptions(data.freightZones ?? []);
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

  const handleAdd = async () => {
    if (!selectedProcessType || !selectedZone) {
      Toast.fire({ icon: 'warning', title: t.required_select }); return;
    }
    // Validar que no exista combinación
    const exists = freight.some(
      f => f.codProceso === selectedProcessType.value && f.codZona === selectedZone.value
    );
    if (exists) {
      Toast.fire({ icon: 'warning', title: t.freight_zone_exist_error }); return;
    }

    setAdding(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/flete/agregar`, {
        codProceso: selectedProcessType.value,
        codZona:    selectedZone.value,
      });
      setFreight(res.data ?? []);
      setSelectedProcessType(null);
      setSelectedZone(null);
      Toast.fire({ icon: 'success', title: t.freight_zone_add });
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.freight_zone_add_error;
      Toast.fire({ icon: 'error', title: msg });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = () => {
    if (!selectedRow) {
      Toast.fire({ icon: 'warning', title: 'Selecciona un registro para eliminar' }); return;
    }
    Swal.fire({
      title: t.question_delete_freight_zone,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/flete/eliminar`, {
          codRegistro: selectedRow,
        });
        setFreight(res.data ?? []);
        setSelectedRow(null);
        Toast.fire({ icon: 'success', title: t.freight_zone_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.freight_zone_deleted_error });
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {t.freight_supplier} — USA Freight Cost
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Panel izquierdo: controls */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.process_Type}
            </label>
            <Select
              value={selectedProcessType}
              onChange={setSelectedProcessType}
              options={processTypeOptions}
              isClearable
              placeholder={t.select_option}
              instanceId="select-process-type"
              classNamePrefix="react-select"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.zone_cost}
            </label>
            <Select
              value={selectedZone}
              onChange={setSelectedZone}
              options={freightZoneOptions}
              isClearable
              placeholder={t.select_option}
              instanceId="select-freight-zone"
              classNamePrefix="react-select"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="btn btn-primary disabled:opacity-50 flex-1"
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.saving_data}
                </span>
              ) : t.btn_add}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedRow}
              className="btn btn-outline-danger disabled:opacity-50"
            >
              {t.btn_delete}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedProcessType(null); setSelectedZone(null); setSelectedRow(null); }}
              className="btn btn-outline-secondary"
            >
              {t.btn_cancel}
            </button>
          </div>
        </div>

        {/* Panel derecho: tabla de fletes */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {freight.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              {t.record_empty}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-3 text-left">{t.process_Type}</th>
                  <th className="px-3 py-3 text-left">{t.zone_cost}</th>
                  <th className="px-3 py-3 text-left">{t.initial_weight}</th>
                  <th className="px-3 py-3 text-left">{t.final_weight}</th>
                  <th className="px-3 py-3 text-left">{t.cost_per_pound}</th>
                  <th className="px-3 py-3 text-left">{t.minimum_cost}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {freight.map((f) => (
                  <tr
                    key={f.codRegistro}
                    onClick={() => setSelectedRow(f.codRegistro)}
                    className={`cursor-pointer transition ${
                      selectedRow === f.codRegistro
                        ? 'bg-primary/10 dark:bg-primary/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{f.tipProceso}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{f.nomZona}</td>
                    <td className="px-3 py-2 text-gray-500">{f.pesoInicial}</td>
                    <td className="px-3 py-2 text-gray-500">{f.pesoFinal}</td>
                    <td className="px-3 py-2 text-gray-500">{f.costoPorLibra}</td>
                    <td className="px-3 py-2 text-gray-500">{f.costoMinimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}