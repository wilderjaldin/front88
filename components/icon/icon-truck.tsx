import { FC } from 'react';

interface IconTruckProps {
    className?: string;
}

// Camión de reparto — botón de reporte de "Envío" en delivery-report, junto
// al de IconPrinter (etiqueta/invoice/lista-empaque/recibo-entrega/nafta).
const IconTruck: FC<IconTruckProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M2 17V6C2 5.44772 2.44772 5 3 5H14C14.5523 5 15 5.44772 15 6V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 8H18.4038C18.7343 8 19.0424 8.1671 19.2231 8.44388L21.8193 12.4273C21.9369 12.6074 21.9991 12.8178 21.9991 13.0328V16C21.9991 16.5523 21.5514 17 20.9991 17H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path opacity="0.5" d="M2 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path opacity="0.5" d="M2 13H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
};

export default IconTruck;
