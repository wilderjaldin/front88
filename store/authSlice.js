import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {},
  token: '',
  permissions: [],

  impersonated: false,

  adminToken: '',
  adminUser: null,
  adminPermissions: [],

  // Cuentas en segundo plano (multi-sesión tipo Google): cada entrada es
  // { token, user, permissions } de una cuenta logueada que no es la activa.
  // El login normal (setAuth) NO las toca; solo addAccount/switchAccount/removeAccount.
  sessions: [],
};

// Identidad estable de una cuenta — Id si vino del back, si no el email en
// minúsculas (ambos pueden faltar según el endpoint, por eso el fallback).
const accountKey = (user) => {
  const id = user?.id ?? user?.Id;
  if (id !== undefined && id !== null) return `id:${id}`;
  const email = user?.email ?? user?.Email;
  return email ? `email:${String(email).toLowerCase()}` : null;
};

export const authSlice = createSlice({
  name: 'authSlice',
  initialState: initialState,
  reducers: {
    setUser: (state, action) => {

      state.user = action.payload.user

    },
    setAuth: (state, action) => {

      state.token = action.payload.token;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions;

      // setAuth también es el logout (token:null) — al cerrar sesión se cierran
      // TODAS las cuentas, no solo la activa (más seguro ante una sesión revocada).
      // En un login normal (primera cuenta) `sessions` ya está vacío, así que no rompe nada.
      state.sessions = [];
    },
    setImpersonation: (state, action) => {

      state.adminToken = state.token;
      state.adminUser = state.user;
      state.adminPermissions = state.permissions;

      state.token = action.payload.token;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions;

      state.impersonated = true;
    },
    restoreAdmin: (state) => {

      state.token = state.adminToken;
      state.user = state.adminUser;
      state.permissions = state.adminPermissions;

      state.adminToken = '';
      state.adminUser = null;
      state.adminPermissions = [];

      state.impersonated = false;

    },
    // Resultado de usuarios/session-check cuando permissionsChanged=true: pisa el
    // token (ya viene con los permisos nuevos codificados en el back) y, si el back
    // también manda el array de permisos, lo actualiza en el mismo golpe — a
    // diferencia de setAuth, nunca toca `user` ni corre riesgo de vaciar `permissions`
    // si esa clave no viene en el payload.
    refreshSession: (state, action) => {
      state.token = action.payload.token;
      if (action.payload.permissions !== undefined) {
        state.permissions = action.payload.permissions;
      }
    },

    // La verificación de credenciales (login real contra la API) y el chequeo
    // de duplicados ya se hicieron antes de despachar esto — acá solo se
    // archiva la cuenta activa actual y se activa la recién logueada.
    addAccount: (state, action) => {
      if (state.token) {
        state.sessions.push({ token: state.token, user: state.user, permissions: state.permissions });
      }
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions;
    },

    // Intercambia la cuenta activa con una de `sessions` (por su key de identidad).
    switchAccount: (state, action) => {
      const key = action.payload.key;
      const idx = state.sessions.findIndex((s) => accountKey(s.user) === key);
      if (idx === -1) return;
      const target = state.sessions[idx];
      state.sessions[idx] = { token: state.token, user: state.user, permissions: state.permissions };
      state.token = target.token;
      state.user = target.user;
      state.permissions = target.permissions;
    },

    // Olvida una cuenta en segundo plano (no afecta a la activa).
    removeAccount: (state, action) => {
      const key = action.payload.key;
      state.sessions = state.sessions.filter((s) => accountKey(s.user) !== key);
    },

  },
});

export const {
  setAuth, setUser, setImpersonation, restoreAdmin, refreshSession,
  addAccount, switchAccount, removeAccount,
} = authSlice.actions

export { accountKey }

export const selectToken = (state) => state.authState.token
export const selectUser = (state) => state.authState.user
export const selectPermissions = (state) => state.authState.permissions
// Acceso total: lo define la API en el login. Es solo para UX — la autorización
// real la aplica el backend en cada request desde el token, así que si el usuario
// lo manipula en el navegador solo "ve" opciones que igual le darán 403.
export const selectIsSuperAdmin = (state) => state.authState.user?.esSuperAdmin === true
export const selectAuth = (state) => { return { user: state.authState.user, token: state.authState.token } }
export const selectImpersonated = (state) => state.authState.impersonated
export const selectSessions = (state) => state.authState.sessions ?? []

export default authSlice.reducer