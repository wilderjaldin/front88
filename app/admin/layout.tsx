import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Sidebar from '@/components/layouts/sidebar';
import { Suspense } from 'react';
import Loading from "@/app/admin/loading";
import TextContextMenu from '@/components/TextContextMenu'
import { useTranslation } from "@/app/locales";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';


export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={{
        components: {
          Pagination: {
            defaultProps: {
              size: 'sm',
              radius: 'xl',
            },
          },
        },
      }}
    >
      {/* BEGIN MAIN CONTAINER */}
      <div className="relative">
        <Overlay />
        <ScrollToTop />

        {/* BEGIN APP SETTING LAUNCHER */}
        {/* END APP SETTING LAUNCHER */}

        <div className={`navbar-sticky main-container min-h-screen text-black dark:text-white-dark`}>
          {/* BEGIN SIDEBAR */}
          <Sidebar />
          {/* END SIDEBAR */}
          <div className="main-content flex min-h-screen flex-col">
            {/* BEGIN TOP NAVBAR */}
            <Header />
            {/* END TOP NAVBAR */}

            {/* BEGIN CONTENT AREA */}
            <div className={`p-6`}>
              <Suspense fallback={<Loading />}>
                {children}
              </Suspense>
            </div>
            {/* END CONTENT AREA */}

            {/* BEGIN FOOTER */}
            <Footer />
            {/* END FOOTER */}
          </div>
        </div>
      </div>
    </MantineProvider>
  );
}