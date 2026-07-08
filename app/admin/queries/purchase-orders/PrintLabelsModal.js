'use client';
import { useState } from 'react';
import IconPrinter from '@/components/icon/icon-printer';
import axiosClient from '@/app/lib/axiosClient';
import { swalError } from '@/app/lib/swal';

const thClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-3 py-2 text-left whitespace-nowrap";
const tdClass = "text-xs text-gray-700 px-3 py-2";
const inputCls = "h-7 w-14 rounded border border-gray-300 bg-white px-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/40";

export default function PrintLabelsModal({ detalle = [], numOrdenCompra }) {
  const [formato,     setFormato]     = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [items, setItems] = useState(
    detalle.map((d, idx) => ({
      numCorrelativo:   d.numCorrelativo ?? (idx + 1),
      checked:          false,
      nroParte:         d.nroParteCompra,
      nroParteCliente:  d.nroParte,
      descripcion:      d.desRepuesto,
      canOrdenada:      d.canComprada,
      canFaltante:      d.canFaltante,
      imprimir:         d.canFaltante,
      copias:           1,
    }))
  );

  const todos = items.length > 0 && items.every(i => i.checked);

  const toggleTodos = (checked) =>
    setItems(prev => prev.map(i => ({ ...i, checked })));

  const toggleItem = (idx, checked) =>
    setItems(prev => prev.map((i, j) => j === idx ? { ...i, checked } : i));

  const updateField = (idx, field, value) =>
    setItems(prev => prev.map((i, j) => j === idx ? { ...i, [field]: value } : i));

  const handleGenerarPdf = async () => {
    const seleccionados = items.filter(i => i.checked);
    if (seleccionados.length === 0) {
      swalError('Sin ítems seleccionados', 'Seleccione al menos un ítem para generar el PDF.');
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        numOrdenCompra,
        formatoMediano: formato === 'mediano',
        items: seleccionados.map(i => ({
          numCorrelativo: i.numCorrelativo,
          imprimir:       Number(i.imprimir) || 0,
          copias:         Number(i.copias)   || 1,
        })),
      };
      const rs = await axiosClient.post('ordenescompra/etiquetas/pdf', payload, { responseType: 'blob' });
      const disposition = rs.headers?.['content-disposition'] ?? '';
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)["']?/i);
      const filename = match?.[1]?.trim() || `Etiquetas-OC${numOrdenCompra}.pdf`;
      const url = URL.createObjectURL(new Blob([rs.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        swalError('Error', err?.response?.data?.mensaje ?? 'Solicitud inválida.');
      } else if (status === 403) {
        swalError('Sin permiso', 'No tiene permiso para generar etiquetas.');
      } else {
        swalError('Error', 'No se pudo generar el PDF. Intente nuevamente.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles superiores */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-100 pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Pendientes de Recibir</p>
          <p className="text-xs text-orange-500 font-medium mt-0.5">Seleccione los ítems a imprimir</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input type="radio" name="formato" value="mediano" checked={formato === 'mediano'} onChange={() => setFormato('mediano')} className="h-3.5 w-3.5 accent-primary cursor-pointer" />
            Formato Mediano
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input type="radio" name="formato" value="pequeno" checked={formato === 'pequeno'} onChange={() => setFormato('pequeno')} className="h-3.5 w-3.5 accent-primary cursor-pointer" />
            Formato pequeño
          </label>
          <button
            disabled={generating}
            onClick={handleGenerarPdf}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {generating
              ? <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <IconPrinter className="h-3.5 w-3.5 shrink-0" />
            }
            {generating ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr>
              <th className={`${thClass} w-8`}>
                <input type="checkbox" checked={todos} onChange={e => toggleTodos(e.target.checked)} className="h-3.5 w-3.5 accent-primary cursor-pointer" />
              </th>
              <th className={thClass}>Nro. Parte</th>
              <th className={thClass}>Nro. Parte Cliente</th>
              <th className={thClass}>Descripción</th>
              <th className={`${thClass} text-center`}>Can. Ordenada</th>
              <th className={`${thClass} text-center`}>Can. Faltante</th>
              <th className={`${thClass} text-center`}>Imprimir</th>
              <th className={`${thClass} text-center`}>Copias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr key={idx} className={`transition-colors hover:bg-gray-50 ${!item.checked ? 'opacity-50' : ''}`}>
                <td className={tdClass}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={e => toggleItem(idx, e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary cursor-pointer"
                  />
                </td>
                <td className={`${tdClass} font-medium text-primary`}>{item.nroParte}</td>
                <td className={tdClass}>{item.nroParteCliente}</td>
                <td className={tdClass}>{item.descripcion}</td>
                <td className={`${tdClass} text-center text-primary font-medium`}>{item.canOrdenada}</td>
                <td className={`${tdClass} text-center text-primary font-medium`}>{item.canFaltante}</td>
                <td className={`${tdClass} text-center`}>
                  <input
                    type="number"
                    min="0"
                    value={item.imprimir}
                    onChange={e => updateField(idx, 'imprimir', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className={`${tdClass} text-center`}>
                  <input
                    type="number"
                    min="1"
                    value={item.copias}
                    onChange={e => updateField(idx, 'copias', e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
