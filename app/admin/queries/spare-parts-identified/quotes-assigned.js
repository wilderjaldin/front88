'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import Modal from '@/components/modal';
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError, swalConfirm } from '@/app/lib/swal';
import IconBackSpace from '@/components/icon/icon-backspace';
import Link from 'next/link';
import Assigned from './assigned';

const URL_SAVE_NOTE = 'repuestosporidentificar/guardar-notas';
const URL_DELETE    = 'repuestosporidentificar/eliminar-items';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const QuotesAssigned = ({ t, data, unassignOrder, setOrdersAssigned, setOrdersUnassigned }) => {
  const [selected,      setSelected]      = useState([]);
  const [filter,        setFilter]        = useState('');
  const [page,          setPage]          = useState(1);
  const [notesDirty,    setNotesDirty]    = useState(false);
  const [show_modal,    setShowModal]     = useState(false);
  const [modal_title,   setModalTitle]    = useState('');
  const [modal_content, setModalContent]  = useState(null);
  const [modal_size,    setModalSize]     = useState('w-full max-w-3xl');

  const { register, getValues, setValue } = useForm();

  useEffect(() => { setSelected([]); setPage(1); }, [data]);

  useEffect(() => {
    data.forEach(o => setValue(`note.${o.codRegistro}`, o.nota ?? ''));
  }, [data]);

  const filteredData = useMemo(() => {
    if (!filter.trim()) return data;
    const f = filter.trim().toLowerCase();
    return data.filter(item =>
      (item.nomCliente      ?? '').toLowerCase().includes(f) ||
      (item.nroCotizacion?.toString() ?? '').includes(f) ||
      (item.nomMarca        ?? '').toLowerCase().includes(f)
    );
  }, [data, filter]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData   = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  const handleSaveNote = async () => {
    const payload = pageData.map(o => ({
      CodRegistro: o.codRegistro,
      Nota:        getValues(`note.${o.codRegistro}`) ?? '',
    }));
    try {
      await axiosClient.put(URL_SAVE_NOTE, payload);
      setNotesDirty(false);
      swalSuccess(t.save_note_quote_success);
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? t.save_note_quote_error_server);
    }
  };

  const handleDeleteOrders = async () => {
    if (selected.length === 0) return;
    const { isConfirmed } = await swalConfirm(t.question_delete_the_selected_records);
    if (!isConfirmed) return;
    try {
      const rs = await axiosClient.post(URL_DELETE, selected.map(o => o.codRegistro));
      swalSuccess(t.delete_quote_success);
      setOrdersUnassigned((rs.data.noAsignados ?? []).map((o, i) => ({ ...o, id: i })));
      setOrdersAssigned((rs.data.asignados     ?? []).map((o, i) => ({ ...o, id: i })));
      setSelected([]);
    } catch (err) {
      swalError(t.error ?? 'Error', err?.response?.data?.mensaje ?? t.delete_quote_error_server);
    }
  };

  const handleShowAssignments = () => {
    setModalSize('w-full max-w-3xl');
    setModalTitle('Items asignados a otros usuarios');
    setModalContent(<Assigned t={t} action_cancel={() => setShowModal(false)} />);
    setShowModal(true);
  };

  const noSel = selected.length === 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.assigned_quotations}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            placeholder={t.filter}
            className="h-10 w-52 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {filter && (
            <button onClick={() => setFilter('')} className="absolute inset-y-0 end-2 flex items-center text-gray-400 hover:text-gray-600">
              <IconBackSpace className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          onClick={() => unassignOrder(selected)}
          disabled={noSel}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M3 12h18"/></svg>
          {t.remove_assignment}
        </button>
        <button
          onClick={handleDeleteOrders}
          disabled={noSel}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition ${noSel ? 'text-gray-300 cursor-not-allowed dark:text-gray-600' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path strokeLinecap="round" d="M9 6V4h6v2"/></svg>
          {t.delete}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          onClick={handleSaveNote}
          disabled={!notesDirty}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition ${!notesDirty ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300'}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Guardar Notas
        </button>
        <button
          onClick={handleShowAssignments}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75"/></svg>
          {t.view_assignments}
        </button>

        {selected.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} w-10`}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={pageData.length > 0 && selected.length === pageData.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className={thClass}>{t.nro_quote}</th>
                <th className={thClass}>{t.created_by ?? 'Creado por'}</th>
                <th className={thClass}>{t.customer}</th>
                <th className={thClass}>{t.country ?? 'País'}</th>
                <th className={thClass}>{t.brand}</th>
                <th className={thClass}>{t.note}</th>
                <th className={thClass}>{t.quote_date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    selected.includes(o)
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <td className={`${tdClass} text-center`}>
                    <input type="checkbox" className="form-checkbox" checked={selected.includes(o)} onChange={() => toggleRow(o)} />
                  </td>
                  <td className={tdClass}>
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/queries/spare-parts-identified/quotes?customer=${o.codCliente}&id=${o.nroCotizacion}`}
                    >
                      {o.nroCotizacion}
                    </Link>
                  </td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      o.creadoPor === 1
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {o.creadoPor === 1 ? 'Cliente' : 'Usuario'}
                    </span>
                  </td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={tdClass}>
                    {o.codPais ? (
                      <div className="inline-flex items-center gap-1.5">
                        <img src={`/assets/flags/${o.codPais.toLowerCase()}.svg`} alt={o.nomPais} className="h-3.5 w-5 rounded-sm object-cover shrink-0" />
                        <span>{o.nomPais}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className={tdClass}>{o.nomMarca}</td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`note.${o.codRegistro}`, { onChange: () => setNotesDirty(true) })}
                      className="h-7 w-full min-w-[140px] rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className={tdClass}>{o.feCotizacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}

      <Modal
        size={modal_size}
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        title={modal_title}
        content={modal_content}
      />
    </div>
  );
};

export default QuotesAssigned;
