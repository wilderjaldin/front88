import { createContext, useContext } from 'react';

export const RepresentativeContext = createContext(null);
export const useRepresentative = () => useContext(RepresentativeContext);
