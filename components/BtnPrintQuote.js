'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import IconPrinter from './icon/icon-printer';
import Modal from '@/components/modal';
const PdfViewer = dynamic(() => import('@/app/admin/revision/quotes/PdfViewer'), {
  ssr: false,
});

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const BtnPrintQuote = ({ close, token, t, order, className="" }) => {

  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);
  const [modal_size, setModalSize] = useState('w-full max-w-7xl')

 
  const print = () => {
    setShowModal(true)
    setModalSize('w-full max-w-4xl');
    setTimeout(() => {
      setModalContent(<PdfViewer order={order} token={token} />);
    }, 500); // 100ms suele ser suficiente
  }

  return (
    <>
      <button onClick={() => print()} title='Imprimir' className={`${className}`}><IconPrinter></IconPrinter></button>
      <Modal size={modal_size} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default BtnPrintQuote;
