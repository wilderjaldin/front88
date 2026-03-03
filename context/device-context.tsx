'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type DeviceContextType = {
  isMobile: boolean;
};

const DeviceContext = createContext<DeviceContextType>({ isMobile: false });

export const DeviceProvider = ({
  children,
  initialIsMobile,
}: {
  children: React.ReactNode;
  initialIsMobile: boolean;
}) => {
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  // (Opcional) ajustar en cliente si cambia el tamaño
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // evalúa en el primer render
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DeviceContext.Provider value={{ isMobile }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => useContext(DeviceContext);