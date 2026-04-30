'use client';
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

  const [marcas,        setMarcas]        = useState([]);
  const [allMarcas,     setAllMarcas]     = useState([]);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [addingMarca,   setAddingMarca]   = useState(false);

  const [paises,        setPaises]        = useState([]);
  const [paisOptions,   setPaisOptions]   = useState([]);
  const [selectedPais,  setSelectedPais]  = useState(null);
  const [addingPais,    setAddingPais]    = useState(false);

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
      Toast.fire({ icon: 'warning', title: t.required_select }); return;
    }
    setAddingMarca(true);
    try {
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/marcas/guardar`, {
        codMarca: selectedMarca.value,
      });
      setMarcas(res.data ?? []);
      setSelectedMarca(null);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? t.brand_save_error });
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
        const res = await axiosClient.delete(`/proveedores/${proveedor.codPrv}/marcas/eliminar`, {
          data: { codRegistro },
        });
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
      const res = await axiosClient.post(`/proveedores/${proveedor.codPrv}/paises/guardar`, {
        codPais: selectedPais.value,
      });
      setPaises(res.data ?? []);
      setSelectedPais(null);
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? t.country_error_save });
    } finally {
      setAddingPais(false);
    }
  };

  const handleDeletePais = (codPais) => {
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
        const res = await axiosClient.delete(`/proveedores/${proveedor.codPrv}/paises/eliminar`, {
          data: { codPais },
        });
        setPaises(res.data ?? []);
        Toast.fire({ icon: 'success', title: t.record_deleted });
      } catch {
        Toast.fire({ icon: 'error', title: t.record_deleted_error });
      }
    });
  };

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
              className="group flex items-center gap-1.5 btn btn-info shrink-0 disabled:opacity-50"
            >
              <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              {t.btn_add}
            </button>
          </div>

          <div className="min-h-[80px] max-h-52 overflow-y-auto rounded-lg border border-info/20 dark:border-info/20">
            {paises.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-gray-400">
                {t.record_empty}
              </div>
            ) : (
              <ul className="divide-y divide-info/10 dark:divide-info/10">
                {paises.map((p) => (
                  <li
                    key={p.codRegistro ?? p.codPais}
                    className="flex items-center justify-between px-3 py-2 hover:bg-info/5 text-sm"
                  >
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{p.nomPais}</span>
                    <button
                      onClick={() => handleDeletePais(p.codPais)}
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

      </div>
    </div>
  );
}
