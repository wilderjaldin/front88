'use client';
import IconSearch from '@/components/icon/icon-search';
import Tippy from '@tippyjs/react';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useTranslation } from "@/app/locales";
import IconListCheck from '@/components//icon/icon-list-check';
import IconLayoutGrid from '@/components//icon/icon-layout-grid';
import IconPlusProps from '@/components/icon/icon-plus';
import Swal from 'sweetalert2'
import { Pagination } from '@mantine/core';
import { useDevice } from '@/context/device-context';
import IconPencil from '@/components/icon/icon-pencil';
import IconCheck from '@/components/icon/icon-check';
import IconBan from '@/components/icon/icon-ban';
import IconLock from '@/components/icon/icon-lock';
import IconEye from '@/components/icon/icon-eye';
import { useRef } from 'react';
import Link from 'next/link';
import axiosClient from "@/app/lib/axiosClient";
import { useDispatch } from "react-redux";
import { setImpersonation } from "@/store/authSlice";

import UserActionsMenu from "./userActionsMenu"

const url_delete_spare = process.env.NEXT_PUBLIC_API_URL + 'repuesto/EliminarRegistroCliente';
const DatatablesUser = ({ data = [], t, total, page, handlePageChange, currentUserId, handleSearchChange, toggleUserStatus, addUser, editUser, handleCountries }) => {

  const { isMobile } = useDevice();

  const dispatch = useDispatch();

  const searchRef = useRef('');
  const [value, setValue] = useState((isMobile) ? 'grid' : 'list');

  const [search, setSearch] = useState('');

  const pageSize = 20;
  const [openMenu, setOpenMenu] = useState(null);



  const handleSearch = () => {
    handleSearchChange?.(searchRef.current);
  };


  const handleViewAs = async (user) => {
    Swal.fire({
      title: '¿Ver como este usuario?',
      text: `Ingresarás como ${user.nomUsuario}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {

          const res = await axiosClient.post(`/usuarios/vercomo/${user.codUsuario}`);

          dispatch(setImpersonation({
            token: res.data.token,
            user: res.data.user,
            permissions: res.data.permissions
          }));


        } catch (error) {

          console.error("Error impersonando:", error);

          Swal.fire(
            'Error',
            'No se pudo iniciar sesión como este usuario',
            'error'
          );

        }
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {t.users} <span>{t.records} ({total})</span>
            </h1>
            <div className="h-1 w-12 rounded bg-primary/70 mt-2"></div>
          </div>


          <div className="flex flex-wrap items-center gap-3">


            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative w-64"
            >
              <input
                type="text"
                placeholder={t.filter}
                defaultValue=""
                onChange={(e) => {
                  searchRef.current = e.target.value;
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-900 
                      px-4 py-2 pr-10 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 
                      p-1.5 rounded-md transition text-gray-400"
              >
                <IconSearch className="h-4 w-4" />
              </button>
            </form>


            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">

              <button
                type="button"
                className={`p-2 transition 
            ${value === 'list'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setValue('list')}
              >
                <IconListCheck className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={`p-2 transition 
            ${value === 'grid'
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                onClick={() => setValue('grid')}
              >
                <IconLayoutGrid className="h-4 w-4" />
              </button>
            </div>


            <button
              type="button"
              onClick={addUser}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 
                   text-white text-sm font-medium 
                   shadow-sm hover:shadow-md 
                   transition-all"
            >
              <IconPlusProps className="h-4 w-4" />
              Agregar Usuario
            </button>

          </div>
        </div>

      </div>
      {(data.length > 0) &&
        <div className=''>
          {value === 'list' && (

            <div className="panel mt-5 border-0 p-0">

              <div className="
                  overflow-x-auto
                  overflow-y-visible
                  rounded-2xl
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-700
                  shadow-sm
                ">
                {(data.length > 0) &&
                  <DataTable
                    style={{ overflow: 'visible' }}
                    className="
                              min-w-[1200px] text-sm
                              [&_thead]:bg-gray-50 
                              [&_thead]:dark:bg-gray-800
                              [&_thead_th]:text-xs 
                              [&_thead_th]:font-semibold 
                              [&_thead_th]:uppercase 
                              [&_thead_th]:tracking-wider
                              [&_thead_th]:text-gray-500
                              [&_thead_th]:dark:text-gray-400
                              [&_tbody_tr]:transition
                              [&_tbody_tr]:hover:bg-gray-50
                              [&_tbody_tr]:dark:hover:bg-gray-800
                              [&_.mantine-datatable-pagination]:justify-center
                            "
                    highlightOnHover
                    withTableBorder={false}
                    withColumnBorders={false}
                    borderRadius="lg"
                    shadow="sm"
                    records={data}
                    page={page}
                    verticalSpacing="md"
                    rowClassName="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    columns={[
                      {
                        title: '',
                        accessor: 'codUsuario',
                        render: (s) => (
                          <UserActionsMenu
                            user={s}
                            urrentUserId={currentUserId}
                            editUser={editUser}
                            toggleUserStatus={toggleUserStatus}
                            handleViewAs={handleViewAs}
                            handleCountries={handleCountries}
                          />
                        )
                      },
                      {
                        accessor: 'nomRol',
                        title: `Rol`,
                        sortable: false,
                      },
                      {
                        accessor: 'nomUsuario',
                        title: t.name,
                        sortable: false,
                      },
                      {
                        accessor: 'corElectronico',
                        title: t.email,
                        sortable: false,
                      },
                      {
                        accessor: 'usuIdioma',
                        title: 'Idioma',
                        sortable: false,
                      },
                      {
                        accessor: 'nombrePais',
                        title: t.country,
                        sortable: false,
                      },
                      {
                        accessor: 'nombreCiudad',
                        title: t.city,
                        sortable: false,
                      },
                      {
                        accessor: 'codEstado',
                        title: t.status,
                        sortable: false,
                        render: (row) => (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${row.codEstado === 'AC'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                              }`}
                          >
                            {row.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                          </span>
                        )
                      },
                      {
                        accessor: 'auditoria',
                        title: 'Auditoría',
                        sortable: false,
                        render: (row) => {
                          const formatDate = (date) =>
                            date
                              ? new Date(date).toLocaleDateString('es-BO', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: 'numeric',
                                minute: 'numeric',
                              })
                              : '-';

                          const formatText = (text) =>
                            text?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

                          return (
                            <div className="text-xs space-y-1 leading-tight">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700">

                                <div className="flex justify-between">
                                  <span className="text-gray-400">Registrado</span>
                                  <span className="text-gray-500">
                                    {formatDate(row.fecRegistra)}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                  {formatText(row.usuarioRegistra)}
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                                <div className="flex justify-between">
                                  <span className="text-gray-400">Modificado</span>
                                  <span className="text-gray-500">
                                    {formatDate(row.fecModifica)}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                  {formatText(row.usuarioModifica)}
                                </div>

                              </div>
                            </div>
                          );
                        }
                      }

                    ]}
                    paginationText={() => null}
                    noRecordsIcon={null}
                    noRecordsText=""
                    totalRecords={total}
                    recordsPerPage={pageSize}
                    onPageChange={(p) => handlePageChange(p)}
                  />
                }
              </div>



            </div >)
          }

          {
            value === 'grid' && (
              <>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {data.map((user, index) => {
                    const initials = user.nomUsuario
                      ?.split(' ')
                      ?.map((n) => n[0])
                      ?.join('')
                      ?.toUpperCase()
                      ?.slice(0, 2);

                    return (
                      <div
                        key={index}
                        className="group relative rounded-2xl bg-white dark:bg-gray-900 
                     border border-gray-200 dark:border-gray-700
                     shadow-sm hover:shadow-xl hover:-translate-y-1
                     transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-5 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 
                              flex items-center justify-center 
                              text-primary font-semibold text-sm">
                              {initials}
                            </div>

                            <div>
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {user.nomUsuario}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.corElectronico}
                              </p>
                            </div>
                          </div>

                          <UserActionsMenu
                            user={user}
                            urrentUserId={currentUserId}
                            editUser={editUser}
                            toggleUserStatus={toggleUserStatus}
                            handleViewAs={handleViewAs}
                            handleCountries={handleCountries}
                          />
                        </div>

                        <div className="px-5 pb-5 space-y-3 text-sm">

                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">Rol</span>
                            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                              {user.nomRol}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Ubicación</span>
                            <span className="text-gray-700 dark:text-gray-200 text-xs font-medium">
                              {user.nombrePais} / {user.nombreCiudad}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400 text-xs">Idioma</span>
                            <span className="text-gray-700 dark:text-gray-200 text-xs font-medium">
                              {user.usuIdioma}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-gray-400 text-xs">Estado</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold
                  ${user.codEstado === 'AC'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-600'
                                }`}
                            >
                              {user.codEstado === 'AC' ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between">
                            <span>
                              Reg: {user.usuarioRegistra || '-'}
                            </span>
                            <span>
                              {user.fecRegistra
                                ? new Date(user.fecRegistra).toLocaleDateString('es-BO')
                                : '-'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>
                              Mod: {user.usuarioModifica || '-'}
                            </span>
                            <span>
                              {user.fecModifica
                                ? new Date(user.fecModifica).toLocaleDateString('es-BO')
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
                {total > pageSize && (
                  <div className="flex justify-center mt-8">
                    <Pagination
                      total={Math.ceil(total / pageSize)}
                      value={page}
                      onChange={handlePageChange}
                      size="sm"
                      radius="xl"
                    />
                  </div>
                )}
              </>
            )
          }

        </div >


      }

    </>
  );
};

export default DatatablesUser;
