import { store } from "@/store";

// redux-persist guarda TODO el root bajo esta key de localStorage (ver
// persistConfig.key en store/index.js), con cada sub-reducer serializado
// como un string JSON adentro.
const STORAGE_KEY = "persist:root-daxsoft";

// El evento "storage" del navegador SOLO se dispara en las OTRAS pestañas del
// mismo origen (nunca en la que hizo el cambio) — es justo el gancho que
// necesitamos: si en esta pestaña el token activo quedó desactualizado
// respecto al que otra pestaña acaba de guardar, recargamos para que todo
// (Redux, componentes ya montados, requests en curso) arranque de cero con
// la cuenta activa correcta. Sin esto, una pestaña vieja seguiría mandando a
// la API el JWT de la cuenta anterior.
let initialized = false;

export function initMultiAccountSync() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      const root = JSON.parse(e.newValue);
      const authState = JSON.parse(root.authState ?? "{}");
      const newToken = authState.token;
      const currentToken = store.getState().authState.token;
      if (newToken !== currentToken) {
        window.location.reload();
      }
    } catch {
      // Valor de storage corrupto/parcial (escritura a medio hacer) — se ignora,
      // la próxima escritura completa disparará el evento de nuevo.
    }
  });
}
