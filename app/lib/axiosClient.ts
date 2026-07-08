import axios from "axios";
import { store } from "@/store";

const ICON_SHIELD = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const showVencidoAttack = () => {
  if (typeof window === 'undefined') return;
  import('sweetalert2').then(({ default: Swal }) => {
    Swal.fire({
      html: `<div style="padding:14px 4px 8px">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#7f1d1d);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 32px rgba(220,38,38,0.45)">
          ${ICON_SHIELD}
        </div>
        <h2 style="color:#1e293b;font-size:16px;font-weight:800;margin:0 0 10px;line-height:1.3;letter-spacing:-0.01em">
          ⚠️ Intento bloqueado y registrado
        </h2>
        <p style="color:#334155;font-size:13px;margin:0 0 10px;line-height:1.55">
          Esta cotización está <strong>protegida a nivel de servidor</strong>. Tu intento de modificarla saltándote las restricciones del navegador <strong>no funcionó</strong> — y tampoco funcionará.
        </p>
        <p style="color:#64748b;font-size:12px;margin:0 0 14px;line-height:1.5">
          Este evento fue registrado automáticamente con tu usuario, fecha, hora y el endpoint exacto que intentaste manipular. Esta información queda disponible para auditoría interna.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;text-align:left">
          <p style="color:#991b1b;font-size:11.5px;font-weight:600;margin:0;line-height:1.5">
            🔒 Recuerda: eres personal de confianza de la empresa. Cualquier intento de manipular datos protegidos se considera una falta grave y puede tener consecuencias disciplinarias.
          </p>
        </div>
      </div>`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc2626',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  });
};

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.authState.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 409 &&
      error?.config?.url?.includes('cotizaciondetalle/')
    ) {
      showVencidoAttack();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;