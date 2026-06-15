'use client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@mantine/core';
import Swal from 'sweetalert2';
import axios from 'axios';
import Modal from '@/components/modal';
import DeleteForm from './delete-form';
import ShowAssignmentsForm from './show-assignments-form';
import MailToCustomerForm from './mail-to-customer-form';
import MailToSupplierForm from './mail-to-supplier-form';
import IconBackSpace from '@/components/icon/icon-backspace';

const url_export      = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/ExportarListaEx';
const url_save_note   = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/GuardarNota';
const url_save_status = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/CodigoInvalidoDescontinuado';

const PAGE_SIZE = 20;

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left whitespace-nowrap select-none";
const tdClass = "text-xs text-gray-700 dark:text-gray-300 px-3 py-2";

const SortIcon = ({ active, dir }) => {
  if (!active)
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" fill="currentColor" className="shrink-0 text-gray-300">
        <path d="M3.5 0L7 4.5H0L3.5 0Z"/><path d="M3.5 11L0 6.5H7L3.5 11Z"/>
      </svg>
    );
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor" className="shrink-0 text-primary">
      {dir === 'asc' ? <path d="M3.5 0L7 7H0L3.5 0Z"/> : <path d="M3.5 7L0 0H7L3.5 7Z"/>}
    </svg>
  );
};

