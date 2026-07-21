'use client';
import dynamic from 'next/dynamic';

// @microsoft/signalr toca APIs de navegador al cargarse (no es SSR-safe).
// Se importa solo en cliente (ssr:false) para que no truene al renderizar
// en el servidor — mismo motivo que react-quill-new usa dynamic+ssr:false.
const NotificationsProvider = dynamic(() => import('@/components/NotificationsProvider'), { ssr: false });

export default NotificationsProvider;
