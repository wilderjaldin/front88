'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import IconSave from '@/components/icon/icon-save';
import IconUser from '@/components/icon/icon-user';
import IconLock from '@/components/icon/icon-lock';
import IconMail from '@/components/icon/icon-mail';
import IconSettings from '@/components/icon/icon-settings';
import { useTranslation } from '@/app/locales';
import { useDynamicTitle } from '@/app/hooks/useDynamicTitle';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, selectUser } from '@/store/authSlice';
import {
  toggleTheme, toggleMenu, toggleNavbar, toggleSemidark,
} from '@/store/themeConfigSlice';

const useMsg = () => {
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text: string }
  const timer = useRef(null);
  const show = (type, text) => {
    clearTimeout(timer.current);
    setMsg({ type, text });
    timer.current = setTimeout(() => setMsg(null), 4000);
  };
  return [msg, show];
};

const InlineMsg = ({ msg }) => {
  if (!msg) return null;
  const isOk = msg.type === 'success';
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm
      ${isOk
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40'
        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40'}`}>
      {isOk
        ? <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        : <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
      }
      {msg.text}
    </div>
  );
};

const initials = (name) =>
  (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const OptionPills = ({ value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors text-sm
          ${value === opt.value
            ? 'border-primary bg-primary/10 text-primary font-medium dark:bg-primary/20'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer gap-4">
    <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
    <span className="relative inline-flex items-center">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary transition-colors" />
      <span className="absolute left-[2px] top-[2px] h-5 w-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
    </span>
  </label>
);

const ReadField = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{value || '—'}</span>
  </div>
);

const STRENGTH_LEVELS = [
  { label: 'Muy débil',  bar: 'bg-red-500',     text: 'text-red-500'     },
  { label: 'Débil',      bar: 'bg-orange-500',  text: 'text-orange-500'  },
  { label: 'Regular',    bar: 'bg-yellow-500',  text: 'text-yellow-500'  },
  { label: 'Fuerte',     bar: 'bg-emerald-500', text: 'text-emerald-500' },
];

const getStrength = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return { score: Math.max(score, 1), ...STRENGTH_LEVELS[Math.max(score - 1, 0)] };
};

const StrengthBar = ({ value }) => {
  const info = getStrength(value);
  if (!info) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {STRENGTH_LEVELS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300
            ${i < info.score ? info.bar : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${info.text}`}>{info.label}</p>
    </div>
  );
};

const EyeIcon = ({ open }) => open ? (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
) : (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PwdInput = ({ placeholder, maxLen, registration, error, show: extShow, onToggle, hideToggle }) => {
  const [intShow, setIntShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const show   = extShow    !== undefined ? extShow    : intShow;
  const toggle = onToggle   !== undefined ? onToggle   : () => setIntShow(v => !v);
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          maxLength={maxLen}
          {...registration}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); registration?.onBlur?.(e); }}
          className="form-input w-full pr-10"
          placeholder={focused ? '' : (placeholder ?? '••••••••')}
        />
        {!hideToggle && (
          <button
            type="button"
            onClick={toggle}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            <EyeIcon open={show} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const SaveBtn = ({ loading, label, disabled }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold
               text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/25
               active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
  >
    {loading
      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      : <IconSave className="h-4 w-4" />
    }
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function UserSettings() {
  const t        = useTranslation();
  const dispatch = useDispatch();
  const authUser = useSelector(selectUser);
  const themeConfig  = useSelector((state) => state.themeConfig);
  const router       = useRouter();
  const searchParams = useSearchParams();
  useDynamicTitle('Configuraciones');

  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [msgData, showMsgData]    = useMsg();
  const [msgPwd,  showMsgPwd]     = useMsg();
  const [msgSmtp, showMsgSmtp]    = useMsg();
  const [showNew, setShowNew]     = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [verifiedSmtp, setVerifiedSmtp] = useState(null);
  const [msgLogin, showMsgLogin]  = useMsg();

  const TABS = [
    { key: 'general',    label: 'General',    icon: IconUser },
    { key: 'acceso',     label: 'Acceso',     icon: IconLock },
    { key: 'smtp',       label: 'SMTP',       icon: IconMail },
    { key: 'apariencia', label: 'Apariencia', icon: IconSettings },
  ];
  const tabFromUrl = TABS.findIndex(tab => tab.key === searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState(tabFromUrl >= 0 ? tabFromUrl : 0);
  const tabRefs = useRef([]);
  const [glider, setGlider] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.findIndex(tab => tab.key === searchParams.get('tab'));
    setActiveTab(idx >= 0 ? idx : 0);
  }, [searchParams]);

  const handleTabChange = (index) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', TABS[index].key);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab];
      if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    document.fonts?.ready?.then(measure);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, [activeTab, loading]);

  useEffect(() => {
    axiosClient.get('/usuarios/mi-perfil')
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Datos personales ─────────────────────────────────────────────────────────
  const {
    register: regData,
    handleSubmit: submitData,
    reset: resetData,
    watch: watchData,
    formState: { errors: errData, isSubmitting: savingData },
  } = useForm();

  useEffect(() => {
    if (!profile) return;
    resetData({
      nomUsuario: profile.nomUsuario ?? '',
      usuIdioma:  profile.usuIdioma  ?? 'ES',
    });
  }, [profile]);

  const onSaveData = async (data) => {
    try {
      const res = await axiosClient.put('/usuarios/mi-perfil/info', {
        nomUsuario: data.nomUsuario,
        usuIdioma:  data.usuIdioma,
      });
      setProfile(prev => ({ ...prev, ...res.data }));
      dispatch(setUser({ user: { ...authUser, name: res.data.nomUsuario } }));
      showMsgData('success', 'Información actualizada correctamente');
    } catch {
      showMsgData('error', 'No se pudo guardar la información');
    }
  };

  // ── Correo de acceso (login) — independiente del correo SMTP ────────────────
  const {
    register: regLogin,
    handleSubmit: submitLogin,
    reset: resetLogin,
    formState: { errors: errLogin, isSubmitting: savingLogin },
  } = useForm({ defaultValues: { logUsuario: '', claActual: '' } });

  useEffect(() => {
    if (!profile) return;
    resetLogin({ logUsuario: profile.logUsuario ?? '', claActual: '' });
  }, [profile]);

  const onSaveLogin = async (data) => {
    try {
      await axiosClient.put('/usuarios/mi-perfil/login', {
        logUsuario:  data.logUsuario,
        claveActual: data.claActual,
      });
      setProfile(prev => ({ ...prev, logUsuario: data.logUsuario }));
      showMsgLogin('success', 'Correo de acceso actualizado correctamente');
      resetLogin({ logUsuario: data.logUsuario, claActual: '' });
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'No se pudo actualizar el correo de acceso';
      showMsgLogin('error', msg);
    }
  };

  // ── Contraseña de acceso ─────────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: submitPwd,
    watch,
    reset: resetPwd,
    formState: { errors: errPwd, isSubmitting: savingPwd },
  } = useForm({ defaultValues: { claActual: '', claNew: '', claConfirm: '' } });

  const newPwd = watch('claNew');

  const onSavePwd = async (data) => {
    try {
      await axiosClient.put('/usuarios/mi-perfil/password', {
        claveActual:    data.claActual,
        claveNueva:     data.claNew,
        confirmarClave: data.claConfirm,
      });
      showMsgPwd('success', 'Contraseña actualizada correctamente');
      resetPwd();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'No se pudo cambiar la contraseña';
      showMsgPwd('error', msg);
    }
  };

  // ── Correo y contraseña SMTP ─────────────────────────────────────────────────
  const {
    register: regSmtp,
    handleSubmit: submitSmtp,
    setValue: setSmtpValue,
    watch: watchSmtp,
    reset: resetSmtp,
    formState: { errors: errSmtp, isSubmitting: savingSmtp },
  } = useForm({ defaultValues: { smtpUser: '', email: '', pwdMail: '' } });

  useEffect(() => {
    if (!profile) return;
    const smtpEmail = profile.corElectronico ?? '';
    resetSmtp({ smtpUser: smtpEmail.split('@')[0] ?? '', email: smtpEmail, pwdMail: '' });
    // Guardar exige probar la conexión en la sesión actual — no alcanza con que
    // el backend la tenga marcada como verificada.
    setVerifiedSmtp(null);
  }, [profile]);

  const translateSmtpError = (rawMessage = '') => {
    const msg = rawMessage.toLowerCase();
    if (msg.includes('535') || msg.includes('authentication')) return 'Usuario o contraseña incorrectos';
    if (msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('getaddrinfo') || msg.includes('enotfound')) {
      return 'No se pudo conectar con el servidor de correo';
    }
    return 'No se pudo verificar la conexión SMTP';
  };

  const testSmtpConnection = async () => {
    const email    = watchSmtp('email');
    const password = watchSmtp('pwdMail');

    if (!email) {
      showMsgSmtp('error', 'Ingresa el correo primero');
      return;
    }

    setTestingSmtp(true);
    try {
      const rs = await axiosClient.post('/usuarios/probar-smtp', { corElectronico: email, pwdMail: password });
      if (rs.data?.exitoso) {
        setVerifiedSmtp({ email, password });
        showMsgSmtp('success', 'Conexión exitosa');
      } else {
        setVerifiedSmtp(null);
        showMsgSmtp('error', translateSmtpError(rs.data?.mensaje));
      }
    } catch (error) {
      setVerifiedSmtp(null);
      showMsgSmtp('error', error.request ? 'No se pudo conectar con el servidor' : 'No se pudo verificar la conexión SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const isSmtpVerified = !!(
    verifiedSmtp &&
    verifiedSmtp.email === watchSmtp('email') &&
    verifiedSmtp.password === watchSmtp('pwdMail')
  );

  const onSaveSmtp = async (data) => {
    try {
      const res = await axiosClient.put('/usuarios/mi-perfil/smtp', {
        corElectronico: data.email,
        pwdMail:        data.pwdMail,
        smtpVerificado: isSmtpVerified,
      });
      // El PUT ya devuelve el estado real guardado — usar eso, no lo que
      // asumimos localmente antes de mandar la request.
      setProfile(prev => ({
        ...prev,
        corElectronico: res.data.corElectronico,
        smtpVerificado: res.data.smtpVerificado,
      }));
      showMsgSmtp('success', 'Correo SMTP actualizado correctamente');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'No se pudo guardar la configuración SMTP';
      showMsgSmtp('error', msg);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const p = profile ?? {};
  const isActive   = p.codEstado === 'AC';
  const statusLabel = isActive ? 'Activo' : p.codEstado === 'IN' ? 'Inactivo' : (p.codEstado ?? '—');

  return (
    <div className="space-y-5 pb-8">

      <ul className="flex space-x-2 text-sm">
        <li className="text-gray-500">Configuraciones</li>
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* ── Panel izquierdo — solo lectura ──────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700
                        bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-6 space-y-6">

          {/* Avatar + nombre + login + badges */}
          <div className="flex flex-col items-center text-center gap-3">

            <div className="flex h-20 w-20 items-center justify-center rounded-full
                            bg-primary text-white text-2xl font-bold ring-4 ring-primary/20">
              {initials(p.nomUsuario)}
            </div>

            <div>
              <div className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                {p.nomUsuario || '—'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 lowercase">{p.logUsuario || '—'}</div>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                             bg-primary/10 text-primary dark:text-blue-400">
              {p.nomRol || '—'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
              ${isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {statusLabel}
            </span>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Ubicación y datos del sistema */}
          <div className="space-y-4">
            <ReadField label="Correo de acceso" value={p.logUsuario?.toLowerCase()} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Correo SMTP</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${p.smtpVerificado ? 'bg-green-500' : 'bg-amber-400'}`}
                  title={p.smtpVerificado ? 'Verificado' : 'No verificado'}
                />
                {p.corElectronico?.toLowerCase() || '—'}
              </span>
            </div>
            <ReadField label="País"     value={p.nomPais} />
            <ReadField label="Ciudad"   value={p.nomCiudad} />
            <ReadField label="Código"   value={p.codUsuario ? `#${p.codUsuario}` : null} />

            <div className="flex gap-2 flex-wrap pt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                ${p.blnSeguimiento
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.blnSeguimiento ? 'bg-sky-500' : 'bg-gray-400'}`} />
                Seguimiento
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                ${p.blnMensaje
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.blnMensaje ? 'bg-violet-500' : 'bg-gray-400'}`} />
                Mensajes
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Registrado por</span>
            {p.usuarioRegistra && (
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{p.usuarioRegistra}</div>
            )}
            <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{p.fecRegistra || '—'}</div>
          </div>

        </div>

        {/* ── Panel derecho — editable ────────────────────────────────────── */}
        <div className="space-y-6 max-w-xl">

          {/* Tabs */}
          <div className="relative flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-slate-700 shadow-sm transition-all duration-200 ease-out"
              style={{ left: glider.left, width: glider.width }}
            />
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  ref={el => { tabRefs.current[index] = el; }}
                  onClick={() => handleTabChange(index)}
                  className={`relative z-10 flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors
                    ${activeTab === index ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* General */}
          {activeTab === 0 && (
          <form
            onSubmit={submitData(onSaveData)}
            className="rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Información personal</h2>
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nombre completo <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                {...regData('nomUsuario', {
                  required:  'Campo requerido',
                  minLength: { value: 3,  message: 'Mínimo 3 caracteres' },
                  maxLength: { value: 50, message: 'Máximo 50 caracteres' },
                  pattern:   { value: /^[a-zA-ZÀ-ÿ\s]+$/, message: 'Solo letras y espacios' },
                  validate:  v => v.trim().length >= 3 || 'El nombre no puede ser solo espacios',
                })}
                className="form-input w-full"
              />
              {errData.nomUsuario && (
                <p className="text-xs text-red-500">{errData.nomUsuario.message}</p>
              )}
            </div>

            {/* Idioma + botón en la misma fila */}
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Idioma de reportes
                </label>
                <div className="flex gap-2">
                  {[{ value: 'ES', label: 'Español' }, { value: 'US', label: 'English' }].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors text-sm
                        ${watchData('usuIdioma') === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-medium dark:bg-primary/20'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      <input type="radio" value={opt.value} {...regData('usuIdioma')} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <SaveBtn loading={savingData} label={t.btn_save} />
            </div>
            <InlineMsg msg={msgData} />
          </form>
          )}

          {/* Acceso */}
          {activeTab === 1 && (
          <>
          <form
            onSubmit={submitLogin(onSaveLogin)}
            className="rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Correo de acceso</h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Correo <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <input
                type="email"
                autoComplete="off"
                {...regLogin('logUsuario', {
                  required: 'Campo requerido',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                })}
                className="form-input w-full"
              />
              {errLogin.logUsuario && (
                <p className="text-xs text-red-500">{errLogin.logUsuario.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Contraseña actual <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <PwdInput
                maxLen={100}
                registration={regLogin('claActual', {
                  required:  'Campo requerido',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                error={errLogin.claActual}
              />
            </div>

            <InlineMsg msg={msgLogin} />
            <div className="flex justify-end">
              <SaveBtn loading={savingLogin} label={t.btn_save} />
            </div>
          </form>

          <form
            onSubmit={submitPwd(onSavePwd)}
            className="rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Contraseña de acceso</h2>
            </div>

            {/* Actual — fila propia */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Contraseña actual <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <PwdInput
                maxLen={100}
                registration={regPwd('claActual', {
                  required:  'Campo requerido',
                  minLength: { value: 6,   message: 'Mínimo 6 caracteres' },
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                })}
                error={errPwd.claActual}
              />
            </div>

            {/* Nueva + Confirmar — misma fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nueva contraseña <span className="text-red-400 normal-case font-normal">*</span>
                </label>
                <PwdInput
                  maxLen={100}
                  show={showNew}
                  onToggle={() => setShowNew(v => !v)}
                  registration={regPwd('claNew', {
                    required:  'Campo requerido',
                    minLength: { value: 6,   message: 'Mínimo 6 caracteres' },
                    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                  })}
                  error={errPwd.claNew}
                />
                <StrengthBar value={newPwd} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Confirmar contraseña <span className="text-red-400 normal-case font-normal">*</span>
                </label>
                <PwdInput
                  maxLen={100}
                  show={showNew}
                  hideToggle
                  registration={regPwd('claConfirm', {
                    required:  'Campo requerido',
                    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                    validate:  v => v === newPwd || 'Las contraseñas no coinciden',
                  })}
                  error={errPwd.claConfirm}
                />
              </div>
            </div>

            <InlineMsg msg={msgPwd} />
            <div className="flex justify-end">
              <SaveBtn loading={savingPwd} label="Cambiar contraseña" />
            </div>
          </form>
          </>
          )}

          {/* SMTP */}
          {activeTab === 2 && (
          <form
            onSubmit={submitSmtp(onSaveSmtp)}
            className="rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Correo y contraseña SMTP</h2>
            </div>

            {(profile?.smtpVerificado || isSmtpVerified) ? (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs
                              bg-green-50 text-green-700 border border-green-200
                              dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40">
                ✓ La conexión SMTP de esta cuenta está verificada y lista para el envío de correos.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs
                              bg-amber-50 text-amber-700 border border-amber-200
                              dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40">
                ⚠️ La conexión SMTP de esta cuenta no ha sido verificada.
              </div>
            )}

            {/* Correo SMTP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Correo SMTP <span className="text-red-400 normal-case font-normal">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  autoComplete="off"
                  className="form-input w-full rounded-r-none"
                  {...regSmtp('smtpUser', {
                    required: 'Campo requerido',
                    pattern: { value: /^[a-zA-Z0-9._]+$/, message: 'Solo letras, números, punto y guión bajo' },
                  })}
                  onChange={(e) => {
                    const username = e.target.value.trim();
                    setSmtpValue('email', username ? `${username}@daxparts.com` : '', { shouldValidate: true });
                  }}
                />
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-l-0
                                 border-gray-300 rounded-r-lg text-sm dark:bg-gray-800 dark:border-gray-700">
                  @daxparts.com
                </span>
              </div>
              {errSmtp.smtpUser && <p className="text-xs text-red-500">{errSmtp.smtpUser.message}</p>}
              <input type="hidden" {...regSmtp('email', { required: { value: true, message: 'Campo requerido' } })} />
            </div>

            {/* Contraseña SMTP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Contraseña del correo (SMTP)
              </label>
              <PwdInput
                maxLen={100}
                registration={regSmtp('pwdMail')}
                error={errSmtp.pwdMail}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={testSmtpConnection}
                  disabled={testingSmtp}
                  className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingSmtp ? 'Probando…' : 'Probar Conexión'}
                </button>
              </div>
              <SaveBtn loading={savingSmtp} label={t.btn_save} disabled={!isSmtpVerified} />
            </div>

            <InlineMsg msg={msgSmtp} />
          </form>
          )}

          {/* Apariencia */}
          {activeTab === 3 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-900/40 p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Apariencia</h2>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Tema</label>
              <OptionPills
                value={themeConfig.theme}
                onChange={v => dispatch(toggleTheme(v))}
                options={[
                  { value: 'light',  label: 'Claro' },
                  { value: 'dark',   label: 'Oscuro' },
                  { value: 'system', label: 'Sistema' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Estilo de menú</label>
              <OptionPills
                value={themeConfig.menu}
                onChange={v => dispatch(toggleMenu(v))}
                options={[
                  { value: 'vertical',             label: 'Vertical' },
                  { value: 'collapsible-vertical', label: 'Colapsable' },
                  { value: 'horizontal',           label: 'Horizontal' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Barra de navegación</label>
              <OptionPills
                value={themeConfig.navbar}
                onChange={v => dispatch(toggleNavbar(v))}
                options={[
                  { value: 'navbar-sticky', label: 'Fija' },
                  { value: 'navbar-static', label: 'Estática' },
                ]}
              />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <Toggle
                label="Menú semi-oscuro"
                checked={!!themeConfig.semidark}
                onChange={v => dispatch(toggleSemidark(v))}
              />
            </div>
          </div>
          )}

        </div>
      </div>
    </div>
  );
}
