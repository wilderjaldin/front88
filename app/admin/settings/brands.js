'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import Modal from '@/components/modal';
import IconEdit from '@/components/icon/icon-edit';
import IconTrash from '@/components/icon/icon-trash';
import { useTranslation } from '@/app/locales';

import BrandForm from '@/components/forms/brand-form';

const url_brands = process.env.NEXT_PUBLIC_API_URL + 'cliente/MostrarMarcas';
const url_delete_brand = process.env.NEXT_PUBLIC_API_URL + 'repuesto/EliminarMarcaRepuesto';

export default function Brands({ t, token }) {


  const [brands, setBrands] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    setFiltered(
      brands.filter(b =>
        b.NomMarca.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, brands]);

  const normalizeList = (res) => {
    if (
      res?.data?.estado === 'OK' &&
      Array.isArray(res.data.dato)
    ) {
      return res.data.dato;
    }

    return [];
  };

  const loadBrands = async () => {
    try {
      const res = await axios.post(url_brands, { ValToken: token });

      const list = normalizeList(res);

      setBrands(list);
      setFiltered(list);

      if (!list.length && res.data?.estado === 'Error') {
        console.warn('Error backend:', res.data?.mensaje);
      }

    } catch (error) {
      console.error('Error conexión:', error);

      setBrands([]);
      setFiltered([]);

      Swal.fire({
        icon: 'error',
        title: t.error,
        text: t.load_brands_error,
      });
    }
  };




  const addBrand = () => {
    setModalTitle(t.add_brand);
    setModalContent(
      <BrandForm
        t={t}
        token={token}
        updateBrandsFile={updateBrandsFile}
        onSuccess={(list) => {
          setShowModal(false);
          setBrands(list);
          setFiltered(list);
        }}
      />
    );
    setShowModal(true);
  };


  const editBrand = (brand) => {
    setModalTitle(t.edit_brand);
    setModalContent(
      <BrandForm
        t={t}
        token={token}
        brand={brand}
        updateBrandsFile={updateBrandsFile}
        onSuccess={(list) => {
          setShowModal(false);
          setBrands(list);
          setFiltered(list);
        }}
      />
    );
    setShowModal(true);
  };


  const deleteBrand = async (brand) => {
    const result = await Swal.fire({
      title: t.question_delete_brand,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: t.yes,
      cancelButtonText: t.no,
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.post(url_delete_brand, {
        CodMarca: brand.CodMarca,
        ValToken: token,
      });

      const list = res.data?.dato || [];

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: t.brand_deleted,
        showConfirmButton: false,
        timer: 1500,
      });

      setBrands(list);
      setFiltered(
        list.filter(b =>
          b.NomMarca.toLowerCase().includes(search.toLowerCase())
        )
      );

      await updateBrandsFile(list);

    } catch (error) {
      Swal.fire('Error', t.brand_error_delete_server, 'error');
    }
  };

  const updateBrandsFile = async (list) => {
    const brands = list
      .filter(b => b.CodMarca > 0)
      .map(b => ({
        value: b.CodMarca,
        label: b.NomMarca,
      }))
      .sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      );

    await fetch("/api/saveFile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "brands.json",
        folder: "data-runtime",
        content: brands,
      }),
    });
  };

  return (
    <>
      <div className="panel p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">{t.brands}</h2>

          <button className="btn btn-primary" onClick={addBrand}>
            + {t.add_brand}
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder={t.filter}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input w-full mb-4"
          />

          <div className="overflow-x-auto">
            <table className="bg-white table-hover text-sm">
              <thead>
                <tr className="relative !bg-gray-400 hover:!bg-gray-400  text-center text-sm">
                  <th className="text-black font-semibold uppercase">{t.brand}</th>
                  <th className="text-center w-32"></th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filtered) &&
                  filtered
                    .filter(b => b.CodMarca > 0)
                    .map((b) => (
                      <tr key={b.CodMarca}>
                        <td>{b.NomMarca}</td>
                        <td className="text-center">
                          <div className="mx-auto flex w-max items-center gap-2">
                            <button
                              className="btn btn-sm btn-info p-1"
                              onClick={() => editBrand(b)}
                            >
                              <IconEdit />
                            </button>

                            <button
                              className="btn btn-sm btn-danger p-1"
                              onClick={() => deleteBrand(b)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {(!Array.isArray(filtered) ||
                  filtered.filter(b => b.CodMarca > 0).length === 0) && (
                    <tr>
                      <td colSpan={2} className="text-center py-6 text-gray-400">
                        {t.empty_results}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        openModal={() => setShowModal(true)}
        title={modalTitle}
        content={modalContent}
      />
    </>
  );
}