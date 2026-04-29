'use client';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '@/app/lib/axiosClient';
import Swal from 'sweetalert2';
import Select from 'react-select';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconPlus from '@/components/icon/icon-plus';
import IconPencil from '@/components/icon/icon-pencil';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconUsers from '@/components/icon/icon-users';
import IconX from '@/components/icon/icon-x';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconVideo from '@/components/icon/icon-video';
import IconPhone from '@/components/icon/icon-phone';

const URL_GET    = (cod) => `/clientes/${cod}/reuniones`;
const URL_SAVE   = (cod) => `/clientes/${cod}/reuniones/guardar`;
const URL_DELETE = (cod) => `/clientes/${cod}/reuniones/eliminar`;

const Toast = Swal.mixin({
  toast: true, position: 'top-end',
  showConfirmButton: false, timer: 3000, timerProgressBar: true,
});

const MEDIOS = [
  { value: 'PRESENCIAL',   label: 'Presencial'   },
  { value: 'VIDEOLLAMADA', label: 'Videollamada' },
  { value: 'LLAMADA',      label: 'Llamada'      },
  { value: 'TEAMS',        label: 'Teams'        },
  { value: 'ZOOM',         label: 'Zoom'         },
  { value: 'WHATSAPP',     label: 'WhatsApp'     },
];

