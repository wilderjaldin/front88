import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {},
  token: '',
  permissions: [],

  impersonated: false,

  adminToken: '',
  adminUser: null,
  adminPermissions: []
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

    }

  },
});

export const { setAuth, setUser, setImpersonation, restoreAdmin } = authSlice.actions

export const selectToken = (state) => state.authState.token
export const selectUser = (state) => state.authState.user
export const selectPermissions = (state) => state.authState.permissions
export const selectAuth = (state) => { return { user: state.authState.user, token: state.authState.token } }
export const selectImpersonated = (state) => state.authState.impersonated

export default authSlice.reducer
