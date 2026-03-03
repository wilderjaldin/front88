import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  locale: 'es'
};

export const localeSlice = createSlice({
 name: 'localeSlice',
  initialState: initialState,
  reducers: {
    setLocale: (state, action) => {
      state.locale = action.payload   
    }    
  },
});

export const { setLocale } = localeSlice.actions
export const getLocale = (state) => state.localeState.locale
export default localeSlice.reducer
