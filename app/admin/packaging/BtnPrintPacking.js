'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import IconPrinter from '@/components/icon/icon-printer';
import Modal from '@/components/modal';
const PdfViewerPacking = dynamic(() => import('@/app/admin/packaging/PdfViewerPacking'), {
  ssr: false,
});

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const BtnPrintPacking = ({ disabled, t, className = "", packages = [] }) => {

  const [show_modal, setShowModal] = useState(false);
  const [modal_content, setModalContent] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
    setPdfBlobUrl(null);
  };

  const print = () => {
    setShowModal(true);
    setPdfBlobUrl(null);
    setTimeout(() => {
      setModalContent(<PdfViewerPacking packages={packages} onLoaded={setPdfBlobUrl} />);
    }, 500); // 100ms suele ser suficiente
  }

  return (
    <>
      <button disabled={disabled} onClick={() => print()} title='Imprimir' className={`${className}`}>{ t.print_packaging } <IconPrinter className='ml-2'></IconPrinter></button>
      <Modal
        size="w-full max-w-2xl"
        closeModal={closeModal}
        openModal={() => setShowModal(true)}
        showModal={show_modal}
        content={modal_content}
        headerActions={
          <div className="flex items-center gap-2">
            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download="embalaje.pdf" className="no-load btn btn-primary btn-sm rounded">
                {t.download_pdf}
              </a>
            )}
            <button type="button" onClick={closeModal} className="btn btn-success btn-sm rounded">
              {t.btn_close}
            </button>
          </div>
        }
      />
    </>
  );
};

export default BtnPrintPacking;
