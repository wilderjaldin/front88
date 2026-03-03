'use client';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toggleSidebar } from '@/store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '@/store/theme';
import { useState, useEffect } from 'react';
import IconCaretsDown from '@/components/icon/icon-carets-down';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconMenuChat from '@/components/icon/menu/icon-menu-chat';
import IconMenuInvoice from '@/components/icon/menu/icon-menu-invoice';
import { usePathname } from 'next/navigation';
import { useTranslation } from "@/app/locales";

const Sidebar = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const t = useTranslation();
  const [currentMenu, setCurrentMenu] = useState<string>('');
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
  const toggleMenu = (value: string) => {
    setCurrentMenu((oldValue) => {
      return oldValue === value ? '' : value;
    });
  };

  useEffect(() => {
    const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
    if (selector) {
      selector.classList.add('active');
      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
        if (ele.length) {
          ele = ele[0];
          setTimeout(() => {
            ele.click();
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    setActiveRoute();
    if (window.innerWidth < 1024 && themeConfig.sidebar) {
      dispatch(toggleSidebar());
    }
  }, [pathname]);

  const setActiveRoute = () => {
    let allLinks = document.querySelectorAll('.sidebar ul a.active');
    for (let i = 0; i < allLinks.length; i++) {
      const element = allLinks[i];
      element?.classList.remove('active');
    }
    const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
    selector?.classList.add('active');
  };

  return (
    <div className={semidark ? 'dark' : ''}>
      <nav
        className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
      >
        <div className="h-full bg-white dark:bg-black">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="main-logo flex shrink-0 items-center">
              <img className="ml-[5px] w-24 flex-none" src="/assets/images/logo.png" alt="logo" />
              <span className="align-middle text-2xl font-semibold ltr:ml-1.5 rtl:mr-1.5 dark:text-white-light lg:inline"></span>
            </Link>

            <button
              type="button"
              className="collapse-icon flex h-8 w-8 items-center rounded-full transition duration-300 hover:bg-gray-500/10 rtl:rotate-180 dark:text-white-light dark:hover:bg-dark-light/10"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconCaretsDown className="m-auto rotate-90" />
            </button>
          </div>
          <PerfectScrollbar className="relative h-[calc(100vh-80px)]">
            <ul className="relative space-y-0.5 p-4 py-0 font-semibold">
              <li className="menu nav-item">
                <button type="button" className={`${currentMenu === 'register' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('register')}>
                  <div className="flex items-center">
                    <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{ t.register }</span>
                  </div>

                  <div className={currentMenu !== 'register' ? '-rotate-90 rtl:rotate-90' : ''}>
                    <IconCaretDown />
                  </div>
                </button>

                <AnimateHeight duration={300} height={currentMenu === 'register' ? 'auto' : 0}>
                  <ul className="sub-menu text-gray-500">
                    <li>
                      <Link href="/admin/register/spares">{t.spare_parts}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/spares-in-lot">{t.spare_parts_in_lot}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/reference-change-part">{t.reference_part_change}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/reference-change-part-lot">{t.reference_change_part_in_lot}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/customers">{ t.customers }</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/suppliers">{ t.suppliers }</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/supplier-freight">{t.freight_supplier}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/company">{t.company}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/utility">{ t.utility }</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/availability">{t.availability}</Link>
                    </li>
                    <li>
                      <Link href="/admin/register/exchange-rate">{ t.exchange_rate }</Link>
                    </li>
                  </ul>
                </AnimateHeight>
              </li>

              <li className="menu nav-item">
                <button type="button" className={`${currentMenu === 'revision' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('revision')}>
                  <div className="flex items-center">
                    <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.revision}</span>
                  </div>

                  <div className={currentMenu !== 'revision' ? '-rotate-90 rtl:rotate-90' : ''}>
                    <IconCaretDown />
                  </div>
                </button>

                <AnimateHeight duration={300} height={currentMenu === 'revision' ? 'auto' : 0}>
                  <ul className="sub-menu text-gray-500">
                    <li>
                      <Link href="/admin/revision/orders-process">{t.orders_in_process}</Link>
                    </li>
                    <li>
                      <Link href="/admin/revision/authorize-purchase">{t.authorize_purchase}</Link>
                    </li>
                    <li>
                      <Link href="/admin/revision/crm-dashboard">{t.panel_crm}</Link>
                    </li>
                  </ul>
                </AnimateHeight>
              </li>

              <li className="nav-item">
                <Link href="/admin/purchase-order" className="group">
                  <div className="flex items-center">
                    <IconMenuChat className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.purchase_order}</span>
                  </div>
                </Link>
              </li>

              <li className="nav-item">
                <Link href="/admin/purchase-reception" className="group">
                  <div className="flex items-center">
                    <IconMenuChat className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.purchase_reception}</span>
                  </div>
                </Link>
              </li>

              <li className="nav-item">
                <Link href="/admin/packaging" className="group">
                  <div className="flex items-center">
                    <IconMenuChat className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.packaging}</span>
                  </div>
                </Link>
              </li>

              <li className="nav-item">
                <Link href="/admin/delivery" className="group">
                  <div className="flex items-center">
                    <IconMenuChat className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.delivery}</span>
                  </div>
                </Link>
              </li>
              <li className="menu nav-item">
                <button type="button" className={`${currentMenu === 'queries' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('queries')}>
                  <div className="flex items-center">
                    <IconMenuInvoice className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.query}</span>
                  </div>

                  <div className={currentMenu !== 'queries' ? '-rotate-90 rtl:rotate-90' : ''}>
                    <IconCaretDown />
                  </div>
                </button>

                <AnimateHeight duration={300} height={currentMenu === 'queries' ? 'auto' : 0}>
                  <ul className="sub-menu text-gray-500">
                    <li>
                      <Link href="/admin/queries/spare-parts-quotation">{t.spare_parts_to_be_quoted}</Link>
                    </li>
                    <li>
                      <Link href="/admin/queries/spare-parts-identified">{t.spare_parts_to_be_identified}</Link>
                    </li>
                    <li>
                      <Link href="/admin/queries/orders-placed">{t.quotes_orders_done}</Link>
                    </li>
                    <li>
                      <Link href="/admin/queries/purchase-orders">{ t.purchase_orders }</Link>
                    </li>
                    <li>
                      <Link href="/admin/queries/delivery-report">{t.delivery_report}</Link>
                    </li>
                    <li>
                      <Link href="/admin/queries/change-quote">{t.change_quote}</Link>
                    </li>
                  </ul>
                </AnimateHeight>
              </li>

              <li className="nav-item">
                <Link href="/admin/inbox" className="group">
                  <div className="flex items-center">
                    <IconMenuChat className="shrink-0 group-hover:!text-primary" />
                    <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">{t.inbox}</span>
                  </div>
                </Link>
              </li>

              
            </ul>
            
          </PerfectScrollbar>
        </div>
      </nav >
    </div >
  );
};

export default Sidebar;
