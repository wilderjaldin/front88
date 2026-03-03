'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import Select from 'react-select';

const url_list = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/ObtenerListaControles';
const url_delete = process.env.NEXT_PUBLIC_API_URL + 'repporcotizar/EliminarItem';

const DeleteForm = ({ token, t, selected_orders, action_cancel, users, setUsers, loadUsers, setLoadUsers, setOrdersAssigned }) => {

  const [options_users, setOptions] = useState(users);
  const [orders, setOrders] = useState(selected_orders)
  const [current_position, setCurrentPosition] = useState(0)
  const [order, setOrder] = useState((selected_orders[current_position]) ?? []);
  const [data_values, setData] = useState([]);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { user: (options_users[0]?.value) ?? 0, nro_quote: ((selected_orders[current_position]?.NroOrden) ?? ''), message: 'Listo' } });

  useEffect(() => {
    async function fetchData() {

      await getLists();
      setLoadUsers(false);
    }
    if (loadUsers) {
      fetchData();
    }

  }, []);

  const getLists = async () => {
    let array = [];
    try {
      const rs = await axios.post(url_list, { Filtrar: 0, ValToken: token });

      if (rs.data.estado == 'OK') {

        let users = [];
        rs.data.dato2.map(u => {
          if (u.CodUsuario != 0) {
            users.push({ value: u.CodUsuario, label: u.NomUsuario });
          }
        });

        setUsers(users);
        setOptions(users);
      }
      return array;

    } catch (error) {

      return [];
    }
  }

  const handleChangeOption = (select) => {
    setValue('user', (select?.value) ?? null);
  }

  const next = async (data, send_message = 0) => {
    let position = current_position;


    if (position <= selected_orders.length) {
      let d = [];
      d.push(
        ...data_values, {
        CodUsuDestino: data.user,
        Mensaje: data.message,
        CodRegistro: selected_orders[position].CodRegistro,
        NroOrden: data.nro_quote,
        NroParte: selected_orders[position].NroParte,
        UltimoItem: ((current_position + 1) == selected_orders.length) ? 1 : 0,
        EnviarMen: send_message,
        ValToken: token

      });

      setData(d);
      position++;
      if (position == selected_orders.length) {

        try {
          const rs = await axios.post(url_delete, d);
          
          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delete_orders_success,
              showConfirmButton: false,
              timer: 1500
            }).then(r => {
              let orders_assigned = rs.data.dato.map((o, index) => {
                o.id = index;
                return o;
              });
              setOrdersAssigned(orders_assigned);
            });

          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.delete_orders_error,
              text: rs.data.dato,
              showConfirmButton: false,
              timer: 3500
            });
          }
          action_cancel();
        } catch (error) {
          
        }

      } else {
        setValue('nro_quote', selected_orders[position].NroOrden);
        setValue('message', 'Listo');
        setCurrentPosition(position);
      }

    } else {

    }

  }

  return (
    <div className="">
      <form>
        <fieldset>

          <div className='space-y-1'>
            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="to_user">{ t.to_user }</label>
              <div className="relative flex-1">
                <Select
                  options={options_users}
                  defaultValue={options_users[0]}
                  isClearable
                  {...register('user', { required: { value: true, message: t.required_select } })}
                  isSearchable
                  id="user-select"
                  instanceId="user-select"
                  menuPosition={'fixed'}
                  onChange={handleChangeOption}
                  menuShouldScrollIntoView={false}
                  placeholder={t.select_option}
                ></Select>
                {errors.user && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.user?.message?.toString()}</span>}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col">
              <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nro_quote">{t.nro_quote}</label>
              <div className="relative flex-1">
                <input type='text' autoComplete='OFF' {...register("nro_quote", { required: { value: true, message: t.required_field } })} aria-invalid={errors.nro_quote ? "true" : "false"} placeholder={t.enter_nro_quote} className="form-input form-input-sm placeholder:" />
                {errors.nro_quote && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_quote?.message?.toString()}</span>}
              </div>
            </div>
            <div className="flex sm:flex-row flex-col">
              <textarea {...register('message', { required: false })} rows={4} className='form-input border border-1 border-dark' ></textarea>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button onClick={() => action_cancel()} type="button" className="btn btn-outline-dark">
            {t.btn_cancel}
          </button>

          <button type="button" onClick={handleSubmit((data) => next(data, 0))} className="btn btn-danger">
            {t.btn_delete_without_sending}
          </button>

          <button type="button" onClick={handleSubmit((data) => next(data, 1))} className="btn btn-success">
            {t.delete_and_start_message}
          </button>

        </div>
      </form>
    </div>
  );
};

export default DeleteForm;
