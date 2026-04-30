'use client';
import { createContext, useContext } from 'react';

export const SupplierContext = createContext(null);
export const useSupplier = () => useContext(SupplierContext);