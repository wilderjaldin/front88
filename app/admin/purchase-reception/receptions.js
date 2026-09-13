'use client';
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Pagination } from '@mantine/core';
import IconSave from '@/components/icon/icon-save';
import IconDownload from '@/components/icon/icon-download';
import IconTag from '@/components/icon/icon-tag';
import IconSearchCircle from '@/components/icon/icon-search-circle';
import IconChecks from '@/components/icon/icon-checks';
import IconNotesEdit from '@/components/icon/icon-notes-edit';
import Modal from '@/components/modal';
import PrintLabelsModal from '@/app/admin/purchase-reception/print-labels-modal';
const ExportListPdfViewer = dynamic(() => import('@/app/admin/purchase-reception/ExportListPdfViewer'), { ssr: false });
import axiosClient from '@/app/lib/axiosClient';
import { swalSuccess, swalError } from '@/app/lib/swal';
import { useForm } from "react-hook-form"

const URL_SAVE_ITEMS = 'recepcion/guardar-items';
const URL_SAVE_NOTE  = 'ordenescompra/guardar-nota-item';

const PAGE_SIZE = 20;

const thClass = "text-[10px] font-semibold uppercase tracking-wide leading-tight text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-left select-none";
const tdClass = "text-[11px] text-gray-700 dark:text-gray-300 px-2 py-0.5";
const cellTdClass = "p-0 border-r border-b border-gray-100 dark:border-gray-700";
const cellInputClass = "h-6 w-full px-1.5 bg-transparent text-[11px] border-0 rounded-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50";
const cellInputBorderedClass = "h-6 w-full px-1.5 bg-white dark:bg-gray-900 text-[11px] border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary/50";

// Columnas editables, en orden — define tanto el input como la navegación tipo Excel.
const ITEM_COLUMNS = [
  { key: 'amount', type: 'number', widthPx: 80, align: 'text-center' },
  { key: 'origen', type: 'text',   widthPx: 90 },
  { key: 'note',   type: 'text',   widthPx: 140 },
];

// Alto aproximado del panel de sugerencias, usado solo para decidir si abrir
// hacia abajo o hacia arriba — el máximo real lo pone max-h-40 en el render.
const ORIGEN_DROPDOWN_MAX_HEIGHT = 176;

