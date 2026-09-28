import axiosClient from "@/app/lib/axiosClient";
import { store } from "@/store";
import { setAuth, refreshSession as refreshSessionAction } from "@/store/authSlice";
import { swalError, swalInfo } from "@/app/lib/swal";

const URL_SESSION_CHECK = "usuarios/session-check";

type Router = { push: (href: string) => void };
type Dict = Record<string, string | undefined>;

// Evita chequeos superpuestos si "permisosActualizados", la carga del dashboard
// y un reconnect del hub caen casi al mismo tiempo.
let checking = false;

function doLogout() {
  store.dispatch(setAuth({ token: null, user: null, permissions: null }));
}

// Aviso central y bloqueante (mismo patrón que swalError: sin timer, requiere
// click) — a propósito NO es el toast de notificaciones de arriba a la derecha:
// esto corta el acceso, así que debe verse y confirmarse, no perderse en una
// esquina ni desaparecer solo.
async function endSession(router: Router, title: string, message: string, t: Dict) {
  await swalError(title, message, t.btn_go_to_login ?? "Ir al inicio de sesión");
  doLogout();
  router.push("/");
}

function notifyPermissionsUpdated(t: Dict) {
  swalInfo(
    t.permissions_updated_title ?? "Tus permisos fueron actualizados",
    t.permissions_updated_message ?? "Un administrador actualizó tus permisos. Algunas opciones del menú pueden haber cambiado.",
    t.close ?? "Cerrar"
  );
}

/**
 * Chequeo puntual de sesión/permisos vigentes — se llama en 3 momentos
 * puntuales (evento "permisosActualizados" del hub, al cargar el dashboard, y
 * en onreconnected de SignalR), nunca por temporizador/polling.
 * "sesionRevocada" NO pasa por acá — ver forceLogout: es un corte directo, no
 * hay nada que refrescar.
 */
export async function checkSession(router: Router, t: Dict = {}) {
  if (checking) return;
  checking = true;
  try {
    const rs = await axiosClient.get(URL_SESSION_CHECK);
    const data = rs.data ?? {};

    if (!data.active) {
      await endSession(
        router,
        t.session_ended_title ?? "Tu sesión finalizó",
        t.session_ended_message ?? "Tu sesión ya no está activa. Vuelve a iniciar sesión para continuar.",
        t
      );
      return;
    }

    if (data.permissionsChanged) {
      // El token ya viene con los permisos nuevos codificados en el back; si
      // además manda el array de permisos, se actualiza en el mismo golpe.
      store.dispatch(refreshSessionAction({ token: data.token, permissions: data.permissions }));
      notifyPermissionsUpdated(t);
    }
  } catch {
    // Fallo de red puntual: no forzar logout por esto — se vuelve a intentar
    // en el próximo de los 3 disparadores.
  } finally {
    checking = false;
  }
}

/** Evento "sesionRevocada" del hub: corte directo, sin llamar a session-check. */
export async function forceLogout(router: Router, t: Dict = {}) {
  await endSession(
    router,
    t.session_revoked_title ?? "Tu sesión fue cerrada",
    t.session_revoked_message ?? "Un administrador cerró tu sesión de forma remota.",
    t
  );
}
