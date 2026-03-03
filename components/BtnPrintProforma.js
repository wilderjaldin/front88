'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import IconPrinter from './icon/icon-printer';
import Modal from '@/components/modal';
const PdfProformaViewer = dynamic(() => import('@/app/admin/purchase-order/PdfProformaViewer'), {
  ssr: false,
});

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const BtnPrintProforma = ({ close, token, t, order, className="", selected=[], disabled }) => {

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-5xl')
 
  const print = () => {

    setShowModal(true)
    setModalSize('w-full max-w-2xl');
    setTimeout(() => {
      setModalContent(<PdfProformaViewer order={order} token={token} selected={selected} />);
    }, 500); // 100ms suele ser suficiente
  }

  return (
    <>
      <button disabled={disabled} onClick={() => print()} title='Imprimir' className={`${className}`}>{ t.draft_proforma }</button>
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default BtnPrintProforma;