const Receptions = ({ t, data, setReceptions, selected_orders, onRefresh, origenes = [] }) => {

  const [page,   setPage]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPdfBlobUrl, setExportPdfBlobUrl] = useState(null);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeText, setBarcodeText] = useState('');

  // Sugerencias de "Origen": un único panel flotante compartido por todas las
  // filas (no un componente por fila) — se reposiciona con position:fixed
  // calculado por JS según la celda enfocada, y se filtra con lo que se va
  // escribiendo, sin perder la esencia de celda de texto tipo Excel.
  const [origenDropdown, setOrigenDropdown] = useState(null); // { rowId, top, bottom, left, width }
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const origenDropdownRef = useRef(null);
  const origenOptionRefs = useRef([]);

  // Lista de orígenes "recordados", tipo autocompletado de columna de Excel:
  // arranca con lo que llega del backend y se le van sumando los valores
  // nuevos que se escriben en cualquier celda, para que las filas siguientes
  // los puedan sugerir también.
  const [origenList, setOrigenList] = useState(origenes);
  useEffect(() => {
    setOrigenList(prev => {
      const merged = [...prev];
      origenes.forEach((o) => {
        if (o && !merged.some(m => m.toLowerCase() === o.toLowerCase())) merged.push(o);
      });
      return merged;
    });
  }, [origenes]);

  const rememberOrigen = (value) => {
    const v = (value || '').trim();
    if (!v) return;
    setOrigenList(prev => (
      prev.some(o => o.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]
    ));
  };

  const {
    register,
    getValues,
    setValue,
    watch,
  } = useForm()

  useEffect(() => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CanRecibida || '');
      setValue(`orders_${o.id}_origen`, o.Origen);
      setValue(`orders_${o.id}_note`, o.NotaItem);
    });
  }, [data]);

  useEffect(() => { setPage(1); }, [data]);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData    = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Navegación tipo Excel entre celdas editables de la tabla.
  const cellRefs = useRef({});
  const focusCell = (row, col) => {
    const el = cellRefs.current[`${row}_${col}`];
    if (el) { el.focus(); el.select?.(); }
  };
  const handleCellKeyDown = (e, row, col) => {
    const lastRow = pageData.length - 1;
    const lastCol = ITEM_COLUMNS.length - 1;
    const isNumber = e.target.type === 'number';
    const atStart  = isNumber || e.target.selectionStart === 0;
    const atEnd    = isNumber || e.target.selectionStart === e.target.value.length;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      if (row < lastRow) focusCell(row + 1, col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) focusCell(row - 1, col);
    } else if (e.key === 'ArrowRight' && atEnd) {
      e.preventDefault();
      if (col < lastCol) focusCell(row, col + 1);
    } else if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      if (col > 0) focusCell(row, col - 1);
    }
  };

  // Combina el registro de react-hook-form con la ref propia usada para la navegación.
  const registerCell = (name, row, col, { uppercase = false } = {}) => {
    const field = register(name);
    return {
      ...field,
      ref: (el) => {
        field.ref(el);
        cellRefs.current[`${row}_${col}`] = el;
      },
      onChange: uppercase
        ? (e) => { e.target.value = e.target.value.toUpperCase(); return field.onChange(e); }
        : field.onChange,
      onKeyDown: (e) => handleCellKeyDown(e, row, col),
    };
  };

  const openOrigenDropdown = (rowId, inputEl) => {
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < ORIGEN_DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow;
    setHighlightedIndex(-1);
    setOrigenDropdown({
      rowId,
      left: rect.left,
      width: Math.max(rect.width, 140),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 2 }
        : { top: rect.bottom + 2 }),
    });
  };

  const closeOrigenDropdown = () => { setOrigenDropdown(null); setHighlightedIndex(-1); };

  const selectOrigen = (rowId, value) => {
    setValue(`orders_${rowId}_origen`, value);
    rememberOrigen(value);
    closeOrigenDropdown();
  };

  const getFilteredOrigenes = (rowId) => {
    const typed = (watch(`orders_${rowId}_origen`) || '').trim().toLowerCase();
    return typed ? origenList.filter(op => op.toLowerCase().includes(typed)) : origenList;
  };

  // Cierra el panel si se hace scroll fuera de él (tabla o página) o se
  // redimensiona la ventana — al ser fixed, no seguiría a la celda igual.
  // El scroll dentro del propio listado de sugerencias NO debe cerrarlo.
  useEffect(() => {
    if (!origenDropdown) return;
    const handleScroll = (e) => {
      if (origenDropdownRef.current?.contains(e.target)) return;
      closeOrigenDropdown();
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', closeOrigenDropdown);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', closeOrigenDropdown);
    };
  }, [origenDropdown]);

  // Mantiene visible la opción resaltada por teclado dentro del listado.
  useEffect(() => {
    if (highlightedIndex < 0) return;
    origenOptionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Navegación por teclado propia de la celda "Origen": mientras el listado
  // de sugerencias está abierto, arriba/abajo recorren las opciones en vez
  // de saltar de fila, y Enter confirma la resaltada (o guarda y avanza si
  // no hay ninguna resaltada, igual que en el resto de celdas).
  const handleOrigenKeyDown = (e, row, col, rowId) => {
    const isOpen = origenDropdown?.rowId === rowId;
    if (isOpen) {
      const filtered = getFilteredOrigenes(rowId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length > 0) setHighlightedIndex(i => (i + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length > 0) setHighlightedIndex(i => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          selectOrigen(rowId, filtered[highlightedIndex]);
        } else {
          closeOrigenDropdown();
        }
        const lastRow = pageData.length - 1;
        if (row < lastRow) focusCell(row + 1, col);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOrigenDropdown();
        return;
      }
      if (e.key === 'Tab') {
        closeOrigenDropdown();
        return;
      }
    }
    handleCellKeyDown(e, row, col);
  };

  const handleReceiveAll = () => {
    data.map((o) => {
      setValue(`orders_${o.id}_amount`, o.CantFaltante);
    })
  }

  const handleSaveChanges = async () => {
    if (data.length > 0) {
      saveDataReception();
    }
  }

  // Payload de recepcion/guardar-items — compartido entre "Guardar Recepción" y "Guardar Nota".
  const buildItems = () => data.map((o) => ({
    NumOrdenCompra: o.NumOrdenCompra,
    nroCotizacion: o.NroOrden,
    CodItem: o.CodItem,
    CodRepuesto: o.CodRepuesto,
    // NroParte/NroParteCompra en el payload corresponden a los campos crudos del backend
    // (nroParte/nroParteCompra), invertidos respecto a como se mapean en pantalla.
    NroParte: o.NroParteCliente,
    NroParteCompra: o.NroParte,
    CanRecibida: getValues(`orders_${o.id}_amount`) || 0,
    DesRepuesto: o.Descripcion,
    Nota: getValues(`orders_${o.id}_note`),
    Presentacion: o.Presentacion,
    Material: o.Material,
    Origen: getValues(`orders_${o.id}_origen`),
    HCode: o.HCode,
  }));

  const saveDataReception = async () => {
    setSaving(true);
    try {
      const different = data.some(o => {
        const amount = getValues(`orders_${o.id}_amount`);
        return amount < 1 || amount > o.CantFaltante;
      });

      if (different) {
        swalError(t.error, t.save_puschase_receipt_amount_error, t.close);
        setSaving(false);
        return;
      }

      await axiosClient.post(URL_SAVE_ITEMS, { items: buildItems() });

      swalSuccess(t.save_puschase_receipt_success);
      setReceptions([]);
      onRefresh?.();
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_puschase_receipt_error, t.close);
    }
    setSaving(false);
  }

  // Guarda solo el campo Nota de cada fila, sin tocar Can. Recibida ni el resto de campos
  // (a diferencia de "Guardar Recepción", no cierra la recepción ni limpia la lista).
  const buildNoteItems = () => data.map((o) => ({
    numOrdenCompra: o.NumOrdenCompra,
    nroCotizacion:  o.NroOrden,
    codItem:        o.CodItem,
    nota:           getValues(`orders_${o.id}_note`),
  }));

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await axiosClient.put(URL_SAVE_NOTE, { items: buildNoteItems() });
      swalSuccess(t.save_puschase_receipt_success);
    } catch (error) {
      const apiMsg = error?.response?.data?.mensaje;
      swalError(t.error, apiMsg ?? t.save_puschase_receipt_error, t.close);
    }
    setSavingNote(false);
  }

  const handleBarcodeAccept = () => {
    const codes = barcodeText.split('\n').map(s => s.trim()).filter(Boolean);
    setShowBarcodeModal(false);
    setBarcodeText('');
    if (codes.length === 0) return;

    const counts = {};
    codes.forEach(c => { counts[c] = (counts[c] ?? 0) + 1; });

    let matched = 0;
    data.forEach((o) => {
      const code = counts[o.NroParte] != null ? o.NroParte : (counts[o.NroParteCliente] != null ? o.NroParteCliente : null);
      if (!code) return;
      const current = Number(getValues(`orders_${o.id}_amount`)) || 0;
      const next = Math.min(current + counts[code], o.CantFaltante);
      setValue(`orders_${o.id}_amount`, next);
      matched++;
    });

    if (matched > 0) {
      swalSuccess(t.save_puschase_receipt_success);
    } else {
      swalError(t.error, t.no_matches, t.close);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t.purchase_reception}
          <span className="ml-2 text-sm font-normal text-gray-400">({data.length})</span>
        </h2>
        <div className="mt-1 h-0.5 w-10 rounded bg-primary/60" />
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 dark:hover:bg-indigo-900/20 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <IconDownload className="h-3.5 w-3.5" />
          {t.export_list}
        </button>

        <button
          type="button"
          onClick={() => setShowLabelsModal(true)}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 dark:hover:bg-amber-900/20 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <IconTag className="h-3.5 w-3.5" />
          {t.print_labels}
        </button>

        <button
          type="button"
          onClick={() => setShowBarcodeModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 dark:hover:bg-purple-900/20 transition"
        >
          <IconSearchCircle className="h-3.5 w-3.5" />
          {t.barcode}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleReceiveAll}
          disabled={data.length === 0}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:hover:bg-emerald-900/20 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <IconChecks className="h-3.5 w-3.5" />
          {t.receive_all}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={handleSaveNote}
          disabled={data.length === 0 || savingNote}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 dark:hover:bg-sky-900/20 disabled:opacity-35 disabled:cursor-not-allowed transition"
        >
          <IconNotesEdit className="h-3.5 w-3.5" />
          {savingNote ? (t.saving ?? 'Guardando…') : t.save_note}
        </button>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={data.length === 0 || saving}
          className="btn btn-success inline-flex items-center gap-2 h-9 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSave className="h-4 w-4" />
          {saving ? (t.saving ?? 'Guardando…') : t.save_reception}
        </button>
      </div>

      {/* Tabla */}
      <div className="panel overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className={`${thClass} text-center`} style={{ width: 64 }}>{t.nro_purchase_order}</th>
                <th className={`${thClass} text-center`} style={{ width: 64 }}>{t.nro_order}</th>
                <th className={thClass} style={{ width: 240 }}>{t.customer}</th>
                <th className={thClass} style={{ width: 100 }}>{t.nro_part}</th>
                <th className={thClass} style={{ width: 100 }}>{t.nro_part_customer}</th>
                <th className={thClass} style={{ width: 180 }}>{t.description}</th>
                <th className={`${thClass} text-center`} style={{ width: 56 }}>{t.missing_amount}</th>
                <th className={`${thClass} text-center`} style={{ width: 80 }}>{t.amount_received}</th>
                <th className={thClass} style={{ width: 90 }}>{t.origin}</th>
                <th className={thClass}>{t.note}</th>
              </tr>
            </thead>

            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-gray-400">{t.empty_results}</td>
                </tr>
              ) : pageData.map((o, rowIndex) => {
                const index = o.id ?? data.indexOf(o);
                return (
                <tr key={index}>
                  <td className={`${tdClass} text-center font-medium border-b border-gray-100 dark:border-gray-700`}>{o.NumOrdenCompra}</td>
                  <td className={`${tdClass} text-center border-b border-gray-100 dark:border-gray-700`}>{o.NroOrden}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.NomCliente}</td>
                  <td className={`${tdClass} text-primary border-b border-gray-100 dark:border-gray-700`}>{o.NroParte}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.NroParteCliente}</td>
                  <td className={`${tdClass} border-b border-gray-100 dark:border-gray-700`}>{o.Descripcion}</td>
                  <td className={`${tdClass} text-center border-b border-gray-100 dark:border-gray-700`}>{o.CantFaltante}</td>
                  <td className={cellTdClass}>
                    <input
                      step="any" type="number"
                      {...registerCell(`orders_${index}_amount`, rowIndex, 0)}
                      className={`${cellInputBorderedClass} text-center`}
                    />
                  </td>
                  <td className={cellTdClass}>
                    {(() => {
                      const origenField = registerCell(`orders_${index}_origen`, rowIndex, 1);
                      return (
                        <input
                          type="text"
                          autoComplete="off"
                          {...origenField}
                          onChange={(e) => { origenField.onChange(e); setHighlightedIndex(-1); }}
                          onFocus={(e) => openOrigenDropdown(index, e.target)}
                          onBlur={(e) => {
                            origenField.onBlur?.(e);
                            rememberOrigen(e.target.value);
                            // pequeño delay para que el click en una sugerencia se registre antes de cerrar
                            setTimeout(() => setOrigenDropdown(prev => (prev?.rowId === index ? null : prev)), 150);
                          }}
                          onKeyDown={(e) => handleOrigenKeyDown(e, rowIndex, 1, index)}
                          className={cellInputClass}
                        />
                      );
                    })()}
                  </td>
                  <td className={cellTdClass}>
                    <input type="text" {...registerCell(`orders_${index}_note`, rowIndex, 2, { uppercase: true })} className={cellInputClass} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sugerencias de "Origen" — panel único, fixed y fuera de la tabla (no
          altera su layout), filtrado con lo que se va escribiendo. */}
      {origenDropdown && (() => {
        const filtered = getFilteredOrigenes(origenDropdown.rowId);
        if (filtered.length === 0) return null;
        return (
          <div
            ref={origenDropdownRef}
            style={{
              position: 'fixed',
              left: origenDropdown.left,
              width: origenDropdown.width,
              ...(origenDropdown.top != null ? { top: origenDropdown.top } : { bottom: origenDropdown.bottom }),
            }}
            className="z-50 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1"
          >
            {filtered.map((op, i) => (
              <button
                key={i}
                type="button"
                ref={(el) => { origenOptionRefs.current[i] = el; }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => selectOrigen(origenDropdown.rowId, op)}
                className={`block w-full text-left px-2.5 py-1 text-[11px] transition ${
                  i === highlightedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        );
      })()}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" />
        </div>
      )}

      {/* Modal Exportar Lista — ancho ajustado al contenido del PDF, no un tamaño fijo. */}
      <Modal
        showModal={showExportModal}
        closeModal={() => { setShowExportModal(false); setExportPdfBlobUrl(null); }}
        title={t.export_list}
        size="w-fit max-w-[95vw]"
        headerActions={
          exportPdfBlobUrl && (
            <a
              href={exportPdfBlobUrl}
              download="recepcion.pdf"
              className="no-load btn btn-primary btn-sm rounded"
            >
              {t.download_pdf}
            </a>
          )
        }
      >
        {showExportModal && (
          <ExportListPdfViewer selected_orders={selected_orders} onLoaded={setExportPdfBlobUrl} />
        )}
      </Modal>

      {/* Modal Imprimir Etiquetas */}
      <Modal showModal={showLabelsModal} closeModal={() => setShowLabelsModal(false)} title={t.print_labels} size="w-full max-w-4xl">
        {showLabelsModal && (
          <PrintLabelsModal t={t} selected_orders={selected_orders} close={() => setShowLabelsModal(false)} />
        )}
      </Modal>

      {/* Modal Código de Barra */}
      <Modal showModal={showBarcodeModal} closeModal={() => setShowBarcodeModal(false)} title={t.read_barcode} size="w-full max-w-lg">
        <div className="space-y-3">
          <textarea
            autoFocus
            rows={10}
            value={barcodeText}
            onChange={(e) => setBarcodeText(e.target.value)}
            placeholder={t.read_barcode}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleBarcodeAccept}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
            >
              {t.accept}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Receptions;
