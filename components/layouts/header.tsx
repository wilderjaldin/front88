'use client';
import { useEffect, useState, Fragment } from 'react';

import Link from 'next/link';
import { IRootState } from '@/store/theme';
import { toggleTheme, toggleSidebar, resetLanguageList } from '@/store/themeConfigSlice';
import Dropdown from '@/components/dropdown';
import IconMenu from '@/components/icon/icon-menu';
import IconSearch from '@/components/icon/icon-search';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconSun from '@/components/icon/icon-sun';
import IconMoon from '@/components/icon/icon-moon';
import IconLaptop from '@/components/icon/icon-laptop';
import IconLogout from '@/components/icon/icon-logout';
import IconCaretDown from '@/components/icon/icon-caret-down';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from "@/app/locales";
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from "react-hook-form"
import { selectUser, setAuth, selectToken, selectImpersonated } from '@/store/authSlice';
import { getLocale, setLocale } from '@/store/localeSlice';
import useAuthGuard from '@/components/layouts/useAuthGuard';
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import IconX from '@/components/icon/icon-x';
import IconMailDot from '../icon/icon-mail-dot';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconHome from '../icon/icon-home';
import IconMenuDashboard from '../icon/menu/icon-menu-dashboard';
import IconSquares from '../icon/icon-squares';
import BtnNewQuote from '@/components/BtnNewQuote';
import { useVisibleMenu } from '@/app/hooks/useVisibleMenu';
import { MenuItem } from '@/components/layouts/menuConfig';

import { usePermissions } from "@/app/hooks/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

const url_list_users = process.env.NEXT_PUBLIC_API_URL + "inbox/MostrarListaUsuarios"
const url_save_message = process.env.NEXT_PUBLIC_API_URL + "inbox/IniciarMsg"

