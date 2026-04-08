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
import { useTranslation } from '@/app/locales';
import { useVisibleMenu } from '@/app/hooks/useVisibleMenu';
import { MenuItem } from '@/components/layouts/menuConfig';

const ICON_MAP = {
  invoice: IconMenuInvoice,
  chat: IconMenuChat,
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const t = useTranslation();
  const [currentMenu, setCurrentMenu] = useState<string>('');
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
  const visibleMenu = useVisibleMenu();

  const toggleMenu = (value: string) => {
    setCurrentMenu((old) => (old === value ? '' : value));
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
          setTimeout(() => { ele.click(); });
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
    document.querySelectorAll('.sidebar ul a.active').forEach((el) => el.classList.remove('active'));
    document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]')?.classList.add('active');
  };

  const renderItem = (item: MenuItem, index: number) => {
    const Icon = ICON_MAP[item.icon];
    const label = (t as any)[item.labelKey] ?? item.labelKey;

    if (item.type === 'link') {
      return (
        <li key={index} className="nav-item">
          <Link href={item.href} className="group">
            <div className="flex items-center">
              <Icon className="shrink-0 group-hover:!text-primary" />
              <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">
                {label}
              </span>
            </div>
          </Link>
        </li>
      );
    }

    // Dropdown
    const menuKey = item.labelKey;
    return (
      <li key={index} className="menu nav-item">
        <button
          type="button"
          className={`${currentMenu === menuKey ? 'active' : ''} nav-link group w-full`}
          onClick={() => toggleMenu(menuKey)}
        >
          <div className="flex items-center">
            <Icon className="shrink-0 group-hover:!text-primary" />
            <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">
              {label}
            </span>
          </div>
          <div className={currentMenu !== menuKey ? '-rotate-90 rtl:rotate-90' : ''}>
            <IconCaretDown />
          </div>
        </button>

        <AnimateHeight duration={300} height={currentMenu === menuKey ? 'auto' : 0}>
          <ul className="sub-menu text-gray-500">
            {item.children.map((child, ci) => (
              <li key={ci}>
                <Link href={child.href}>
                  {(t as any)[child.labelKey] ?? child.labelKey}
                </Link>
              </li>
            ))}
          </ul>
        </AnimateHeight>
      </li>
    );
  };

  return (
    <div className={semidark ? 'dark' : ''}>
      <nav className={`sidebar fixed bottom-0 top-0 z-50 h-full min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
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
              {visibleMenu.map((item, index) => renderItem(item, index))}
            </ul>
          </PerfectScrollbar>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;