'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Select from 'react-select';
import IconFile from '../icon/icon-file';
import IconX from '../icon/icon-x';
import IconMail from '../icon/icon-mail';
import IconAttachment from '../icon/icon-attachment';
import IconDiscount from '../icon/icon-discount';
import Modal from '@/components/modal';
import OptionsItemsQuote from '@/components/forms/options-items-quote'
import OptionsItemsQuoteEmpty from '@/components/forms/options-items-quote-empty'
import DiscountForm from "@/components/forms/discount-form"
import AttachQuoteForm from "@/components/forms/attach-quote-form"
import MessageQuoteForm from "@/components/forms/message-quote"
import PriceParametersForm from "@/components/forms/price-parameters-form"
import CostSummary from "@/components/cost-summary"
import { customFormat } from '@/app/lib/format';
import { useDebounce } from 'use-debounce';
import { useSelector } from 'react-redux';
import { getLocale } from '@/store/localeSlice';
import axios from 'axios'
import Swal from 'sweetalert2'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import IconTrashLines from '../icon/icon-trash-lines';
import IconCheck from '../icon/icon-check';
import IconRefresh from '../icon/icon-refresh';
import TableReference from "@/app/admin/revision/quotes/table-reference"
//import PdfViewer from "@/app/admin/revision/quotes/PdfViewer"
import BtnPrintQuote from "@/components/BtnPrintQuote"
import IconDirection from '../icon/icon-direction';
import { useOptionsSelect } from '@/app/options'
import IconPosition from '../icon/icon-position';

const url_search = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/BuscarItem';
const url_update_quantity = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarCantidad';
const url_update_note = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarNotas';
const url_update_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ActualizarDatosCotizacion';
const url_delete_item_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/EliminarItem';
const url_update_preference = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/CambiarPreferencia';
const url_save_freight = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarFleteInterno';
const url_delete_freight = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/EliminarFleteInterno';
const url_more_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/VerOpciones';
const url_clone_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/DuplicarCotizacion';
const url_validate_quote = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ValidarNroParte';
const url_price_parameters = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarParamPrecio';
const url_save_tracking = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarSeguimiento';
const url_update_item = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ActualizarItem';
const url_search_reference = process.env.NEXT_PUBLIC_API_URL + 'referencia/MostrarReferencia';
const url_change_report = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarNroParte';