const Header = () => {
  useAuthGuard();

  const visibleMenu = useVisibleMenu();
  const { hasPermission } = usePermissions();
  const impersonated = useSelector(selectImpersonated);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const token = useSelector(selectToken);
  const locale = useSelector(getLocale);
  const t = useTranslation();

  const user_redux = useSelector(selectUser);
  console.log('user_redux', user_redux)

  const [showModal, setShowModal] = useState(false);

  const initials = user_redux?.name?.split(' ')
    ?.map((n: any) => n[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2);

  const {
    register,
    handleSubmit,
    formState: { },
  } = useForm({ defaultValues: { term: '', option: 'spares' } });

  const {
    register: registerMessage,
    handleSubmit: handleSubmitMessage,
    setValue: setValueMessage,
    formState: { errors: errorsMessage },
  } = useForm();

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);

  useEffect(() => {
    const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
    if (selector) {
      const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
      for (let i = 0; i < all.length; i++) {
        all[0]?.classList.remove('active');
      }

      const allLinks = document.querySelectorAll('ul.horizontal-menu a.active');
      for (let i = 0; i < allLinks.length; i++) {
        const element = allLinks[i];
        element?.classList.remove('active');
      }
      selector?.classList.add('active');

      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
        if (ele) {
          ele = ele[0];
          setTimeout(() => {
            ele?.classList.add('active');
          });
        }
      }
    }
    if (themeConfig.languageList.length > 2) {
      dispatch(resetLanguageList());
    }
  }, [pathname]);

  const logout = () => {
    dispatch(setAuth({ token: null, user: null, permissions: null }))
    router.push('/');
  }

  const changeLanguage = (locale: string) => {
    dispatch(setLocale(locale));
  }



  const [search, setSearch] = useState(false);
  const [users, setUsers] = useState([])

  const onSearch = (data: any) => {
    if (data.option == 'all') {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-lg btn-dark mr-4",
          cancelButton: "btn btn-lg btn-dark ml-4"
        },
        buttonsStyling: false
      });
      swalWithBootstrapButtons.fire({
        title: t.search_by,
        showCancelButton: true,
        confirmButtonText: t.nro_part,
        cancelButtonText: t.reference,
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) {
          //part
          router.push(`/admin/search?term=${data.term}&type=part`)
        } else if (
          result.dismiss === Swal.DismissReason.cancel
        ) {
          //reference
          router.push(`/admin/search?term=${data.term}&type=reference`)
        }
      });

    } else if (data.option == 'purchase-orders' || data.option == "orders-placed") {
      router.push(`/admin/queries/${data.option}?term=${data.term}`)
    } else {
      router.push(`/admin/register/${data.option}?term=${data.term}`)
    }
  }

  const showFormMessage = async () => {
    setShowModal(true);
    if (users.length == 0) {
      await getListUsers();
    }

  }
  const handleInitMessage = async (data: any) => {
    try {
      const rs = await axios.post(url_save_message, { CodUsuarioDestino: data.user, NroOrden: data.nro_order, Mensaje: data.message, ValToken: token });

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.message_successfully_saved,
          showConfirmButton: false,
          timer: 1000
        }).then(r => {
          setShowModal(false);
        });
      }
    } catch (error) {

    }
  }

  const getListUsers = async () => {
    try {
      const rs = await axios.post(url_list_users, { ValToken: token });
      if (rs.data.estado == 'OK') {
        const _users: any = [];
        rs.data.dato.map((u: any) => {
          if (u.CodUsuario != 0) {
            _users.push({ value: u.CodUsuario, label: u.NomUsuario })
          }
        });
        setUsers(_users);
      }
    } catch (error) {

    }
  }

  const onChangeSelect = (select: any) => {
    if (select?.value != null) {
      setValueMessage('user', select.value)
    } else {
      setValueMessage('user', 0)
    }

  }

  return (
    <>
      <header id="site-header" className={`${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''} z-20`}>
        <div className="shadow-sm">
          <div className="relative flex w-full items-center bg-white px-5 py-2.5 dark:bg-black">
            <div className="horizontal-logo flex items-center justify-between ltr:mr-2 rtl:ml-2 lg:hidden">
              <Link href="/admin/dashboard" className="main-logo flex shrink-0 items-center">
                <img className="inline w-24 ltr:-ml-1 rtl:-mr-1" src="/assets/images/logo.png" alt="logo" />
                <span className="hidden align-middle text-2xl  font-semibold  transition-all duration-300 ltr:ml-1.5 rtl:mr-1.5 dark:text-white-light md:inline"></span>
              </Link>
              <button
                type="button"
                className="collapse-icon flex flex-none rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary ltr:ml-2 rtl:mr-2 dark:bg-dark/40 dark:text-[#d0d2d6] dark:hover:bg-dark/60 dark:hover:text-primary lg:hidden"
                onClick={() => dispatch(toggleSidebar())}
              >
                <IconMenu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-1.5 ltr:ml-auto rtl:mr-auto rtl:space-x-reverse dark:text-[#d0d2d6] sm:flex-1 ltr:sm:ml-0 sm:rtl:mr-0 lg:space-x-2">

              <div className="sm:ltr:mr-auto sm:rtl:ml-auto">
                <form
                  className={`${search && '!block'} absolute inset-x-0 top-1/2 z-10 mx-4 hidden -translate-y-1/2 sm:relative sm:top-0 sm:mx-0 sm:block sm:translate-y-0`}
                  onSubmit={handleSubmit(onSearch)}
                >
                  <div className='flex gap-4'>
                    <div className="relative">
                      <input
                        {...register("term", { required: true })}
                        type="text"
                        className="peer form-input bg-gray-100 placeholder:tracking-widest ltr:pl-2 ltr:pr-9 rtl:pl-9 rtl:pr-9 sm:bg-transparent ltr:sm:pr-4 rtl:sm:pl-4"
                        placeholder={t.search}
                      />
                      <button type="button" className="absolute top-1/2 block -translate-y-1/2 hover:opacity-80 ltr:right-2 rtl:left-2 sm:hidden" onClick={() => setSearch(false)}>
                        <IconXCircle />
                      </button>
                    </div>
                    <div>
                      <select {...register("option", { required: true })} className='form-select'>
                        <option value="spares">{t.spare_parts}</option>
                        <option value="customers">{t.customers}</option>
                        <option value="suppliers">{t.suppliers}</option>
                        <option value="purchase-orders">{t.purchase_order}</option>
                        <option value="orders-placed">{t.quotes}</option>
                        <option value="all">{t.all}</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary appearance-none peer-focus:text-primary ltr:right-auto rtl:left-auto">
                      <IconSearch className="font-bold mx-auto" />
                    </button>

                    <Link href={"/admin/dashboard"} target='_blank' className="no-load ml-10 appearance-none peer-focus:text-black ltr:right-auto rtl:left-auto">
                      <IconSquares className="mx-auto h-6 w-6 dark:text-[#d0d2d6] fill-white" />
                    </Link>
                  </div>
                </form>


              </div>
              <div className='flex'>
                <div className="dropdown shrink-0 mr-4">
                  <BtnNewQuote token={token} t={t} classNameBtn='block p-2 rounded-full bg-gray-300 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60' classNameIcon='drop-shadow-xl mx-auto h-4.5 w-4.5 dark:text-[#d0d2d6]'></BtnNewQuote>
                </div>

                <div className="dropdown shrink-0 mr-4">
                  <button onClick={() => showFormMessage()} className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                    <IconMailDot />
                  </button>
                </div>

                {themeConfig.theme === 'light' ? (
                  <button
                    className={`${themeConfig.theme === 'light' &&
                      'flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60'
                      }`}
                    onClick={() => dispatch(toggleTheme('dark'))}
                  >
                    <IconSun />
                  </button>
                ) : (
                  ''
                )}
                {themeConfig.theme === 'dark' && (
                  <button
                    className={`${themeConfig.theme === 'dark' &&
                      'flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60'
                      }`}
                    onClick={() => dispatch(toggleTheme('system'))}
                  >
                    <IconMoon />
                  </button>
                )}
                {themeConfig.theme === 'system' && (
                  <button
                    className={`${themeConfig.theme === 'system' &&
                      'flex items-center rounded-full bg-white-light/40 p-2 hover:bg-white-light/90 hover:text-primary dark:bg-dark/40 dark:hover:bg-dark/60'
                      }`}
                    onClick={() => dispatch(toggleTheme('light'))}
                  >
                    <IconLaptop />
                  </button>
                )}
              </div>

              <div className="dropdown shrink-0">
                <Dropdown
                  offset={[0, 8]}
                  placement={`bottom-end`}
                  btnClassName="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                  button={<img className="h-5 w-5 rounded-full object-cover" src={`/assets/locale/${locale.toUpperCase()}.svg`} alt="flag" />}
                >
                  <ul className="grid w-[280px] grid-cols-2 gap-2 !px-2 font-semibold text-dark dark:text-white-dark dark:text-white-light/90">
                    {themeConfig.languageList.map((item: any) => {
                      return (
                        <li key={item.code}>
                          <button
                            type="button"
                            className={`flex w-full hover:text-primary ${locale === item.code ? 'bg-primary/10 text-primary' : ''}`}
                            onClick={() => {
                              changeLanguage(item.code);
                            }}
                          >
                            <img src={`/assets/locale/${item.code.toUpperCase()}.svg`} alt="flag" className="h-5 w-5 rounded-full object-cover" />
                            <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Dropdown>
              </div>

              <div className="dropdown flex shrink-0">
                <Dropdown
                  offset={[0, 8]}
                  placement="bottom-end"
                  btnClassName="relative group block"
                  button={
                    <div
                      className="
          h-10 w-10
          rounded-full
          flex items-center justify-center
          bg-yellow-400
          text-black
          font-semibold
          text-sm
          uppercase
          select-none
          shadow-sm
          ring-2 ring-white dark:ring-gray-900
          transition
          group-hover:scale-105
        "
                    >
                      {initials}
                    </div>
                  }
                >
                  <ul className="w-[260px] !py-0 text-gray-700 dark:text-gray-200">

                    {/* PERFIL */}
                    <li>
                      <div className="flex items-start gap-3 px-4 py-4">

                        {/* Bandera dinámica */}
                        <img
                          className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                          src={
                            user_redux?.countryCode
                              ? `/assets/flags/${user_redux.countryCode.toLowerCase()}.svg`
                              : "/assets/flags/bo.svg"
                          }
                          alt={user_redux?.countryCode || "country"}
                        />

                        <div className="flex-1 min-w-0">

                          {/* Nombre completo */}
                          <h4
                            className="
                text-sm font-semibold
                leading-tight
                break-words
              "
                          >
                            {user_redux?.name}
                          </h4>

                          {/* Rol como badge */}
                          <span
                            className="
                inline-block mt-1
                text-xs
                px-2 py-0.5
                rounded-full
                bg-gray-100 dark:bg-gray-800
                text-gray-600 dark:text-gray-300
              "
                          >
                            {user_redux?.rol}
                          </span>

                        </div>
                      </div>
                    </li>

                    {/* LOGOUT */}
                    {!(impersonated) &&
                      <li className="border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => logout()}
                          className="
            w-full
            flex items-center
            px-4 py-3
            text-sm
            text-red-600
            hover:bg-gray-50
            dark:hover:bg-gray-800
            transition
          "
                        >
                          <IconLogout className="h-4.5 w-4.5 mr-2 rotate-90" />
                          {t.logout}
                        </button>
                      </li>
                    }

                  </ul>
                </Dropdown>
              </div>

            </div>
          </div>

          {/* horizontal menu */}
          <ul className="horizontal-menu hidden border-t border-[#ebedf2] bg-white px-6 py-1.5 font-semibold text-black dark:border-[#191e3a] dark:bg-[#0e1726] dark:text-white-dark lg:space-x-1.5 xl:space-x-8 rtl:space-x-reverse">
            {visibleMenu.map((item: MenuItem, index: number) => {
              const label = (t as any)[item.labelKey] ?? item.labelKey;

              if (item.type === 'link') {
                return (
                  <li key={index} className="">
                    <Link href={item.href} className="nav-link">{label}</Link>
                  </li>
                );
              }

              // Dropdown
              return (
                <li key={index} className="menu nav-item relative">
                  <button type="button" className="nav-link">
                    <div className="flex items-center">
                      <span className="px-1">{label}</span>
                    </div>
                    <div className="right_arrow">
                      <IconCaretDown />
                    </div>
                  </button>
                  <ul className="sub-menu">
                    {item.children.map((child, ci) => (
                      <li key={ci}>
                        <Link href={child.href}>
                          {(t as any)[child.labelKey] ?? child.labelKey}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </header>
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" open={showModal} onClose={() => setShowModal(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >

            <div className="fixed inset-0" />
          </TransitionChild>
          <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
            <div className="flex min-h-screen items-start justify-center px-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel as="div" className={`panel my-8 w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark`}>
                  <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                    <div className="text-lg font-bold"></div>
                    <button type="button" className="text-white-dark hover:text-dark" onClick={() => setShowModal(false)}>
                      <IconX />
                    </button>
                  </div>
                  <div className="p-5">
                    <form action="" onSubmit={handleSubmitMessage(handleInitMessage)}>
                      <fieldset className='space-y-4 items-center justify-center'>
                        <legend className='space-y-1'></legend>
                        <div className="flex sm:flex-row flex-col">
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nit">{t.to_user}</label>
                          <div className="flex flex-1">
                            <Select {...registerMessage('user', { required: { value: true, message: t.required_select } })} onChange={onChangeSelect} isClearable id='select-doc_type' options={users} placeholder={t.select_option} className={`w-full`} />
                            {errorsMessage.user && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsMessage.user?.message?.toString()}</span>}
                          </div>
                        </div>

                        <div className="flex sm:flex-row flex-col">
                          <label className="mb-0 sm:w-1/4 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nit">{t.nro_quote}</label>
                          <div className="flex flex-1">
                            <input type='number' autoComplete='OFF' {...registerMessage('nro_order', { required: false })} placeholder={t.login.enter_nro_order} className="form-input placeholder:" />
                          </div>
                        </div>

                        <div className="flex sm:flex-row flex-col">
                          <div className='w-full'>
                            <textarea {...registerMessage('message', { required: { value: true, message: t.required_field } })} className='form-input w-full'></textarea>
                            {errorsMessage.message && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsMessage.message?.message?.toString()}</span>}
                          </div>

                        </div>

                      </fieldset>

                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">


                        <button onClick={() => setShowModal(false)} type="button" className="btn btn-dark">
                          {t.btn_cancel}
                        </button>
                        <button type="submit" className="btn btn-success">
                          {t.start_message}
                        </button>

                      </div>
                    </form>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Header;
