'use client';
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError, swalConfirm } from '@/app/lib/swal';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPlus from '@/components/icon/icon-plus';

export default function Annexes() {
  const { proveedor, annexes, setAnnexes, loadAnnexes, setLoadAnnexes } = useSupplier();
  const t = useTranslation();

  const [marcas,        setMarcas]        = useState([]);
  const [allMarcas,     setAllMarcas]     = useState([]);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [addingMarca,   setAddingMarca]   = useState(false);

  const [paises,        setPaises]        = useState([]);
  const [paisOptions,   setPaisOptions]   = useState([]);
  const [selectedPais,  setSelectedPais]  = useState(null);
  const [addingPais,    setAddingPais]    = useState(false);
  const [paisFilter,    setPaisFilter]    = useState('');
  const [allCountries,  setAllCountries]  = useState(false);
  const [excludedPaises, setExcludedPaises] = useState([]);
  const [selectedPaisesToDelete, setSelectedPaisesToDelete] = useState([]);
  const [deletingPaises, setDeletingPaises] = useState(false);

  useEffect(() => {
    if (!loadAnnexes) {
      setMarcas(annexes.marcasProveedor ?? []);
      setAllMarcas((annexes.marcasSistema ?? []).filter(m => m.label));
      setPaises(annexes.paisesProveedor ?? []);
      setPaisOptions((annexes.paisesSistema ?? []).filter(p => p.label));
      return;
    }
    axiosClient.get(`/proveedores/${proveedor.codPrv}/anexos`)
      .then(res => {
        const data = res.data ?? {};
        setMarcas(data.marcasProveedor ?? []);
        setAllMarcas((data.marcasSistema ?? []).filter(m => m.label));
        setPaises(data.paisesProveedor ?? []);
        setPaisOptions((data.paisesSistema ?? []).filter(p => p.label));
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

  // ── Marcas ─────────────────────────────────────────────────────────────────
  const loadMarcaOptions = (inputValue, callback) => {
    if (!inputValue || inputValue.length < 2) { callback([]); return; }
    const q = inputValue.toLowerCase();
    callback(allMarcas.filter(m => m.label.toLowerCase().includes(q)));
  };

  const handleAddMarca = async () => {
    if (!selectedMarca) {
      swalError(t.required_select); return;
    }
    setAddingMarca(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/marcas/guardar`, {
        codMarca: selectedMarca.value,
      });
      setMarcas(res.data ?? []);
      setSelectedMarca(null);
      swalSuccess(t.brand_save_success);
    } catch (err) {
      swalError(t.error, err?.response?.data?.message ?? t.brand_save_error);
    } finally {
      setAddingMarca(false);
    }
  };

  const handleDeleteMarca = async (codRegistro) => {
    const result = await swalConfirm(t.question_delete_brand, '', {
      confirmText: t.yes_delete, cancelText: t.btn_cancel, confirmColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await axiosClient.delete(`/proveedores/${proveedor.codPrv}/marcas/eliminar`, {
        data: { codRegistro },
      });
      setMarcas(res.data ?? []);
      swalSuccess(t.brand_deleted);
    } catch {
      swalError(t.error, t.brand_error_deleted);
    }
  };

  // ── Países ─────────────────────────────────────────────────────────────────
  const handleAddPais = async () => {
    if (!selectedPais) {
      swalError(t.required_select); return;
    }
    setAddingPais(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/paises/guardar`, {
        todos: false,
        paises: [selectedPais.value],
      });
      setPaises(res.data ?? []);
      setSelectedPais(null);
      swalSuccess(t.country_success_save);
    } catch (err) {
      swalError(t.error, err?.response?.data?.message ?? t.country_error_save);
    } finally {
      setAddingPais(false);
    }
  };

  // Estimación en el front de cuántos países entrarían — solo para mostrar el
  // contador en el botón, el backend resuelve el universo real con { todos, paises }
  const getPaisesPendientes = () => {
    const excludedCodes   = new Set(excludedPaises.map(p => p.value));
    const registeredCodes = new Set(paises.map(p => p.codPais));
    return paisOptions.filter(p => !excludedCodes.has(p.value) && !registeredCodes.has(p.value));
  };
  const paisesPendientes = allCountries ? getPaisesPendientes() : [];

  const handleAddAllPaises = async () => {
    setAddingPais(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/paises/guardar`, {
        todos: true,
        paises: excludedPaises.map(p => p.value),
      });
      setPaises(res.data ?? []);
      setAllCountries(false);
      setExcludedPaises([]);
      swalSuccess(t.country_success_save);
    } catch (err) {
      swalError(t.error, err?.response?.data?.message ?? t.country_error_save);
    } finally {
      setAddingPais(false);
    }
  };

  const togglePaisSelected = (codPais) => {
    setSelectedPaisesToDelete(prev =>
      prev.includes(codPais) ? prev.filter(c => c !== codPais) : [...prev, codPais]
    );
  };

  const toggleSelectAllFiltered = (checked, filteredList) => {
    const filteredCodes = filteredList.map(p => p.codPais);
    setSelectedPaisesToDelete(prev =>
      checked
        ? Array.from(new Set([...prev, ...filteredCodes]))
        : prev.filter(c => !filteredCodes.includes(c))
    );
  };

  const handleDeleteSelectedPaises = async () => {
    if (selectedPaisesToDelete.length === 0) return;
    const isAll = selectedPaisesToDelete.length === paises.length;
    const result = await swalConfirm(t.question_delete_record, '', {
      confirmText: t.yes_delete, cancelText: t.btn_cancel, confirmColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    setDeletingPaises(true);
    try {
      const res = await axiosClient.delete(`/proveedores/${proveedor.codPrv}/paises/eliminar`, {
        data: isAll ? { todos: true, paises: [] } : { todos: false, paises: selectedPaisesToDelete },
      });
      setPaises(res.data ?? []);
      setSelectedPaisesToDelete([]);
      swalSuccess(t.record_deleted);
    } catch {
      swalError(t.error, t.record_deleted_error);
    } finally {
      setDeletingPaises(false);
    }
  };

  const filteredPaises = paisFilter
    ? paises.filter(p => p.nomPais?.toLowerCase().includes(paisFilter.toLowerCase()))
    : paises;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t.anexos}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── MARCAS ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-secondary/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-secondary">{t.brands}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
              {marcas.length}
            </span>
          </div>

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
                  !inputValue || inputValue.length < 2
                    ? 'Escribe al menos 2 caracteres'
                    : 'Sin resultados'
                }
              />
            </div>
            <button
              type="button"
              onClick={handleAddMarca}
              disabled={addingMarca || !selectedMarca}
              className="group flex items-center gap-1.5 btn btn-secondary shrink-0 disabled:opacity-50"
            >
              <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              {t.btn_add}
            </button>
          </div>

          <div className="min-h-[80px] max-h-52 overflow-y-auto rounded-lg border border-secondary/20 dark:border-secondary/20">
            {marcas.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-gray-400">
                {t.record_empty}
              </div>
            ) : (
              <ul className="divide-y divide-secondary/10 dark:divide-secondary/10">
                {marcas.map((m) => (
                  <li
                    key={m.codRegistro ?? m.codMarca}
                    className="flex items-center justify-between px-3 py-2 hover:bg-secondary/5 text-sm"
                  >
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
        <div className="rounded-xl border border-info/30 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-info">{t.country}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-info/10 text-info">
              {paises.length}
            </span>
          </div>

          {/* Todos los países + excluir — bloque propio, diferenciado del resto */}
          <div className={`rounded-lg border transition-colors ${
            allCountries
              ? 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 p-3 space-y-3'
              : 'border-transparent p-0'
          }`}>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={allCountries}
                onChange={(e) => {
                  setAllCountries(e.target.checked);
                  setExcludedPaises([]);
                  setSelectedPais(null);
                }}
                className="form-checkbox h-4 w-4 text-amber-500 focus:ring-amber-400"
              />
              Todos los países
            </label>

            {allCountries && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-amber-700 dark:text-amber-400">
                  Excluir países
                </label>
                <Select
                  isMulti
                  value={excludedPaises}
                  onChange={(opts) => setExcludedPaises(opts ?? [])}
                  options={paisOptions}
                  placeholder="Selecciona países a excluir..."
                  instanceId="select-pais-excluidos-supplier"
                  classNamePrefix="react-select"
                  styles={{
                    multiValue: (base) => ({ ...base, backgroundColor: '#fde68a' }),
                    multiValueLabel: (base) => ({ ...base, color: '#92400e', fontWeight: 600 }),
                    multiValueRemove: (base) => ({
                      ...base, color: '#92400e',
                      ':hover': { backgroundColor: '#f59e0b', color: '#fff' },
                    }),
                  }}
                />
              </div>
            )}

            <div className="flex gap-2">
              {!allCountries && (
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
              )}
              <button
                type="button"
                onClick={allCountries ? handleAddAllPaises : handleAddPais}
                disabled={addingPais || (allCountries ? paisesPendientes.length === 0 : !selectedPais)}
                className={`group flex items-center gap-1.5 btn disabled:opacity-50 ${
                  allCountries ? 'btn-warning w-full justify-center' : 'btn-info shrink-0'
                }`}
              >
                <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                {allCountries ? `${t.btn_add} (${paisesPendientes.length})` : t.btn_add}
              </button>
            </div>
          </div>

          {/* Países registrados: filtro + selección + lista comparten un mismo contenedor */}
          <div className="rounded-lg border border-info/20 dark:border-info/20 overflow-hidden">
            <input
              type="text"
              value={paisFilter}
              onChange={(e) => setPaisFilter(e.target.value)}
              placeholder="Filtrar países registrados..."
              className="form-input h-8 text-xs w-full rounded-none border-0 border-b border-info/20 dark:border-info/20 focus:ring-0"
            />

            {paises.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-info/20 dark:border-info/20 bg-info/5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filteredPaises.length > 0 && filteredPaises.every(p => selectedPaisesToDelete.includes(p.codPais))}
                    onChange={(e) => toggleSelectAllFiltered(e.target.checked, filteredPaises)}
                    className="form-checkbox h-3.5 w-3.5 text-info focus:ring-info"
                  />
                  Todo
                </label>
                <button
                  type="button"
                  onClick={handleDeleteSelectedPaises}
                  disabled={selectedPaisesToDelete.length === 0 || deletingPaises}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconTrashLines className="h-3.5 w-3.5" />
                  {t.btn_delete}{selectedPaisesToDelete.length > 0 && ` (${selectedPaisesToDelete.length})`}
                </button>
              </div>
            )}

            <div className="min-h-[80px] max-h-52 overflow-y-auto">
              {paises.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-sm text-gray-400">
                  {t.record_empty}
                </div>
              ) : filteredPaises.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-sm text-gray-400">
                  Sin resultados para &quot;{paisFilter}&quot;
                </div>
              ) : (
                <ul className="divide-y divide-info/10 dark:divide-info/10">
                  {filteredPaises.map((p) => (
                    <li
                      key={p.codRegistro ?? p.codPais}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-info/5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPaisesToDelete.includes(p.codPais)}
                        onChange={() => togglePaisSelected(p.codPais)}
                        className="form-checkbox h-3.5 w-3.5 text-info focus:ring-info shrink-0"
                      />
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{p.nomPais}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