const QuoteForm = ({ t, token, _customer_, _order_ = [], _items_, _tracking_, options_share, getOrder }) => {


  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
  const [items, setItems] = useState(_items_)
  const [order, setOrder] = useState(_order_)
  const [isSelectItems, setIsSelectItems] = useState(false);
  const [disabledTracking, setDisabledTracking] = useState(true);
  const [quote_or_tracking_option, setQuoteORTrackingOption] = useState();
  const [tracking_option, setTrackingOption] = useState('');
  const [all_disabled_tracking, setAllDisabledTracking] = useState(false);
  const [customer, setCustomer] = useState(_customer_);
  const brands = useOptionsSelect("brands") || [];
  const [optionSelected, setOptionSelected] = useState("");
  const [showPosition, setShowPosition] = useState(false);

  const tablaRef = useRef(null);
  const locale = useSelector(getLocale);


  const [seleccionados, setSeleccionados] = useState([])

  const toggleSeleccion = (item) => {
    setSeleccionados((prev) =>
      prev.includes(item) ? prev.filter((i) => i.CodItem !== item.CodItem) : [...prev, item]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === items.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(items.map((d) => d))
    }
  }

  const {
    register,
    getValues,
    setValue,
    control: controlDefault,
    formState: { errors },
  } = useForm({ defaultValues: { freight: customFormat(_order_.FleteInterno) } });

  const {
    register: registerSearchQuote,
    getValues: getValuesQuote,
    setValue: setValueQuote,
    setFocus,
    control,
    formState: { errors: errorsSearchQuote },
    handleSubmit: handleSearchQuoteFormSubmit
  } = useForm({
    defaultValues: {
      items: items.map(p => ({ Cantidad: 1 }))
    }
  })

  const {
    register: registerNoteQuote,
    getValues: getValuesNoteQuote,
    formState: { errors: errorsNoteQuote },
    handleSubmit: handleSaveNoteQuoteFormSubmit
  } = useForm();

  useEffect(() => {
    setOrder(_order_);
    setValue('freight', customFormat(_order_.FleteInterno));

    setValueQuote('equipment_brand', brands.find(opt => opt.label === (_order_?.MarcaEquipo ?? null)) || null)
    if (!_order_.NroOrden) {
      setAllDisabledTracking(true)
    } else {
      setAllDisabledTracking(false)
    }
  }, [_order_]);

  useEffect(() => {
    setValue('freight', customFormat(order.FleteInterno));
  }, [order]);

  useEffect(() => {
    setCustomer(_customer_)

  }, [_customer_]);

  useEffect(() => {
    if (_tracking_?.Cotizar || _tracking_?.Seguimiento) {
      setAllDisabledTracking(true);
      setValue('share_with_customer', options_share.find(opt => opt.value === (_tracking_?.CodUsuarioCompartido ?? null)) || null)
      setOptionSelected((_tracking_?.Cotizar == 1 ? "quote" : (_tracking_?.Seguimiento == 1 ? "tracking" : '')))
    }
  }, [_tracking_]);

  useEffect(() => {
    setItems(_items_)
    updateInputs(_items_);
  }, [_items_]);

  useEffect(() => {
    if (seleccionados.length > 0) {
      setIsSelectItems(false)
    } else {
      setIsSelectItems(true);
    }
  }, [seleccionados]);

  const updateInputs = (items) => {

    items.map((p, index) => {
      setValueQuote(`items.${p.CodItem}.Cantidad`, p.Cantidad);
    });
  }

  const watchedItems = useWatch({ control, name: 'items' });
  const [debouncedItems] = useDebounce(watchedItems, 800);

  useEffect(() => {
    // Solo enviar si hay cambios reales
    debouncedItems.forEach(async (item, index) => {
      const original = items[index - 1];

      if ((original) && item.Cantidad !== original.Cantidad) {
        try {
          const data = {
            Idioma: locale,
            NroOrden: order.NroOrden,
            CodItem: original.CodItem,
            Cantidad: item.Cantidad,
            ValToken: token
          }

          const rs = await axios.post(url_update_quantity, data);
          if (rs.data.estado == 'OK') {
            setOrder(rs.data.dato1[0]);
            setItems(rs.data.dato2);
            updateInputs(rs.data.dato2);
          }

        } catch (error) {

        }
      }
    });
  }, [debouncedItems]);

  useEffect(() => {
    if (!order) return;

    const equipmentBrand = brands.find(opt => opt.label === order?.MarcaEquipo) || null;
    const engineBrand = brands.find(opt => opt.label === order?.MarcaMotor) || null;

    setValueQuote('nro_order', order.NroPedido);
    setValueQuote('equipment_model', order.ModeloEquipo);
    setValueQuote('equipment_serie', order.NroSerieEquipo);
    setValueQuote('equipment_year', order.AnioEquipo);
    setValueQuote('engine_model', order.ModeloMotor);
    setValueQuote('engine_serie', order.NroSerieMotor);

    setValueQuote('equipment_brand', equipmentBrand);
    setValueQuote('engine_brand', engineBrand);

    console.log('estableciendo valores');
    console.log('equipo', equipmentBrand);
    console.log('motor', engineBrand);

  }, [order, brands]);


  const onSaveNote = async (data) => {
    try {
      const rs = await axios.post(url_update_note, { NroOrden: order.NroOrden, NotaUsuario: data.note_user, NotaCliente: data.note_customer, ValToken: token });
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_note_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {

        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.save_note_quote_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleSearchQuoteFormSubmit(onSearch)();
    }
  };

  const onSearch = async (data) => {

    const data_search = {
      NroOrden: (order.NroOrden) ? order.NroOrden : 0,
      CodCliente: customer.CodCliente,
      NroParte: data.nro_part,
      Cantidad: data.quantity,
      Posicion: (data.position != '') ? data.position : 0,
      NroPedido: data.nro_order,
      MarcaEquipo: (data.equipment_brand?.label) ?? "",
      ModeloEquipo: data.equipment_model,
      AnioEquipo: data.equipment_year,
      NroSerieEquipo: data.equipment_serie,
      MarcaMotor: (data.engine_brand?.label) ?? "",
      ModeloMotor: data.engine_model,
      NroSerieMotor: data.engine_serie,
      ValToken: token
    }

    try {
      const rs = await axios.post(url_search, data_search);

      if (rs.data.estado == 'OP') {
        showOptions(rs.data.dato3, data);
      } else if (rs.data.estado == 'OK') {

        if (rs.data.dato3.length == 1) {
          //addItem(data, rs.data.dato3[0], rs.data.dato2[0]);

          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.add_item_to_quote_success,
            showConfirmButton: false,
            timer: 1500
          }).then(r => {
            setOrder(rs.data.dato2[0]);
            setItems(rs.data.dato3);
            if (rs.data.dato2[0].NroOrden) {
              router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${rs.data.dato2[0].NroOrden}`);
            }
            setValueQuote('nro_part', '');
            setValueQuote('quantity', '');
            updateInputs(rs.data.dato3);
            setFocus("nro_part");
          });




          return;
        } else {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.add_item_to_quote_success,
            showConfirmButton: false,
            timer: 1500
          }).then(r => {
            setOrder(rs.data.dato2[0]);
            setItems(rs.data.dato3);
            updateInputs(rs.data.dato3);
            setFocus("nro_part");
          });
        }

      } else if (rs.data.estado == "NC") {

        setOrder(rs.data.dato2[0]);
        setItems(rs.data.dato3);
        updateInputs(rs.data.dato3);

        setModalTitle('');
        setModalSize('w-full max-w-2xl');
        setModalContent(<OptionsItemsQuoteEmpty code={rs.data.dato1} close={() => setShowModal(false)} customer={customer} order={order} token={token} t={t} data={data} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder}></OptionsItemsQuoteEmpty>);
        setShowModal(true);
        if (rs.data.dato2[0].NroOrden) {
          router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${rs.data.dato2[0].NroOrden}`);
        }
        getOrder(rs.data.dato2[0].NroOrden)
      }
      setValueQuote('nro_part', '');
      setValueQuote('quantity', '');
      setFocus("nro_part");
    } catch (error) {

    }
  }

  const showOptions = (options, data) => {
    setModalTitle('');
    setModalSize('w-full max-w-5xl')
    setModalContent(<OptionsItemsQuote close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} options={options} customer={customer} order={order} token={token} t={t} data={data}></OptionsItemsQuote>);
    setShowModal(true);
  }
  const updateItem = async () => {
    try {
      let data = [];
      seleccionados.map(i => {
        data.push({ Idioma: locale, NroOrden: order.NroOrden, CodItem: i.CodItem, Cantidad: i.Cantidad, ValToken: token });
      });
      const rs = await axios.post(url_update_item, data);

      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.update_item_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setSeleccionados([]);
        });

        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
      }
    } catch (error) {

    }
  }
  const message = () => {
    setModalSize('w-full max-w-6xl');
    setModalTitle('');
    setModalContent(<MessageQuoteForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></MessageQuoteForm>);
    setShowModal(true);
  }

  const discount = () => {
    setModalTitle('');
    setModalSize('w-full max-w-lg');
    setModalContent(<DiscountForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></DiscountForm>);
    setShowModal(true);
  }
  const attach = () => {
    setModalTitle('');
    setModalSize('w-full max-w-6xl');
    setModalContent(<AttachQuoteForm close={() => setShowModal(false)} updateInputs={updateInputs} setItems={setItems} setOrder={setOrder} customer={customer} order={order} token={token} t={t}></AttachQuoteForm>);
    setShowModal(true);
  }

  const updateQuote = async () => {
    const data = getValuesQuote();
    try {
      const data_quote = {
        NroOrden: order.NroOrden,
        NroPedido: data.nro_order,
        MarcaEquipo: (data.equipment_brand?.label) ?? "",
        ModeloEquipo: data.equipment_model,
        AnioEquipo: data.equipment_year,
        NroSerieEquipo: data.equipment_serie,
        MarcaMotor: (data.engine_brand?.label) ?? "",
        ModeloMotor: data.engine_model,
        NroSerieMotor: data.engine_serie,
        ValToken: token
      }
      const rs = await axios.post(url_update_quote, data_quote);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.update_quote_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {

        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.update_quote_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.update_quote_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const newQuote = () => {
    Swal.fire({
      title: t.question_create_new_quote,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.delete("id");
        router.replace(`${pathname}?${nextSearchParams}`);
        setOrder([]);
        setItems([]);
      }
    });


  }

  const handleChangeOption = (option) => {
    const value = option.target.value;
    setQuoteORTrackingOption(value);
    setOptionSelected(value);
    if (option.target.value == 'quote') {
      setDisabledTracking(true);
    } else {
      setDisabledTracking(false);
    }
  }


  const handleChangePreference = async (select) => {
    try {
      Swal.fire({
        title: t.updating,
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(async (r) => {
        const rs = await axios.post(url_update_preference, { Idioma: locale, NroOrden: order.NroOrden, CodCliente: customer.CodCliente, TipoPreferencia: select.value, ValToken: token });
        if (rs.data.estado == 'OK') {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.update_preference_success,
            showConfirmButton: false,
            timer: 1500
          }).then(async (r) => {
            setOrder(rs.data.dato1[0]);
            setItems(rs.data.dato2);
          });
        } else {
          Swal.fire({
            title: t.error,
            text: t.update_preference_error,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }

      });
    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.update_preference_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });

    }
  }

  const saveFreight = async () => {
    Swal.fire({
      title: t.updating,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const freight = getValues('freight');
    try {
      const rs = await axios.post(url_save_freight, { Idioma: locale, NroOrden: order.NroOrden, FleteInterno: freight, ValToken: token });
      Swal.close();
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_freight_success,
          showConfirmButton: false,
          timer: 1500
        }).then(async (r) => {
          //setValue('freight', freight.toFixed(2));

          setOrder(rs.data.dato1[0]);
          setItems(rs.data.dato2);

        });
      } else if (rs.data.estado == 'Error') {
        Swal.fire({
          title: t.error,
          text: rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      } else {
        Swal.fire({
          title: t.error,
          text: t.save_freight_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.save_freight_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  }

  const deleteFreight = async () => {
    Swal.fire({
      title: t.question_delete_freight,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_distribute,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_delete_freight, { Idioma: locale, NroOrden: order.NroOrden, CodCliente: customer.CodCliente, ValToken: token });

          if (rs.data.estado == 'OK') {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delete_freight_success,
              showConfirmButton: false,
              timer: 1500
            }).then(async (r) => {
              setOrder(rs.data.dato1[0]);
              setItems(rs.data.dato2);
            });
          } else {
            Swal.fire({
              title: t.error,
              text: t.delete_freight_error,
              icon: 'error',
              confirmButtonColor: '#dc2626',
              confirmButtonText: t.close
            });
          }
        } catch (error) {

          Swal.fire({
            title: t.error,
            text: t.delete_freight_error_server,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: t.close
          });
        }
      }
    });
  }

  const showMore = async (item) => {


    try {
      const rs = await axios.post(url_more_quote, { NroOrden: order.NroOrden, CodCliente: customer.CodCliente, NroParte: item.NroParte, Cantidad: item.Cantidad, ValToken: token });
      if (rs.data.estado == 'OK') {
        let data = getValuesQuote();
        data.nro_part = item.NroParte.replace(/\s+/g, "").replace(/\*/g, "");
        data.quantity = getValuesQuote(`items.${item.CodItem}.Cantidad`)
        data.position = item.CodItem;


        setModalTitle('');
        setModalSize('w-full max-w-5xl')
        setModalContent(<OptionsItemsQuote
          close={() => setShowModal(false)}
          updateInputs={updateInputs}
          setItems={setItems}
          setOrder={setOrder}
          options={rs.data.dato2}
          customer={customer}
          order={order}
          token={token}
          item_select={item}
          t={t}
          data={data}
        ></OptionsItemsQuote>);
        setShowModal(true);
      }
    } catch (error) {

    }
  }

  /*
  const selectItem = (e, item) => {
    if (e.target.checked) {
      setSelectItems(prevArray => [...prevArray, item]);
    } else {

      setSelectItems(() => {
        return select_items.filter((i) => {
          return item.CodItem != i.CodItem;
        });
      });

    }
  }
  */

  const deleteItems = async () => {
    try {
      let data = [];
      seleccionados.map(i => {
        data.push({ Idioma: locale, NroOrden: order.NroOrden, CodItem: i.CodItem, ValToken: token });
      });
      const rs = await axios.post(url_delete_item_quote, data);
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.delete_item_success,
          showConfirmButton: false,
          timer: 1500
        }).then(r => {
          setSeleccionados([]);
        });

        setOrder(rs.data.dato1[0]);
        setItems(rs.data.dato2);
        updateInputs(rs.data.dato2);
      }


    } catch (error) {

    }
  }

  const priceParameters = async () => {
    try {
      const rs = await axios.post(url_price_parameters, { NroOrden: order.NroOrden, ValToken: token });

      if (rs.data.estado == 'OK') {
        setModalSize('w-full max-w-lg');
        setModalTitle('');
        setModalContent(<PriceParametersForm
          close={() => setShowModal(false)}
          updateInputs={updateInputs}
          setItems={setItems}
          setOrder={setOrder}
          customer={customer}
          order={order}
          token={token}
          default_value={rs.data.dato}
          t={t}
          data={[]}
        ></PriceParametersForm>);
        setShowModal(true);
      } else {
        Swal.fire({
          title: t.error,
          text: rs.data.mensaje,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }
    } catch (error) {

    }

  }

  const costSummary = () => {

    setModalTitle('');
    setModalSize('w-full max-w-sm');
    setModalContent(<CostSummary
      close={() => setShowModal(false)}
      order={order}
      token={token}
      t={t}
    ></CostSummary>);
    setShowModal(true);
  }

  const cloneQuote = () => {
    Swal.fire({
      title: t.clone_quote,
      text: t.question_clone_quote,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        const rs = await axios.post(url_clone_quote, { Idioma: locale, NroOrden: order.NroOrden, ValToken: token });
        if (rs.data.dato1[0].NroOrden) {
          router.push(`/admin/revision/quotes?customer=${customer.CodCliente}&option=quotes&id=${rs.data.dato1[0].NroOrden}`);
        }
      }
    });
  }
  const validateQuote = async () => {
    if (seleccionados.length == 0) {
      Swal.fire({
        title: t.error,
        text: t.validate_quote_empty_error,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    let data = [];
    seleccionados.map((i) => {
      data.push({
        NroOrden: order.NroOrden,
        NroParte: i.NroParte,
        Cantidad: i.Cantidad,
        Marca: i.Marca,
        ValToken: token
      });
    });

    try {
      const rs = await axios.post(url_validate_quote, data);
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.validate_quote_success,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.validate_quote_error,
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (error) {

      Swal.fire({
        title: t.error,
        text: t.validate_quote_error_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }

  }

  const apply = async () => {

    let customer_id = getValues('share_with_customer') || null;
    if (!quote_or_tracking_option) {
      Swal.fire({
        title: t.error,
        text: t.quote_or_tracking_option_empty,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    } else {
      try {
        const data = {
          NroOrden: order.NroOrden,
          CodUsuarioCompartido: (customer_id?.value) ? customer_id.value : 0,
          Cotizar: (quote_or_tracking_option == "quote") ? 1 : 0,
          Seguimiento: (quote_or_tracking_option == "tracking") ? 1 : 0,
          WhatsAp: 0,
          Mail: 0,
          Asignado: (all_disabled_tracking) ? 1 : 0,
          NotaUsuario: getValuesNoteQuote('note_user'),
          ValToken: token

        }

        const rs = await axios.post(url_save_tracking, data);
        if (rs.data.estado == 'Ok') {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.tracking_option_success,
            showConfirmButton: false,
            timer: 1500
          });
          setAllDisabledTracking(true);
        }
      } catch (error) {

      }
    }
  }

  const buyQuote = () => {

    let novalid = [];
    if (items.length > 0) {
      items.map(item => {
        if (item.Precio == 0) {
          novalid.push(item.NroParte);
        }
      })
    }
    if (novalid.length > 0) {
      Swal.fire({
        title: t.error,
        text: `${t.quote_without_price} - [${novalid.join(", ")}]`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('option', 'buy');
    nextSearchParams.set('step', 'verify')
    router.replace(`${pathname}?${nextSearchParams}`);
  }

  const showReference = async (item) => {
    Swal.fire({
      title: t.searching,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });



    try {
      const NroParte = (item.NroParte.replace(/\s+/g, "").replace(/\*/g, ""));
      const rs = await axios.post(url_search_reference, { NroParte: NroParte, CodMarca: 0, ValToken: token });

      if (rs.data.estado == "OK") {
        setShowModal(true);
        setModalSize('w-full max-w-6xl');
        setModalTitle(t.reference_part_change);
        let references = rs.data.dato1;
        let options = rs.data.dato2;
        setModalContent(<TableReference brands={brands} NroParte={NroParte} t={t} items={references} options={options} token={token} close={() => setShowModal(false)} quote_id={order.NroOrden}></TableReference>)
        Swal.close();
      }
    } catch (error) {

    }
  }


  const handelChangeShowPart = async (element) => {

    const isChecked = element.target.checked;

    Swal.fire({
      title: t.updating,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const rs = await axios.post(url_change_report, { NroOrden: order.NroOrden, MostrarCodigo: isChecked ? 1 : 0, ValToken: token });
      Swal.close();
      if (rs.data.estado == 'OK') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.record_updated,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          setOrder((prevOrder) => ({
            ...prevOrder,
            MostrarCodigo: isChecked ? 1 : 0
          }));
        })
      }
    } catch (error) {

    }
  }

  return (
    <>
      <div className='panel border mt-8 bg-[#F2F2F2]'>
        <div className="grid grid-cols-2 gap-4">
          <form action="" onSubmit={handleSearchQuoteFormSubmit(onSearch)}>
            <fieldset>
              <legend className='space-y-1'>{t.search}</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className='space-y-1'>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nro_part">{t.nro_part}</label>
                    <div className="relative flex-1">
                      <input onKeyDown={handleKeyDown} type='text' autoComplete='OFF' {...registerSearchQuote("nro_part", { required: { value: true, message: t.required_field } })} aria-invalid={errorsSearchQuote.nro_part ? "true" : "false"} placeholder={t.enter_nro_part} className="form-input form-input-sm placeholder:" />
                      {errorsSearchQuote.nro_part && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsSearchQuote.nro_part?.message?.toString()}</span>}
                    </div>
                  </div>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="quantity">{t.amount}</label>
                    <div className="relative flex-1">
                      <input onKeyDown={handleKeyDown} type='text' autoComplete='OFF' {...registerSearchQuote("quantity", { required: { value: true, message: t.required_field } })} aria-invalid={errorsSearchQuote.quantity ? "true" : "false"} placeholder={t.enter_quantity} className="form-input form-input-sm placeholder:" />
                      {errorsSearchQuote.quantity && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsSearchQuote.quantity?.message?.toString()}</span>}
                    </div>
                  </div>

                </div>

                <div className='space-y-1'>
                  {(showPosition) &&
                    <div className="flex sm:flex-row flex-col mb-2">
                      <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="position">{t.position}</label>
                      <div className="relative flex-1">
                        <input onKeyDown={handleKeyDown} type='text' autoComplete='OFF' {...registerSearchQuote("position", { required: false })} aria-invalid={errors.position ? "true" : "false"} className="form-input form-input-sm placeholder:" />
                        {errors.position && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.position?.message?.toString()}</span>}
                      </div>
                    </div>
                  }

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    {(order.NroOrden) &&
                      <button type='button' onClick={() => setShowPosition(!showPosition)} className={`btn btn-sm  p-0 ${(showPosition) ? 'bg-gray-900' : 'bg-gray-400'} `}><IconPosition className='fill-white'></IconPosition></button>
                    }
                    <button type="button" onClick={handleSearchQuoteFormSubmit(onSearch)} className='btn btn-primary'>{t.btn_search}</button>
                  </div>

                </div>

              </div>


              <div className='bg-black h-0.5 my-4'></div>
              <div className='bg-gray-300 p-4 mb-4'>
                <div className="flex sm:flex-row flex-col items-center">
                  <label className="mb-0 sm:w-1/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="nro_order">{t.nro_pedido}</label>
                  <div className="sm:w-2/5">
                    <input type='text' autoComplete='OFF' {...registerSearchQuote("nro_order", { required: false })} aria-invalid={errors.nro_order ? "true" : "false"} placeholder={t.enter_nro_order} className="form-input form-input-sm placeholder:" />
                    {errors.nro_order && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.nro_order?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className='space-y-1'>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_brand">{t.equipment_brand}</label>
                    <div className="relative flex-1">
                      <Controller
                        name="equipment_brand"
                        control={control}
                        rules={{ required: false }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isClearable
                            options={brands}
                            placeholder={t.select}
                            instanceId="equipment_brand"
                            menuPosition={'fixed'}
                            menuShouldScrollIntoView={false}
                            className="w-full"
                          />
                        )}
                      />

                      {errors.equipment_brand && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_brand?.message?.toString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_model">{t.equipment_model}</label>
                    <div className="relative flex-1">
                      <input type='text' autoComplete='OFF' {...registerSearchQuote("equipment_model", { required: false })} aria-invalid={errors.equipment_model ? "true" : "false"} placeholder={t.enter_equipment_model} className="form-input form-input-sm placeholder:" />
                      {errors.equipment_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_model?.message?.toString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_serie">{t.equipment_serie}</label>
                    <div className="relative flex-1">
                      <input type='text' autoComplete='OFF' {...registerSearchQuote("equipment_serie", { required: false })} aria-invalid={errors.equipment_serie ? "true" : "false"} placeholder={t.enter_equipment_serie} className="form-input form-input-sm placeholder:" />
                      {errors.equipment_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_serie?.message?.toString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="equipment_year">{t.year}</label>
                    <div className="relative flex-1">
                      <input type='text' autoComplete='OFF' {...registerSearchQuote("equipment_year", { required: false })} aria-invalid={errors.equipment_year ? "true" : "false"} placeholder={t.enter_equipment_year} className="form-input form-input-sm placeholder:" />
                      {errors.equipment_year && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.equipment_year?.message?.toString()}</span>}
                    </div>
                  </div>

                </div>
                <div className='space-y-1'>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_brand">{t.engine_brand}</label>
                    <div className="relative flex-1">
                      <Controller
                        name="engine_brand"
                        control={control}
                        rules={{ required: false }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isClearable
                            options={brands}
                            placeholder={t.select}
                            instanceId="engine_brand"
                            menuPosition={'fixed'}
                            menuShouldScrollIntoView={false}
                            className="w-full"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_model">{t.engine_model}</label>
                    <div className="relative flex-1">
                      <input type='text' autoComplete='OFF' {...registerSearchQuote("engine_model", { required: false })} aria-invalid={errors.engine_model ? "true" : "false"} placeholder={t.enter_engine_model} className="form-input form-input-sm placeholder:" />
                      {errors.engine_model && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_model?.message?.toString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="engine_serie">{t.engine_serie}</label>
                    <div className="relative flex-1">
                      <input type='text' autoComplete='OFF' {...registerSearchQuote("engine_serie", { required: false })} aria-invalid={errors.engine_serie ? "true" : "false"} placeholder={t.enter_engine_serie} className="form-input form-input-sm placeholder:" />
                      {errors.engine_serie && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.engine_serie?.message?.toString()}</span>}
                    </div>
                  </div>
                  {(order.NroOrden) &&
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button type="button" onClick={() => updateQuote()} className='btn btn-primary'>{t.btn_update}</button>
                    </div>
                  }
                </div>
              </div>

            </fieldset>
            <div className='bg-black h-0.5 my-4'></div>

            {(order.NroOrden) &&
              <blockquote className="rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]">
                <div className="flex items-start">

                  <p className="m-0 text-sm not-italic text-[#515365] dark:text-white-light">{t.question_show_nro_part}</p>

                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="show_nro_part">{t.show} {t.nro_part}</label>
                  <div className="relative flex-1">

                    <div className="mb-5">
                      <label className="relative h-6 w-12">
                        <input checked={order.MostrarCodigo === 1} {...register("show_nro_part")} onChange={handelChangeShowPart} type="checkbox" value={1} className="custom_switch peer absolute z-10 h-full w-full cursor-pointer opacity-0" id="nro_part" />
                        <span className="outline_checkbox bg-white block h-full rounded-full border-2 border-gray-400 before:absolute before:bottom-1 before:left-1 before:h-4 before:w-4 before:rounded-full before:bg-gray-400 before:bg-[url(/assets/images/close.svg)] before:bg-center before:bg-no-repeat before:transition-all before:duration-300 peer-checked:border-primary peer-checked:before:left-7 peer-checked:before:bg-primary peer-checked:before:bg-[url(/assets/images/checked.svg)] dark:border-white-dark dark:before:bg-white-dark"></span>
                      </label>
                    </div>


                  </div>
                </div>
              </blockquote>
            }




          </form>

          <form action="">
            <fieldset>
              <legend></legend>
              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                <div className="relative mt-10 px-6 mb-8">
                  <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_quote}</div>
                      <div className="text-end ml-8 font-bold flex-1"><span className='bg-secondary px-4 py-1 text-xl rounded text-white'>{order.NroOrden}</span></div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.total_weight_lb}</div>
                      <div className="text-end ml-8 font-bold flex-1">{customFormat(order.TotalPeso)}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.quote_total}</div>
                      <div className="text-end ml-8 font-bold flex-1">{customFormat(order.Total)}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col border-b pb-2">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.nro_items}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.NroItems}</div>
                    </div>
                    <div className="flex sm:flex-row flex-col">
                      <div className="flex-none ltr:mr-2 rtl:ml-2">{t.exchange_rate}</div>
                      <div className="text-end ml-8 font-bold flex-1">{order.TipoCambio}</div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f] mt-4 pb-4">
                <div className="flex w-full gap-4 my-6 items-center justify-center">
                  <div>
                    <label className="inline-flex">
                      <input onChange={handleChangeOption} type="radio" checked={optionSelected === "quote"} name="option" value={'quote'} className="form-radio text-blue-600 focus:ring-blue-500 disabled:checked:bg-blue-600" />
                      <span className={`${(_tracking_?.Cotizar == 1) ? 'text-blue-600 font-bold' : ''}`}>{t.btn_quote}</span>
                    </label>
                  </div>
                  <div>
                    <label className="inline-flex">
                      <input onChange={handleChangeOption} type="radio" checked={optionSelected === "tracking"} name="option" value={'tracking'} className="form-radio text-blue-600 focus:ring-blue-500 disabled:checked:bg-blue-600" />
                      <span className={`${(_tracking_?.Seguimiento == 1) ? 'text-blue-600 font-bold' : ''}`}>{t.follow}</span>
                    </label>
                  </div>
                </div>

                <div className="flex sm:flex-row flex-col">
                  <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.share_with}</label>
                  <div className="flex">
                    <div>
                      <Controller
                        name="share_with_customer"
                        control={controlDefault}
                        rules={{ required: false }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            isClearable
                            options={options_share}
                            placeholder={t.select_option}
                            instanceId="share_with_customer"
                            menuPosition={'fixed'}
                            menuShouldScrollIntoView={false}
                            className="w-full text-left"
                          />
                        )}
                      />
                    </div>

                    <button onClick={() => apply()} type="button" className="btn btn-outline-primary ltr:rounded-l-none rtl:rounded-r-none">
                      {t.apply}
                    </button>
                  </div>
                </div>
              </div>

            </fieldset>
          </form>
        </div>


      </div>
      {(order.NroOrden) &&
        <div>
          <div className="bg-gray-300 py-4 mt-4">
            <div className="px-4 grid grid-cols-12 gap-2">

              <div className="flex flex-wrap gap-2 col-span-4">
                <button onClick={() => newQuote()} title={t.btn_new} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0'><IconFile></IconFile></button>
                <button onClick={() => updateItem()} title={t.update} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0' disabled={isSelectItems}><IconRefresh></IconRefresh></button>
                <BtnPrintQuote order={order} token={token} className={`btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0`}></BtnPrintQuote>
                <button onClick={() => deleteItems()} title={t.delete} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0' disabled={isSelectItems}><IconTrashLines></IconTrashLines></button>
                <button onClick={() => message()} title={t.send_by_message} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0'><IconMail></IconMail></button>
                <button onClick={() => discount()} title={t.add_discount} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0'><IconDiscount></IconDiscount></button>
                <button onClick={() => attach()} title={t.attach} className='btn bg-yellow-500 btn-sm hover:btn-dark disabled:bg-gray-400 border-0'><IconAttachment></IconAttachment></button>
              </div>

              <div className="flex flex-wrap gap-2 col-span-4">
                <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" >{t.preference}</label>
                <div className="relative flex-1">

                  <Select
                    options={[{ value: "RE", label: "MAS ECONOMICO" }, { value: "OR", label: "ORIGINAL" }]}
                    isClearable={false}
                    isSearchable={false}
                    //{...register('country', { required: { value: true, message: t.required_field } })}
                    id="preference-select"
                    instanceId="preference-select"
                    onChange={handleChangePreference}
                    placeholder={t.select_option}
                  ></Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 col-span-4">
                <button onClick={() => priceParameters()} className='btn btn-sm btn-dark' type='button'>{t.price_parameter}</button>
                <button onClick={() => costSummary()} className='btn btn-sm btn-dark' type='button'>{t.cost_summary}</button>
                <button onClick={() => cloneQuote()} className='btn btn-sm btn-dark' type='button'>{t.duplicate}</button>
                <button onClick={() => validateQuote()} className='btn btn-sm btn-dark' type='button'>{t.validate}</button>
                <button onClick={() => buyQuote()} className='btn btn-sm btn-success' type='button'>{t.buy}</button>
              </div>
            </div>
          </div>
          <div className="border-0 p-0">
            <div className="table-responsive">
              <table className="bg-white table-hover table-compact" ref={tablaRef}>
                <thead>
                  <tr className="relative !bg-gray-400 text-center uppercase">
                    <th className='w-1 !p-2'>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="border border-dark border-1 bg-white form-checkbox !mr-0"
                          checked={seleccionados.length === items.length}
                          onChange={toggleTodos}
                        />
                      </label>
                    </th>
                    <th className='w-1 !p-0'>Item</th>
                    <th className='w-1'>{t.qty}</th>
                    <th className='whitespace-nowrap'>{t.nro_part}</th>
                    <th>{t.description}</th>
                    <th>{t.weight_unit}</th>
                    <th>{t.spare_part_type}</th>
                    <th>{t.application}</th>
                    <th>{t.brand}</th>
                    <th>{t.price_unit}</th>
                    <th>Total</th>
                    <th>{t.indicator}</th>
                    <th>{t.t_delivery}</th>
                    <th>{t.days_of_validity}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td className='!p-2'>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="border border-dark border-1 form-checkbox !mr-0"
                              checked={seleccionados.includes(item)}
                              onChange={() => toggleSeleccion(item)}
                            />
                          </label>
                        </td>
                        <td className='!p-0 text-center'>{item.CodItem}</td>
                        <td>

                          <input
                            step="any" type="number"
                            {...registerSearchQuote(`items.${item.CodItem}.Cantidad`, {
                              valueAsNumber: true
                            })}
                            className="border text-center rounded form-input w-20 border-dark border-2 !p-1 text-xl"
                          />

                        </td>
                        <td className='whitespace-nowrap'>{(item.NroParte.includes("*")) ? <button onClick={() => showReference(item)} className="btn btn-sm btn-outline-info font-bold">{item.NroParte}</button> : item.NroParte}</td>
                        <td>{item.DesRepuesto}</td>
                        <td className='text-end'>{customFormat(item.Peso)}</td>
                        <td>{item.TipoRepuesto}</td>
                        <td>{item.Aplicacion}</td>
                        <td>{item.Marca}</td>
                        <td className='text-end'>{customFormat(item.Precio)}</td>
                        <td className='text-end'>{customFormat(item.Total)}</td>
                        <td>
                          {(item.VerMas) &&
                            <button onClick={() => showMore(item)} className='btn btn-sm btn-secondary' type="button">{t.see_more}</button>
                          }
                        </td>
                        <td>{item.TiEntrega}</td>
                        <td>{item.Dias}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-[#F2F2F2] p-5 border shadow-lg">
            <div>
              <div>
                <label htmlFor="Email">{t.note_to_customer}</label>
                <div className="relative text-white-dark">
                  <textarea defaultValue={order.NotaCliente} className='form-input' {...registerNoteQuote(`note_customer`, { required: { value: true, message: t.required_field } })} rows="4">
                  </textarea>
                  {errorsNoteQuote.note_customer && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsNoteQuote.note_customer?.message?.toString()}</span>}
                </div>
              </div>
              <div>
                <label htmlFor="Email">{t.note_to_user}</label>
                <div className="relative text-white-dark">
                  <div className="relative text-white-dark">
                    <textarea defaultValue={order.NotaUsuario} className='form-input' {...registerNoteQuote(`note_user`, { required: { value: true, message: t.required_field } })} rows="4">
                    </textarea>
                    {errorsNoteQuote.note_user && <span className='text-red-400 error block text-xs mt-1' role="alert">{errorsNoteQuote.note_user?.message?.toString()}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button className='btn btn-sm btn-dark' type="button" onClick={handleSaveNoteQuoteFormSubmit(onSaveNote)}>{t.btn_save}</button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-md bg-white text-center shadow-lg dark:bg-[#1c232f]">
              <div className="mt-6 p-5 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{t.total_spare_parts}:</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.TotRepuestos)}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{t.freight}</div>

                  <div className='text-end ml-8 font-bold flex-1'>
                    <div className="flex justify-items-end justify-end">
                      <button type="button" onClick={() => saveFreight()} className={`btn btn-sm btn-outline-dark ${(order.FleteInterno > 0) ? 'ltr:rounded-r-none rtl:rounded-l-none' : 'ltr:rounded-r-none'}  group/item`}>
                        <IconCheck className='fill-success group-hover/item:fill-white'></IconCheck>
                      </button>
                      {(order.FleteInterno > 0) &&
                        <button title='Distribuir' type="button" onClick={() => deleteFreight()} className="btn btn-sm btn-outline-dark rounded-none ltr:border-l-0 rtl:border-r-0 group/item">
                          <IconDirection className='fill-black group-hover/item:fill-white'></IconDirection>
                        </button>
                      }
                      <input {...register(`freight`, { required: { value: true, message: t.required_field } })} type="text" placeholder="" className="text-end text-sm form-input ltr:rounded-l-none rtl:rounded-r-none w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{t.discount}</div>
                  <div className="text-end ml-8 font-bold flex-1">{(order.Descuento) ? (`- ${customFormat(order.Descuento)}`) : '0.00'}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">{t.tax}</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.MtoIva)}</div>
                </div>
                <div className="flex sm:flex-row flex-col border-b pb-2">
                  <div className="flex-none ltr:mr-2 rtl:ml-2">Total $us</div>
                  <div className="text-end ml-8 font-bold flex-1">{customFormat(order.Total)}</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      }
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default QuoteForm;