const MEDIO_META = {
  PRESENCIAL:   { chip: 'bg-success/10 text-success border-success/30',     icon: <IconMapPin  className="h-3 w-3" /> },
  VIDEOLLAMADA: { chip: 'bg-info/10 text-info border-info/30',               icon: <IconVideo   className="h-3 w-3" /> },
  LLAMADA:      { chip: 'bg-warning/10 text-warning border-warning/30',      icon: <IconPhone   className="h-3 w-3" /> },
  TEAMS:        { chip: 'bg-violet-100 text-violet-600 border-violet-200',   icon: <IconVideo   className="h-3 w-3" /> },
  ZOOM:         { chip: 'bg-sky-100 text-sky-600 border-sky-200',            icon: <IconVideo   className="h-3 w-3" /> },
  WHATSAPP:     { chip: 'bg-emerald-100 text-emerald-600 border-emerald-200',icon: <IconPhone   className="h-3 w-3" /> },
};

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function parseDateParts(dateStr) {
  if (!dateStr) return { day: '—', month: '—', year: '—' };
  const d = new Date(dateStr + 'T00:00:00');
  return { day: String(d.getDate()).padStart(2, '0'), month: MONTHS[d.getMonth()], year: d.getFullYear() };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MeetingCustomer({ t, cliente, meetings, setMeetings, loadMeetings, setLoadMeetings }) {

  const [editData,      setEditData]      = useState(null);
  const [personas,      setPersonas]      = useState([]);
  const [inputPersona,  setInputPersona]  = useState('');

  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { fecReunion: '', horReunion: '', medio: null, nota: '' } });

  useEffect(() => {
    if (!loadMeetings) return;
    axiosClient.get(URL_GET(cliente.codCliente))
      .then(res => setMeetings(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadMeetings(false));
  }, []);

  if (loadMeetings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Personas chip input ────────────────────────────────────────────────────
  const addPersona = () => {
    const name = inputPersona.trim();
    if (!name) return;
    if (personas.some(p => p.toLowerCase() === name.toLowerCase())) {
      Toast.fire({ icon: 'warning', title: 'Persona ya agregada' }); return;
    }
    setPersonas(prev => [...prev, name]);
    setInputPersona('');
  };

  const removePersona = (idx) => setPersonas(prev => prev.filter((_, i) => i !== idx));

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (meeting) => {
    setEditData(meeting);
    reset({
      fecReunion: meeting.fecReunion ?? '',
      horReunion: meeting.horReunion ?? '',
      medio:      MEDIOS.find(m => m.value === meeting.medio) ?? null,
      nota:       meeting.nota ?? '',
    });
    setPersonas((meeting.personas ?? []).map(p => p.nombre ?? p));
  };

  const cancelEdit = () => {
    setEditData(null);
    reset({ fecReunion: '', horReunion: '', medio: null, nota: '' });
    setPersonas([]);
    setInputPersona('');
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = {
      codReunion: editData?.codReunion ?? 0,
      fecReunion: data.fecReunion,
      horReunion: data.horReunion,
      medio:      data.medio?.value ?? null,
      nota:       data.nota,
      personas:   personas.map(p => ({ nombre: p })),
    };
    try {
      const res = await axiosClient.post(URL_SAVE(cliente.codCliente), payload);
      setMeetings(res.data ?? []);
      cancelEdit();
      Toast.fire({ icon: 'success', title: editData ? 'Reunión actualizada' : 'Reunión programada' });
    } catch (err) {
      Toast.fire({ icon: 'error', title: err?.response?.data?.message ?? 'Error al guardar' });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (meeting) => {
    Swal.fire({
      title: '¿Eliminar reunión?',
      html: `<span class="text-sm text-gray-500">${meeting.fecReunion} ${meeting.horReunion ?? ''}</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: t.btn_cancel,
      reverseButtons: true,
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axiosClient.delete(URL_DELETE(cliente.codCliente), {
          data: { codReunion: meeting.codReunion },
        });
        setMeetings(res.data ?? []);
        Toast.fire({ icon: 'success', title: 'Reunión eliminada' });
      } catch {
        Toast.fire({ icon: 'error', title: 'Error al eliminar' });
      }
    });
  };

  const isEditing = !!editData;

  return (
    <div className="space-y-6">

      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">Reuniones</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── FORM ────────────────────────────────────────────────────────── */}
        <div className={`lg:col-span-2 rounded-xl border bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4 transition-colors
          ${isEditing ? 'border-warning/40' : 'border-primary/30'}`}>

          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${isEditing ? 'text-warning' : 'text-primary'}`}>
              {isEditing ? 'Editar Reunión' : 'Nueva Reunión'}
            </h3>
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
              <span className="inline-flex items-center gap-1.5">
                <IconCalendar className="h-3.5 w-3.5 text-gray-400" />
                {t.date} <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="date"
              {...register('fecReunion', { required: t.required_field })}
              className="form-input w-full"
            />
            {errors.fecReunion && <p className="text-xs text-red-500">{errors.fecReunion.message}</p>}
          </div>

          {/* Hora */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <IconClock className="h-3.5 w-3.5 text-gray-400" />
                Hora <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="time"
              {...register('horReunion', { required: t.required_field })}
              className="form-input w-full"
            />
            {errors.horReunion && <p className="text-xs text-red-500">{errors.horReunion.message}</p>}
          </div>

          {/* Medio */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Medio <span className="text-red-500">*</span>
            </label>
            <Controller
              name="medio"
              control={control}
              rules={{ required: t.required_select }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={MEDIOS}
                  isClearable
                  placeholder="Selecciona el medio..."
                  instanceId="select-medio-meeting"
                  classNamePrefix="react-select"
                  formatOptionLabel={(opt) => {
                    const meta = MEDIO_META[opt.value];
                    return (
                      <span className="flex items-center gap-2 text-sm">
                        {meta?.icon}
                        {opt.label}
                      </span>
                    );
                  }}
                />
              )}
            />
            {errors.medio && <p className="text-xs text-red-500">{errors.medio.message}</p>}
          </div>

          {/* Nota */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.note}
            </label>
            <textarea
              {...register('nota')}
              rows={3}
              placeholder="Detalles de la reunión..."
              className="form-input w-full resize-none text-sm"
            />
          </div>

          {/* Personas involucradas */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <IconUsers className="h-3.5 w-3.5 text-gray-400" />
                Personas involucradas
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputPersona}
                onChange={e => setInputPersona(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPersona(); } }}
                placeholder="Nombre de la persona..."
                className="form-input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={addPersona}
                disabled={!inputPersona.trim()}
                className="group flex items-center gap-1 btn btn-outline-primary btn-sm shrink-0 disabled:opacity-40"
              >
                <IconPlus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {personas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {personas.map((p, i) => (
                  <span key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                               bg-primary/10 text-primary border border-primary/20">
                    {p}
                    <button type="button" onClick={() => removePersona(i)}
                      className="ml-0.5 hover:opacity-60 transition">
                      <IconX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 btn disabled:opacity-50 flex-1
                ${isEditing ? 'btn-warning' : 'btn-primary'}`}
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  {isEditing ? <IconPencil className="h-3.5 w-3.5" /> : <IconPlus className="h-3.5 w-3.5" />}
                  {isEditing ? 'Actualizar' : 'Programar'}
                </>
              )}
            </button>
            {isEditing && (
              <button type="button" onClick={cancelEdit}
                className="btn border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                {t.btn_cancel}
              </button>
            )}
          </div>
        </div>

        {/* ── MEETING CARDS ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-3">

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Reuniones programadas
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {meetings.length}
            </span>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
              <IconCalendar className="h-10 w-10 opacity-30" />
              <p className="text-sm">Sin reuniones programadas</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {meetings.map((m) => {
                const { day, month, year } = parseDateParts(m.fecReunion);
                const meta = MEDIO_META[m.medio] ?? { chip: 'bg-gray-100 text-gray-500 border-gray-200', icon: null };
                const personasList = (m.personas ?? []).map(p => p.nombre ?? p);
                const isBeingEdited = editData?.codReunion === m.codReunion;
                return (
                  <div key={m.codReunion}
                    className={`rounded-xl border bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30 overflow-hidden transition-all
                      ${isBeingEdited ? 'border-warning/50 ring-1 ring-warning/30' : 'border-gray-200 dark:border-gray-700'}`}>

                    <div className="flex gap-0">

                      {/* Date block */}
                      <div className="flex flex-col items-center justify-center px-4 py-4 bg-primary/5 dark:bg-primary/10 border-r border-gray-100 dark:border-gray-700 shrink-0 min-w-[68px]">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">{month}</span>
                        <span className="text-2xl font-bold text-gray-800 dark:text-white leading-none my-0.5">{day}</span>
                        <span className="text-[10px] text-gray-400">{year}</span>
                        {m.horReunion && (
                          <span className="mt-2 flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            <IconClock className="h-2.5 w-2.5" />
                            {m.horReunion}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 px-4 py-3 space-y-2 min-w-0">

                        {/* Top row: medio badge + actions */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.chip}`}>
                            {meta.icon}
                            {MEDIOS.find(mo => mo.value === m.medio)?.label ?? m.medio}
                          </span>
                          <div className="flex gap-1 shrink-0">
                            <button type="button" onClick={() => openEdit(m)}
                              className="p-1 rounded text-gray-400 hover:bg-warning/10 hover:text-warning transition">
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDelete(m)}
                              className="p-1 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition">
                              <IconTrashLines className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nota */}
                        {m.nota && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                            {m.nota}
                          </p>
                        )}

                        {/* Personas */}
                        {personasList.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <IconUsers className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {personasList.map((p, i) => (
                              <span key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
