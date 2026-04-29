'use client';
// Tab: Fórmula — basado en capturas 6, 7 y 8
import { useEffect, useState } from 'react';
import { useSupplier } from '../../SupplierContext';
import { useTranslation } from '@/app/locales';
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import ImportFormulaForm from '@/components/forms/formula-import-form';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencil from '@/components/icon/icon-pencil';

export default function Formula() {
  const {
    proveedor,
    formula,     setFormula,
    variables,   setVariables,
    loadFormula, setLoadFormula,
  } = useSupplier();

  const t     = useTranslation();
  const token = useSelector(selectToken);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loadFormula) return;
    axiosClient.get(`/proveedores/${proveedor.codPrv}/formula`)
      .then(res => {
        const data = res.data ?? {};
        setFormula(data.formula ?? null);
        setVariables(data.variables ?? []);
      })
      .catch(() => {
        setFormula(null);
        setVariables([]);
      })
      .finally(() => setLoadFormula(false));
  }, []);

  if (loadFormula) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleDelete = () => {
    Swal.fire({
      title: t.question_delete_formula,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await axiosClient.delete(`/proveedores/${proveedor.codPrv}/formula/eliminar`);
        setFormula(null);
        setVariables([]);
        Swal.fire({
          position: 'top-end', icon: 'success',
          title: t.formula_deleted,
          showConfirmButton: false, timer: 1500,
        });
      } catch {
        Swal.fire({
          title: t.error, text: t.formula_error_server,
          icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close,
        });
      }
    });
  };

  // ── Vista ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {t.import_formula}
      </h2>

      {showForm ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6">
          <ImportFormulaForm
            vars={variables}
            formula={formula ?? ''}
            setFormula={setFormula}
            updateVariables={setVariables}
            action_cancel={() => setShowForm(false)}
            supplier={{ CodPrv: proveedor.codPrv }}
            token={token}
            t={t}
          />
        </div>
      ) : (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-8 flex flex-col items-center gap-6">

        {/* Fórmula actual */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">{t.import_formula}</p>
          <span className={`inline-block rounded-xl px-6 py-4 text-lg font-mono font-semibold shadow-sm
            ${formula
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
            }`}>
            {formula ?? t.supplier_without_formula}
          </span>
        </div>

        {/* Tabla de variables actuales */}
        {variables.length > 0 && (
          <div className="w-full max-w-md overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Variable</th>
                  <th className="px-3 py-2 text-left">{t.value}</th>
                  <th className="px-3 py-2 text-left">{t.variable_type}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {variables.map((v, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono">{v.variable}</td>
                    <td className="px-3 py-2 text-gray-500">{v.valor}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                        ${v.tipoVariable === 'DINAMICA'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-secondary/10 text-secondary'}`}>
                        {v.tipoVariable}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {formula && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 btn btn-outline-danger"
            >
              <IconTrashLines className="h-4 w-4" />
              {t.btn_delete}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 btn btn-success"
          >
            <IconPencil className="h-4 w-4" />
            {formula ? t.edit_formula : t.create_formula}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}