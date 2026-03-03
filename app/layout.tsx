import ProviderComponent from '@/components/layouts/provider-component';
import type { Metadata } from "next";
import '../styles/tailwind.css';
import { Nunito } from 'next/font/google';
import { useTranslation } from "./locales";
import { LoadingProvider } from '@/components/layouts/LoadingProvider';
import RouteClickInterceptor from '@/components/layouts/RouteClickInterceptor';

import { headers } from 'next/headers';
import { DeviceProvider } from '@/context/device-context';


const nunito = Nunito({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <html lang="en">
      <body className={nunito.variable}>
        <div className="min-h-screen text-black dark:text-white-dark">
          <ProviderComponent>
            <RouteClickInterceptor />
            <LoadingProvider>
                {children}
            </LoadingProvider>
          </ProviderComponent>
        </div>
      </body>
    </html>
  );
}