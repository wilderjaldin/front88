'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@/app/locales';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconX from '@/components/icon/icon-x';

const URL_LIST = '/tipocambios';
const URL_SAVE = '/tipocambios/guardar';
const URL_EDIT = '/tipocambios/editar';

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ExchangeRate() {
  const t = useTranslation();
  useDynamicTitle(`${t.register} | ${t.exchange_rate}`);

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { fecCam: today(), tipCam: '' } });

  useEffect(() => {
    axiosClient.get(URL_LIST)
      .then(res => {
        setRows(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (row) => {
    setEditRow(row);
    reset({ fecCam: row.fecCam, tipCam: row.tipCam });
  };

  const cancelEdit = () => {
    setEditRow(null);
    reset({ fecCam: today(), tipCam: '' });
  };

  const onSubmit = async (data) => {
    const payload = { fecCam: data.fecCam, tipCam: parseFloat(data.tipCam) };
    try {
      if (editRow) {
        const res = await axiosClient.put(URL_EDIT, payload);
        setRows(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        Toast.fire({ icon: 'success', title: 'Tipo de cambio actualizado' });
      } else {
        const res = await axiosClient.post(URL_SAVE, payload);
        setRows(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        Toast.fire({ icon: 'success', title: t.currency_save });
      }
      cancelEdit();
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? t.currency_save_error });
    }
  };

  const isEditing = !!editRow;

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <ul className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <li>{t.register}</li>
        <li className="before:content-['/'] before:mx-2">{t.exchange_rate}</li>
      </ul>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {t.exchange_rate}
          </h1>
          {!loading && (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {total}
            </span>
          )}
        </div>
        <div className="h-1 w-12 rounded bg-primary/70 mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── FORM ──────────────────────────────────────────────────────────── */}
        <div className={`lg:col-span-2 rounded-xl border bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-5 transition-colors
          ${isEditing ? 'border-warning/40' : 'border-primary/30'}`}>

          {/* Form header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-sm font-semibold ${isEditing ? 'text-warning' : 'text-primary'}`}>
                {isEditing ? 'Editando registro' : 'Nuevo registro'}
              </h2>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Solo se puede modificar el valor del tipo de cambio
                </p>
              )}
            </div>
            {isEditing && (
              <button type="button" onClick={cancelEdit}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.date} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              disabled={isEditing}
              {...register('fecCam', { required: t.required_field })}
              className={`form-input w-full ${isEditing ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}`}
            />
            {errors.fecCam && <p className="text-xs text-red-500">{errors.fecCam.message}</p>}
          </div>

          {/* Tipo de Cambio */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.exchange_rate} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              {...register('tipCam', {
                required: t.required_field,
                min: { value: 0.0001, message: 'Debe ser mayor a 0' },
                pattern: { value: /^\d+(\.\d{1,4})?$/, message: 'Máximo 4 decimales' },
              })}
              className="form-input w-full"
              placeholder="0.0000"
            />
            {errors.tipCam && <p className="text-xs text-red-500">{errors.tipCam.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2
                         text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {t.btn_cancel}
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`flex-1 btn disabled:opacity-50 ${isEditing ? 'btn-warning' : 'btn-success'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.updating}
                </span>
              ) : isEditing ? t.btn_update : t.btn_add}
            </button>
          </div>

        </div>

        {/* ── LIST ──────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Sin registros
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">{t.date}</th>
                    <th className="px-4 py-3 text-left">País</th>
                    <th className="px-4 py-3 text-right">{t.exchange_rate}</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {rows.map((r) => {
                    const isSelected = editRow?.fecCam === r.fecCam;
                    return (
                      <tr
                        key={r.fecCam}
                        className={`transition-colors
                          ${isSelected ? 'bg-warning/8 dark:bg-warning/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      >
                        {/* Fecha */}
                        <td className="px-4 py-3">
                          <span className="text-gray-600 dark:text-gray-300">{fmtDate(r.fecCam)}</span>
                        </td>

                        {/* País */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {r.codPais && (
                              <img
                                src={`/assets/flags/${r.codPais.toLowerCase()}.svg`}
                                alt={r.codPais}
                                className="h-4 w-5 rounded-sm object-cover border border-gray-200 dark:border-gray-600 shrink-0"
                              />
                            )}
                            <span className="text-gray-600 dark:text-gray-300">{r.nomPais ?? r.codPais ?? '—'}</span>
                          </div>
                        </td>

                        {/* Tipo de cambio */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold tabular-nums text-gray-800 dark:text-white">
                            {Number(r.tipCam).toFixed(4)}
                          </span>
                        </td>

                        {/* Acción */}
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            title="Editar tipo de cambio"
                            className="p-1.5 rounded-md text-gray-400 hover:bg-warning/10 hover:text-warning transition"
                          >
                            <IconPencilPaper className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
