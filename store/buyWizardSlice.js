import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderId:       null,
  shippingInfo:  {},
  optionPayment: '',
  contact:       {},
};

const buyWizardSlice = createSlice({
  name: 'buyWizard',
  initialState,
  reducers: {
    setWizardOrder: (state, { payload }) => {
      if (state.orderId !== payload) return { ...initialState, orderId: payload };
    },
    setWizardShipping: (state, { payload }) => { state.shippingInfo  = payload; },
    setWizardPayment:  (state, { payload }) => { state.optionPayment = payload; },
    setWizardContact:  (state, { payload }) => { state.contact       = payload; },
    clearBuyWizard:    () => initialState,
  },
});

export const {
  setWizardOrder, setWizardShipping,
  setWizardPayment, setWizardContact, clearBuyWizard,
} = buyWizardSlice.actions;

export const selectBuyWizard = (state) => state.buyWizard;

export default buyWizardSlice.reducer;
