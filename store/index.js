import { combineReducers, configureStore } from '@reduxjs/toolkit';

import themeConfigReducer from '@/store/themeConfigSlice';
import authReducer from '@/store/authSlice';
import localeReducer from '@/store/localeSlice';
import storage from 'redux-persist/lib/storage'
import { persistReducer } from 'redux-persist'
import thunk from 'redux-thunk'

const persistConfig = {
  key: 'root-daxsoft',
  storage,
  whitelist: ['authState', 'themeConfig', 'localeState']
}

const rootReducer = combineReducers({
  authState: authReducer,
  localeState: localeReducer,
  themeConfig: themeConfigReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
