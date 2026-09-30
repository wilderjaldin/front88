"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import DatatablesUsers from './datatables-users';
import UserForm from './form';

import { getLocale } from '@/store/localeSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken, selectUser } from '@/store/authSlice';
import Modal from '@/components/modal';
import axiosClient from "@/app/lib/axiosClient";
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import { usePermissions } from "@/app/hooks/usePermissions";
import AccessDenied from "@/components/AccessDenied";
import AllowedCountries from "./allowedCountries"
import { PERMISSIONS } from "@/constants/permissions";
import { getHubConnection } from "@/app/lib/signalr";

// ── URLs ──────────────────────────────────────────────────────────────────────
const URL_LISTAR_USUARIOS  = "/usuarios/listar";
const URL_DETALLE_USUARIO  = "/usuarios/detalle";
const URL_STATUS_USUARIO   = "/usuarios/status";
const URL_CONTROLES        = "/usuarios/controles";
const URL_PRESENCIA_DEBUG  = "/usuarios/presencia-debug"; // temporal, solo para inspeccionar la respuesta

export default function Users() {

  const { hasPermission } = usePermissions();

  const router       = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  const [show_modal,  setShowModal]  = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_size]                 = useState('w-full max-w-5xl');
  const [modalType,   setModalType]  = useState("");

  const token = useSelector(selectToken);
  const user  = useSelector(selectUser);
  const currentUserId = user?.id || null;

  const t      = useTranslation();
  const locale = useSelector(getLocale);

  const [total,        setTotal]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [roles,        setRoles]        = useState([]);
  const [countries,    setCountries]    = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [term,         setTerm]         = useState('');
  const [formMode,     setFormMode]     = useState("create");
  const [forbidden,    setForbidden]    = useState(false);
  const [controlesLoaded, setControlesLoaded] = useState(false);

  const active = searchParams.get("active") || 0;

  const { register, reset, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { query: term, show_inactive: (active == 1) ? true : false }
  });

  useEffect(() => {
    const currentPage = Number(searchParams.get("page")) || 1;
    setPage(currentPage);
  }, [searchParams]);

  useEffect(() => {
    getUsers(page, term);
  }, [page, term]);

  // Refs con el page/term vigentes, para que el refetch de abajo (registrado
  // una sola vez) siempre pida la página/búsqueda actuales y no las que había
  // en el primer mount (closure obsoleta).
  const pageRef = useRef(page);
  const termRef = useRef(term);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { termRef.current = term; }, [term]);

  // Refetch al volver a la pestaña/ventana — el Router Cache de Next.js puede
  // servir esta página desde caché al navegar y volver (sin remontar el
  // componente ni re-ejecutar el efecto de arriba), así que sin esto el
  // indicador online/offline y el resto de la lista quedaban congelados hasta
  // un F5 completo. visibilitychange cubre volver desde otra pestaña/app;
  // focus cubre volver a la ventana. Cualquiera de los dos alcanza para volver
  // a pedir la lista completa (que ya trae `online` fresco del backend).
  useEffect(() => {
    const refetch = () => getUsers(pageRef.current, termRef.current);
    const onVisibility = () => { if (document.visibilityState === 'visible') refetch(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refetch);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refetch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estado online/offline en vivo — reusa la conexión SignalR que ya arma/mantiene
  // NotificationsProvider (montado en app/admin/layout.tsx); acá solo nos
  // suscribimos a dos eventos propios, sin abrir conexión ni llamar start().
  // Actualiza la fila en memoria por codUsuario, sin volver a pedir la lista.
  useEffect(() => {
    const conn = getHubConnection();

    // String(): el payload del hub y el de /usuarios/listar podrían serializar
    // codUsuario de forma distinta (number vs string) — comparar como texto
    // evita que un desajuste de tipo haga que nunca "matchee" ninguna fila.
    const setOnline = (codUsuario, online) => {
      setUsers(prev => prev.map(u =>
        String(u.codUsuario) === String(codUsuario) ? { ...u, online } : u
      ));
    };
    const onUsuarioOnline  = (data) => setOnline(data?.codUsuario, true);
    const onUsuarioOffline = (data) => setOnline(data?.codUsuario, false);

    conn.on("usuarioOnline", onUsuarioOnline);
    conn.on("usuarioOffline", onUsuarioOffline);

    return () => {
      conn.off("usuarioOnline", onUsuarioOnline);
      conn.off("usuarioOffline", onUsuarioOffline);
    };
  }, []);

  // Roles + países: se cargan juntos y solo la primera vez que se abre el modal
  // de usuario, para no repetir la llamada cada vez que se abre el formulario.
  const loadControles = async () => {
    if (controlesLoaded) return;
    try {
      const rs = await axiosClient.get(URL_CONTROLES);
      setRoles(rs.data?.roles ?? []);
      setCountries(rs.data?.paises ?? []);
      setControlesLoaded(true);
    } catch (error) {
      console.error("Error cargando roles/países", error);
    }
  };

  const handleSearchChange = (value) => {
    setPage(1);
    setTerm(value);
  };

  const handlePageChange = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const getUsers = async (page = 1, searchTerm = term) => {
    try {
      const rs = await axiosClient.get(URL_LISTAR_USUARIOS, { params: { page, term: searchTerm } });
      const data = Array.isArray(rs.data.data) ? rs.data.data : [];
      setTotal(rs.data.total ?? 0);
      setUsers(data.map((o, index) => ({ ...o, id: index })));

      // Debug temporal — solo para ver qué devuelve este endpoint, no se usa
      // para nada en pantalla. Quitar junto con URL_PRESENCIA_DEBUG.
      axiosClient.get(URL_PRESENCIA_DEBUG)
        .then(r => console.log('[presencia-debug]', r.data))
        .catch(err => console.log('[presencia-debug] error', err?.response?.status, err?.response?.data));
    } catch (error) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      } else {
        console.error("Error cargando usuarios", error);
      }
    }
  };

  const toggleUserStatus = (user) => {
    if (user.codUsuario === currentUserId) return;

    const activating = user.codEstado !== 'AC';

    Swal.fire({
      title: activating ? '¿Reactivar usuario?' : '¿Inactivar usuario?',
      text: user.nomUsuario,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: activating ? '#16a34a' : '#dc2626',
      confirmButtonText: activating ? 'Sí, activar' : 'Sí, inactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          const response = await axiosClient.post(URL_STATUS_USUARIO, {
            codUsuario: user.codUsuario,
            codEstado: activating ? 'AC' : 'IN'
          });
          return response.data;
        } catch (error) {
          Swal.showValidationMessage(
            error?.response?.data?.message || 'Ocurrió un error al procesar la solicitud'
          );
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: activating ? 'Usuario activado' : 'Usuario inactivado',
          text: `${user.nomUsuario} fue actualizado correctamente.`,
          timer: 3000,
          showConfirmButton: false
        });
        updateList(result.value);
      }
    });
  };

  const addUser = () => {
    loadControles();
    setModalType("user");
    setSelectedUser(null);
    setModalTitle("Registrar un nuevo usuario");
    setShowModal(true);
    setFormMode("create");
  };

  const editUser = async (user) => {
    try {
      loadControles();
      const rs = await axiosClient.get(URL_DETALLE_USUARIO, { params: { codUsuario: user.codUsuario } });
      setModalType("user");
      setSelectedUser(rs.data);
      setModalTitle(`Editar Datos de ${rs.data.nombre}`);
      setShowModal(true);
      setFormMode("edit");
    } catch (error) {
      console.error(error);
    }
  };

  const updateList = (rs) => {
    const data = Array.isArray(rs.data) ? rs.data : [];
    setTotal(rs.total ?? 0);
    setUsers(data.map((o, index) => ({ ...o, id: index })));
  };

  const handleCountries = (user) => {
    loadControles();
    setSelectedUser(user);
    setModalType('countries');
    setModalTitle('Países Permitidos');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  useDynamicTitle(`${t.register} | ${t.users}`);

  if (forbidden || !hasPermission(PERMISSIONS.VER_USUARIOS)) {
    return <AccessDenied />;
  }

  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>{t.register}</li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.users}</span>
        </li>
      </ul>

      <DatatablesUsers
        hasPermission={hasPermission}
        handleCountries={handleCountries}
        addUser={addUser}
        editUser={editUser}
        page={page}
        term={term}
        data={users}
        t={t}
        total={total}
        handlePageChange={handlePageChange}
        currentUserId={currentUserId}
        token={token}
        handleSearchChange={handleSearchChange}
        toggleUserStatus={toggleUserStatus}
      />

      <Modal
        size={modal_size}
        closeModal={handleCloseModal}
        showModal={show_modal}
        title={modal_title}
      >
        {modalType === 'user' && (
          <UserForm
            roles={roles}
            countries={countries}
            mode={formMode}
            user={selectedUser}
            action_cancel={handleCloseModal}
            token={token}
            updateList={updateList}
          />
        )}

        {modalType === 'countries' && (
          <AllowedCountries
            user={selectedUser}
            countries={countries}
            action_cancel={handleCloseModal}
            token={token}
            updateList={updateList}
          />
        )}
      </Modal>
    </div>
  );
}