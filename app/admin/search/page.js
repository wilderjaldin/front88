"use client";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useTranslation } from "@/app/locales";

import { useRouter } from 'next/navigation';
import Modal from '@/components/modal';
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useSearchParams } from "next/navigation";
import IconCaretDown from "@/components/icon/icon-caret-down";
import IconCheck from "@/components/icon/icon-check";

import DatePicker from "react-date-picker";

import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";

import TableCustomers from "@/app/admin/search/table_customers"
import TableSuppliers from "@/app/admin/search/table_suppliers"
import TableBrands from "@/app/admin/search/table_brands"
import TableOrders from "@/app/admin/search/table_orders"
import TablePurchaseOrders from "@/app/admin/search/table_purchase_orders"
import TableReception from "@/app/admin/search/table_reception"
import TableSparePartsChange from "@/app/admin/search/table_spare_parts_change"
import TableQuotes from "@/app/admin/search/table_quotes"
import TablePackingDelivery from "@/app/admin/search/table_packaging_delivery"
import TableSparePartsQuote from "@/app/admin/search/table_spare_parts_to_be_quoted"
import TableSparePartsOptions from "@/app/admin/search/table_spare_parts"
import { useDynamicTitle } from "@/app/hooks/useDynamicTitle";

const url_search_part = process.env.NEXT_PUBLIC_API_URL + 'buscar/BuscarTodoNroParte';
const url_search_reference = process.env.NEXT_PUBLIC_API_URL + 'buscar/BuscarNroReferencia';


