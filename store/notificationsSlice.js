import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  totalNoLeidos: 0,
};

export const notificationsSlice = createSlice({
  name: 'notificationsSlice',
  initialState: initialState,
  reducers: {
    setTotalNoLeidos: (state, action) => {
      state.totalNoLeidos = action.payload;
    },
    decrementTotalNoLeidos: (state) => {
      state.totalNoLeidos = Math.max(0, state.totalNoLeidos - 1);
    },
  },
});

export const { setTotalNoLeidos, decrementTotalNoLeidos } = notificationsSlice.actions
export const selectTotalNoLeidos = (state) => state.notificationsState.totalNoLeidos
export default notificationsSlice.reducer
