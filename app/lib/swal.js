import Swal from 'sweetalert2';

const ICON_CHECK    = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_X        = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const ICON_QUESTION = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_INFO     = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2.5"/><path d="M12 8h.01M12 12v4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export const swalSuccess = (title, msg = '') => Swal.fire({
  html: `<div style="display:flex;align-items:center;gap:8px;padding:0">
    ${ICON_CHECK}
    <div style="text-align:left">
      ${msg ? `<p style="color:rgba(255,255,255,0.75);font-size:10px;margin:0 0 2px;text-transform:uppercase;letter-spacing:.08em">${msg}</p>` : ''}
      <p style="color:#fff;font-size:13px;font-weight:600;margin:0;line-height:1.3">${title}</p>
    </div>
  </div>`,
  backdrop: false, position: 'top-end', padding: '10px 14px',
  background: '#16a34a', showConfirmButton: false, timer: 2000, timerProgressBar: true,
});

export const swalError = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fca5a5,#ef4444);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(239,68,68,0.3)">${ICON_X}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#ef4444',
});

export const swalConfirm = (title, msg = '', { confirmText = 'Sí', cancelText = 'Cancelar', confirmColor = '#4f46e5' } = {}) => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#a5b4fc,#4f46e5);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(79,70,229,0.3)">${ICON_QUESTION}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 ${msg ? '10px' : '0'};line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: cancelText,
  confirmButtonColor: confirmColor, reverseButtons: true,
});

// A diferencia de swalSuccess (toast, se autocierra), esta es una alerta centrada
// con botón de confirmar — para avisos importantes que el usuario debe leer y cerrar.
export const swalSuccessModal = (title, msg = '', confirmText = 'Cerrar') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#86efac,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(22,163,74,0.3)">${ICON_CHECK}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 ${msg ? '10px' : '0'};line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#16a34a',
});

export const swalInfo = (title, msg = '', confirmText = 'Entendido') => Swal.fire({
  html: `<div style="padding:12px 0 6px">
    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 24px rgba(245,158,11,0.3)">${ICON_INFO}</div>
    <h2 style="color:#1e293b;font-size:17px;font-weight:700;margin:0 0 10px;line-height:1.3">${title}</h2>
    ${msg ? `<p style="color:#64748b;font-size:13px;margin:0">${msg}</p>` : ''}
  </div>`,
  showConfirmButton: true, confirmButtonText: confirmText, confirmButtonColor: '#f59e0b',
});
