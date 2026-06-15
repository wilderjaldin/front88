import { combineReducers, configureStore } from '@reduxjs/toolkit';

import themeConfigReducer from '@/store/themeConfigSlice';
import authReducer from '@/store/authSlice';
import localeReducer from '@/store/localeSlice';
import buyWizardReducer from '@/store/buyWizardSlice';
import storage from 'redux-persist/lib/storage'
import { persistReducer } from 'redux-persist'
import thunk from 'redux-thunk'

const persistConfig = {
  key: 'root-daxsoft',
  storage,
  whitelist: ['authState', 'themeConfig', 'localeState', 'buyWizard']
}

const rootReducer = combineReducers({
  authState:   authReducer,
  localeState: localeReducer,
  themeConfig: themeConfigReducer,
  buyWizard:   buyWizardReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
