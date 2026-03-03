import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {},
  token: '',
  permissions: {}
};

export const authSlice = createSlice({
 name: 'authSlice',
  initialState: initialState,
  reducers: {
    setUser: (state, action) => {
      
      state.user = action.payload.user
      
    },
    setAuth: ( state, action ) => {
      
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.permissions = action.payload.permissions;
    }
    
  },
});

export const { setAuth } = authSlice.actions
export const { setUser } = authSlice.actions
export const selectToken = (state) => state.authState.token
export const selectUser = (state) => state.authState.user
export const selectPermissions = (state) => state.authState.permissions
export const selectAuth = (state) => { return { user: state.authState.user, token: state.authState.token } }
export default authSlice.reducer
