'use client';

import App from '@/App';
import { Provider } from 'react-redux';
import React, { ReactNode, Suspense, useEffect } from 'react';
import Loading from '@/components/layouts/loading';
import { store } from '@/store';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { MantineProvider } from '@mantine/core';
import { initMultiAccountSync } from '@/app/lib/multiAccountSync';

interface IProps {
    children?: ReactNode;
}

const persistor = persistStore(store);

const ProviderComponent = ({ children }: IProps) => {
    // Una sola vez por carga de la app — sincroniza la cuenta activa entre pestañas.
    useEffect(() => { initMultiAccountSync(); }, []);

    return (
        <MantineProvider>
            <Provider store={store}>
                <PersistGate persistor={persistor}>
                    <Suspense fallback={<Loading />}>
                        <App>{children}</App>
                    </Suspense>
                </PersistGate>
            </Provider>
        </MantineProvider>
    );
};

export default ProviderComponent;