export default function Search() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useSelector(selectToken);
  const t = useTranslation();

  const options = [{ value: 0, label: t.nro_parte }, { value: 1, label: "Cotización/Orden" }, { value: 2, label: "Orden Compra" }, { value: 3, label: t.customer }, { value: 4, label: t.supplier }, { value: 5, label: t.brand }]
  const range = [{ value: 30, label: "Últimos 30 Días" }, { value: 15, label: "Últimos 15 Días" }, { value: 7, label: "Últimos 7 Días" }, { value: 0, label: "Definir Rango" }]

  const [label_term, setLabelTerm] = useState(options[0].label);
  const [isRange, setIsRange] = useState(false)
  const [type_term, setTypeTerm] = useState('text')
  //
  const [quotes, setQuotes] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [brands, setBrands] = useState([])
  const [orders, setOrders] = useState([])
  const [purchase_orders, setPurchaseOrders] = useState([])
  const [receptions, setReceptions] = useState([])
  const [spare_parts_change, setSparePartsChange] = useState([])
  const [packing, setPacking] = useState([])
  const [quoting, setQuoting] = useState([])
  const [spare_parts, setSpareParts] = useState([])
  //

  let term = searchParams.get("term") || '';
  let type = searchParams.get("type") || '';

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm({ defaultValues: { params: 0, range: 30 } });

  useEffect(() => {

    async function fetchData() {
      await handleSearch(term)
    }
    fetchData();


  }, [term, type]);

  const handleSearch = async (term) => {
    const rs = await axios.post( (type == "part") ? url_search_part : ( (type == "reference") ? url_search_reference : "" ) , {
      "CadBuscar": term,
      "ValToken": token

    });



    if (rs.data.estado == 'OK') {

      setQuotes(rs.data.dato1);
      setOrders(rs.data.dato2);
      setSpareParts(rs.data.dato3)
      
    }
  }

  const onChangeSelect = (select, field) => {
    setLabelTerm(select.label)
    if (select.value == 1 || select.value == 2) {
      setTypeTerm('number');
    } else {
      setTypeTerm('text');
    }
    setValue('params', select.value);
  }

  const onChangeSelectRange = (select) => {
    if (select.value == 0) {
      setIsRange(true);
      setValue('to', '');
      setValue('from', '');
    } else {
      setIsRange(false);
    }
    setValue('range', select.value);
  }

  const formatDate = (fecha) => {
    if (!fecha) return "";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();
    return `${mes}/${dia}/${año}`;
  };

  const getDates = (days) => {
    const today = new Date();
    const past_date = new Date();
    past_date.setDate(today.getDate() - days);

    return {
      today: formatDate(today),
      past_date: formatDate(past_date),
    };
  };

  function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  const onSearch = async (data) => {
    try {
      let dates = [];
      if (data.range > 0) {
        const { today, past_date } = getDates(data.range);
        dates.date_init = past_date;
        dates.date_end = today;

      } else {
        dates.date_init = formatDate(data.from);
        dates.date_end = formatDate(data.to);
      }

      const initDate = parseDate(dates.date_init);
      const endDate = parseDate(dates.date_end);

      if (initDate > endDate) {
        Swal.fire({
          title: t.error,
          text: t.dates_range_invalid,
          icon: 'warning',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
        return;
      }


      const rs = await axios.post(url_search, {
        "FecInicio": dates.date_init,
        "FecFin": dates.date_end,
        "CodParametro": data.params,
        "CadBuscar": data.term,
        "ValToken": token

      });


      if (rs.data.estado == 'OK') {
        if (data.params != 2) {
          setCustomers(rs.data.Clientes);
          setSuppliers(rs.data.Proveedores);
          setBrands(rs.data.Marcas);
        }
        setQuotes(rs.data.Cotizaciones);
        setOrders(rs.data.Ordenes);
        setPurchaseOrders(rs.data.OrdenesCompra)
        setReceptions(rs.data.Recepcion)
        setSparePartsChange(rs.data.RepuestosCambio)
        setPacking(rs.data.EmbalajeEntrega)
        setQuoting(rs.data.RepPorCotizar)
        setSpareParts(rs.data.Repuestos)
      }

    } catch (error) {

    }
  }

  useDynamicTitle(`${t.search}`);
  return (
    <>
      <div>
        <ul className="flex space-x-2 rtl:space-x-reverse">
          <li>
            {t.home}
          </li>
          <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
            <span className="font-bold"> {t.search} </span>
          </li>
        </ul>
      </div>
      {(false) &&
        <div className="panel shadow-xl border-[#b7b7b7] border mt-8 sm:px-20">
          <form action="" onSubmit={handleSubmit(onSearch)}>
            <fieldset className="space-y-4">
              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.search_parameter}</label>
                <div className="relative flex-1">
                  <Select isClearable={false} isSearchable={false} id='select-status' placeholder={t.select_option} {...register("params", { required: { value: true, message: t.required_select } })} className='w-full' options={options} defaultValue={options[0]} onChange={(e) => onChangeSelect(e, 'status')} />
                  {errors.params && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.params?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="term">{label_term}</label>
                <div className="relative flex-1">
                  <input type={type_term} autoComplete='OFF' {...register("term", { required: { value: true, message: t.required_field } })} aria-invalid={errors.term ? "true" : "false"} placeholder={t.enter_term} className="form-input placeholder:" />
                  {errors.term && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.term?.message?.toString()}</span>}
                </div>
              </div>

              <div className="flex sm:flex-row flex-col">
                <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end">{t.range}</label>
                <div className="relative flex-1">
                  <Select isClearable={false} isSearchable={false} id='rango' placeholder={t.select_option} {...register("range", { required: { value: true, message: t.required_select } })} className='w-full' options={range} defaultValue={range[0]} onChange={onChangeSelectRange} />
                  {errors.rango && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.rango?.message?.toString()}</span>}
                </div>
              </div>
              {(isRange) &&
                <>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="from">{t.from}</label>
                    <div className="relative flex-1">
                      <Controller
                        control={control}
                        name="from"
                        rules={{
                          required: { value: true, message: t.required_date }
                        }}
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            onChange={onChange}
                            value={value}
                            format={"d/MM/y"}
                            locale="es-ES"
                            className="form-input"
                          />
                        )}
                      />
                      {errors.from && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.from?.message?.toString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-row flex-col">
                    <label className="mb-0 sm:w-2/5 sm:ltr:mr-2 rtl:ml-2 text-end" htmlFor="to">{t.to}</label>
                    <div className="relative flex-1">
                      <Controller
                        control={control}
                        name="to"
                        rules={{
                          required: { value: true, message: t.required_date }
                        }}
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            onChange={onChange}
                            value={value}
                            format={"d/MM/y"}
                            locale="es-ES"
                            className="form-input"
                          />
                        )}
                      />
                      {errors.to && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.to?.message?.toString()}</span>}
                    </div>
                  </div>
                </>
              }
              <div className="my-5">

                <div className="flex flex-wrap items-center justify-center gap-2">

                  <button type="submit" className="btn btn-success">
                    {t.btn_search}
                  </button>

                </div>
              </div>
            </fieldset>
          </form>
        </div>
      }

      <div>
        {(quotes.length > 0) && <TableQuotes t={t} quotes={quotes}></TableQuotes>}
      </div>

      <div>
        {(orders.length > 0) && <TableOrders t={t} orders={orders}></TableOrders>}
      </div>

      <div>
        {(spare_parts.length > 0) && <TableSparePartsOptions t={t} spare_parts={spare_parts}></TableSparePartsOptions>}
      </div>

      <div>
        {(purchase_orders.length > 0) && <TablePurchaseOrders t={t} orders={purchase_orders}></TablePurchaseOrders>}
      </div>
      <div>
        {(receptions.length > 0) && <TableReception t={t} orders={receptions}></TableReception>}
      </div>

      <div>
        {(packing.length > 0) && <TablePackingDelivery t={t} packing={packing}></TablePackingDelivery>}
      </div>

      <div>
        {(quoting.length > 0) && <TableSparePartsQuote t={t} data={quoting}></TableSparePartsQuote>}
      </div>

      

      <div>
        {(spare_parts_change.length > 0) && <TableSparePartsChange t={t} orders={spare_parts_change}></TableSparePartsChange>}
      </div>

      <div>
        {(customers.length > 0) && <TableCustomers t={t} customers={customers}></TableCustomers>}
      </div>

      <div>
        {(suppliers.length > 0) && <TableSuppliers t={t} suppliers={suppliers}></TableSuppliers>}
      </div>

      <div>
        {(brands.length > 0) && <TableBrands t={t} brands={brands} ></TableBrands>}
      </div>

    </>
  );
}