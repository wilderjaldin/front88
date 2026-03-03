"use client";
import { use, useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form"
import { useTranslation } from "@/app/locales";
import Link from "next/link";
import DatatablesUsers from './datatables-users';
import UserForm from './form';
import ComponentSpareForm from "@/components/forms/spare-form";
import ComponentSpareView from "@/app/admin/register/spares/view";

import { getLocale } from '@/store/localeSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectToken, selectUser } from '@/store/authSlice';
import Modal from '@/components/modal';
import axiosClient from "@/app/lib/axiosClient";
import { useOptionsSelect } from '@/app/options'
import Swal from 'sweetalert2'
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";
import IconBackSpace from "@/components/icon/icon-backspace";
const url_list = "/usuarios/listar";
const url_get_user = "/usuarios/detalle";
const url_status_user = "/usuarios/status";
const url_rols = "/roles"


export default function Users() {

  //Paginacion
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [page, setPage] = useState(pageFromUrl);
  //end paginacion

  //Modal
  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl');

  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  const currentUserId = user.id;
  const t = useTranslation();
  const locale = useSelector(getLocale);

  const [total, setTotal] = useState(null)

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const countries = useOptionsSelect("countries");
  const cities_all = useOptionsSelect("cities");
  const [selectedUser, setSelectedUser] = useState(null);

  const [spare, setSpare] = useState(null);

  const [term, setTerm] = useState('');

  const active = searchParams.get("active") || 0;
  const action = searchParams.get("action") || '';
  const id = searchParams.get("id") || null;

  const [show_form, setShowForm] = useState((action == 'new') ? true : false)
  const [show_view, setShowView] = useState((action == 'view') ? true : false)
  const [formMode, setFormMode] = useState("create");

  const {
    register, reset,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { query: term, show_inactive: (active == 1) ? true : false } });


  useEffect(() => {
    loadRoles();
  }, []);
  useEffect(() => {
    const currentPage = Number(searchParams.get("page")) || 1;
    setPage(currentPage);
  }, [searchParams]);

  useEffect(() => {
    getUsers(page, term);
  }, [page, term]);

  const handleSearchChange = (value) => {
    setPage(1);
    setTerm(value);
  };

  const handlePageChange = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`?${params.toString()}`);
  };

  const getUsers = async (page = 1, searchTerm = term) => {
    try {
      const rs = await axiosClient.get(url_list, {
        params: {
          page,
          term: searchTerm
        }
      });

      const data = Array.isArray(rs.data.data) ? rs.data.data : [];
      setTotal(rs.data.total ? rs.data.total : 0);

      setUsers(
        data.map((o, index) => ({
          ...o,
          id: index,
        }))
      );
    } catch (error) {
      console.error("Error cargando usuarios", error);
    }
  };

  const loadRoles = async () => {
    try {
      const rs = await axiosClient.get(url_rols);

      const formattedRoles = rs.data.map(r => ({
        value: r.codRol,
        label: r.nomRol
      }));

      setRoles(formattedRoles);

    } catch (error) {
      console.error(error);
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
          const response = await axiosClient.post(url_status_user, {
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

        const data = result.value;

        Swal.fire({
          icon: 'success',
          title: activating ? 'Usuario activado' : 'Usuario inactivado',
          text: `${user.nomUsuario} fue actualizado correctamente.`,
          timer: 3000,
          showConfirmButton: false
        });

        updateList(data)
      }
    });
  };

  const addUser = async (user) => {
    try {

      const userData = null;

      setSelectedUser(userData);
      setModalTitle(`Registrar un nuevo usuario`);
      setShowModal(true);
      setFormMode("create")

    } catch (error) {
      console.error(error);
    }
  };

  const editUser = async (user) => {
    try {
      const rs = await axiosClient.get(url_get_user, {
        params: {
          codUsuario: user.codUsuario
        }
      });

      const userData = rs.data;

      setSelectedUser(userData);
      setModalTitle(`Editar Datos de ${userData.nombre}`);
      setShowModal(true);
      setFormMode("edit")

    } catch (error) {
      console.error(error);
    }
  };

  const updateList = (rs) => {
    console.log('LISTA AC', rs)
    const data = Array.isArray(rs.data) ? rs.data : [];
    setTotal(rs.total ? rs.total : 0);
    setUsers(
      data.map((o, index) => ({
        ...o,
        id: index,
      }))
    );
  }

  const updateUser = async (formData) => {
    try {
      const rs = await axiosClient.put(url_update_user, formData);

      // ✅ Actualizar lista SIN volver a consultar
      setUsers(prev =>
        prev.map(u =>
          u.codUsuario === formData.codUsuario
            ? { ...u, ...formData }
            : u
        )
      );

      setIsModalOpen(false);

    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  useDynamicTitle(`${t.register} | ${t.users}`);

  return (
    <div>
      <ul className="flex space-x-2 rtl:space-x-reverse">
        <li>
          {t.register}
        </li>
        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>{t.users}</span>
        </li>
      </ul>

      {(show_form && spare) && <ComponentSpareForm action_cancel={() => setShowForm(false)} token={token} t={t} spare={spare} updateList={updateList}  ></ComponentSpareForm>}
      {(show_view) && <ComponentSpareView action_cancel={() => setShowView(false)} token={token} t={t} spare={spare} updateList={updateList} locale={locale} ></ComponentSpareView>}
      {(users && !(show_form || show_view)) && <DatatablesUsers addUser={addUser} editUser={editUser} page={page} data={users} t={t} total={total} handlePageChange={handlePageChange} currentUserId={currentUserId} token={token} handleSearchChange={handleSearchChange} toggleUserStatus={toggleUserStatus} />}

      <Modal
        size={modal_size}
        closeModal={handleCloseModal}
        showModal={show_modal}
        title={modal_title}
      >
        <UserForm
          roles={roles}
          countries={countries}
          cities_all={cities_all}
          mode={formMode}
          user={selectedUser}   // puede ser null
          action_cancel={handleCloseModal}
          token={token}
          updateList={updateList}
        />
      </Modal>

    </div>


  );
}