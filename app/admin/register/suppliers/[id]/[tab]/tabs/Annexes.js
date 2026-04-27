'use client';
// Tab: Anexos — basado en captura 4
// Izquierda: Marcas del proveedor (agregar/eliminar)
// Derecha: Países asignados al proveedor (agregar/eliminar, select + All checkbox)
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPlus from '@/components/icon/icon-plus';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

export default function Annexes() {
  const { proveedor, annexes, setAnnexes, loadAnnexes, setLoadAnnexes } = useSupplier();
  const t = useTranslation();

  // Marcas
  const [marcas,         setMarcas]         = useState([]);   // marcas del proveedor
  const [allMarcas,      setAllMarcas]       = useState([]);   // todas las marcas (para async)
  const [selectedMarca,  setSelectedMarca]   = useState(null);
  const [addingMarca,    setAddingMarca]     = useState(false);

  // Países
  const [paises,         setPaises]          = useState([]);   // países del proveedor
  const [paisOptions,    setPaisOptions]      = useState([]);   // todas las opciones
  const [selectedPais,   setSelectedPais]    = useState(null);
  const [allPaises,      setAllPaises]       = useState(false);
  const [addingPais,     setAddingPais]      = useState(false);

  useEffect(() => {
    if (!loadAnnexes) return;
    axiosClient.get(`/proveedores/${proveedor.codProveedor}/anexos`)
      .then(res => {
        const data = res.data ?? {};
        setMarcas(data.marcasProveedor ?? []);
        setAllMarcas(data.marcas ?? []);
        setPaises(data.paisesProveedor ?? []);
        setPaisOptions(data.paises ?? []);
        setAllPaises(data.allPaises ?? false);
        setAnnexes(data);
      })
      .catch(() => {})
      .finally(() => setLoadAnnexes(false));
  }, []);

  if (loadAnnexes) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Marcas ────────────────────────────────────────────────────────────────
  const loadMarcaOptions = (inputValue, callback) => {
    if (!inputValue || inputValue.length < 2) { callback([]); return; }
    const q = inputValue.toLowerCase();
    callback(allMarcas.filter(m => m.label.toLowerCase().includes(q)));
  };

  const handleAddMarca = async () => {
    if (!selectedMarca) {
      Toast.fire({ icon: 'warning', title: t.required_select }); return;
    }
    setAddingMarca(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/marcas/agregar`, {
        codMarca: selectedMarca.value,
      });
      setMarcas(res.data ?? []);
      setSelectedMarca(null);
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.brand_save_error;
      Toast.fire({ icon: 'error', title: msg });
    } finally {
      setAddingMarca(false);
    }
  };

  const handleDeleteMarca = (codRegistro) => {
    Swal.fire({
      title: t.question_delete_brand,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/marcas/eliminar`, { codRegistro });
        setMarcas(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.brand_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.brand_error_deleted });
      }
    });
  };

  // ── Países ─────────────────────────────────────────────────────────────────
  const handleAddPais = async () => {
    if (!selectedPais) {
      Toast.fire({ icon: 'warning', title: t.required_select }); return;
    }
    setAddingPais(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/paises/agregar`, {
        codPais: selectedPais.value,
      });
      setPaises(res.data ?? []);
      setSelectedPais(null);
    } catch (err) {
      const msg = err?.response?.data?.message ?? t.country_error_save;
      Toast.fire({ icon: 'error', title: msg });
    } finally {
      setAddingPais(false);
    }
  };

  const handleDeletePais = (codRegistro) => {
    Swal.fire({
      title: t.question_delete_record,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/paises/eliminar`, { codRegistro });
        setPaises(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.record_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.record_deleted_error });
      }
    });
  };

  const handleToggleAll = async (checked) => {
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codProveedor}/paises/all`, {
        allPaises: checked,
      });
      setAllPaises(checked);
      setPaises(res.data ?? []);
    } catch {
      Toast.fire({ icon: 'error', title: t.record_updated_error });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.anexos}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── MARCAS ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.brands}</h3>

          {/* Agregar marca */}
          <div className="flex gap-2">
            <div className="flex-1">
              <AsyncSelect
                value={selectedMarca}
                onChange={setSelectedMarca}
                loadOptions={loadMarcaOptions}
                defaultOptions={false}
                isClearable
                cacheOptions
                placeholder="Escribe 2+ caracteres..."
                instanceId="async-select-marca-supplier"
                classNamePrefix="react-select"
                filterOption={false}
                noOptionsMessage={({ inputValue }) =>
                  !inputValue || inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados'
                }
              />
            </div>
            <button
              type="button"
              onClick={handleAddMarca}
              disabled={addingMarca || !selectedMarca}
              className="flex items-center gap-1.5 btn btn-primary shrink-0 disabled:opacity-50"
            >
              <IconPlus className="h-3.5 w-3.5" />
              + Mark
            </button>
          </div>

          {/* Lista marcas */}
          <div className="min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {marcas.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6 text-sm text-gray-400">
                {t.record_empty}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {marcas.map((m) => (
                  <li key={m.codRegistro ?? m.codMarca}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                    <span className="text-gray-800 dark:text-gray-200">{m.nomMarca}</span>
                    <button
                      onClick={() => handleDeleteMarca(m.codRegistro)}
                      className="p-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <IconTrashLines className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── PAÍSES ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.country}</h3>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={allPaises}
                onChange={e => handleToggleAll(e.target.checked)}
                className="form-checkbox"
              />
              All
            </label>
          </div>

          {/* Agregar país */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={selectedPais}
                onChange={setSelectedPais}
                options={paisOptions}
                isClearable
                placeholder={t.select_option}
                instanceId="select-pais-supplier"
                classNamePrefix="react-select"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPais}
              disabled={addingPais || !selectedPais}
              className="flex items-center gap-1.5 btn btn-primary shrink-0 disabled:opacity-50"
            >
              <IconPlus className="h-3.5 w-3.5" />
              + Country
            </button>
          </div>

          {/* Lista países */}
          <div className="min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {paises.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6 text-sm text-gray-400">
                {t.record_empty}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left w-6"></th>
                    <th className="px-3 py-2 text-left">{t.country}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paises.map((p) => (
                    <tr key={p.codRegistro ?? p.codPais} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDeletePais(p.codRegistro)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <IconTrashLines className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200 font-medium">
                        {p.nomPais}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}