'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from "react-hook-form"
import axios from 'axios'
import Swal from 'sweetalert2'
import IconTrashLines from '../icon/icon-trash-lines';
import IconSave from "../icon/icon-save"
import IconDownload from "../icon/icon-download"

const url_register_file = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/GuardarDatosArchivoAdj';
const url_attch = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/SubirArchivoAdj';
const url_list_files = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/MostrarArchivosAdjuntos';
const url_download_file = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/DescargarArchivoAdjunto';
const url_delete_file = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/EliminarArchivoAdjunto';
const url_update_description_file = process.env.NEXT_PUBLIC_API_URL + 'ordenesdetalle/ModificarDesArchivoAdjunto';

const AttachQuoteForm = ({ close, token, t, order }) => {

  const [files, setFiles] = useState([]);
  const [filename, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register, setValue, getValues,
    handleSubmit,
    formState: { errors },
  } = useForm();


  useEffect(() => {
    getListFiles();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setValue('attach', [file], { shouldValidate: true });

      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }

    }
  };

  const handleRemoveFile = () => {
    setFileName("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('attach', []);
    const input = document.getElementById('file_attach');
    if (input) input.value = "";
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], "captura.png", { type: blob.type });
            const dt = new DataTransfer();
            dt.items.add(file);
            const fileInput = document.getElementById("file_attach");
            fileInput.files = dt.files;

            // Actualiza el formulario y el nombre del archivo
            handleFileChange({ target: { files: dt.files } });
            Swal.fire({
              icon: "success",
              title: "Imagen pegada correctamente",
              timer: 1500,
              showConfirmButton: false,
              position: "top-end"
            });
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileInput = document.getElementById('file_attach');
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      fileInput.files = dt.files;

      handleFileChange({ target: { files: dt.files } });
    }
  }, [handleFileChange]);

  const getListFiles = async () => {
    try {
      const rs = await axios.post(url_list_files, { NroOrden: order.NroOrden, ValToken: token });

      if (rs.data.estado == 'Ok') {
        setFiles(rs.data.dato);
      }
    } catch (error) {

    }
  }


  const onUpdaload = async (data) => {

    try {
      var file_extension = '';
      var file_name = '';
      if (data.attach[0]) {
        file_extension = '.' + data.attach[0].name.split('.').pop();
        file_name = (data.attach[0].name).replace((file_extension), "");

        const rs_register = await axios.post(url_register_file, { NroOrden: order.NroOrden, NomArchivo: file_name, ExtArchivo: file_extension, ValToken: token });

        if (rs_register.data.estado == 'Ok') {
          const formData = new FormData();
          formData.append('NroOrden', order.NroOrden);
          formData.append('File', data.attach[0]);
          const rs_attach = await axios.post(url_attch, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });


          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.file_upload_success,
            showConfirmButton: false,
            timer: 1500
          }).then(async (r) => {
            setFiles(rs_register.data.dato)
          });
        }
      } else {
        Swal.fire({
          title: t.error,
          text: t.file_empty_error,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: t.close
        });
      }

    } catch (error) {

    }
  }

  const updateDescriptionFile = async (file) => {

    try {
      const description = getValues(`description.${file.CodRegistro}`);
      const rs = await axios.post(url_update_description_file, { CodRegistro: file.CodRegistro, DesArchivo: description, ValToken: token });
      if (rs.data.estado == 'Ok') {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.save_description_file_success,
          showConfirmButton: false,
          timer: 1500
        });
      }

    } catch (error) {

    }
  }

  const downloadFile = async (file) => {

    try {
      const response = await axios.post(url_download_file, { CodRegistro: file.CodRegistro, NroOrden: order.NroOrden, ValToken: token }, {
        responseType: 'blob',
      });



      const contentDisposition = response.headers['content-disposition']


      const fileNameMatch = contentDisposition?.match(/filename="?(.+)"?/)

      const fileName = fileNameMatch ? (fileNameMatch[1].replace('"', '')) : 'archivo.pdf'


      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url);
      Swal.close();

    } catch (error) {

    }
  }

  const deleteFile = async (file) => {

    Swal.fire({
      title: t.question_delete_file,
      text: file.NomArchivo,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: t.yes_delete,
      cancelButtonText: t.btn_cancel,
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const rs = await axios.post(url_delete_file, { CodRegistro: file.CodRegistro, NroOrden: order.NroOrden, ValToken: token });

          if (rs.data.estado == 'Ok') {
            setFiles(rs.data.dato);
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: t.delete_file_success,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              position: "top-end",
              icon: "error",
              title: t.delete_file_error,
              showConfirmButton: false,
              timer: 1500
            });
          }
        } catch (error) {

          Swal.fire({
            position: "top-end",
            icon: "error",
            title: t.delete_file_error_server,
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    });



  }



  return (
    <>

      <div className=''>

        <div className="grid grid-cols-1 gap-6">
          <div className={``}>
            <div className="mb-5">
              <form className="space-y-4" onSubmit={handleSubmit(onUpdaload)}>

                <div className="pt-0 flex flex-col">
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    htmlFor="file_attach"
                    className={`bg-gray-200 flex flex-col items-center justify-center border-4 border-dashed rounded h-36 px-6 text-lg text-gray-600 cursor-pointer transition-all duration-200
                    ${isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
                    <svg className="w-8 h-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <div className="mt-2 text-base leading-normal text-blue-500 font-bold">
                      {(filename) ? <span>{t.selected_file}: {filename}</span> : "Selecciona un archivo"}
                    </div>
                    <input {...register('attach', { required: false })} type='file'
                      accept="image/*, .pdf, .doc, .docx, .xls, .xlsx"
                      id="file_attach" className="hidden" onChange={handleFileChange} />

                  </label>
                  <p className="py-2 text-gray-400">{t.allowed_file_types}: .jpeg .jpg .png .pdf .doc .docx .xls .xlsx</p>
                </div>

                {previewUrl && (
                  <div className="mt-3 flex flex-col items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="max-h-60 rounded-lg border border-gray-300 shadow-md"
                    />

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="btn btn-sm btn-danger"
                      >
                        { t.btn_delete }
                      </button>
                    </div>
                  </div>
                )}

                <div className="my-5">

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button onClick={() => close()} type="button" className="btn btn-dark">
                      {t.btn_cancel}
                    </button>

                    <button type="submit" className="btn btn-success">
                      {t.btn_upload}
                    </button>

                  </div>
                </div>

              </form>

            </div>
          </div>
        </div >

        <div className="table-responsive mb-5">
          <table className="table-hover bg-white mantine-Table-root mantine-cdbiq">
            <thead>
              <tr className="relative !bg-gray-400 text-center uppercase">
                <th className='w-1'></th>
                <th>{t.file_name}</th>
                <th>{t.description}</th>
                <th>{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <button onClick={() => deleteFile(f)} title={t.delete} type="button" className="btn btn-sm btn-danger"><IconTrashLines /></button>
                    </td>
                    <td>
                      <div className='flex items-center gap-2'>
                        <button onClick={() => downloadFile(f)} title='Descargar' className='btn btn-sm btn-outline-info' type="button"> <IconDownload></IconDownload> </button>
                        <span>{f.NomArchivo}</span>

                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="flex">
                          <input type="text" defaultValue={f.DesArchivo} placeholder="" {...register(`description.${f.CodRegistro}`)} className="form-input border border-primary border-1 ltr:rounded-r-none rtl:rounded-l-none" />
                          <button onClick={() => updateDescriptionFile(f)} type="button" className="btn btn-outline-primary ltr:rounded-l-none rtl:rounded-r-none">
                            <IconSave></IconSave>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>{f.FecRegistra}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div >
    </>
  );
};

export default AttachQuoteForm;