const SortableHeader = ({ col, label, sortCol, sortDir, onSort, className = '' }) => (
  <th onClick={() => onSort(col)} className={`${thClass} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}>
    <span className="inline-flex items-center gap-1.5">
      {label}<SortIcon active={sortCol === col} dir={sortDir} />
    </span>
  </th>
);

const ItemsAssigned = ({ token, t, data, unassignOrder, setOrdersAssigned }) => {
  const [selected,  setSelected]  = useState([]);
  const [filter,    setFilter]    = useState('');
  const [sortCol,   setSortCol]   = useState('');
  const [sortDir,   setSortDir]   = useState('asc');
  const [page,      setPage]      = useState(1);

  const [show_modal,    setShowModal]    = useState(false);
  const [modal_title,   setModalTitle]   = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size,    setModalSize]    = useState('w-full max-w-xl');

  const [users,        setUsers]        = useState([]);
  const [loadUsers,    setLoadUsers]    = useState(true);

  const { register, getValues, setValue } = useForm();

  useEffect(() => { setSelected([]); setPage(1); }, [data]);

  useEffect(() => {
    data.forEach(o => setValue(`note.${o.codRegistro}`, o.nota ?? ''));
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filter.trim()) {
      const f = filter.trim().toLowerCase();
      result = result.filter(item =>
        (item.nomCliente      ?? '').toLowerCase().includes(f) ||
        (item.nroCotizacion?.toString() ?? '').includes(f) ||
        (item.nroParte        ?? '').toLowerCase().includes(f) ||
        (item.nomMarca        ?? '').toLowerCase().includes(f)
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const va = a[sortCol] ?? '', vb = b[sortCol] ?? '';
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData   = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  };

  const toggleAll = () =>
    setSelected(selected.length === pageData.length ? [] : [...pageData]);
  const toggleRow = (row) =>
    setSelected(prev => prev.includes(row) ? prev.filter(x => x !== row) : [...prev, row]);

  // ── Acciones ────────────────────────────────────────────────────────────

  const handleSaveNote = async () => {
    const payload = pageData.map(o => ({
      CodRegistro: o.codRegistro,
      Nota:        getValues(`note.${o.codRegistro}`),
      ValToken:    token,
    }));
    try {
      const rs = await axios.post(url_save_note, payload);
      if (rs.data.estado === 'OK') {
        Swal.fire({ position: 'top-end', icon: 'success', title: t.save_note_quote_success, showConfirmButton: false, timer: 1500 });
      } else {
        Swal.fire({ position: 'top-end', icon: 'error', title: t.save_note_quote_error, showConfirmButton: false, timer: 1500 });
      }
    } catch {
      Swal.fire({ position: 'top-end', icon: 'error', title: t.save_note_quote_error_server, showConfirmButton: false, timer: 1500 });
    }
  };

  const handleSaveStatus = (option) => {
    const label = option === 'IV' ? t.question_change_status_invalid
      : option === 'DE'           ? t.question_change_status_discontinued
      : t.question_change_status_no_option;
    Swal.fire({
      title: label, icon: 'question', showCancelButton: true,
      confirmButtonColor: '#15803d', confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel, reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const payload = selected.map(o => ({
          EstadoCodigo: option, CodRegistro: o.codRegistro,
          NroOrden: o.nroCotizacion, NroParte: o.nroParte, ValToken: token,
        }));
        const rs = await axios.post(url_save_status, payload);
        if (rs.data.estado === 'OK') {
          Swal.fire({ position: 'top-end', icon: 'success', title: t.save_change_status_order_success, showConfirmButton: false, timer: 1500 }).then(() => {
            setOrdersAssigned((rs.data.dato ?? []).map((o, i) => ({ ...o, id: i })));
          });
        } else {
          Swal.fire({ position: 'top-end', icon: 'error', title: t.save_change_status_order_error, showConfirmButton: false, timer: 1500 });
        }
      } catch {
        Swal.fire({ position: 'top-end', icon: 'error', title: t.save_change_status_order_error_server, showConfirmButton: false, timer: 1500 });
      }
    });
  };

  const handleExportOrders = async () => {
    if (selected.length === 0) return;
    try {
      const CadCodRegistro = selected.map(o => o.codRegistro).join(',');
      const response = await axios.post(url_export, { CadCodRegistro, ValToken: token }, { responseType: 'blob' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'archivo.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match?.[1]) filename = match[1];
      }
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.className = 'no-load';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const handleMailToCustomer = () => {
    const names = [...new Set(selected.map(o => o.nomCliente))];
    if (names.length > 1) {
      Swal.fire({ title: t.error, text: t.different_customers_send_email_error, icon: 'error', confirmButtonColor: '#dc2626', confirmButtonText: t.close });
      return;
    }
    setModalSize('w-full max-w-3xl');
    setModalTitle('');
    setModalContent(<MailToCustomerForm selected={selected} close={() => setShowModal(false)} t={t} token={token} />);
    setShowModal(true);
  };

  const handleMailToSupplier = () => {
    setModalSize('w-full max-w-3xl');
    setModalTitle('');
    setModalContent(<MailToSupplierForm selected={selected} close={() => setShowModal(false)} t={t} token={token} />);
    setShowModal(true);
  };

  const handleDeleteOrders = () => {
    if (selected.length === 0) return;
    setModalSize('w-full max-w-xl');
    setModalTitle('');
    setModalContent(
      <DeleteForm
        t={t} token={token}
        action_cancel={() => setShowModal(false)}
        users={users} setUsers={setUsers}
        loadUsers={loadUsers} setLoadUsers={setLoadUsers}
        selected_orders={selected}
        setOrdersAssigned={setOrdersAssigned}
      />
    );
    setShowModal(true);
  };

  const handleShowAssignments = () => {
    setModalSize('w-full max-w-5xl');
    setModalTitle('Items Asignados a otros Usuarios');
    setModalContent(
      <ShowAssignmentsForm
        t={t} token={token}
        action_cancel={() => setShowModal(false)}
        users={users} setUsers={setUsers}
        loadUsers={loadUsers} setLoadUsers={setLoadUsers}
        selected_orders={selected}
        setOrdersAssigned={setOrdersAssigned}
      />
    );
    setShowModal(true);
  };

  const btnDanger = (disabled) =>
    `h-9 px-3 rounded-lg text-sm font-medium transition ${
      disabled
        ? 'border border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
        : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    }`;
  const btnSecondary = (disabled) =>
    `h-9 px-3 rounded-lg border text-sm font-medium transition ${
      disabled
        ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700 dark:text-gray-600'
        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300'
    }`;

  const noSel = selected.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {t.items_to_be_quoted_assigned}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredData.length})</span>
          </h2>
          <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
        </div>

        {/* Filtro local */}
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

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => unassignOrder(selected)}
          disabled={noSel}
          className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← {t.remove_assignment}
        </button>

        <button onClick={handleDeleteOrders}     disabled={noSel} className={btnDanger(noSel)}>{t.delete}</button>
        <button onClick={handleExportOrders}     disabled={noSel} className={btnSecondary(noSel)}>{t.export}</button>
        <button onClick={handleMailToCustomer}   disabled={noSel} className={btnSecondary(noSel)}>{t.mail_to_customer}</button>
        <button onClick={handleMailToSupplier}   disabled={noSel} className={btnSecondary(noSel)}>{t.mail_to_supplier}</button>
        <button onClick={() => handleSaveStatus('IV')} disabled={noSel} className={btnDanger(noSel)}>{t.invalid}</button>
        <button onClick={() => handleSaveStatus('DE')} disabled={noSel} className={btnDanger(noSel)}>{t.discontinued}</button>
        <button onClick={() => handleSaveStatus('SO')} disabled={noSel} className={btnDanger(noSel)}>{t.no_option}</button>
        <button onClick={handleShowAssignments} className={btnSecondary(false)}>{t.view_assignments}</button>
        <button onClick={handleSaveNote}         className={btnSecondary(false)}>{t.btn_save}</button>

        {selected.length > 0 && (
          <span className="text-xs font-medium text-primary ml-1">
            {selected.length} {t.selected ?? 'seleccionado(s)'}
          </span>
        )}
      </div>

      {/* Tabla */}
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
                <SortableHeader col="nroCotizacion" label={t.nro_order}           sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="nroParte"      label={t.nro_part}            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="cantidad"      label={t.amount}              sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader col="nomCliente"    label={t.customer}            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader col="nomMarca"      label={t.application}         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className={thClass}>Nota</th>
                <SortableHeader col="dias"          label="Días"                  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="text-center" />
                <SortableHeader col="fecCotizacion" label="Fecha Cot."            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
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
                  <td className={`${tdClass} font-semibold text-primary`}>{o.nroCotizacion}</td>
                  <td className={`${tdClass} font-medium`}>{o.nroParte}</td>
                  <td className={`${tdClass} text-center`}>{o.cantidad}</td>
                  <td className={tdClass}>{o.nomCliente}</td>
                  <td className={`${tdClass} text-gray-500`}>{o.nomMarca}</td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      {...register(`note.${o.codRegistro}`)}
                      className="h-7 w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      (o.dias ?? 0) < 7
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : (o.dias ?? 0) < 30
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {o.dias ?? 0}
                    </span>
                  </td>
                  <td className={`${tdClass} text-gray-400`}>{o.fecCotizacion}</td>
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

export default ItemsAssigned;
